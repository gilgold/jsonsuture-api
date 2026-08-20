# Deployment

## Current production architecture

- Compute: Base44 Deno backend functions.
- State: Base44 entities (`ApiKey`, `UsageBucket`, `MetricBucket`).
- Public URL: `https://vesper-3159a405.base44.app/functions/<function>`.
- Billing: Stripe Checkout + signed webhook code, dormant until secrets exist.
- Source and CI: GitHub repository and Actions.

## Reproduce

1. Create the three entity schemas from `entities/`.
2. Deploy every TypeScript file in `functions/` using the filename (without `.ts`) as the function name.
3. Run smoke tests in this order: health, key creation, successful repair, invalid key, malformed request, rate/quota behavior.
4. Configure a custom domain later if desired; no domain is required for launch.

## Stripe activation

Create recurring Stripe Prices matching the published tiers, then configure these encrypted secrets:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_DEVELOPER`
- `STRIPE_PRICE_PRO`

Register the webhook URL:

`https://vesper-3159a405.base44.app/functions/jsonSutureStripeWebhook`

Subscribe to `customer.subscription.created`, `customer.subscription.updated`, and `customer.subscription.deleted`.

The checkout function authenticates the API key, stores only its hash in Stripe metadata, and the webhook verifies Stripe's signature before changing plan limits. Card data never reaches this application.

## Operational checks

- Health: `GET /functions/jsonSutureHealth`
- Runtime logs: structured JSON from repair, signup, and webhook functions.
- Usage/cost: aggregate `MetricBucket` by date.
- Conversion: count API keys with `first_success_at`, paid `plan`, and Stripe subscription fields.

## Rollback

Redeploy a known Git tag. Entity schema changes in v1 are additive; function rollback does not require data migration.
