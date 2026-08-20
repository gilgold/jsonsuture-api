import { Validator } from 'jsonschema';
import { jsonrepair } from 'jsonrepair';

export const LIMITS = {
  inputBytes: 128 * 1024,
  schemaBytes: 32 * 1024,
  maxDepth: 64,
  maxNodes: 20_000,
  maxSchemaDepth: 20,
} as const;

export type RepairOptions = {
  coerce_types?: boolean;
  use_defaults?: boolean;
};

export type RepairResult = {
  data: unknown;
  repaired_text: string;
  changed: boolean;
  input_was_valid_json: boolean;
  schema_valid: boolean | null;
  schema_errors: Array<{ path: string; keyword: string; message: string }>;
  transformations: string[];
};

export class InputError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

const byteLength = (value: string) => new TextEncoder().encode(value).byteLength;

function assertTreeSafe(value: unknown, maxDepth = LIMITS.maxDepth, maxNodes = LIMITS.maxNodes): void {
  let nodes = 0;
  const stack: Array<{ value: unknown; depth: number }> = [{ value, depth: 0 }];
  while (stack.length) {
    const current = stack.pop()!;
    nodes += 1;
    if (nodes > maxNodes) throw new InputError('PAYLOAD_TOO_COMPLEX', `JSON exceeds ${maxNodes} nodes`, 413);
    if (current.depth > maxDepth) throw new InputError('PAYLOAD_TOO_DEEP', `JSON exceeds depth ${maxDepth}`, 413);
    if (current.value && typeof current.value === 'object') {
      for (const [key, child] of Object.entries(current.value as Record<string, unknown>)) {
        if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
          throw new InputError('UNSAFE_KEY', `Key '${key}' is not accepted`);
        }
        stack.push({ value: child, depth: current.depth + 1 });
      }
    }
  }
}

function assertSchemaSafe(schema: unknown): asserts schema is Record<string, unknown> {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new InputError('INVALID_SCHEMA', 'schema must be a JSON object');
  }
  const encoded = JSON.stringify(schema);
  if (byteLength(encoded) > LIMITS.schemaBytes) {
    throw new InputError('SCHEMA_TOO_LARGE', `schema exceeds ${LIMITS.schemaBytes} bytes`, 413);
  }
  const stack: Array<{ value: unknown; depth: number }> = [{ value: schema, depth: 0 }];
  let nodes = 0;
  while (stack.length) {
    const { value, depth } = stack.pop()!;
    nodes += 1;
    if (nodes > 5_000 || depth > LIMITS.maxSchemaDepth) {
      throw new InputError('SCHEMA_TOO_COMPLEX', 'schema is too deep or complex', 413);
    }
    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        if (key === '$ref' && (typeof child !== 'string' || !child.startsWith('#'))) {
          throw new InputError('REMOTE_REF_NOT_ALLOWED', 'Only local JSON Schema $ref values are allowed');
        }
        if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
          throw new InputError('UNSAFE_SCHEMA_KEY', `Schema key '${key}' is not accepted`);
        }
        stack.push({ value: child, depth: depth + 1 });
      }
    }
  }
}


function applySchemaOptions(value: unknown, schema: Record<string, any>, options: Record<string, unknown>): unknown {
  let result = value;
  if (options.coerce_types === true && typeof schema.type === 'string') {
    if ((schema.type === 'number' || schema.type === 'integer') && typeof result === 'string' && /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(result)) {
      const parsed = Number(result);
      if (Number.isFinite(parsed) && (schema.type !== 'integer' || Number.isInteger(parsed))) result = parsed;
    } else if (schema.type === 'boolean' && typeof result === 'string' && /^(true|false)$/i.test(result)) {
      result = result.toLowerCase() === 'true';
    } else if (schema.type === 'string' && (typeof result === 'number' || typeof result === 'boolean')) {
      result = String(result);
    }
  }
  if (result && typeof result === 'object' && !Array.isArray(result) && schema.properties && typeof schema.properties === 'object') {
    const object = result as Record<string, unknown>;
    for (const [key, childSchema] of Object.entries(schema.properties as Record<string, any>)) {
      if (!(key in object) && options.use_defaults === true && childSchema && Object.prototype.hasOwnProperty.call(childSchema, 'default')) {
        object[key] = structuredClone(childSchema.default);
      }
      if (key in object && childSchema && typeof childSchema === 'object') object[key] = applySchemaOptions(object[key], childSchema, options);
    }
  } else if (Array.isArray(result) && schema.items && typeof schema.items === 'object') {
    result = result.map((item) => applySchemaOptions(item, schema.items, options));
  }
  return result;
}

export function repairJson(text: string, schema?: unknown, options: RepairOptions = {}): RepairResult {
  if (typeof text !== 'string' || text.length === 0) {
    throw new InputError('INVALID_INPUT', 'text must be a non-empty string');
  }
  if (byteLength(text) > LIMITS.inputBytes) {
    throw new InputError('PAYLOAD_TOO_LARGE', `text exceeds ${LIMITS.inputBytes} bytes`, 413);
  }

  let inputWasValid = true;
  try { JSON.parse(text); } catch { inputWasValid = false; }

  let repairedText: string;
  let data: unknown;
  try {
    repairedText = jsonrepair(text);
    data = JSON.parse(repairedText);
  } catch {
    throw new InputError('UNREPAIRABLE_JSON', 'Input could not be repaired deterministically', 422);
  }
  assertTreeSafe(data);

  const transformations: string[] = [];
  if (!inputWasValid || repairedText.trim() !== text.trim()) transformations.push('syntax_repair');
  let schemaValid: boolean | null = null;
  let schemaErrors: Array<{ path: string; keyword: string; message: string }> = [];

  if (schema !== undefined) {
    assertSchemaSafe(schema);
    const before = JSON.stringify(data);
    try {
      data = applySchemaOptions(data, schema, options);
      const validation = new Validator().validate(data, schema);
      schemaValid = validation.valid;
      schemaErrors = validation.errors.slice(0, 50).map((error) => ({
        path: error.path.length ? '/' + error.path.map(String).join('/') : '/',
        keyword: error.name,
        message: error.message,
      }));
      if (JSON.stringify(data) !== before) transformations.push('schema_coercion');
    } catch (error) {
      throw new InputError('INVALID_SCHEMA', error instanceof Error ? error.message : 'Schema validation failed');
    }
  }

  return {
    data,
    repaired_text: JSON.stringify(data),
    changed: transformations.length > 0,
    input_was_valid_json: inputWasValid,
    schema_valid: schemaValid,
    schema_errors: schemaErrors,
    transformations,
  };
}
