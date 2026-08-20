# Market research and decision record

Research date: 2026-08-20.

## Candidate scorecard

Weighted 1–5 scores considered pain severity, frequency, willingness to pay, competitive whitespace, API/agent fit, data availability, implementation simplicity, marginal cost, legal/ToS safety, automation, distribution, and defensibility.

| Rank | Candidate | Score |
|---:|---|---:|
| 1 | Prompt-injection payload firewall | 4.73 |
| 2 | LLM JSON repair + schema enforcement | 4.73 |
| 3 | Agent tool-loop cost guard | 4.70 |
| 4 | robots.txt/AI crawling compliance | 4.54 |
| 5 | x402 header verification | 4.38 |
| 6 | HTML-to-LLM Markdown stripper | 4.34 |
| 7 | Markdown table to query engine | 4.25 |
| 8 | API docs to MCP tool generator | 4.23 |
| 9 | Dependency-license compatibility | 4.21 |
| 10 | Repository security/bus-factor risk | 4.16 |
| 11 | Sandboxed AST/WASM execution | 4.06 |
| 12 | HN/Reddit trend intelligence | 3.99 |
| 13 | Screenshot to UI bounding boxes | 3.98 |
| 14 | Entity disambiguation | 3.97 |
| 15 | Web stack/WAF fingerprint | 3.96 |
| 16 | Invoice key-value parser | 3.94 |
| 17 | RSS polling/delta API | 3.93 |
| 18 | SERP snippet/fact extraction | 3.92 |
| 19 | Passive SSL/subdomain recon | 3.90 |
| 20 | ArXiv method/citation extraction | 3.80 |
| 21 | App-review bug stream | 3.77 |

JSON repair won the tie because it has no external data, inference, scraping, moderation, or provider-rate-limit dependency. A prompt-injection firewall has greater false-negative/liability risk and weaker deterministic guarantees.

## Demand evidence

1. Mature open-source workarounds show repeated demand: [mangiucugna/json_repair](https://github.com/mangiucugna/json_repair) and [josdejong/jsonrepair](https://github.com/josdejong/jsonrepair).
2. Developers report structured-output failures across models and tools: [OpenRouter schema discussion](https://www.reddit.com/r/LocalLLaMA/comments/1kip5qj/openrouters_api_does_not_follow_given_json_schema/) and [n8n parser failures](https://www.reddit.com/r/n8n/comments/1i8jq8g/tool_agent_error_with_structured_output_parser/).
3. Structured-output trade-offs remain actively debated: [Hacker News discussion](https://news.ycombinator.com/item?id=46345333) and [sampling/structured output discussion](https://news.ycombinator.com/item?id=45345207).
4. A paid x402 JSON repair MCP implementation demonstrates machine-payment experimentation: [ktcod/x402-json-repair-mcp](https://github.com/ktcod/x402-json-repair-mcp).

Sources are evidence of pain and workarounds, not proof of willingness to pay. Conversion must be validated with real usage.

## Competition

- `jsonrepair` npm and `json_repair` Python: free, excellent libraries; require language-specific integration and self-operation.
- Native model structured output: prevents many errors but is provider-specific and cannot clean arbitrary upstream payloads.
- Instructor/Outlines/Guardrails AI: broader generation/validation frameworks with larger integration scope.

JSONSuture differentiates on a universal HTTP contract, zero payload retention, explicit cost/limits, one-call onboarding, schema validation, and agent-readable discovery. It deliberately does not call models, judge semantics, store payloads, proxy model providers, or become an observability platform.

## Standards decision

OpenAPI 3.1, `llms.txt`, and a tool schema are implemented. A legacy-compatible agent manifest is included. A remote MCP transport and x402 settlement were deferred: both are viable, but neither is needed for the one-endpoint MVP, and x402 requires a funded recipient/wallet plus accounting decisions.
