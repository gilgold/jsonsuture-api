import { describe, expect, it } from 'vitest';
import { InputError, repairJson } from '../src/core.js';

describe('documented benchmark cases', () => {
  it.each([
    ["```json\n{'name':'Ada','active':True,}\n```", { name: 'Ada', active: true }],
    ['{name: "Ada", count: 2}', { name: 'Ada', count: 2 }],
    ['{"items":[1,2,{"x":"y"}', { items: [1, 2, { x: 'y' }] }],
    ['{/* model note */"ok":true,// trailing note\n"n":2}', { ok: true, n: 2 }],
    ['{"message":"hello" + " world"}', { message: 'hello world' }],
    ['{"items":[1,2,...,4]}', { items: [1, 2, 4] }],
  ])('repairs %s', (input, expected) => {
    expect(repairJson(input).data).toEqual(expected);
  });

  it('uses a schema to reject plain prose where an object is required', () => {
    const out = repairJson('This is not JSON and has no data structure.', { type: 'object' });
    expect(out.data).toBe('This is not JSON and has no data structure.');
    expect(out.schema_valid).toBe(false);
  });
});
