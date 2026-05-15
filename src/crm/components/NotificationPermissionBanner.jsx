import React, { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

/**
 * NotificationPermissionBanner
 * ────────────────────────────
 * Shows a banner above the lead-list page when the browser hasn't yet
 * made a decision about notifications. Browsers REQUIRE a real user
 * gesture to request permission, so we never call requestPermission()
 * in an effect — only in the Enable button's click handler.
 *
 * When permission is 'denied' we render a small recovery hint with a
 * Re-check button (no event fires when the user toggles permission via
 * the browser's lock-icon UI).
 *
 * When 'granted' or 'unsupported' we render nothing.
 *
 * Mount once near the top of any page where telecallers spend time
 * (DailyCalling, MyLeads, MobileLeadList, etc.).
 */
function getPerm() {
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission;
}

export default function NotificationPermissionBanner() {
  const [perm, setPerm] = useState(getPerm);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') setPerm(getPerm());
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const handleEnable = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const result = await Notification.requestPermission();
      setPerm(result);
      if (result === 'granted') {
        try {
          new Notification('🔔 FanBe CRM', {
            body: 'You will now get alerts for new leads & callback reminders.',
            icon: '/crm/favicon.ico',
          });
        } catch { /* no-op */ }
      }
    } catch { /* no-op */ }
  };

  if (perm === 'granted' || perm === 'unsupported') return null;

  if (perm === 'denied') {
    return (
      <div className="flex items-start gap-3 px-4 py-3 mb-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl">
        <BellOff size={18} className="flex-shrink-0 text-amber-600 mt-0.5" />
        <div className="text-sm flex-1">
          <p className="font-semibold mb-0.5">Notifications are blocked</p>
          <p className="text-xs text-amber-800 leading-snug">
            You won&apos;t get new-lead or callback alerts. Tap the lock / info icon next to the URL → Permissions → Notifications → Allow, then tap Re-check.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPerm(getPerm())}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 active:bg-amber-800"
        >
          Re-check
        </button>
      </div>
    );
  }

  // perm === 'default'
  return (
    <div className="flex items-center gap-3 px-4 py-3 mb-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl">
      <Bell size={18} className="flex-shrink-0 text-blue-600" />
      <p className="text-sm flex-1">
        <span className="font-semibold">Enable notifications</span> to get alerts for new leads &amp; callback reminders.
      </p>
      <button
        type="button"
        onClick={handleEnable}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 active:bg-blue-800"
      >
        Enable
      </button>
    </div>
  );
}
