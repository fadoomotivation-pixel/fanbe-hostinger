// src/context/WhatsAppLeadContext.jsx
// ============================================================================
// Site-wide interceptor that turns every WhatsApp CTA into a captured lead.
// ============================================================================
// WhatsApp CTAs are scattered across ~20 files as hardcoded `wa.me` links —
// some as <a href>, some as onClick + window.open. Rather than editing every
// call site (and having the next one added silently bypass capture), this
// provider intercepts the *intent* at two chokepoints:
//
//   1. a capture-phase document click listener, for <a href="…wa.me…">
//   2. a patched window.open, for the imperative call sites
//
// A first-time visitor gets the quick grab sheet; a visitor we already know
// goes straight through, with a repeat enquiry logged in the background. The
// hand-off to WhatsApp is never blocked on the network.
// ============================================================================

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import WhatsAppLeadModal from '@/components/WhatsAppLeadModal';
import { projectsData } from '@/data/projectsData';
import {
  isWhatsAppUrl,
  getSavedVisitor,
  saveVisitor,
  captureWhatsAppLead,
  flushLeadQueue,
  collectAttribution,
} from '@/lib/whatsappLeadCapture';

const SKIP_KEY = 'fanbe_wa_skipped';

const WhatsAppLeadContext = createContext({ openWhatsApp: () => {} });
export const useWhatsAppLead = () => useContext(WhatsAppLeadContext);

// Read the prefilled chat text out of a wa.me / api.whatsapp.com link so the
// lead note records what the visitor was about to ask.
const readPrefillText = (url) => {
  try { return new URL(url, window.location.origin).searchParams.get('text') || ''; }
  catch { return ''; }
};

// Sign the outgoing message so the name shows up in WhatsApp itself, not just
// in the CRM — whoever picks up the chat sees who it is straight away.
const signMessage = (url, name) => {
  if (!name) return url;
  try {
    const u = new URL(url, window.location.origin);
    const text = u.searchParams.get('text') || 'Hello, I am interested in Fanbe Group projects.';
    const signed = encodeURIComponent(`${text}\n\n— ${name}`);
    // Built by hand rather than via searchParams.set: that serialises spaces
    // as `+`, and every other WhatsApp link on the site uses %20. Same result
    // in WhatsApp, but keeping one encoding makes the links comparable in logs.
    const others = [...u.searchParams.entries()]
      .filter(([k]) => k !== 'text')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
    u.search = [`text=${signed}`, ...others].join('&');
    return u.toString();
  } catch { return url; }
};

const projectFromPath = (pathname) => {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  if (!match) return '';
  const project = projectsData.find(p => p.slug === match[1]);
  return project ? project.title : '';
};

const skippedThisSession = () => {
  try { return sessionStorage.getItem(SKIP_KEY) === '1'; } catch { return false; }
};
const markSkipped = () => {
  try { sessionStorage.setItem(SKIP_KEY, '1'); } catch { /* ignore */ }
};

export const WhatsAppLeadProvider = ({ children }) => {
  const { pathname } = useLocation();
  const [pending, setPending] = useState(null);   // { url, project, message }

  // Employees working inside the CRM (and brokers in their portal) must never
  // hit the visitor grab sheet — their WhatsApp clicks are outbound, not leads.
  const enabled = !pathname.startsWith('/crm') && !pathname.startsWith('/broker');

  const nativeOpen = useRef(null);
  const bypass     = useRef(false);   // set while WE are the one calling open()
  // Refs, not deps: the window.open patch must be installed exactly once, so
  // it reads the current route/enabled state at call time instead of being
  // torn down and reinstalled on every navigation.
  const enabledRef = useRef(enabled);
  const projectRef = useRef('');

  useEffect(() => {
    enabledRef.current = enabled;
    projectRef.current = projectFromPath(pathname);
  }, [enabled, pathname]);

  // Anything stranded by an earlier failed write goes out now.
  useEffect(() => {
    flushLeadQueue();
    const onOnline = () => flushLeadQueue();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  const openNow = useCallback((url) => {
    bypass.current = true;
    try {
      const win = nativeOpen.current ? nativeOpen.current(url, '_blank') : null;
      // Popup blocked (common on iOS when the gesture is one frame stale) —
      // navigate instead. Losing the tab beats losing the conversation.
      if (!win) window.location.href = url;
    } finally {
      bypass.current = false;
    }
  }, []);

  // Returns true when the navigation was swallowed and the sheet was shown.
  const handleIntent = useCallback((url) => {
    if (!enabledRef.current || bypass.current || !isWhatsAppUrl(url)) return false;

    const project = projectRef.current;
    const message = readPrefillText(url);
    const visitor = getSavedVisitor();

    // Already known → zero friction. Log the repeat enquiry in the background
    // and let the original click proceed untouched.
    if (visitor) {
      captureWhatsAppLead({
        name: visitor.name,
        phone: visitor.phone,
        project,
        message,
        source: 'WhatsApp',
        attribution: collectAttribution(),
      });
      return false;
    }

    // They already declined once this session — don't ask again.
    if (skippedThisSession()) return false;

    setPending({ url, project, message });
    return true;
  }, []);

  // ── Chokepoint 1: <a href="…wa.me…"> ──────────────────────────────────────
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;   // open-in-new-tab intent
      const anchor = e.target?.closest?.('a[href]');
      if (!anchor || !isWhatsAppUrl(anchor.href)) return;
      if (handleIntent(anchor.href)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [handleIntent]);

  // ── Chokepoint 2: window.open('https://wa.me/…') ──────────────────────────
  useEffect(() => {
    const native = window.open.bind(window);
    nativeOpen.current = native;
    window.open = (url, ...rest) => {
      if (handleIntent(url)) return null;
      return native(url, ...rest);
    };
    return () => {
      window.open = native;
      nativeOpen.current = null;
    };
  }, [handleIntent]);

  const handleSubmit = useCallback(({ name, phone }) => {
    const intent = pending;
    if (!intent) return;

    saveVisitor({ name, phone });

    // Fire and forget — deliberately NOT awaited. The write is keepalive, so
    // it completes even though the browser is about to switch apps.
    captureWhatsAppLead({
      name,
      phone,
      project: intent.project,
      message: intent.message,
      source:  'WhatsApp',
      attribution: collectAttribution(),
    });

    // Same user gesture → the popup is allowed.
    openNow(signMessage(intent.url, name));
    setPending(null);
  }, [pending, openNow]);

  const handleSkip = useCallback(() => {
    const intent = pending;
    markSkipped();
    setPending(null);
    if (intent) openNow(intent.url);
  }, [pending, openNow]);

  // Imperative escape hatch for new call sites: useWhatsAppLead().openWhatsApp(url)
  const openWhatsApp = useCallback((url) => {
    if (!handleIntent(url)) openNow(url);
  }, [handleIntent, openNow]);

  return (
    <WhatsAppLeadContext.Provider value={{ openWhatsApp }}>
      {children}
      <WhatsAppLeadModal
        isOpen={!!pending}
        project={pending?.project}
        onSubmit={handleSubmit}
        onSkip={handleSkip}
        onClose={handleSkip}
      />
    </WhatsAppLeadContext.Provider>
  );
};

export default WhatsAppLeadProvider;
