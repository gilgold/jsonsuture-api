# Pricing and unit economics

## Plans

| Plan | Monthly price | Included calls | Effective revenue/call at full use |
|---|---:|---:|---:|
| Free | $0 | 250 | — |
| Developer | $9 | 10,000 | $0.00090 |
| Pro | $29 | 100,000 | $0.00029 |

## Cost model

The core performs deterministic CPU work with no AI or paid external API calls.

- Estimated compute + managed-state cost/call: $0.000002 at launch volume.
- AI cost/call: $0.
- External API cost/call: $0.
- Stripe processing is modeled separately at the account's actual fee schedule; no card data is handled here.

At full included use before payment-processing fees:

- Developer infrastructure cost: ~$0.02; gross profit ~$8.98; gross margin ~99.8%.
- Pro infrastructure cost: ~$0.20; gross profit ~$28.80; gross margin ~99.3%.

These are engineering estimates, not observed invoices. `MetricBucket.estimated_cost_usd` makes the assumption explicit and replaceable with measured cost.

## Break-even

There is no new fixed external spend in the current deployment. If later fixed tooling costs $25/month, three Developer customers or one Pro customer cover it before payment fees. Labor and Base44 subscription/credits already held by the owner are not treated as incremental product infrastructure.
