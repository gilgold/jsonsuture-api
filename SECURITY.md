# Security

## Controls

- 256-bit API keys; only SHA-256 hashes and short prefixes are stored.
- One-time raw key display.
- Fixed 128 KiB input and 32 KiB schema caps.
- Maximum depth/node limits before schema processing.
- Remote `$ref` blocked, preventing network fetches and schema SSRF.
- `__proto__`, `prototype`, and `constructor` keys rejected.
- No dynamic code execution, filesystem access, arbitrary URL fetch, or shell execution.
- Generic 5xx responses; no stack traces returned.
- Quota and minute-rate limits cap abuse costs.
- Stripe webhook signature verification; no card storage.

## Cost-abuse bound

One free key can invoke at most 250 calls/month. At the conservative internal estimate of $0.000002 per call, compute exposure per fully used free key is about $0.00050. Free key creation is limited to three per network/day, making the modeled daily exposure roughly $0.00150 plus managed-database overhead.

## Known MVP trade-off

Base44 entity counters use read/update operations rather than a database-native atomic increment. Very high concurrent bursts can produce small counter drift. The minute bucket, hard monthly limit, and low launch-tier rates reduce exposure; moving counters to an atomic KV/SQL primitive is the first scaling migration.

## Reporting

Open a private GitHub security advisory on the repository or email darkstorm13@gmail.com. Do not include live API keys or customer payloads.
