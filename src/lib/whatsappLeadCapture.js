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

// Where did this enquiry come from? Campaign params + referrer + page, folded
// into the notes field so the team can see it without a schema change.
export const collectAttribution = () => {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const pick = (k) => (params.get(k) || '').slice(0, 80) || undefined;
    return {
      page:     window.location.pathname + window.location.search,
      referrer: (document.referrer || '').slice(0, 200) || undefined,
      utmSource:   pick('utm_source'),
      utmMedium:   pick('utm_medium'),
      utmCampaign: pick('utm_campaign'),
      ref:         pick('ref') || pick('agent'),
    };
  } catch { return {}; }
};

const buildNotes = ({ message, attribution = {}, repeat, label = 'WhatsApp enquiry', dedupeUnknown }) => {
  const lines = [];
  lines.push(repeat
    ? `🔁 Repeat ${label} from website — ${new Date().toLocaleString('en-IN')}`
    : `🟢 ${label} from website — ${new Date().toLocaleString('en-IN')}`);
  if (message)              lines.push(`Message: "${message}"`);
  if (attribution.page)     lines.push(`Page: ${attribution.page}`);
  if (attribution.ref)      lines.push(`Ref: ${attribution.ref}`);
  const utm = [attribution.utmSource, attribution.utmMedium, attribution.utmCampaign]
    .filter(Boolean).join(' / ');
  if (utm)                  lines.push(`Campaign: ${utm}`);
  if (attribution.referrer) lines.push(`Referrer: ${attribution.referrer}`);
  if (dedupeUnknown) lines.push('⚠️ Duplicate check could not run (network) — may repeat an existing lead.');
  return lines.join('\n');
};

// ── EMAIL TO THE OWNER ──────────────────────────────────────────────────────
// Sends the lead straight to the owner's inbox, in parallel with the CRM
// write and independent of it — if Supabase is having a bad day the enquiry
// still lands somewhere a human will see it.
//
// Goes through Web3Forms so there is no server to run and nothing to deploy.
// Its access key is designed to be public (it only lets a form post to the
// one inbox it was issued for), so it ships in the bundle the way the
// Supabase anon key already does. Set VITE_WEB3FORMS_KEY to switch this on;
// with no key we skip the email and the CRM write is unaffected.
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
        Project:  project || '—',
        Source:   source,
        Message:  message || '—',
        Page:     attribution.page || '—',
        Campaign: [attribution.utmSource, attribution.utmMedium, attribution.utmCampaign]
          .filter(Boolean).join(' / ') || '—',
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

// Talks to PostgREST directly instead of going through supabase-js, for two
// reasons that both matter on a phone mid-hand-off:
//
//   • keepalive — a normal fetch is cancelled when the browser backgrounds
//     the tab to switch into WhatsApp; a keepalive request still completes.
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
      const err = new Error(`Supabase ${method} ${path} failed (${res.status}): ${text}`);
      // 23505 = unique violation. This table currently has no unique index on
      // phone (only the id primary key), so this never fires today — it is
      // here so that adding one later turns duplicates into a clean success
      // rather than a retry loop.
      err.isDuplicate = res.status === 409 || text.includes('23505');
      throw err;
    }
    return text ? JSON.parse(text) : null;
  } finally {
    clearTimeout(timer);
  }
};

const insertLeadRow = (row) =>
  restFetch('leads', { method: 'POST', body: row, prefer: 'return=minimal', timeoutMs: 10000, keepalive: true });

// Existing lead → don't touch status, assignment or the telecaller's own
// notes ordering; just prepend the fresh enquiry and bump updated_at so the
// lead resurfaces at the top of "recently active".
const appendRepeatEnquiry = (leadId, existingNotes, noteText) => {
  const merged = [noteText, existingNotes].filter(Boolean).join('\n\n');
  return restFetch(`leads?id=eq.${encodeURIComponent(leadId)}`, {
    method: 'PATCH',
    body: { notes: merged.slice(0, 8000), updated_at: new Date().toISOString() },
    prefer: 'return=minimal',
    keepalive: true,
  });
};

// Returns the existing lead, null if there is none, or undefined when we
// could not find out. Undefined deliberately falls through to an insert: a
// slow lookup must never cost us the lead. There is no unique index on
// leads.phone to catch a genuine repeat in that case, so the inserted row is
// flagged in its notes instead — a duplicate the team can see and merge is
// still far better than a lead we never captured.
const findExistingLead = async (storedPhone) => {
  const ten = toTenDigits(storedPhone);
  // The table has been filled by several importers over time, so the same
  // number may sit there in any of these shapes.
  const variants = [...new Set([storedPhone, ten, `91${ten}`, `0${ten}`])].filter(Boolean);
  const filter = `in.(${variants.join(',')})`;
  try {
    const rows = await restFetch(
      `leads?select=id,notes&phone=${encodeURIComponent(filter)}&limit=1`,
      { timeoutMs: 6000 }
    );
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  } catch (err) {
    console.warn('[WA Lead] duplicate lookup unavailable, inserting anyway:', err && err.message);
    return undefined;
  }
};

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
    const existing = await findExistingLead(storedPhone);

    if (existing) {
      await appendRepeatEnquiry(
        existing.id,
        existing.notes,
        buildNotes({ message, attribution: attr, repeat: true, label: noteLabel })
      );
      return { success: true, duplicate: true };
    }

    // existing === undefined means the lookup itself failed, not that the
    // number is new. Record that on the row so a possible repeat is visible.
    const dedupeUnknown = existing === undefined;
    const now = new Date().toISOString();
    await insertLeadRow({
      // Both name columns are written because the CRM reads `full_name`
      // while the original schema declares `name` NOT NULL.
      name:              String(name || '').trim() || `${source} Enquiry`,
      full_name:         String(name || '').trim() || `${source} Enquiry`,
      phone:             storedPhone,
      email:             email || '',
      source,
      status:            'Active',
      final_status:      'FollowUp',
      // Someone who reached out themselves is warmer than an imported row.
      interest_level:    interestLevel,
      notes:             buildNotes({ message, attribution: attr, label: noteLabel, dedupeUnknown }),
      site_visit_status: 'not_planned',
      project:           project || null,
      created_at:        now,
      updated_at:        now,
    });

    return { success: true };
  } catch (err) {
    if (err && err.isDuplicate) return { success: true, duplicate: true };
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
