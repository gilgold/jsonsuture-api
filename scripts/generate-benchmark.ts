import { writeFileSync } from 'node:fs';
import { InputError, repairJson } from '../src/core.js';

type Case = {
  id: string;
  category: 'repair' | 'schema' | 'guardrail';
  description: string;
  run: () => unknown;
  expected: unknown;
};

const cases: Case[] = [
  {
    id: 'markdown-fence-single-quotes-python-bool',
    category: 'repair',
    description: 'Code fence, single quotes, Python boolean, and trailing comma',
    run: () => repairJson("```json\n{'name':'Ada','active':True,}\n```").data,
    expected: { name: 'Ada', active: true },
  },
  {
    id: 'unquoted-keys',
    category: 'repair',
    description: 'Unquoted object keys',
    run: () => repairJson('{name: "Ada", count: 2}').data,
    expected: { name: 'Ada', count: 2 },
  },
  {
    id: 'truncated-nested-object',
    category: 'repair',
    description: 'Truncated nested object and array',
    run: () => repairJson('{"items":[1,2,{"x":"y"}').data,
    expected: { items: [1, 2, { x: 'y' }] },
  },
  {
    id: 'javascript-comments',
    category: 'repair',
    description: 'JavaScript-style comments around values',
    run: () => repairJson('{/* model note */"ok":true,// trailing note\n"n":2}').data,
    expected: { ok: true, n: 2 },
  },
  {
    id: 'concatenated-strings',
    category: 'repair',
    description: 'Concatenated string literals',
    run: () => repairJson('{"message":"hello" + " world"}').data,
    expected: { message: 'hello world' },
  },
  {
    id: 'ellipsis-array',
    category: 'repair',
    description: 'Array with an ellipsis placeholder',
    run: () => repairJson('{"items":[1,2,...,4]}').data,
    expected: { items: [1, 2, 4] },
  },
  {
    id: 'schema-valid',
    category: 'schema',
    description: 'Valid repaired output passes JSON Schema',
    run: () => repairJson("{answer:'yes', confidence:0.9,}", {
      type: 'object',
      required: ['answer', 'confidence'],
      properties: { answer: { type: 'string' }, confidence: { type: 'number' } },
    }).schema_valid,
    expected: true,
  },
  {
    id: 'schema-violation',
    category: 'schema',
    description: 'Semantic type mismatch is reported, not invented away',
    run: () => repairJson('{"count":"unknown"}', {
      type: 'object', required: ['count'], properties: { count: { type: 'integer' } },
    }).schema_valid,
    expected: false,
  },
  {
    id: 'explicit-type-coercion',
    category: 'schema',
    description: 'String-to-integer coercion occurs only when enabled',
    run: () => repairJson('{"count":"12"}', {
      type: 'object', required: ['count'], properties: { count: { type: 'integer' } },
    }, { coerce_types: true }).data,
    expected: { count: 12 },
  },
  {
    id: 'explicit-default',
    category: 'schema',
    description: 'Schema default is applied only when enabled',
    run: () => repairJson('{"name":"Ada"}', {
      type: 'object', properties: { name: { type: 'string' }, active: { type: 'boolean', default: true } },
    }, { use_defaults: true }).data,
    expected: { name: 'Ada', active: true },
  },
  {
    id: 'remote-ref-blocked',
    category: 'guardrail',
    description: 'Remote schema references are rejected',
    run: () => {
      try { repairJson('{}', { $ref: 'https://example.com/schema.json' }); return 'NO_ERROR'; }
      catch (error) { return error instanceof InputError ? error.code : 'UNKNOWN_ERROR'; }
    },
    expected: 'REMOTE_REF_NOT_ALLOWED',
  },
  {
    id: 'prototype-pollution-blocked',
    category: 'guardrail',
    description: 'Prototype-pollution keys are rejected',
    run: () => {
      try { repairJson('{"constructor":{"prototype":{"polluted":true}}}'); return 'NO_ERROR'; }
      catch (error) { return error instanceof InputError ? error.code : 'UNKNOWN_ERROR'; }
    },
    expected: 'UNSAFE_KEY',
  },
  {
    id: 'empty-input-rejected',
    category: 'guardrail',
    description: 'Empty input is rejected instead of fabricated',
    run: () => {
      try { repairJson(''); return 'NO_ERROR'; }
      catch (error) { return error instanceof InputError ? error.code : 'UNKNOWN_ERROR'; }
    },
    expected: 'INVALID_INPUT',
  },
  {
    id: 'plain-prose-rejected-by-object-schema',
    category: 'schema',
    description: 'Plain prose is preserved as a string, then rejected by an object schema',
    run: () => repairJson('This is not JSON and has no data structure.', { type: 'object' }).schema_valid,
    expected: false,
  },
];

const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const results = cases.map((test) => {
  let actual: unknown;
  let error: string | null = null;
  try { actual = test.run(); }
  catch (caught) { error = caught instanceof Error ? caught.message : String(caught); actual = null; }
  return {
    id: test.id,
    category: test.category,
    description: test.description,
    passed: error === null && equal(actual, test.expected),
    expected: test.expected,
    actual,
    error,
  };
});
const passed = results.filter((result) => result.passed).length;
const report = {
  benchmark: 'JSONSuture deterministic acceptance benchmark',
  version: '1.0.0',
  methodology: 'Fixed synthetic cases with explicit expected outputs. Guardrail cases count as passing only when the documented error code is returned.',
  totals: { cases: results.length, passed, failed: results.length - passed },
  results,
};
writeFileSync('docs/benchmark-results.json', JSON.stringify(report, null, 2) + '\n');

const rows = results.map((r) => `| \`${r.id}\` | ${r.category} | ${r.passed ? 'PASS' : 'FAIL'} | ${r.description} |`).join('\n');
const markdown = `# JSONSuture deterministic acceptance benchmark\n\nThis is a reproducible acceptance suite, not a comparison against competing products and not a claim about all malformed JSON. It uses fixed synthetic cases with explicit expected outputs.\n\n## Result\n\n**${passed}/${results.length} cases passed.**\n\n| Case | Type | Result | Expected behavior |\n|---|---|---|---|\n${rows}\n\n## Reproduce\n\n\`\`\`bash\nnpm ci\nnpm run benchmark\n\`\`\`\n\nMachine-readable output: [benchmark-results.json](benchmark-results.json).\n\n## Interpretation\n\nRepair cases test common syntax damage found at application boundaries. Schema cases verify validation and explicitly enabled normalization. Guardrail cases verify that JSONSuture fails closed for unsafe or semantically unknowable input. The benchmark does not measure model accuracy, semantic reconstruction, or every possible JSON corruption.\n`;
writeFileSync('docs/BENCHMARK.md', markdown);
console.log(JSON.stringify(report.totals));
if (passed !== results.length) process.exitCode = 1;
