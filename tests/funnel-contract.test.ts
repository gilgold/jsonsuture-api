import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const home = readFileSync(new URL('../functions/jsonSutureHome.ts', import.meta.url), 'utf8');
const checkout = readFileSync(new URL('../functions/jsonSutureCheckout.ts', import.meta.url), 'utf8');

describe('paid checkout frontend/backend contract', () => {
  it('sends the API key only as Bearer authorization, not in the JSON body', () => {
    expect(home).toContain("'Authorization': 'Bearer ' + key");
    expect(home).toContain('body: JSON.stringify({plan: button.dataset.plan})');
    expect(home).not.toContain('apiKey: key');
  });

  it('uses the backend checkout URL field with a compatibility fallback', () => {
    expect(checkout).toContain('checkout_url: session.url');
    expect(home).toContain('data.checkout_url || data.url');
    expect(home).toContain('location.assign(checkoutUrl)');
  });

  it('posts to the deployed checkout function', () => {
    expect(home).toContain("base + '/functions/jsonSutureCheckout'");
  });
});
