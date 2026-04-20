export function cn(...c: any[]) { return c.filter(Boolean).join(' ') }
export function formatINR(n: number | null | undefined) {
  if (n == null) return '\u20b90'
  return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n)
}
export function formatDate(d: string | null | undefined) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
}
export function formatDateTime(d: string | null | undefined) {
  if (!d) return '\u2014'
  return new Date(d).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})
}
export function generateBookingNo() {
  const n=new Date(); const yy=String(n.getFullYear()).slice(2); const mm=String(n.getMonth()+1).padStart(2,'0')
  return `FNB-${yy}${mm}-${Math.floor(Math.random()*9000)+1000}`
}
export const STAGE_COLORS: Record<string,string> = {
  token:'bg-yellow-100 text-yellow-800',booking:'bg-blue-100 text-blue-800',
  full_payment:'bg-green-100 text-green-800',registry_done:'bg-emerald-100 text-emerald-800',cancelled:'bg-red-100 text-red-800'
}
export const PAYOUT_STATUS_COLORS: Record<string,string> = {
  pending:'bg-yellow-100 text-yellow-800',approved:'bg-blue-100 text-blue-800',
  paid:'bg-green-100 text-green-800',rejected:'bg-red-100 text-red-800',hold:'bg-gray-100 text-gray-700'
}
export const PLOT_STATUS_COLORS: Record<string,string> = {
  available:'bg-green-100 text-green-800',token:'bg-yellow-100 text-yellow-800',
  booked:'bg-blue-100 text-blue-800',registry_done:'bg-emerald-100 text-emerald-800',
  cancelled:'bg-red-100 text-red-800',hold:'bg-orange-100 text-orange-800'
}
export const KYC_COLORS: Record<string,string> = {
  pending:'bg-yellow-100 text-yellow-800',verified:'bg-green-100 text-green-800',rejected:'bg-red-100 text-red-800'
}