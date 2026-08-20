# JSONSuture API

**Deterministic JSON repair and JSON Schema validation for AI agents.**

LLMs still return almost-JSON: unquoted keys, trailing commas, code fences, truncated objects, and values that fail your schema. JSONSuture repairs the syntax, validates the result, and reports every transformation — without another model call or payload retention.

[Try free](https://vesper-3159a405.base44.app/functions/jsonSutureHome) · [Business site](https://gilgold.github.io/jsonsuture-api/) · [API docs](https://vesper-3159a405.base44.app/functions/jsonSutureDocs) · [OpenAPI 3.1](https://vesper-3159a405.base44.app/functions/jsonSutureOpenapi)

## Why use it?

- **Predictable:** deterministic repair, not another probabilistic retry.
- **Schema-aware:** optional JSON Schema validation, coercion, and defaults.
- **Agent-ready:** OpenAPI, `llms.txt`, and tool schema included.
- **Private by design:** payloads and schemas are processed in memory and not retained.
- **Cheap to try:** 250 requests/month free; no card required.

## Reproducible benchmark

The checked-in deterministic acceptance benchmark currently passes **14/14 fixed cases**, covering syntax repair, schema behavior, and security guardrails. This is not a claim about every possible corruption and not a competitor comparison. See [methodology and case-level results](docs/BENCHMARK.md) or run `npm run benchmark`.

Important boundary: without a schema, plain prose can be preserved as a valid JSON string. Supply an object/array schema when your application requires structured output; validation will then reject prose.

## 60-second quick start

Create a free key:

```bash
curl -X POST https://vesper-3159a405.base44.app/functions/v1CreateKey
```

Store the one-time `api_key`, then repair malformed model output:

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

## Drop-in examples

### Node.js 18+

```js
const response = await fetch(
  "https://vesper-3159a405.base44.app/functions/v1RepairJson",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.JSONSUTURE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: modelOutput,
      schema: {
        type: "object",
        required: ["answer", "confidence"],
        properties: {
          answer: { type: "string" },
          confidence: { type: "number" },
        },
      },
    }),
  },
);

const { result } = await response.json();
if (!result.schema_valid) throw new Error(JSON.stringify(result.schema_errors));
console.log(result.data);
```

### Python 3.9+

```python
import os, requests

response = requests.post(
    "https://vesper-3159a405.base44.app/functions/v1RepairJson",
    headers={"Authorization": f"Bearer {os.environ['JSONSUTURE_API_KEY']}"},
    json={"text": model_output},
    timeout=10,
)
response.raise_for_status()
data = response.json()["result"]["data"]
```

Complete runnable files are in [`examples/`](examples/).

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

Coercion and defaults are off by default. JSONSuture does not invent semantic facts; it repairs structure and validates the result.

## Pricing

| Plan | Monthly requests | Rate limit | Price |
|---|---:|---:|---:|
| Free | 250 | 10/min | $0 |
| Developer | 10,000 | 60/min | $9/month |
| Pro | 100,000 | 300/min | $29/month |

Live Stripe Checkout and the customer billing portal are available from the [product page](https://vesper-3159a405.base44.app/functions/jsonSutureHome). Subscriptions renew monthly and can be canceled in the portal.

## API surface

| Endpoint | Auth | Purpose |
|---|---|---|
| `POST /functions/v1CreateKey` | None | Create a free API key; raw key appears once |
| `POST /functions/v1RepairJson` | Bearer key | Repair and optionally validate JSON |
| `GET /functions/jsonSutureHealth` | None | Health and deployed version |
| `GET /functions/jsonSutureOpenapi` | None | OpenAPI 3.1 document |
| `POST /functions/jsonSutureCheckout` | API key | Create a Stripe Checkout Session |
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

## Local development

```bash
npm install
npm run build
npm test
```

The tested repair core is in `src/core.ts`. Base44 Deno adapters are in `functions/`; schemas are in `entities/`.

## Agent discovery

- `openapi.json` — OpenAPI 3.1
- `llms.txt` — low-token agent guide
- `agent-tool.json` — function/tool input schema
- `.well-known/ai-plugin.json` — legacy-compatible manifest pointer

## Feedback and support

Have a malformed-output case the deterministic core should handle? Open a [minimal reproducible issue](https://github.com/gilgold/jsonsuture-api/issues/new) with secrets and private data removed, or start a [discussion](https://github.com/gilgold/jsonsuture-api/discussions).

## License

MIT for source code. Product terms and privacy details are on the [business site](https://gilgold.github.io/jsonsuture-api/).
