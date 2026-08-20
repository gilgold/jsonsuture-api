import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  createClientFromRequest(req);
  if (!['GET', 'POST'].includes(req.method)) return Response.json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED', status: 405 } }, { status: 405 });
  return Response.json({ ok: true, service: 'JSONSuture', version: '1.0.0', api_version: '2026-08-20', status: 'operational', timestamp: new Date().toISOString(), retention: 'payloads are not stored' }, { headers: { 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' } });
});
