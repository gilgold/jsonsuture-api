# JSONSuture API

Deterministic JSON repair and JSON Schema validation for AI agents. JSONSuture fixes malformed or truncated JSON without another model call, then returns explicit validation results. It does not store customer payloads.

**Live product:** https://vesper-3159a405.base44.app/functions/jsonSutureHome  
**API docs:** https://vesper-3159a405.base44.app/functions/jsonSutureDocs  
**OpenAPI:** https://vesper-3159a405.base44.app/functions/jsonSutureOpenapi

## Five-minute quick start

Create a free key (250 requests/month):

```bash
curl -X POST https://vesper-3159a405.base44.app/functions/v1CreateKey
```

Store the returned key, then repair JSON:

```bash
curl -X POST https://vesper-3159a405.base44.app/functions/v1RepairJson \
  -H "Authorization: Bearer $JSONSUTURE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text":"```json\n{name: Ada, active: true,}\n```"}'
```

```json
{
  "ok": true,
  "result": {
    "data": { "name": "Ada", "active": true },
    "repaired_text": "{\"name\":\"Ada\",\"active\":true}",
    "changed": true,
    "input_was_valid_json": false,
    "schema_valid": null,
    "schema_errors": [],
    "transformations": ["syntax_repair"]
  }
}
```

## Schema validation

```json
{
  "text": "{count: '12'}",
  "schema": {
    "type": "object",
    "required": ["count"],
    "properties": { "count": { "type": "integer" } }
  },
  "options": { "coerce_types": true }
}
```

Coercion and defaults are off by default. JSONSuture never makes an LLM call and does not perform semantic fact completion.

## API surface

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /functions/v1CreateKey` | None | Create a free API key; raw key appears once |
| `POST /functions/v1RepairJson` | Bearer key | Repair and optionally validate JSON |
| `GET /functions/jsonSutureHealth` | None | Health and deployed version |
| `GET /functions/jsonSutureOpenapi` | None | OpenAPI 3.1 document |
| `POST /functions/jsonSutureCheckout` | Bearer key | Create Stripe Checkout session when configured |
| `POST /functions/jsonSutureStripeWebhook` | Stripe signature | Apply subscription status and quota changes |

## Errors

Errors have stable machine-readable fields:

```json
{
  "ok": false,
  "error": {
    "code": "UNREPAIRABLE_JSON",
    "status": 422,
    "detail": "Input could not be repaired deterministically",
    "request_id": "req_..."
  }
}
```

Expected statuses: 400 invalid input/schema, 401 key failure, 402 quota exhausted, 413 hard size/complexity limit, 422 unrepairable input, 429 rate limit.

## Limits and security

- 128 KiB input; 32 KiB schema; depth 64; 20,000 nodes.
- Only local JSON Schema `$ref` values; remote refs are blocked.
- Prototype-pollution keys are rejected.
- API keys are random 256-bit secrets; only SHA-256 hashes are stored.
- Payloads and schemas are not persisted or logged.
- Per-key minute and monthly quotas are enforced server-side.
- No external URLs are fetched, eliminating SSRF exposure in the core endpoint.

See [SECURITY.md](SECURITY.md) for the threat model.

## Pricing

- Free: $0, 250 calls/month, 10/minute.
- Developer: $9/month, 10,000 calls, 60/minute.
- Pro: $29/month, 100,000 calls, 300/minute.

Paid checkout code and signed webhook fulfillment are deployed but intentionally return `BILLING_NOT_CONFIGURED` until Stripe credentials and Price IDs are installed.

## Local development

```bash
npm install
npm run build
npm test
```

The tested repair core is in `src/core.ts`. Base44 Deno function adapters are in `functions/`. Entity schemas are in `entities/`.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md). The current production deployment uses Base44 managed Deno functions and entities at zero additional external spend.

## Agent discovery

- `openapi.json` — OpenAPI 3.1
- `llms.txt` — low-token agent guide
- `agent-tool.json` — function/tool input schema
- `.well-known/ai-plugin.json` — legacy-compatible manifest pointer

A remote MCP server was deliberately omitted from v1: OpenAPI is universally consumable, and a separate persistent transport would add operational surface without improving the single core call. x402 was also deferred because it requires a funded wallet/payment recipient and adds legal/accounting complexity; traditional API keys plus Stripe are the mature launch rail.

## License

MIT for source code. Product terms and privacy summary are on the live landing page.
