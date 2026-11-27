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
  const business = clip(form.get('business'), 160);
  const email = clip(form.get('email'), 200);
  const phone = clip(form.get('phone'), 40);
  const interest = clip(form.get('interest'), 80);
  const nextJob = clip(form.get('next-job'), 3000);

  if (!name || !business || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return reply(request, 422, { ok: false, error: 'Please add your name, business name, and a valid email.' });
  }
  if (!env.RESEND_API_KEY) return reply(request, 500, { ok: false, error: 'Email is not set up yet.' });

  const rows = [['Name', name], ['Business', business], ['Email', email], ['Phone', phone || '—'], ['Interested in', interest], ['Next job', nextJob || '—']];
  const table = rows.map(([k, v]) => `<tr><td style="padding:8px 14px 8px 0;color:#686868;font:600 12px Arial;text-transform:uppercase;letter-spacing:.08em;vertical-align:top">${k}</td><td style="padding:8px 0;font:15px/1.5 Arial;color:#111;white-space:pre-wrap">${esc(v)}</td></tr>`).join('');

  try {
    await send(env.RESEND_API_KEY, {
      from: FROM,
      to: [TO],
      reply_to: email,
      subject: `New booking request: ${business} (${name}, ${interest})`,
      html: `<div style="max-width:560px;font-family:Arial"><p style="margin:0 0 6px;font:600 11px Arial;letter-spacing:.14em;text-transform:uppercase;color:#686868">mediaseed.co</p><h1 style="margin:0 0 18px;font:700 24px Georgia;color:#111">New <span style="background:linear-gradient(transparent 60%,#FFE792 60%)">booking request</span></h1><table style="border-collapse:collapse">${table}</table><p style="margin:22px 0 0;font:13px Arial;color:#686868">Hit reply to answer ${esc(name)} directly.</p></div>`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join('\n')
    });
  } catch (err) {
    console.error(err);
    return reply(request, 502, { ok: false, error: 'Could not send right now.' });
  }

  // Confirmation to the lead (never blocks the booking if it fails)
  try {
    const first = esc(name.split(' ')[0]);
    await send(env.RESEND_API_KEY, {
      from: FROM,
      to: [email],
      reply_to: TO,
      subject: 'Got it. Your jobsite content plan is on the way.',
      html: confirmationHtml(first, esc(interest), esc(business)),
      text: `Thanks, ${name.split(' ')[0]}.\n\nI got your request for a 15-minute jobsite content plan for ${business}. Here's what happens next:\n\n01  I review your business and your next job.\n02  I reach out within one business day to set a time.\n03  On our 15-minute call, you get a content plan for that job.\n\nRather talk now? Call or text (831) 917-7749.\n\nBuild it. Show it.\nMedia Seed · Monterey County · Est. 2019\nmediaseed.co`
    });
  } catch (err) { console.error(err); }

  return reply(request, 200, { ok: true });
}

function confirmationHtml(first, interest, business) {
  const Y = '#FFE792', INK = '#111111', MUTED = '#686868', SOFT = '#F3F3F1';
  const serif = "Georgia,'Times New Roman',serif", sans = 'Arial,Helvetica,sans-serif';
  const step = (n, title, body) => `
    <tr><td style="padding:0 0 18px">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
        <td width="54" valign="top" style="font:italic 600 30px/1 ${serif};color:${INK}"><span style="border-bottom:3px solid ${Y};padding-bottom:2px">${n}</span></td>
        <td valign="top" style="padding-left:6px"><p style="margin:0 0 4px;font:700 15px/1.4 ${serif};color:${INK}">${title}</p><p style="margin:0;font:14px/1.6 ${sans};color:#444">${body}</p></td>
      </tr></table>
    </td></tr>`;
  return `<!doctype html><html><body style="margin:0;padding:0;background:${SOFT}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SOFT}"><tr><td align="center" style="padding:28px 14px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:10px;overflow:hidden">
    <tr><td style="background:${INK};padding:12px 28px;font:600 10px/1.4 ${sans};letter-spacing:.16em;text-transform:uppercase;color:#ffffff">
      <span style="color:${Y}">&#9679;</span>&nbsp; Request received &nbsp;&nbsp;<span style="color:${Y}">&#9679;</span>&nbsp; Est. 2019
    </td></tr>
    <tr><td style="padding:34px 28px 6px">
      <p style="margin:0 0 22px;font:700 22px/1 ${serif};color:${INK}">Media <i style="font-weight:400">Seed</i></p>
      <h1 style="margin:0 0 14px;font:700 34px/1.1 ${serif};color:${INK}">Thanks, <span style="background:${Y};padding:0 6px">${first}.</span></h1>
      <p style="margin:0 0 26px;font:16px/1.6 ${sans};color:#444">I got your request for a <b style="color:${INK}">15-minute jobsite content plan</b> for ${business}. Here's what happens next.</p>
    </td></tr>
    <tr><td style="padding:0 28px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${step('01', `I look at ${business}`, 'Your work, your next job, and who you want to reach.')}
      ${step('02', 'I reach out within one business day', 'We pick a time that works around your jobsite.')}
      ${step('03', 'You get your content plan', 'In 15 minutes, you leave knowing exactly what we would shoot and post.')}
    </table></td></tr>
    <tr><td style="padding:8px 28px 30px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${INK};border-radius:8px"><tr>
        <td style="padding:20px 22px"><p style="margin:0 0 4px;font:600 10px/1.4 ${sans};letter-spacing:.14em;text-transform:uppercase;color:${Y}">Rather talk now?</p>
        <p style="margin:0 0 14px;font:italic 600 22px/1.3 ${serif};color:#ffffff">Call or text me.</p>
        <a href="tel:+18319177749" style="display:inline-block;padding:12px 18px;background:${Y};color:${INK};font:700 15px ${sans};text-decoration:none;border-radius:2px;white-space:nowrap">(831) 917-7749</a></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:22px 28px;border-top:1px solid #e3e3e0">
      <p style="margin:0 0 4px;font:italic 18px/1.3 ${serif};color:${INK}">Build it. <span style="background:linear-gradient(transparent 60%,${Y} 60%)">Show it.</span></p>
      <p style="margin:0;font:12px/1.6 ${sans};color:${MUTED}">Media Seed · Jobsite content for contractors · <a href="https://mediaseed.co" style="color:${MUTED}">mediaseed.co</a></p>
    </td></tr>
  </table></td></tr></table></body></html>`;
}
