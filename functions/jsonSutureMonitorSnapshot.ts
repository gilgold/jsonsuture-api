import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TEST_PREFIXES = new Set([
  'js_live_MSqBj3f',
  'js_live_n4pWCrQ',
  'js_live_Fmlgc3y',
  'js_live_-3vWQ5t',
  'js_live_BNz7GEU',
]);
const LEGACY_UNQUALIFIED_PREFIX = 'js_live_GUc50z-';
const CUSTOMER_BILLING_PREFIXES = [
  'checkout.',
  'customer.subscription.',
  'invoice.',
  'payment_intent.',
  'charge.',
];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  },
});

const countBy = (rows: any[], field: string) => rows.reduce((out: Record<string, number>, row) => {
  const key = String(row?.[field] ?? 'unknown');
  out[key] = (out[key] || 0) + 1;
  return out;
}, {});

const maxIso = (values: unknown[]) => values
  .filter((value): value is string => typeof value === 'string' && value.length > 0)
  .sort()
  .at(-1) || null;

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'METHOD_NOT_ALLOWED' }, 405);

  try {
    const base44 = createClientFromRequest(req);
    const [allKeys, allBillingEvents] = await Promise.all([
      base44.asServiceRole.entities.ApiKey.list('-created_date', 500),
      base44.asServiceRole.entities.BillingEvent.list('-created_date', 500),
    ]);

    const now = Date.now();
    const cutoff24h = now - 24 * 60 * 60 * 1000;
    const within24h = (value: unknown) => typeof value === 'string' && Date.parse(value) >= cutoff24h;

    const nonTestKeys = allKeys.filter((row: any) => {
      const prefix = String(row?.key_prefix || '');
      if (TEST_PREFIXES.has(prefix)) return false;
      if (prefix === LEGACY_UNQUALIFIED_PREFIX && !row?.first_success_at && Number(row?.monthly_used || 0) === 0) return false;
      return true;
    });
    const activeKeys = nonTestKeys.filter((row: any) => row?.status === 'active');
    const activatedKeys = nonTestKeys.filter((row: any) => Boolean(row?.first_success_at));
    const repeatKeys = nonTestKeys.filter((row: any) => Number(row?.monthly_used || 0) >= 2);
    const paidKeys = nonTestKeys.filter((row: any) => row?.plan === 'developer' || row?.plan === 'pro');
    const activePaidKeys = paidKeys.filter((row: any) => row?.status === 'active');
    const new24h = nonTestKeys.filter((row: any) => within24h(row?.created_date));
    const activated24h = nonTestKeys.filter((row: any) => within24h(row?.first_success_at));

    const customerBillingEvents = allBillingEvents.filter((row: any) =>
      CUSTOMER_BILLING_PREFIXES.some((prefix) => String(row?.event_type || '').startsWith(prefix))
    );
    const billing24h = customerBillingEvents.filter((row: any) => within24h(row?.processed_at || row?.created_date));
    const failedBillingEvents = customerBillingEvents.filter((row: any) => row?.status === 'failed');
    const latestBillingEvent = [...customerBillingEvents].sort((a: any, b: any) =>
      String(b?.processed_at || b?.created_date || '').localeCompare(String(a?.processed_at || a?.created_date || ''))
    )[0];

    const activated24hBySource = countBy(activated24h, 'acquisition_source');
    const new24hBySource = countBy(new24h, 'acquisition_source');

    return json({
      ok: true,
      generated_at: new Date(now).toISOString(),
      privacy: {
        raw_keys: false,
        key_hashes: false,
        ip_hashes: false,
        customer_ids: false,
        subscription_ids: false,
        record_ids: false,
      },
      keys: {
        non_test_total: nonTestKeys.length,
        active: activeKeys.length,
        activated: activatedKeys.length,
        repeat_users: repeatKeys.length,
        paid: paidKeys.length,
        active_paid: activePaidKeys.length,
        new_24h: new24h.length,
        activated_24h: activated24h.length,
        new_24h_by_source: new24hBySource,
        activated_24h_by_source: activated24hBySource,
        by_plan: countBy(nonTestKeys, 'plan'),
        by_status: countBy(nonTestKeys, 'status'),
        by_source: countBy(nonTestKeys, 'acquisition_source'),
        latest_created_at: maxIso(nonTestKeys.map((row: any) => row?.created_date)),
        latest_first_success_at: maxIso(nonTestKeys.map((row: any) => row?.first_success_at)),
        latest_used_at: maxIso(nonTestKeys.map((row: any) => row?.last_used_at)),
      },
      billing: {
        customer_events_total: customerBillingEvents.length,
        events_24h: billing24h.length,
        failed_events_total: failedBillingEvents.length,
        by_type: countBy(customerBillingEvents, 'event_type'),
        by_status: countBy(customerBillingEvents, 'status'),
        latest_event: latestBillingEvent ? {
          type: String(latestBillingEvent.event_type || 'unknown'),
          status: String(latestBillingEvent.status || 'unknown'),
          processed_at: latestBillingEvent.processed_at || latestBillingEvent.created_date || null,
          has_error: Boolean(latestBillingEvent.error),
        } : null,
        latest_failed_at: maxIso(failedBillingEvents.map((row: any) => row?.processed_at || row?.created_date)),
      },
      integrity: {
        active_paid_without_customer: activePaidKeys.filter((row: any) => !row?.stripe_customer_id).length,
        active_paid_without_subscription: activePaidKeys.filter((row: any) => !row?.stripe_subscription_id).length,
        paid_not_active: paidKeys.filter((row: any) => row?.status !== 'active').length,
      },
      limits: {
        max_records_per_entity: 500,
        test_prefix_count: TEST_PREFIXES.size,
      },
    });
  } catch (error) {
    console.error(JSON.stringify({ level: 'error', event: 'monitor_snapshot_failed', message: error instanceof Error ? error.message : String(error) }));
    return json({ ok: false, error: 'SNAPSHOT_FAILED' }, 500);
  }
});
