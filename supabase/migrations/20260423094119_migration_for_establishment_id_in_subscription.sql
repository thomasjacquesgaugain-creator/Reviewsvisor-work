ALTER TABLE subscriptions
ADD COLUMN establishment_id uuid;

ALTER TABLE subscriptions
ADD CONSTRAINT fk_subscription_establishment
FOREIGN KEY (establishment_id)
REFERENCES establishments(id)
ON DELETE CASCADE;

CREATE INDEX idx_subscriptions_establishment_id
ON subscriptions(establishment_id);

CREATE UNIQUE INDEX unique_provider_subscription_id
ON subscriptions(provider_subscription_id)
WHERE provider_subscription_id IS NOT NULL;

CREATE UNIQUE INDEX unique_establishment_subscription
ON subscriptions(establishment_id)
WHERE establishment_id IS NOT NULL;