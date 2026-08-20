import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const sha256 = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map((b) => b.toString(16).padStart(2, '0')).join('');
const randomKey = () => { const bytes = crypto.getRandomValues(new Uint8Array(32)); return `js_live_${btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`; };

Deno.serve(async (req) => {
  const requestId = `req_${crypto.randomUUID()}`;
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return response({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', status: 405, detail: 'Use POST', request_id: requestId } }, 405);
  const base44 = createClientFromRequest(req);
  const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown').trim().slice(0, 100);
  const ipHash = await sha256(`jsonsuture:${ip}`);
  const today = new Date().toISOString().slice(0, 10);
  const bucketKey = `signup:${ipHash}:${today}`;
  const rows = await base44.asServiceRole.entities.UsageBucket.filter({ bucket_key: bucketKey });
  const row = rows[0];
  const count = Number(row?.count || 0);
  if (count >= 3) return response({ ok: false, error: { code: 'SIGNUP_RATE_LIMIT', status: 429, detail: 'Daily free-key limit reached for this network', request_id: requestId } }, 429);
  if (row) await base44.asServiceRole.entities.UsageBucket.update(row.id, { count: count + 1 });
  else await base44.asServiceRole.entities.UsageBucket.create({ bucket_key: bucketKey, key_hash: ipHash, kind: 'signup_day', count: 1, expires_at: new Date(Date.now() + 48 * 3600_000).toISOString() });

  const key = randomKey();
  const keyHash = await sha256(key);
  const prefix = key.slice(0, 15);
  const billingPeriod = new Date().toISOString().slice(0, 7);
  await base44.asServiceRole.entities.ApiKey.create({ key_hash: keyHash, key_prefix: prefix, plan: 'free', status: 'active', monthly_limit: 250, rate_limit_per_minute: 10, billing_period: billingPeriod, monthly_used: 0, created_ip_hash: ipHash });
  console.log(JSON.stringify({ level: 'info', event: 'signup', request_id: requestId, key_prefix: prefix }));
  return response({ ok: true, api_key: key, warning: 'Store this key now. It is shown only once and cannot be recovered.', plan: { name: 'free', monthly_requests: 250, requests_per_minute: 10 }, endpoints: { repair: 'https://vesper-3159a405.base44.app/functions/v1RepairJson', docs: 'https://vesper-3159a405.base44.app/functions/jsonSutureDocs' }, request_id: requestId }, 201);
});
