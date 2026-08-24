import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const raw = readFileSync(new URL('../postman/JSONSuture.postman_collection.json', import.meta.url), 'utf8');
const collection = JSON.parse(raw);
const createKeySource = readFileSync(new URL('../functions/v1CreateKey.ts', import.meta.url), 'utf8');
const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const site = readFileSync(new URL('../docs/index.html', import.meta.url), 'utf8');

describe('Postman acquisition and security contract', () => {
  it('ships a valid 2.1 collection with no embedded live key', () => {
    expect(collection.info.schema).toBe('https://schema.getpostman.com/json/collection/v2.1.0/collection.json');
    expect(collection.variable.find((v: { key: string }) => v.key === 'apiKey').value).toBe('');
    expect(raw).not.toMatch(/js_live_[A-Za-z0-9_-]+/);
  });

  it('attributes key creation to Postman and keeps auth in the Bearer variable', () => {
    const create = collection.item.find((item: { name: string }) => item.name.includes('Create free key'));
    const repair = collection.item.find((item: { name: string }) => item.name === '3. Repair malformed JSON');
    expect(create.request.url.raw).toContain('source=postman');
    expect(createKeySource).toContain("'postman'");
    expect(repair.request.auth.bearer[0].value).toBe('{{apiKey}}');
    expect(repair.request.body.raw).not.toContain('api_key');
  });

  it('links the collection from both public source and business site', () => {
    expect(readme).toContain('postman/JSONSuture.postman_collection.json');
    expect(site).toContain('postman/JSONSuture.postman_collection.json');
  });
});
