-- sql/seed.sql

-- Insert Plans
INSERT INTO plans (name, api_call_limit, token_limit, monthly_price_cents, 
                   input_token_price, cached_input_token_price, output_token_price, reasoning_token_price)
VALUES 
('Free', 1000, 100000, 0, 5, 1, 15, 15),
('Pro', 10000, 1000000, 2900, 3, 1, 10, 10)
ON CONFLICT (name) DO NOTHING;

-- Insert Test Tenant
INSERT INTO tenants (name, email)
VALUES ('Test Corp', 'test@example.com')
ON CONFLICT (email) DO NOTHING;