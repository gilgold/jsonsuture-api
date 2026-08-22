import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  createClientFromRequest(req);
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>JSONSuture — Repair malformed JSON for AI agents</title>
  <meta name="description" content="Deterministic JSON repair and schema validation API. No LLM calls. No payload retention.">
  <style>
    :root{color-scheme:dark;--bg:#0b1020;--card:#121a2d;--text:#f4f7ff;--muted:#aab4cc;--accent:#7dd3fc;--line:#26324a;--good:#86efac}
    *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 system-ui,sans-serif}main{max-width:1040px;margin:auto;padding:64px 24px}nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:70px}a{color:var(--accent)}.brand{font-weight:800;letter-spacing:.08em;color:var(--text);text-decoration:none}h1{font-size:clamp(42px,7vw,76px);line-height:1.02;margin:0;max-width:850px}.lead{font-size:21px;color:var(--muted);max-width:720px;margin:24px 0 32px}.cta{display:inline-block;background:var(--accent);color:#07111e;text-decoration:none;font-weight:800;padding:13px 18px;border-radius:9px;border:0;cursor:pointer}.cta.secondary{background:transparent;color:var(--accent);border:1px solid var(--line)}.cta:disabled{opacity:.5}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin:52px 0}.card,pre,.key-panel{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:20px}.card h3{margin-top:0}pre{overflow:auto;color:#dbeafe}.label{color:var(--good);font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.08em}section{margin:72px 0}h2{font-size:32px}.muted{color:var(--muted)}footer{color:var(--muted);border-top:1px solid var(--line);padding-top:28px;margin-top:80px}.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}.plan{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:22px}.price{font-size:34px;font-weight:800}.upgrade{margin-top:22px;padding:22px;border:1px solid var(--line);border-radius:12px}input{width:100%;max-width:620px;padding:13px;border:1px solid var(--line);border-radius:8px;background:#080d19;color:var(--text);margin:8px 0 14px}.actions{display:flex;gap:10px;flex-wrap:wrap}.error{color:#fca5a5}.key-panel{margin-top:20px;max-width:760px}.key-panel[hidden],pre[hidden]{display:none}.key-value{display:block;overflow:auto;padding:12px;background:#080d19;border-radius:8px;margin:10px 0 14px;white-space:nowrap}.success{color:var(--good)}
  </style>
</head>
<body>
<main>
  <nav><a class="brand" href="#">JSONSUTURE</a><div><a href="https://vesper-3159a405.base44.app/functions/jsonSutureDocs">Docs</a> · <a href="https://github.com/gilgold/jsonsuture-api">GitHub</a> · <a href="mailto:darkstorm13@gmail.com?subject=JSONSuture%20implementation%20help">Help</a></div></nav>
  <header>
    <p class="label">Deterministic. Private. Agent-ready.</p>
    <h1>Repair the JSON your model almost returned.</h1>
    <p class="lead">Send malformed LLM output. Get valid JSON plus explicit schema-validation results—without another model call, retry, or stored payload.</p>
    <button class="cta" id="keyButton">Create free API key</button>
    <p id="keyResult" class="muted"></p>
    <div id="keyPanel" class="key-panel" hidden>
      <strong>Your API key — copy it now; it cannot be recovered.</strong>
      <code id="issuedKey" class="key-value"></code>
      <div class="actions">
        <button class="cta secondary" id="copyKeyButton">Copy key</button>
        <button class="cta" id="sampleButton">Run a sample repair</button>
      </div>
      <p class="muted">The sample uses one of your 250 free monthly requests and contains no private data.</p>
      <pre id="sampleResult" hidden></pre>
    </div>
  </header>
  <section><h2>One request</h2><pre>curl -X POST https://vesper-3159a405.base44.app/functions/v1RepairJson \\
  -H "Authorization: Bearer $JSONSUTURE_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"text":"{name: Ada, active: true,}"}'</pre></section>
  <div class="grid"><div class="card"><h3>No LLM bill</h3><p class="muted">A deterministic parser repairs syntax locally. Estimated infrastructure cost is about $0.000002 per call.</p></div><div class="card"><h3>Schema-aware</h3><p class="muted">Validate against JSON Schema; opt into type coercion and defaults explicitly.</p></div><div class="card"><h3>Zero payload retention</h3><p class="muted">Request text is processed in memory and never written to the product database or logs.</p></div></div>
  <section id="pricing"><h2>Pricing</h2><div class="plans"><div class="plan"><h3>Free</h3><div class="price">$0</div><p>250 calls/month<br>10 requests/minute</p></div><div class="plan"><h3>Developer</h3><div class="price">$9<span class="muted">/mo</span></div><p>10,000 calls/month<br>60 requests/minute</p></div><div class="plan"><h3>Pro</h3><div class="price">$29<span class="muted">/mo</span></div><p>100,000 calls/month<br>300 requests/minute</p></div></div><div class="upgrade"><h3>Upgrade an API key</h3><p class="muted">Your raw key is sent directly to the secure billing function, hashed for lookup, and never logged or placed in a URL.</p><input id="apiKey" type="password" autocomplete="off" placeholder="js_live_…"><div class="actions"><button class="cta buy" data-plan="developer">Choose Developer — $9/mo</button><button class="cta buy" data-plan="pro">Choose Pro — $29/mo</button></div><p id="billingResult" class="error"></p></div></section>
  <section><h2>Need implementation help?</h2><p class="muted">Send your stack and expected JSON shape—never secrets or sensitive payloads—and get a recommended integration path.</p><a class="cta" href="mailto:darkstorm13@gmail.com?subject=JSONSuture%20implementation%20help">Email implementation support</a></section>
  <section id="legal"><h2>Terms & privacy</h2><p class="muted"><strong>Terms:</strong> Best-effort service with no warranty; do not use it for unlawful activity or to process secrets you are not authorized to handle. Quotas and abuse controls apply.</p><p class="muted"><strong>Privacy:</strong> JSON payloads and schemas are not stored. We retain hashed API keys, coarse usage counters, latency, status, and estimated cost for authentication, billing, and reliability. No advertising profiles.</p></section>
  <footer>JSONSuture v1 · <a href="https://vesper-3159a405.base44.app/functions/jsonSutureOpenapi">OpenAPI</a> · <a href="https://vesper-3159a405.base44.app/functions/jsonSutureHealth">Status</a> · <a href="mailto:darkstorm13@gmail.com?subject=JSONSuture%20implementation%20help">Support</a></footer>
</main>
<script>
  const base = 'https://vesper-3159a405.base44.app';
  const allowedSources = new Set(['direct','website','github','guide','apis_guru','launch_directory','community','other']);
  const requestedSource = (new URLSearchParams(location.search).get('source') || 'direct').toLowerCase();
  const source = allowedSources.has(requestedSource) ? requestedSource : 'other';
  let issuedKey = '';

  document.getElementById('keyButton').onclick = async () => {
    const button = document.getElementById('keyButton');
    const message = document.getElementById('keyResult');
    button.disabled = true;
    message.className = 'muted';
    message.textContent = 'Creating key…';
    try {
      const response = await fetch(base + '/functions/v1CreateKey', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({source})
      });
      const data = await response.json();
      if (!response.ok || !data.api_key) throw new Error(data.error?.detail || 'Could not create key');
      issuedKey = data.api_key;
      document.getElementById('issuedKey').textContent = issuedKey;
      document.getElementById('apiKey').value = issuedKey;
      document.getElementById('keyPanel').hidden = false;
      message.className = 'success';
      message.textContent = 'Free key created. Run the sample below to verify the integration.';
      button.textContent = 'Free key created';
    } catch (error) {
      message.className = 'error';
      message.textContent = error.message || 'Could not create key';
      button.disabled = false;
    }
  };

  document.getElementById('copyKeyButton').onclick = async () => {
    const button = document.getElementById('copyKeyButton');
    if (!issuedKey) return;
    try {
      await navigator.clipboard.writeText(issuedKey);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Copy manually above';
    }
  };

  document.getElementById('sampleButton').onclick = async () => {
    if (!issuedKey) return;
    const button = document.getElementById('sampleButton');
    const output = document.getElementById('sampleResult');
    button.disabled = true;
    button.textContent = 'Repairing…';
    output.hidden = false;
    output.textContent = 'Calling JSONSuture…';
    try {
      const response = await fetch(base + '/functions/v1RepairJson', {
        method: 'POST',
        headers: {'Authorization': 'Bearer ' + issuedKey, 'Content-Type': 'application/json'},
        body: JSON.stringify({
          text: '{name: Ada, role: engineer, active: true,}',
          schema: {type: 'object', required: ['name','role','active'], properties: {name: {type: 'string'}, role: {type: 'string'}, active: {type: 'boolean'}}}
        })
      });
      const data = await response.json();
      output.textContent = JSON.stringify(data, null, 2);
      if (!response.ok) throw new Error(data.error?.detail || 'Sample repair failed');
      button.textContent = 'Sample repair passed';
    } catch (error) {
      output.textContent = error.message || 'Sample repair failed';
      button.textContent = 'Retry sample repair';
      button.disabled = false;
    }
  };

  document.querySelectorAll('.buy').forEach((button) => button.onclick = async () => {
    const key = document.getElementById('apiKey').value.trim();
    const output = document.getElementById('billingResult');
    if (!key) { output.textContent = 'Enter your API key first.'; return; }
    document.querySelectorAll('.buy').forEach((item) => item.disabled = true);
    output.textContent = 'Opening secure Stripe Checkout…';
    try {
      const response = await fetch(base + '/functions/jsonSutureCheckout', {
        method: 'POST',
        headers: {'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'},
        body: JSON.stringify({plan: button.dataset.plan})
      });
      const data = await response.json();
      const checkoutUrl = data.checkout_url || data.url;
      if (!response.ok || !checkoutUrl) throw new Error(data.error?.detail || data.error?.code || 'Could not create checkout');
      location.assign(checkoutUrl);
    } catch (error) {
      output.textContent = error.message || 'Could not create checkout';
      document.querySelectorAll('.buy').forEach((item) => item.disabled = false);
    }
  });
</script>
</body>
</html>`;

  return new Response(html, { headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=120',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src https://vesper-3159a405.base44.app; frame-ancestors 'none'"
  }});
});
