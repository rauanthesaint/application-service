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
        const query = `
            SELECT
    a.id,
    a.phone,
    a.comment,
    a.status,
    a.created_at,
    a.updated_at,
    a.updated_by,

    json_build_object(
        'first_name', u.first_name,
        'last_name', u.last_name
    ) AS user,

    CASE 
        WHEN o.id IS NULL THEN NULL
        ELSE json_build_object(
            'uin', o.uin,
            'name', o.name
        )
    END AS organization,

    json_build_object(
        'id', l.id,
        'weight', l.weight,
        'length', l.length,
        'height', l.height,
        'width', l.width,
        'volume', l.volume,
        'co_loading', l.co_loading,
        'created_at', l.created_at,
        'updated_at', l.updated_at,
        'type', json_build_object(
            'id', lt.id,
            'name', lt.name
        )
    ) AS load,

    json_build_object(
        'id', p.id,
        'currency_id', p.currency_id,
        'amount', p.amount,
        'prepayment', p.prepayment,
        'created_at', p.created_at,
        'updated_at', p.updated_at,
        'method', json_build_object(
            'id', pm.id,
            'name', pm.name
        ),
        'condition', json_build_object(
            'id', pc.id,
            'name', pc.name
        )
    ) AS payment,

    json_build_object(
        'id', t.id,
        'count', t.count,
        'created_at', t.created_at,
        'updated_at', t.updated_at,
        'type', json_build_object(
            'id', tt.id,
            'name', tt.name
        )
    ) AS transport

FROM applications a
JOIN users u ON u.id = a.user_id
LEFT JOIN organizations o ON o.id = a.organization_id
JOIN loads l ON l.application_id = a.id
JOIN load_types lt ON lt.id = l.type_id
JOIN payments p ON p.application_id = a.id
JOIN payment_methods pm ON pm.id = p.method_id
JOIN payment_conditions pc ON pc.id = p.condition_id
JOIN transports t ON t.application_id = a.id
JOIN transport_types tt ON tt.id = t.type_id

WHERE a.id = $1;
`;
        const result = await this.database.query(query, [id]);

        if (result.rows.length === 0) return null;

        return ApplicationPublicSchema.parse(result.rows[0]);
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
