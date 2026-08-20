# JSONSuture deterministic acceptance benchmark

This is a reproducible acceptance suite, not a comparison against competing products and not a claim about all malformed JSON. It uses fixed synthetic cases with explicit expected outputs.

## Result

**14/14 cases passed.**

| Case | Type | Result | Expected behavior |
|---|---|---|---|
| `markdown-fence-single-quotes-python-bool` | repair | PASS | Code fence, single quotes, Python boolean, and trailing comma |
| `unquoted-keys` | repair | PASS | Unquoted object keys |
| `truncated-nested-object` | repair | PASS | Truncated nested object and array |
| `javascript-comments` | repair | PASS | JavaScript-style comments around values |
| `concatenated-strings` | repair | PASS | Concatenated string literals |
| `ellipsis-array` | repair | PASS | Array with an ellipsis placeholder |
| `schema-valid` | schema | PASS | Valid repaired output passes JSON Schema |
| `schema-violation` | schema | PASS | Semantic type mismatch is reported, not invented away |
| `explicit-type-coercion` | schema | PASS | String-to-integer coercion occurs only when enabled |
| `explicit-default` | schema | PASS | Schema default is applied only when enabled |
| `remote-ref-blocked` | guardrail | PASS | Remote schema references are rejected |
| `prototype-pollution-blocked` | guardrail | PASS | Prototype-pollution keys are rejected |
| `empty-input-rejected` | guardrail | PASS | Empty input is rejected instead of fabricated |
| `plain-prose-rejected-by-object-schema` | schema | PASS | Plain prose is preserved as a string, then rejected by an object schema |

## Reproduce

```bash
npm ci
npm run benchmark
```

Machine-readable output: [benchmark-results.json](benchmark-results.json).

## Interpretation

Repair cases test common syntax damage found at application boundaries. Schema cases verify validation and explicitly enabled normalization. Guardrail cases verify that JSONSuture fails closed for unsafe or semantically unknowable input. The benchmark does not measure model accuracy, semantic reconstruction, or every possible JSON corruption.
