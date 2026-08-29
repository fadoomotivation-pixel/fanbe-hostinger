// src/context/WhatsAppLeadContext.jsx
// ============================================================================
// Site-wide interceptor that replaces every WhatsApp CTA with a lead form.
// ============================================================================
// WhatsApp CTAs are scattered across ~20 files as hardcoded `wa.me` links —
// some as <a href>, some as onClick + window.open. Rather than editing every
// call site (and having the next one added silently bypass capture), this
// provider intercepts the *intent* at two chokepoints:
//
//   1. a capture-phase document click listener, for <a href="…wa.me…">
//   2. a patched window.open, for the imperative call sites
//
// The visitor is never sent to WhatsApp. They leave a number, the sales team
// contacts them — so the intercepted CTA opens the form and that is the end
// of it. No WhatsApp URL is ever navigated to, on any path.
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

// Where a wa.me URL is parked once it has been taken out of an href.
const WA_HREF_ATTR = 'data-wa-href';

const WhatsAppLeadContext = createContext({ openLeadForm: () => {} });
export const useWhatsAppLead = () => useContext(WhatsAppLeadContext);

// Read the prefilled chat text out of a wa.me / api.whatsapp.com link. The
// visitor never sees it now, but it says which CTA they pressed, so it is
// worth keeping on the lead note for whoever calls them back.
const readPrefillText = (url) => {
  try { return new URL(url, window.location.origin).searchParams.get('text') || ''; }
  catch { return ''; }
};

const projectFromPath = (pathname) => {
  const match = pathname.match(/^\/projects\/([^/]+)/);
  if (!match) return '';
  const project = projectsData.find(p => p.slug === match[1]);
  return project ? project.title : '';
};

export const WhatsAppLeadProvider = ({ children }) => {
  const { pathname } = useLocation();
  const [pending, setPending] = useState(null);   // { url, project, message }

  // Employees working inside the CRM (and brokers in their portal) must never
  // hit the visitor grab sheet — their WhatsApp clicks are outbound, not leads.
  const enabled = !pathname.startsWith('/crm') && !pathname.startsWith('/broker');

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

  // Returns true when the navigation was swallowed and the form was shown —
  // which, on the public site, is every WhatsApp URL. A returning visitor
  // gets the same form with their details already filled in, so they confirm
  // rather than retype; nobody is passed through to WhatsApp.
  const handleIntent = useCallback((url) => {
    if (!enabledRef.current || !isWhatsAppUrl(url)) return false;
    setPending({
      project: projectRef.current,
      message: readPrefillText(url),
      visitor: getSavedVisitor(),
    });
    return true;
  }, []);

  // ── Chokepoint 1: <a href="…wa.me…"> ──────────────────────────────────────
  //
  // Intercepting the click alone is not enough. While the wa.me URL sits in
  // the href, the browser offers its own ways around us that no JavaScript
  // can veto: ctrl/cmd-click, middle-click, right-click → "Open link in new
  // tab", "Copy link address". Each of those reaches WhatsApp with no number
  // captured. So the URL is moved off the href into a data attribute and the
  // element is left behaving as a button; the click handler reads it from
  // there. Nothing the browser can act on is left in the DOM.
  useEffect(() => {
    if (!enabled) return;   // CRM/broker links are staff tools — leave them alone

    const disarm = (root) => {
      const nodes = root.querySelectorAll
        ? root.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp.com"]')
        : [];
      nodes.forEach((a) => {
        const href = a.getAttribute('href');
        if (!href || !isWhatsAppUrl(href)) return;
        a.setAttribute(WA_HREF_ATTR, href);
        a.removeAttribute('href');
        a.removeAttribute('target');
        a.setAttribute('role', 'button');
        if (!a.hasAttribute('tabindex')) a.setAttribute('tabindex', '0');
        a.style.cursor = 'pointer';
      });
    };

    disarm(document);
    // React re-renders put the href straight back, so keep watching.
    const observer = new MutationObserver(() => disarm(document));
    observer.observe(document.body, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['href'],
    });

    const onClick = (e) => {
      if (e.defaultPrevented) return;
      const el = e.target?.closest?.(`[${WA_HREF_ATTR}], a[href]`);
      if (!el) return;
      const url = el.getAttribute(WA_HREF_ATTR) || el.getAttribute('href');
      if (!url || !isWhatsAppUrl(url)) return;
      if (handleIntent(url)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    // Keyboard activation on a disarmed link: it is a button now, so Enter
    // and Space should open the sheet the way a real button would.
    const onKeyDown = (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const el = e.target?.closest?.(`[${WA_HREF_ATTR}]`);
      if (!el) return;
      const url = el.getAttribute(WA_HREF_ATTR);
      if (!url || !isWhatsAppUrl(url)) return;
      if (handleIntent(url)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      observer.disconnect();
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [handleIntent, enabled]);

  // ── Chokepoint 2: window.open('https://wa.me/…') ──────────────────────────
  // A WhatsApp URL is swallowed and never passed to the real window.open.
  // Everything else opens as normal.
  useEffect(() => {
    const native = window.open.bind(window);
    window.open = (url, ...rest) => {
      if (handleIntent(url)) return null;
      return native(url, ...rest);
    };
    return () => { window.open = native; };
  }, [handleIntent]);

  const handleSubmit = useCallback(({ name, phone }) => {
    const intent = pending;
    if (!intent) return;

    // Remembered so a later enquiry comes back pre-filled.
    saveVisitor({ name, phone });

    // Fire and forget — deliberately NOT awaited, so the confirmation shows
    // instantly. A failed write is queued and retried; the notification email
    // goes out on its own path.
    captureWhatsAppLead({
      name,
      phone,
      project: intent.project,
      message: intent.message,
      source:  'WhatsApp',
      attribution: collectAttribution(),
    });
  }, [pending]);

  const handleClose = useCallback(() => setPending(null), []);

  // Imperative entry point for new call sites: useWhatsAppLead().openLeadForm()
  const openLeadForm = useCallback((url = 'https://wa.me/') => {
    handleIntent(url);
  }, [handleIntent]);

  return (
    <WhatsAppLeadContext.Provider value={{ openLeadForm }}>
      {children}
      <WhatsAppLeadModal
        isOpen={!!pending}
        project={pending?.project}
        knownVisitor={pending?.visitor}
        onSubmit={handleSubmit}
        onClose={handleClose}
      />
    </WhatsAppLeadContext.Provider>
  );
};

export default WhatsAppLeadProvider;
