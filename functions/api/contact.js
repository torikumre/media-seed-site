// Cloudflare Pages Function: POST /api/contact
// Sends booking requests to Media Seed through Resend.
// Requires a secret named RESEND_API_KEY (Cloudflare > Workers & Pages > media-seed-site > Settings > Variables and Secrets).

const TO = 'hello@mediaseed.co';
const FROM = 'Media Seed <bookings@mediaseed.co>';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clip = (s, n) => String(s ?? '').trim().slice(0, n);

function reply(request, status, data) {
  const wantsJson = (request.headers.get('accept') || '').includes('application/json');
  if (wantsJson) return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } });
  const to = data.ok ? '/contact.html?sent=1' : '/contact.html?error=1';
  return Response.redirect(new URL(to, request.url).toString(), 303);
}

async function send(apiKey, payload) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function onRequestPost({ request, env }) {
  let form;
  try { form = await request.formData(); } catch { return reply(request, 400, { ok: false, error: 'Bad request' }); }

  // Spam checks: hidden field must stay empty, and a human takes more than 2 seconds
  if (form.get('company')) return reply(request, 200, { ok: true });
  const started = Number(form.get('started') || 0);
  if (started && Date.now() - started < 2000) return reply(request, 200, { ok: true });

  const name = clip(form.get('name'), 120);
  const email = clip(form.get('email'), 200);
  const phone = clip(form.get('phone'), 40);
  const interest = clip(form.get('interest'), 80);
  const nextJob = clip(form.get('next-job'), 3000);

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply(request, 422, { ok: false, error: 'Please add your name and a valid email.' });
  }
  if (!env.RESEND_API_KEY) return reply(request, 500, { ok: false, error: 'Email is not set up yet.' });

  const rows = [['Name', name], ['Email', email], ['Phone', phone || '—'], ['Interested in', interest], ['Next job', nextJob || '—']];
  const table = rows.map(([k, v]) => `<tr><td style="padding:8px 14px 8px 0;color:#686868;font:600 12px Arial;text-transform:uppercase;letter-spacing:.08em;vertical-align:top">${k}</td><td style="padding:8px 0;font:15px/1.5 Arial;color:#111;white-space:pre-wrap">${esc(v)}</td></tr>`).join('');

  try {
    await send(env.RESEND_API_KEY, {
      from: FROM,
      to: [TO],
      reply_to: email,
      subject: `New booking request: ${name} (${interest})`,
      html: `<div style="max-width:560px;font-family:Arial"><p style="margin:0 0 6px;font:600 11px Arial;letter-spacing:.14em;text-transform:uppercase;color:#686868">mediaseed.co</p><h1 style="margin:0 0 18px;font:700 24px Georgia;color:#111">New <span style="background:linear-gradient(transparent 60%,#FFE792 60%)">booking request</span></h1><table style="border-collapse:collapse">${table}</table><p style="margin:22px 0 0;font:13px Arial;color:#686868">Hit reply to answer ${esc(name)} directly.</p></div>`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join('\n')
    });
  } catch (err) {
    console.error(err);
    return reply(request, 502, { ok: false, error: 'Could not send right now.' });
  }

  // Confirmation to the lead (never blocks the booking if it fails)
  try {
    await send(env.RESEND_API_KEY, {
      from: FROM,
      to: [email],
      reply_to: TO,
      subject: 'Got it. Your jobsite content plan is on the way.',
      html: `<div style="max-width:520px;font-family:Arial;color:#111"><h1 style="margin:0 0 14px;font:700 26px Georgia">Thanks, ${esc(name.split(' ')[0])}.</h1><p style="font:16px/1.6 Arial">I got your request for a <span style="background:linear-gradient(transparent 60%,#FFE792 60%)">15-minute jobsite content plan</span>. I'll reach out within one business day to set a time.</p><p style="font:16px/1.6 Arial">If it's easier, call or text me at <a href="tel:+18319177749" style="color:#111">(831) 917-7749</a>.</p><p style="margin:26px 0 0;font:italic 17px Georgia">Build it. Show it.</p><p style="margin:4px 0 0;font:13px Arial;color:#686868">Media Seed · Monterey County · Est. 2019</p></div>`,
      text: `Thanks, ${name.split(' ')[0]}.\n\nI got your request for a 15-minute jobsite content plan. I'll reach out within one business day to set a time.\n\nIf it's easier, call or text me at (831) 917-7749.\n\nBuild it. Show it.\nMedia Seed · Monterey County · Est. 2019`
    });
  } catch (err) { console.error(err); }

  return reply(request, 200, { ok: true });
}
