CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    interval VARCHAR(20) NOT NULL DEFAULT 'monthly',
    max_orgs INTEGER NOT NULL,
    max_minds_per_org INTEGER NOT NULL,
    max_storage_mb_per_mind INTEGER NOT NULL,
    max_members_per_org INTEGER NOT NULL,
    paystack_plan_code VARCHAR(100),
    features TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    paystack_customer_code VARCHAR(100),
    paystack_subscription_code VARCHAR(100),
    paystack_authorization_code VARCHAR(100),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    subscription_id UUID REFERENCES user_subscriptions(id),
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    paystack_reference VARCHAR(100) UNIQUE,
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL,
    channel VARCHAR(20),
    paid_at TIMESTAMP WITH TIME ZONE,
    metadata TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_reference ON payment_transactions(paystack_reference);

INSERT INTO subscription_plans (code, name, amount_cents, currency, interval, max_orgs, max_minds_per_org, max_storage_mb_per_mind, max_members_per_org, features, sort_order) VALUES
('free', 'Free', 0, 'USD', 'monthly', 1, 3, 512, 3, '["1 organization","3 minds per org","512 MB storage per mind","3 team members","Basic AI queries"]', 0),
('starter', 'Starter', 900, 'USD', 'monthly', 5, 10, 2048, 10, '["5 organizations","10 minds per org","2 GB storage per mind","10 team members","Priority AI queries","Document upload"]', 1),
('pro', 'Pro', 2900, 'USD', 'monthly', 25, 50, 10240, 25, '["25 organizations","50 minds per org","10 GB storage per mind","25 team members","Advanced AI queries","Document upload","Custom integrations","Priority support"]', 2),
('enterprise', 'Enterprise', 9900, 'USD', 'monthly', -1, -1, 51200, -1, '["Unlimited organizations","Unlimited minds","50 GB storage per mind","Unlimited team members","Enterprise AI queries","Document upload","Custom integrations","Dedicated support","SSO & audit logs"]', 3);
