import { DatabaseManager } from "@/database/manager";
import { IRepository } from "./Repository.interface";
import {
    Application,
    ApplicationDTO,
    ApplicationPublic,
    Load,
    LoadPublic,
    LoadType,
    Payment,
    PaymentPublic,
    Transport,
    TransportPublic,
} from "@/models";
import { ApplicationPublicSchema } from "@/models/schemas/Application.schema";
import { LoadTypeSchema } from "@/models/schemas";

export class Repository implements IRepository {
    constructor(private database: DatabaseManager) {}

    async getApplicationById(id: number): Promise<ApplicationPublic | null> {
        const applicationQuery = `
            SELECT * FROM applications WHERE id = $1`;
        const applicationParams = [id];

        const application = await this.database.query<Application>(applicationQuery, applicationParams);

        if (application.rows.length === 0) {
            return null;
        }

        const loadQuery = `
            SELECT l.*, lt.* FROM loads l JOIN load_types lt ON lt.id = l.type_id WHERE application_id=$1`;

        const loadResult = await this.database.query<Load & { name: string }>(loadQuery, [id]);
        if (loadResult.rows.length === 0) {
            return null;
        }
        const load = loadResult.rows[0];
        const loadPublic: LoadPublic = { type: { id: load.type_id, name: load.name }, ...load };

        const transportQuery = `
            SELECT t.*, tt.* FROM transports t JOIN transport_types tt ON tt.id = t.type_id WHERE application_id=$1`;

        const transportResult = await this.database.query<Transport & { name: string }>(transportQuery, [id]);
        if (transportResult.rows.length === 0) {
            return null;
        }
        const transport = transportResult.rows[0];
        const transportPublic: TransportPublic = {
            type: { id: transport.type_id, name: transport.name },
            ...transport,
        };
        if (transportResult.rows.length === 0) {
            return null;
        }

        const paymentQuery = `
            SELECT p.*, pm.name as method_name, pc.name as condition_name FROM payments p 
            join payment_methods pm on pm.id = p.method_id join payment_conditions pc on pc.id = p.condition_id 
            where p.application_id = $1`;
        const paymentResult = await this.database.query<Payment & { condition_name: string; method_name: string }>(
            paymentQuery,
            [id]
        );
        if (paymentResult.rows.length === 0) {
            return null;
        }
        const payment = paymentResult.rows[0];
        const paymentPublic: PaymentPublic = {
            condition: { id: payment.condition_id, name: payment.condition_name },
            method: { id: payment.method_id, name: payment.method_name },
            ...payment,
        };

        const user = await this.database.query<{ last_name: string; first_name: string }>(
            `
            SELECT last_name, id, first_name FROM users WHERE id=$1`,
            [application.rows[0].user_id]
        );
        const userResult = user.rows[0];

        let organization;
        if (application.rows[0].organization_id === null) {
            organization = null;
        } else {
            const organizationResult = await this.database.query<{ uin: string; name: string }>(
                `SELECT uin, name FROM organizations WHERE id=$1`,
                [application.rows[0].organization_id]
            );
            organization = organizationResult.rows[0];
        }

        const applicationPublic: ApplicationPublic = {
            ...application.rows[0],
            load: loadPublic,
            transport: transportPublic,
            payment: paymentPublic,
            user: { last_name: userResult.last_name, first_name: userResult.first_name },
            organization: organization,
        };

        return ApplicationPublicSchema.parse(applicationPublic);
    }

    async createApplication(dto: ApplicationDTO): Promise<ApplicationPublic> {
        const { transport, payment, load, user_id, organization_id, status, comment, phone } = dto;

        return await this.database.transaction<ApplicationPublic>(async (client) => {
            // 1. Вставляем application
            const applicationQuery = `
            INSERT INTO applications (user_id, organization_id, status, comment, phone)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`;
            const applicationResult = await client.query<Application>(applicationQuery, [
                user_id,
                organization_id,
                status,
                comment,
                phone,
            ]);
            const application = applicationResult.rows[0];
            const appId = application.id;

            // 2. Вставляем load
            const loadQuery = `
            INSERT INTO loads (application_id, type_id, weight, length, height, width, volume, co_loading)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`;
            const loadInsert = await client.query<Load>(loadQuery, [
                appId,
                load.type_id,
                load.weight,
                load.length,
                load.height,
                load.width,
                load.volume,
                load.co_loading,
            ]);
            const loadId = loadInsert.rows[0].id;

            const loadResult = await client.query(
                `
            SELECT l.*, t.id AS type_id, t.name AS type_name
            FROM loads l
            JOIN load_types t ON l.type_id = t.id
            WHERE l.id = $1
        `,
                [loadId]
            );
            const loadPublic = {
                ...loadResult.rows[0],
                type: {
                    id: loadResult.rows[0].type_id,
                    name: loadResult.rows[0].type_name,
                },
            };
            delete loadPublic.type_id;
            delete loadPublic.application_id;

            // 3. Вставляем payment
            const paymentQuery = `
            INSERT INTO payments (application_id, currency_id, amount, prepayment, method_id, condition_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *`;
            const paymentInsert = await client.query<Payment>(paymentQuery, [
                appId,
                payment.currency_id,
                payment.amount,
                payment.prepayment,
                payment.method_id,
                payment.condition_id,
            ]);
            const paymentId = paymentInsert.rows[0].id;

            const paymentResult = await client.query(
                `
            SELECT p.*, m.id AS method_id, m.name AS method_name,
                   c.id AS condition_id, c.name AS condition_name
            FROM payments p
            JOIN payment_methods m ON p.method_id = m.id
            JOIN payment_conditions c ON p.condition_id = c.id
            WHERE p.id = $1
        `,
                [paymentId]
            );
            const paymentPublic = {
                ...paymentResult.rows[0],
                method: {
                    id: paymentResult.rows[0].method_id,
                    name: paymentResult.rows[0].method_name,
                },
                condition: {
                    id: paymentResult.rows[0].condition_id,
                    name: paymentResult.rows[0].condition_name,
                },
            };
            delete paymentPublic.method_id;
            delete paymentPublic.condition_id;
            delete paymentPublic.application_id;

            // 4. Вставляем transport
            const transportQuery = `
            INSERT INTO transports (application_id, type_id, count)
            VALUES ($1, $2, $3)
            RETURNING *`;
            const transportInsert = await client.query<Transport>(transportQuery, [
                appId,
                transport.type_id,
                transport.count,
            ]);
            const transportId = transportInsert.rows[0].id;

            const transportResult = await client.query(
                `
            SELECT tr.*, tt.id AS type_id, tt.name AS type_name
            FROM transports tr
            JOIN transport_types tt ON tr.type_id = tt.id
            WHERE tr.id = $1
        `,
                [transportId]
            );
            const transportPublic = {
                ...transportResult.rows[0],
                type: {
                    id: transportResult.rows[0].type_id,
                    name: transportResult.rows[0].type_name,
                },
            };
            delete transportPublic.type_id;
            delete transportPublic.application_id;

            // 5. Получаем user и organization
            const userResult = await client.query(`SELECT first_name, last_name FROM users WHERE id = $1`, [user_id]);
            const user = userResult.rows[0];

            const organization = organization_id
                ? (await client.query(`SELECT uin, name FROM organizations WHERE id = $1`, [organization_id])).rows[0]
                : null;

            // 6. Собираем публичный объект
            const applicationPublic: ApplicationPublic = {
                id: application.id,
                phone: application.phone,
                comment: application.comment,
                status: application.status,
                created_at: application.created_at,
                updated_at: application.updated_at,
                updated_by: application.updated_by,
                user,
                organization,
                load: loadPublic,
                payment: paymentPublic,
                transport: transportPublic,
            };

            return applicationPublic;
        });
    }

    async getLoadTypes(): Promise<LoadType[]> {
        const query = `
            SELECT * FROM load_types`;
        const { rows } = await this.database.query<LoadType>(query);
        return rows.map((row) => LoadTypeSchema.parse(row));
    }
}
