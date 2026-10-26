-- sql/init.sql

-- Tenants represent customer organizations
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans define quotas and pricing
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 'Free', 'Pro'
    api_call_limit INTEGER NOT NULL,
    token_limit BIGINT NOT NULL,
    monthly_price_cents INTEGER NOT NULL,
    
    -- AI Token Pricing Constants (in micro-cents per 1k tokens)
    input_token_price INTEGER NOT NULL DEFAULT 0,
    cached_input_token_price INTEGER NOT NULL DEFAULT 0,
    output_token_price INTEGER NOT NULL DEFAULT 0,
    reasoning_token_price INTEGER NOT NULL DEFAULT 0
);

-- Subscriptions link tenants to plans
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, canceled, past_due
    current_period_end TIMESTAMP WITH TIME ZONE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage Events: The core metering table
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- 'api_call' or 'ai_tokens'
    quantity BIGINT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    idempotency_key VARCHAR(255) NOT NULL,
    
    -- CRITICAL: Prevents double-counting at the DB level
    CONSTRAINT unique_idempotency UNIQUE (tenant_id, idempotency_key)
);

-- Indexes for performance
CREATE INDEX idx_usage_events_tenant ON usage_events(tenant_id);
CREATE INDEX idx_usage_events_timestamp ON usage_events(timestamp);
CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);