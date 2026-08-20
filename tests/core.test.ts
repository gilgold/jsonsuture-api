import { describe, expect, it } from 'vitest';
import { InputError, LIMITS, repairJson } from '../src/core.js';

describe('repairJson', () => {
  it('returns valid JSON unchanged', () => {
    const out = repairJson('{"ok":true,"n":2}');
    expect(out.data).toEqual({ ok: true, n: 2 });
    expect(out.input_was_valid_json).toBe(true);
    expect(out.changed).toBe(false);
  });

  it('repairs common LLM JSON damage', () => {
    const out = repairJson("```json\n{'name':'Ada','active':True,}\n```");
    expect(out.data).toEqual({ name: 'Ada', active: true });
    expect(out.transformations).toContain('syntax_repair');
  });

  it('repairs truncated arrays and objects', () => {
    const out = repairJson('{"items":[1,2,{"x":"y"}');
    expect(out.data).toEqual({ items: [1, 2, { x: 'y' }] });
  });

  it('reports schema violations without inventing values', () => {
    const out = repairJson('{"count":"nope"}', {
      type: 'object',
      required: ['count'],
      properties: { count: { type: 'integer' } },
    });
    expect(out.schema_valid).toBe(false);
    expect(out.schema_errors[0]?.keyword).toBe('type');
  });

  it('coerces types only when explicitly enabled', () => {
    const schema = { type: 'object', properties: { count: { type: 'integer' } }, required: ['count'] };
    const strict = repairJson('{"count":"12"}', schema);
    const coerced = repairJson('{"count":"12"}', schema, { coerce_types: true });
    expect(strict.schema_valid).toBe(false);
    expect(coerced.schema_valid).toBe(true);
    expect(coerced.data).toEqual({ count: 12 });
  });

  it('rejects remote schema references', () => {
    expect(() => repairJson('{}', { $ref: 'https://example.com/schema.json' })).toThrowError(InputError);
  });

  it('rejects prototype-pollution keys', () => {
    expect(() => repairJson('{"constructor":{"prototype":{"polluted":true}}}')).toThrowError(InputError);
  });

  it('rejects oversized input', () => {
    const huge = '"' + 'x'.repeat(LIMITS.inputBytes + 1) + '"';
    expect(() => repairJson(huge)).toThrowError(InputError);
  });

  it('rejects empty input', () => {
    expect(() => repairJson('')).toThrowError(InputError);
  });
});
