// src/lib/brokerPortal.js
// LEGACY SHIM — kept so old imports don't break during transition
// All logic is now in brokerSupabase.js
export { brokerLogout, getBrokerSession, isBrokerAuthenticated } from './brokerSupabase.js';

// Legacy brokerLogin shim (synchronous wrapper — new pages use brokerSupabase directly)
export function brokerLogin() {
  return { success: false, message: 'Use brokerSupabase.brokerLogin() instead.' };
}
