// src/lib/whatsappLeadCapture.js
// ============================================================================
// FAST WHATSAPP LEAD GRABBING
// ============================================================================
// Every WhatsApp CTA on the public site used to be a plain wa.me link: the
// visitor jumped straight into WhatsApp and nothing about them ever reached
// the CRM. If nobody happened to read that chat, the enquiry was gone.
//
// This module is the capture layer behind those CTAs. Design rules:
//
//   1. NEVER block the hand-off. WhatsApp opens on the same user gesture that
//      submitted the form; the database write is fired in the background and
//      is never awaited. A slow network must not cost us the chat.
//   2. SURVIVE the hand-off. The insert goes out via fetch({ keepalive: true })
//      so it still completes after the browser backgrounds the tab to switch
//      into the WhatsApp app — the exact moment a normal fetch gets killed.
//   3. NEVER lose a lead. If the write fails anyway (offline, RLS, 5xx) the
//      lead is queued in localStorage and retried on the next page load and
//      on the next `online` event.
//   4. ASK ONCE. After the first capture the visitor is remembered, so every
//      later WhatsApp tap goes straight through with zero friction and is
//      logged as a repeat enquiry instead.
// ============================================================================

import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

const QUEUE_KEY   = 'fanbe_wa_lead_queue';
const VISITOR_KEY = 'fanbe_wa_visitor';

// Matches every WhatsApp deep-link shape used across the site.
const WHATSAPP_URL_RE = /^https?:\/\/(?:api\.whatsapp\.com|(?:web\.|chat\.)?whatsapp\.com|wa\.me)\//i;

export const isWhatsAppUrl = (url) =>
  typeof url === 'string' && WHATSAPP_URL_RE.test(url.trim());

// ── PHONE ───────────────────────────────────────────────────────────────────

// Indian mobile numbers start 6-9. Accepts 9876543210, 09876543210,
// +91 98765 43210, 919876543210 — all collapse to the same 10 digits.
export const toTenDigits = (raw) => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('0'))  return digits.slice(1);
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith('091')) return digits.slice(3);
  return '';
};

export const isValidIndianMobile = (raw) => /^[6-9]\d{9}$/.test(toTenDigits(raw));

// Storage format matches the bulk importer (`+91XXXXXXXXXX`) so the CRM's
// duplicate checks keep working across both entry paths.
export const toStoredPhone = (raw) => {
  const ten = toTenDigits(raw);
  return ten ? `+91${ten}` : String(raw || '').trim();
};

// ── REMEMBERED VISITOR ──────────────────────────────────────────────────────

export const getSavedVisitor = () => {
  try {
    const raw = localStorage.getItem(VISITOR_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    return v && isValidIndianMobile(v.phone) ? v : null;
  } catch { return null; }
};

export const saveVisitor = ({ name, phone }) => {
  try {
    localStorage.setItem(VISITOR_KEY, JSON.stringify({
      name:  String(name || '').trim(),
      phone: toTenDigits(phone),
      savedAt: new Date().toISOString(),
    }));
  } catch { /* private mode — capture still worked, only the memory is lost */ }
};

export const forgetVisitor = () => {
  try { localStorage.removeItem(VISITOR_KEY); } catch { /* ignore */ }
};

// ── ATTRIBUTION ─────────────────────────────────────────────────────────────

const FIRST_TOUCH_KEY = 'fanbe_first_touch';

// Campaign params only sit on the landing URL. The moment the visitor clicks
// through to another page they are gone, so a lead submitted from /contact
// used to look sourceless even when the visit started on a Facebook ad. This
// records how the visit began, once, and keeps it for the rest of the visit.
export const recordFirstTouch = () => {
  if (typeof window === 'undefined') return;
  try {
    if (sessionStorage.getItem(FIRST_TOUCH_KEY)) return;   // already captured
    const params = new URLSearchParams(window.location.search);
    const pick = (k) => (params.get(k) || '').slice(0, 80) || undefined;
    const referrer = (document.referrer || '').slice(0, 200);
    const external = referrer && !referrer.includes(window.location.host);
    const touch = {
      utmSource:   pick('utm_source'),
      utmMedium:   pick('utm_medium'),
      utmCampaign: pick('utm_campaign'),
      ref:         pick('ref') || pick('agent'),
      referrer:    external ? referrer : undefined,
      landingPage: window.location.pathname + window.location.search,
    };
    // A plain internal visit tells us nothing worth remembering.
    if (!touch.utmSource && !touch.utmCampaign && !touch.ref && !touch.referrer) return;
    sessionStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(touch));
  } catch { /* private mode — attribution degrades, capture still works */ }
};

const getFirstTouch = () => {
  try { return JSON.parse(sessionStorage.getItem(FIRST_TOUCH_KEY) || 'null') || {}; }
  catch { return {}; }
};

const hostOf = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
};

/**
 * One plain line answering "where did this lead actually come from?", so the
 * team reads a verdict instead of decoding a UTM string. Paid traffic is named
 * as paid; a visit with neither campaign nor referrer is called out, because
 * that is what a test submission looks like.
 */
export const describeSource = (attr = {}) => {
  const src    = (attr.utmSource || '').toLowerCase();
  const medium = (attr.utmMedium || '').toLowerCase();
  const ref    = (attr.referrer || '').toLowerCase();
  const paid   = /paid|cpc|ppc|ads/.test(medium);

  if (src.startsWith('fb') || src.includes('facebook'))  return paid ? 'Facebook Ad (paid)'  : 'Facebook';
  if (src.startsWith('ig') || src.includes('instagram')) return paid ? 'Instagram Ad (paid)' : 'Instagram';
  if (src.includes('google'))                            return paid ? 'Google Ads (paid)'   : 'Google';
  if (attr.utmSource)  return `${attr.utmSource}${paid ? ' (paid)' : ''}`;
  if (attr.ref)        return `Telecaller/partner link (${attr.ref})`;

  if (ref.includes('facebook'))   return 'Facebook (link, ad nahi)';
  if (ref.includes('instagram'))  return 'Instagram (link, ad nahi)';
  if (/google\.|bing\.|duckduckgo|yahoo\./.test(ref)) return 'Google/Search — organic';
  if (ref) return `Referral: ${hostOf(attr.referrer) || 'doosri site'}`;

  return '⚠️ Direct — koi ad/search nahi (test ho sakta hai)';
};

// Where did this enquiry come from? Campaign params + referrer + page, folded
// into the notes field so the team can see it without a schema change. The
// current URL wins; anything it does not carry falls back to how the visit
// started.
export const collectAttribution = () => {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const pick = (k) => (params.get(k) || '').slice(0, 80) || undefined;
    const first = getFirstTouch();
    const referrer = (document.referrer || '').slice(0, 200) || undefined;
    const external = referrer && !referrer.includes(window.location.host);
    return {
      page:        window.location.pathname + window.location.search,
      landingPage: first.landingPage,
      referrer:    (external ? referrer : undefined) || first.referrer,
      utmSource:   pick('utm_source')   || first.utmSource,
      utmMedium:   pick('utm_medium')   || first.utmMedium,
      utmCampaign: pick('utm_campaign') || first.utmCampaign,
      ref:         pick('ref') || pick('agent') || first.ref,
    };
  } catch { return {}; }
};

// The lines under the marker in a lead's notes. The marker itself (🟢 / 🔁
// plus the timestamp) is added server-side by submit_website_lead, which is
// the only thing that knows whether this phone is already in the table.
const buildDetails = ({ message, attribution = {} }) => {
  const lines = [];
  lines.push(`Source: ${describeSource(attribution)}`);
  if (message)              lines.push(`Message: "${message}"`);
  if (attribution.page)     lines.push(`Page: ${attribution.page}`);
  if (attribution.landingPage && attribution.landingPage !== attribution.page) {
    lines.push(`Landed on: ${attribution.landingPage}`);
  }
  if (attribution.ref)      lines.push(`Ref: ${attribution.ref}`);
  const utm = [attribution.utmSource, attribution.utmMedium, attribution.utmCampaign]
    .filter(Boolean).join(' / ');
  if (utm)                  lines.push(`Campaign: ${utm}`);
  if (attribution.referrer) lines.push(`Referrer: ${attribution.referrer}`);
  return lines.join('\n');
};

// ── EMAIL TO THE OWNER ──────────────────────────────────────────────────────
// Sends the lead straight to the owner's inbox, in parallel with the CRM
// write and independent of it — if Supabase is having a bad day the enquiry
// still lands somewhere a human will see it.
//
// Goes through Web3Forms so there is no server to run and nothing to deploy.
// Its access key is issued as public — it does nothing but post a form to the
// one inbox it was created for — and being VITE_-prefixed it is inlined into
// the client bundle at build time either way. It is kept in an env var rather
// than in this file so the inbox can be changed, or the key rotated, without
// a code change. With no key set the email is skipped and the CRM write is
// unaffected, so a missing setting degrades quietly instead of breaking.
const WEB3FORMS_KEY = (import.meta.env.VITE_WEB3FORMS_KEY || '').trim();
const NOTIFIED_KEY  = 'fanbe_wa_notified';
const NOTIFY_WINDOW_MS = 6 * 60 * 60 * 1000;

// One tap opens WhatsApp; some people tap three times. Don't mail the same
// number more than once every six hours.
const alreadyNotified = (phone) => {
  try {
    const seen = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}');
    const last = seen[phone];
    return !!last && (Date.now() - last) < NOTIFY_WINDOW_MS;
  } catch { return false; }
};

const markNotified = (phone) => {
  try {
    const seen = JSON.parse(localStorage.getItem(NOTIFIED_KEY) || '{}');
    const cutoff = Date.now() - NOTIFY_WINDOW_MS;
    const fresh = Object.fromEntries(Object.entries(seen).filter(([, t]) => t > cutoff));
    fresh[phone] = Date.now();
    localStorage.setItem(NOTIFIED_KEY, JSON.stringify(fresh));
  } catch { /* ignore */ }
};

/** Fire and forget. Never throws — the email must never put the lead at risk. */
export const notifyLeadByEmail = async ({
  name, phone, project, message, source = 'WhatsApp', attribution = {},
} = {}) => {
  if (!WEB3FORMS_KEY) return { success: false, skipped: 'no_key' };
  if (alreadyNotified(phone)) return { success: false, skipped: 'throttled' };

  const ten = toTenDigits(phone);
  const who = String(name || '').trim() || 'Naam nahi diya';
  markNotified(phone);

  try {
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        access_key: WEB3FORMS_KEY,
        subject: `🟢 Nayi ${source} lead: ${who}${ten ? ` (${ten})` : ''}`,
        from_name: 'Fanbe Website',
        // Web3Forms mails every extra field through as a labelled row.
        Naam:     who,
        Phone:    ten ? `+91 ${ten}` : phone,
        // The verdict sits right under the number because it is what decides
        // how the lead gets treated: a paid-ad lead is worth a call back, a
        // direct one with no referrer may just be someone testing the form.
        Kahan_se: describeSource(attribution),
        Project:  project || '—',
        Source:   source,
        Message:  message || '—',
        Page:     attribution.page || '—',
        Landing:  attribution.landingPage && attribution.landingPage !== attribution.page
          ? attribution.landingPage : '—',
        Campaign: [attribution.utmSource, attribution.utmMedium, attribution.utmCampaign]
          .filter(Boolean).join(' / ') || '—',
        // Captured all along but never mailed, which is exactly what made
        // "Google organic" and "someone testing" look identical in the inbox.
        Referrer: attribution.referrer || '— (direct)',
        Ref:      attribution.ref || '—',
        Time:     new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        Call:     ten ? `tel:+91${ten}` : '—',
        WhatsApp: ten ? `https://wa.me/91${ten}` : '—',
      }),
    });
    if (!res.ok) throw new Error(`Web3Forms responded ${res.status}`);
    return { success: true };
  } catch (err) {
    console.warn('[WA Lead] email notification failed:', err && err.message);
    return { success: false, error: err && err.message };
  }
};

// ── WRITE PATH ──────────────────────────────────────────────────────────────

// Everything goes through one SECURITY DEFINER function, submit_website_lead
// (see supabase/migrations/20260928_website_lead_capture_rpc.sql).
//
// The browser used to insert into `leads` directly. That stopped working when
// the anon GRANT and the blanket "Allow all access" policy were removed around
// 15 Sep 2026 — correctly, because the anon key ships in this bundle and could
// read every customer row with it. The emails kept arriving while nothing
// reached the CRM, which is how a month of website leads went missing.
//
// anon now holds EXECUTE on that one function and no table grant at all: it
// can submit a lead and cannot read, update or delete a single row. The
// duplicate check moved server-side with it, since the browser can no longer
// SELECT to do it itself.
//
// Still raw fetch rather than supabase-js, for two reasons that both matter on
// a phone the instant after a tap:
//
//   • keepalive — a normal fetch is cancelled when the browser backgrounds the
//     tab; a keepalive request still completes.
//   • a real timeout — supabase-js does not reject promptly when the network
//     drops (it sat pending indefinitely in testing), so the queue-and-retry
//     fallback never got a chance to run and the lead was silently lost.
const restFetch = async (path, { method = 'GET', body, prefer, timeoutMs = 8000, keepalive = false } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type':  'application/json',
        ...(prefer ? { 'Prefer': prefer } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      keepalive,
      signal: controller.signal,
    });
    const text = await res.text().catch(() => '');
    if (!res.ok) {
      throw new Error(`Supabase ${method} ${path} failed (${res.status}): ${text}`);
    }
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
};

// Resolves { ok: true } | { ok: true, duplicate: true } | { ok: false, error }.
// The function decides which — only it can see whether the number already
// exists — so the note's 🟢 / 🔁 marker and its timestamp are built there too,
// off server time in IST rather than the visitor's device clock.
const submitLeadRpc = (args) =>
  restFetch('rpc/submit_website_lead', {
    method: 'POST',
    body: args,
    timeoutMs: 10000,
    keepalive: true,
  });

/**
 * Capture a website enquiry as a CRM lead.
 *
 * Fire and forget — callers must NOT await this before handing off to
 * WhatsApp. Resolves `{ success, duplicate?, queued?, error? }`; never throws.
 */
export const captureLead = async ({
  name,
  phone,
  email = '',
  project,
  message,
  source = 'WhatsApp',
  label,
  interestLevel = 'Hot',
  attribution,
  _fromQueue = false,
} = {}) => {
  const storedPhone = toStoredPhone(phone);
  if (!isValidIndianMobile(phone)) {
    return { success: false, error: 'invalid_phone' };
  }

  const attr = attribution || collectAttribution();
  const noteLabel = label || (source === 'WhatsApp' ? 'WhatsApp enquiry' : `${source} enquiry`);

  // Independent of everything below, and deliberately not awaited: the inbox
  // copy should go out even if the CRM write then fails. Skipped on a queue
  // retry, which is replaying a lead that was already mailed first time round.
  if (!_fromQueue) {
    notifyLeadByEmail({ name, phone: storedPhone, project, message, source, attribution: attr });
  }
  const payload = {
    name, phone: storedPhone, email, project, message,
    source, label: noteLabel, interestLevel, attribution: attr,
  };

  try {
    const result = await submitLeadRpc({
      p_phone:          storedPhone,
      p_name:           String(name || '').trim(),
      p_email:          email || '',
      p_project:        project || null,
      p_source:         source,
      p_interest_level: interestLevel,
      p_label:          noteLabel,
      p_details:        buildDetails({ message, attribution: attr }),
    });

    // A number the function rejects will never be accepted, so don't queue it.
    if (result && result.ok === false) {
      return { success: false, error: result.error || 'rejected' };
    }
    return { success: true, duplicate: !!(result && result.duplicate) };
  } catch (err) {
    console.warn('[WA Lead] capture failed, queueing for retry:', err && err.message);
    if (!_fromQueue) enqueueLead(payload);
    return { success: false, queued: !_fromQueue, error: err && err.message };
  }
};

// ── RETRY QUEUE ─────────────────────────────────────────────────────────────

const readQueue = () => {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const writeQueue = (items) => {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-50))); }
  catch { /* storage full or blocked — nothing we can do */ }
};

const enqueueLead = (payload) => {
  const queue = readQueue();
  queue.push({ ...payload, queuedAt: new Date().toISOString(), attempts: 0 });
  writeQueue(queue);
};

let flushing = false;

/** Retry every queued lead. Safe to call repeatedly; self-throttles. */
export const flushLeadQueue = async () => {
  if (flushing) return;
  const queue = readQueue();
  if (!queue.length) return;

  flushing = true;
  const remaining = [];
  try {
    for (const item of queue) {
      // Give up after 5 tries rather than retrying a permanently bad row forever.
      if ((item.attempts || 0) >= 5) continue;
      const result = await captureLead({ ...item, _fromQueue: true });
      if (!result.success && result.error !== 'invalid_phone') {
        remaining.push({ ...item, attempts: (item.attempts || 0) + 1 });
      }
    }
    writeQueue(remaining);
    const sent = queue.length - remaining.length;
    if (sent > 0) console.log(`[WA Lead] flushed ${sent} queued lead(s)`);
  } finally {
    flushing = false;
  }
};

export const getQueuedLeadCount = () => readQueue().length;

/** Named wrapper kept for the WhatsApp call sites. */
export const captureWhatsAppLead = (args = {}) =>
  captureLead({ source: 'WhatsApp', ...args });
