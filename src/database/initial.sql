CREATE TABLE loads (
    id SERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    type_id BIGINT NOT NULL,
    weight NUMERIC CHECK (weight > 0) NOT NULL,
    length NUMERIC CHECK (length > 0) NOT NULL,
    height NUMERIC CHECK (height > 0) NOT NULL,
    width NUMERIC CHECK (width > 0) NOT NULL,
    volume NUMERIC CHECK (volume > 0) NOT NULL,
    co_loading VARCHAR(10) NOT NULL CHECK (co_loading IN ('no_load', 'co_load', 'take_load')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_application FOREIGN KEY (application_id) REFERENCES applications(id),
    CONSTRAINT fk_load_type FOREIGN KEY (type_id) REFERENCES load_types(id)
);

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    currency_id BIGINT NOT NULL,
    amount NUMERIC CHECK (amount >= 0) NOT NULL,
    prepayment NUMERIC CHECK (prepayment >= 0 AND prepayment <= 1) NOT NULL DEFAULT 0,
    method_id BIGINT NOT NULL,
    condition_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_application FOREIGN KEY (application_id) REFERENCES applications(id),
    CONSTRAINT fk_currency FOREIGN KEY (currency_id) REFERENCES currencies(id),
    CONSTRAINT fk_method FOREIGN KEY (method_id) REFERENCES payment_methods(id),
    CONSTRAINT fk_condition FOREIGN KEY (condition_id) REFERENCES payment_conditions(id)
);

CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE payment_conditions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

CREATE TABLE transports (
    id SERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL,
    type_id BIGINT NOT NULL,
    count INT CHECK (count > 0) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_transport_application FOREIGN KEY (application_id) REFERENCES applications(id),
    CONSTRAINT fk_transport_type FOREIGN KEY (type_id) REFERENCES transport_types(id)
);

-- ENUM для статуса
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
        CREATE TYPE application_status AS ENUM ('draft', 'active', 'cancelled', 'archived');
    END IF;
END$$;

-- Таблица приложений
CREATE TABLE applications (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    organization_id BIGINT,
    phone VARCHAR(20) NOT NULL,
    comment TEXT,
    status application_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_by BIGINT
);

-- Внешние ключи
ALTER TABLE applications
    ADD CONSTRAINT fk_app_user FOREIGN KEY (user_id) REFERENCES users(id),
    ADD CONSTRAINT fk_app_org FOREIGN KEY (organization_id) REFERENCES organizations(id),
    ADD CONSTRAINT fk_app_updated_by FOREIGN KEY (updated_by) REFERENCES users(id);