import { DatabaseManager } from "@/database/manager";
import { IRepository } from "./Repository.interface";
import {
    ApplicationDTO,
    ApplicationPublic,
    ApplicationFilters,
    LoadType,
    PaymentCondition,
    PaymentMethod,
    TransportType,
    BidDTO,
    BidPublic,
} from "@/models";
import { ApplicationPublicSchema } from "@/models/schemas/Application.schema";
import {
    BidPublicSchema,
    LoadTypeSchema,
    PaymentConditionSchema,
    PaymentMethodSchema,
    TransportTypeSchema,
} from "@/models/schemas";

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
                'id', u.id,
                'first_name', u.first_name,
                'last_name', u.last_name
            ) AS user,

            CASE 
                WHEN o.id IS NULL THEN NULL
                ELSE json_build_object(
                    'id', o.id,
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

            WHERE a.id = $1;`;

        const result = await this.database.query(query, [id]);

        if (result.rows.length === 0) return null;

        return ApplicationPublicSchema.parse(result.rows[0]);
    }

    async createApplication(dto: ApplicationDTO): Promise<ApplicationPublic> {
        const { transport, payment, load, user_id, organization_id, status, comment, phone } = dto;

        return await this.database.transaction(async (client) => {
            const query = `
                WITH app AS (
                    INSERT INTO applications (user_id, organization_id, status, comment, phone)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                ),
                ld AS (
                    INSERT INTO loads (application_id, type_id, weight, length, height, width, volume, co_loading)
                    SELECT id, $6, $7, $8, $9, $10, $11, $12 FROM app
                    RETURNING *
                ),
                pay AS (
                    INSERT INTO payments (application_id, currency_id, amount, prepayment, method_id, condition_id)
                    SELECT id, $13, $14, $15, $16, $17 FROM app
                    RETURNING *
                ),
                tr AS (
                    INSERT INTO transports (application_id, type_id, count)
                    SELECT id, $18, $19 FROM app
                    RETURNING *
                )
                SELECT
                    a.id,
                    a.user_id,
                    a.organization_id,
                    a.phone,
                    a.comment,
                    a.status,
                    a.created_at,
                    a.updated_at,
                    a.updated_by,
                    json_build_object(
                        'id', ld.id,
                        'weight', ld.weight,
                        'length', ld.length,
                        'height', ld.height,
                        'width', ld.width,
                        'volume', ld.volume,
                        'co_loading', ld.co_loading,
                        'type', json_build_object('id', lt.id, 'name', lt.name)
                    ) AS load,
                    json_build_object(
                        'id', pay.id,
                        'amount', pay.amount,
                        'prepayment', pay.prepayment,
                        'method', json_build_object('id', pm.id, 'name', pm.name),
                        'condition', json_build_object('id', pc.id, 'name', pc.name)
                    ) AS payment,
                    json_build_object(
                        'id', tr.id,
                        'count', tr.count,
                        'type', json_build_object('id', tt.id, 'name', tt.name)
                    ) AS transport,
                    json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name) AS "user",
                    CASE 
                        WHEN a.organization_id IS NULL THEN NULL
                        ELSE json_build_object('id', o.id, 'uin', o.uin, 'name', o.name)
                    END AS organization
                FROM app a
                JOIN ld ON ld.application_id = a.id
                JOIN load_types lt ON lt.id = ld.type_id
                JOIN pay ON pay.application_id = a.id
                JOIN payment_methods pm ON pm.id = pay.method_id
                JOIN payment_conditions pc ON pc.id = pay.condition_id
                JOIN tr ON tr.application_id = a.id
                JOIN transport_types tt ON tt.id = tr.type_id
                JOIN users u ON u.id = a.user_id
                LEFT JOIN organizations o ON o.id = a.organization_id;`;

            const params = [
                user_id,
                organization_id,
                status,
                comment,
                phone,
                load.type_id,
                load.weight,
                load.length,
                load.height,
                load.width,
                load.volume,
                load.co_loading,
                payment.currency_id,
                payment.amount,
                payment.prepayment,
                payment.method_id,
                payment.condition_id,
                transport.type_id,
                transport.count,
            ];

            const result = await client.query(query, params);
            return result.rows[0];
        });
    }

    async deleteApplicationById(id: number): Promise<boolean> {
        const query = `
            delete from applications where id = $1`;
        const { rowCount } = await this.database.query(query, [id]);
        return Boolean(rowCount);
    }

    async getLoadTypes(): Promise<LoadType[]> {
        const query = `
            SELECT * FROM load_types`;
        const { rows } = await this.database.query<LoadType>(query);
        return rows.map((row) => LoadTypeSchema.parse(row));
    }
    async getTransportTypes(): Promise<TransportType[]> {
        const query = `SELECT * FROM transport_types`;
        const { rows } = await this.database.query<TransportType>(query);
        return rows.map((row) => TransportTypeSchema.parse(row));
    }
    async getPaymentConditions(): Promise<PaymentCondition[]> {
        const query = "select * from payment_conditions";
        const { rows } = await this.database.query<PaymentCondition>(query);
        return rows.map((row) => PaymentConditionSchema.parse(row));
    }
    async getPaymentMethods(): Promise<PaymentMethod[]> {
        const query = "select * from payment_methods";
        const { rows } = await this.database.query<PaymentMethod>(query);
        return rows.map((row) => PaymentMethodSchema.parse(row));
    }

    async getApplications(filters: ApplicationFilters): Promise<ApplicationPublic[]> {
        const { limit, page, ...rest } = filters;
        const placeholders: string[] = [];
        const params: any[] = [];

        const _limit = limit ?? 20;
        const _page = page ?? 1;
        const offset = (_page - 1) * _limit;

        Object.entries(rest).map(([key, value], index) => {
            placeholders.push(`${key}=$${index + 1}`);
            params.push(value);
        });

        params.push(_limit);
        params.push(offset);

        const constraints = placeholders.length > 0 ? `WHERE ${placeholders.join(" AND ")}` : "";

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
                'id', u.id, 
                'first_name', u.first_name,
                'last_name', u.last_name
            ) AS user,

            CASE 
                WHEN o.id IS NULL THEN NULL
                ELSE json_build_object(
                    'id', o.id,
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
            
            ${constraints} LIMIT $${placeholders.length + 1} OFFSET $${placeholders.length + 2}`;

        const { rows } = await this.database.query(query, params);
        return rows.map((row) => ApplicationPublicSchema.parse(row));
    }

    async createBid(dto: BidDTO): Promise<BidPublic> {
        const { application_id, user_id, organization_id } = dto;
        const query = `
            WITH inserted AS (
                INSERT INTO bids (application_id, user_id, organization_id)
                VALUES ($1, $2, $3)
                RETURNING *
            )
            SELECT 
                i.id,
                i.application_id,
                i.created_at,
                i.updated_at,
                i.status,
                json_build_object(
                    'user', json_build_object('id', fu.id, 'first_name', fu.first_name, 'last_name', fu.last_name),
                    'organization', 
                        CASE 
                            WHEN fo.id IS NULL THEN NULL
                            ELSE json_build_object('id', fo.id, 'uin', fo.uin, 'name', fo.name)
                        END
                ) AS "from",
                CASE 
                    WHEN uu.id IS NULL THEN NULL
                    ELSE json_build_object('id', uu.id, 'first_name', uu.first_name, 'last_name', uu.last_name)
                END AS updated_by
            FROM inserted i
            JOIN users fu ON fu.id = i.user_id
            LEFT JOIN organizations fo ON fo.id = i.organization_id
            LEFT JOIN users uu ON uu.id = i.updated_by_id;`;
        const params = [application_id, user_id, organization_id];
        const { rows } = await this.database.query(query, params);
        return BidPublicSchema.parse(rows[0]);
    }
    async updateBidStatus(
        id: number,
        status: "pending" | "accepted" | "rejected",
        updated_by: number
    ): Promise<BidPublic> {
        const query = `
            WITH updated AS (
                UPDATE bids
                SET status = $1,
                    updated_at = NOW(),
                    updated_by_id = $3
                WHERE id = $2
                RETURNING *
            )
            SELECT
                u.id,
                u.application_id,
                u.status,
                u.created_at,
                u.updated_at,
                jsonb_build_object(
                    'id', ub.id,
                    'first_name', ub.first_name,
                    'last_name', ub.last_name
                ) AS updated_by,
                jsonb_build_object(
                    'user', jsonb_build_object(
                        'id', usr.id,
                        'first_name', usr.first_name,
                        'last_name', usr.last_name
                    ),
                    'organization', jsonb_build_object(
                        'id', org.id,
                        'name', org.name
                    )
                ) AS "from"
            FROM updated u
            JOIN users usr ON usr.id = u.user_id
            LEFT JOIN organizations org ON org.id = u.organization_id
            LEFT JOIN users ub ON ub.id = u.updated_by_id;`;
        const params = [status, id];
        const { rows } = await this.database.query(query, params);
        return BidPublicSchema.parse(rows[0]);
    }
    async getBidById(id: number): Promise<BidPublic | null> {
        const query = `
            SELECT
                b.id,
                b.application_id,
                b.status,
                b.created_at,
                b.updated_at,
                CASE
                    WHEN ub.id IS NULL THEN NULL
                    ELSE jsonb_build_object(
                        'id', ub.id,
                        'first_name', ub.first_name,
                        'last_name', ub.last_name
                    )
                END AS updated_by,
                jsonb_build_object(
                    'user', jsonb_build_object(
                        'id', u.id,
                        'first_name', u.first_name,
                        'last_name', u.last_name
                    ),
                    'organization',
                        CASE
                            WHEN o.id IS NULL THEN NULL
                            ELSE jsonb_build_object(
                                'id', o.id,
                                'name', o.name,
                                'uin', o.uin
                            )
                        END
                ) AS "from"
            FROM bids b
            JOIN users u ON u.id = b.user_id
            LEFT JOIN organizations o ON o.id = b.organization_id
            LEFT JOIN users ub ON ub.id = b.updated_by_id
            WHERE b.id = $1;`;
        const params = [id];
        const { rows } = await this.database.query(query, params);
        if (rows.length === 0) {
            return null;
        }
        return BidPublicSchema.parse(rows[0]);
    }

    async getBidsApplicationId(): Promise<BidPublic[]> {
        const query = `
            SELECT
                b.id,
                b.status,
                b.created_at,
                b.updated_at,
                json_build_object('id', u.id, 'first_name', u.first_name, 'last_name', u.last_name) AS user,
                json_build_object('id', o.id, 'name', o.name, 'uin', o.uin) AS organization
            FROM bids b
            JOIN users u ON u.id = b.user_id
            LEFT JOIN organizations o ON o.id = b.organization_id
            WHERE b.application_id = $1
            ORDER BY b.created_at DESC;`;
        const { rows } = await this.database.query(query);
        return rows.map((row) => BidPublicSchema.parse(row));
    }
}
