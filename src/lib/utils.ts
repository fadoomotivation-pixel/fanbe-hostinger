export function cn(...c: any[]) { return c.filter(Boolean).join(' ') }
export function formatINR(n: number | null | undefined) {
  if (n == null) return '₹0'
  return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n)
}
export function formatDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
}
export const KYC_COLORS: Record<string,string> = {
  pending:'bg-yellow-100 text-yellow-700',
  submitted:'bg-blue-100 text-blue-700',
  verified:'bg-green-100 text-green-700',
  rejected:'bg-red-100 text-red-700',
}
export const PAYOUT_STATUS_COLORS: Record<string,string> = {
  pending:'bg-yellow-100 text-yellow-700',
  approved:'bg-blue-100 text-blue-700',
  paid:'bg-green-100 text-green-700',
  rejected:'bg-red-100 text-red-700',
  hold:'bg-gray-100 text-gray-700',
}