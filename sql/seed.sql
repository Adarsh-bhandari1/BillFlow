-- sql/seed.sql

-- Insert Plans with REALISTIC AI token pricing (micro-cents per 1k tokens)
INSERT INTO plans (name, api_call_limit, token_limit, monthly_price_cents, 
                   input_token_price, cached_input_token_price, output_token_price, reasoning_token_price)
VALUES 
('Free', 1000, 100000, 0, 5000, 1000, 15000, 15000),
('Pro', 10000, 1000000, 2900, 3000, 500, 10000, 10000)
ON CONFLICT (name) DO NOTHING;

-- Insert Test Tenant
INSERT INTO tenants (name, email)
VALUES ('Test Corp', 'test@example.com')
ON CONFLICT (email) DO NOTHING;