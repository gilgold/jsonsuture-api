# JSONSuture launch kit

## Show HN

**Title:** Show HN: JSONSuture – deterministic repair for malformed LLM JSON

LLMs often return output that is one comma, quote, or code fence away from valid JSON. Retrying the model adds latency and cost, and can produce a different answer.

I built JSONSuture as a small deterministic boundary service: send it the raw output, optionally include a JSON Schema, and it returns repaired JSON, explicit transformations, and validation errors. It never calls another model and does not retain payloads.

The core is open source and tested. The hosted API has a free tier (250 requests/month, no card), then $9/month for 10,000 requests.

A few deliberate constraints: remote schema refs are blocked, prototype-pollution keys are rejected, and the service will fail rather than invent semantic data.

Site: https://gilgold.github.io/jsonsuture-api/
GitHub: https://github.com/gilgold/jsonsuture-api

I would value concrete malformed-output examples that it should or should not repair.

## Product Hunt / launch directory

**Tagline:** Repair malformed LLM JSON without another model call

**Description:** JSONSuture deterministically fixes common JSON syntax failures, validates the result against JSON Schema, and reports every transformation. Built for AI-agent and backend pipelines. Payloads are not retained. Free tier included; no card required.

## Short directory description

Deterministic malformed-JSON repair and JSON Schema validation API for AI agents. No LLM retry and no payload retention.

## SEO

- Title: JSONSuture — JSON Repair API for AI Agents
- Meta description: Repair malformed LLM JSON and validate it against JSON Schema without another model call. Deterministic, private, and free to try.
- Primary keyword: JSON repair API
- Secondary keywords: malformed JSON repair, LLM structured output, JSON Schema validation API

## Context-first community reply template

A retry is reasonable when the model omitted semantic content, but for purely syntactic failures it can add cost and change an otherwise correct answer. A safer boundary is: preserve the original output, repair only deterministic syntax, then validate against your schema and fail closed if validation still fails.

I built an open-source implementation of that pattern here: https://github.com/gilgold/jsonsuture-api — the hosted API has a free tier, but the repair core is also runnable locally. If you share a sanitized failing sample, I can check whether it can be repaired without guessing.

Use this only where the discussion is explicitly about invalid LLM JSON and after providing a complete technical answer. Never post it as an unsolicited standalone promotion.
