import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { secrets } from 'base44:runtime';
import Stripe from 'npm:stripe@22.5.0';

const sha256 = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))).map((b) => b.toString(16).padStart(2, '0')).join('');
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Cache-Control': 'no-store' } });

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' } });
  if (req.method !== 'POST') return json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED' } }, 405);
  const secret = await secrets.get('STRIPE_SECRET_KEY');
  const developerPrice = await secrets.get('STRIPE_PRICE_DEVELOPER');
  const proPrice = await secrets.get('STRIPE_PRICE_PRO');
  if (!secret || !developerPrice || !proPrice) return json({ ok: false, error: { code: 'BILLING_NOT_CONFIGURED', status: 503, detail: 'Paid upgrades are temporarily unavailable; the free tier remains active.' } }, 503);
  const auth = req.headers.get('authorization');
  const rawKey = auth?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!rawKey) return json({ ok: false, error: { code: 'UNAUTHORIZED' } }, 401);
  const keyHash = await sha256(rawKey);
  const keys = await base44.asServiceRole.entities.ApiKey.filter({ key_hash: keyHash });
  const key = keys[0];
  if (!key || key.status !== 'active') return json({ ok: false, error: { code: 'UNAUTHORIZED' } }, 401);
  const body = await req.json().catch(() => ({}));
  const plan = body.plan === 'pro' ? 'pro' : body.plan === 'developer' ? 'developer' : null;
  if (!plan) return json({ ok: false, error: { code: 'INVALID_PLAN', detail: 'plan must be developer or pro' } }, 400);
  const stripe = new Stripe(secret);
  const session = await stripe.checkout.sessions.create({ mode: 'subscription', line_items: [{ price: plan === 'pro' ? proPrice : developerPrice, quantity: 1 }], client_reference_id: key.id, subscription_data: { metadata: { key_hash: keyHash, plan } }, metadata: { key_hash: keyHash, plan }, success_url: 'https://vesper-3159a405.base44.app/functions/jsonSutureHome?checkout=success', cancel_url: 'https://vesper-3159a405.base44.app/functions/jsonSutureHome?checkout=cancelled', allow_promotion_codes: true });
  return json({ ok: true, checkout_url: session.url });
});
