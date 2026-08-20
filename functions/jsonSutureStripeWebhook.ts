import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { secrets } from 'base44:runtime';
import Stripe from 'npm:stripe@22.5.0';

const PLAN = { free: { monthly_limit: 250, rate_limit_per_minute: 10 }, developer: { monthly_limit: 10_000, rate_limit_per_minute: 60 }, pro: { monthly_limit: 100_000, rate_limit_per_minute: 300 } } as const;

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  if (req.method !== 'POST') return Response.json({ ok: false }, { status: 405 });
  const secret = await secrets.get('STRIPE_SECRET_KEY');
  const webhookSecret = await secrets.get('STRIPE_WEBHOOK_SECRET');
  if (!secret || !webhookSecret) return Response.json({ ok: false, error: 'billing_not_configured' }, { status: 503 });
  const signature = req.headers.get('stripe-signature');
  if (!signature) return Response.json({ ok: false, error: 'missing_signature' }, { status: 400 });
  const stripe = new Stripe(secret);
  let event: Stripe.Event;
  try { event = await stripe.webhooks.constructEventAsync(await req.text(), signature, webhookSecret); }
  catch { return Response.json({ ok: false, error: 'invalid_signature' }, { status: 400 }); }

  if (event.type.startsWith('customer.subscription.')) {
    const subscription = event.data.object as Stripe.Subscription;
    const keyHash = subscription.metadata.key_hash;
    const requestedPlan = subscription.metadata.plan === 'pro' ? 'pro' : 'developer';
    if (keyHash) {
      const keys = await base44.asServiceRole.entities.ApiKey.filter({ key_hash: keyHash });
      const key = keys[0];
      if (key) {
        const active = ['active', 'trialing'].includes(subscription.status);
        const plan = active ? requestedPlan : 'free';
        await base44.asServiceRole.entities.ApiKey.update(key.id, { plan, status: 'active', monthly_limit: PLAN[plan].monthly_limit, rate_limit_per_minute: PLAN[plan].rate_limit_per_minute, stripe_customer_id: String(subscription.customer), stripe_subscription_id: subscription.id });
      }
    }
  }
  console.log(JSON.stringify({ level: 'info', event: 'stripe_webhook', stripe_event_id: event.id, stripe_event_type: event.type }));
  return Response.json({ received: true });
});
