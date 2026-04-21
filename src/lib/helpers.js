/**
 * Format a number as Indian Rupees (₹1,23,456.00)
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a date as "March 23, 2026"
 */
export function formatDateLong(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Format a date as "23/03/2026"
 */
export function formatDateShort(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/**
 * Convert number to words (Indian system)
 * e.g. 48000 → "Forty Eight Thousand Only"
 */
export function numberToWords(amount) {
  const n = Math.round(amount)
  if (n === 0) return 'Zero Only'

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function twoDigits(n) {
    if (n < 20) return ones[n]
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
  }

  function threeDigits(n) {
    if (n >= 100) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + twoDigits(n % 100) : '')
    return twoDigits(n)
  }

  let result = ''
  let crore = Math.floor(n / 10000000)
  let lakh = Math.floor((n % 10000000) / 100000)
  let thousand = Math.floor((n % 100000) / 1000)
  let rest = n % 1000

  if (crore) result += threeDigits(crore) + ' Crore '
  if (lakh) result += threeDigits(lakh) + ' Lakh '
  if (thousand) result += threeDigits(thousand) + ' Thousand '
  if (rest) result += threeDigits(rest)

  return result.trim() + ' Only'
}

/**
 * Generate B2C invoice number
 * Format: [seq][MM][YY] — e.g., "3326" = 3rd invoice, March, 2026
 */
export function generateB2CInvoiceNumber(seqInMonth, date = new Date()) {
  const month = String(date.getMonth() + 1) // no padding — "3" not "03"
  const year = String(date.getFullYear()).slice(-2) // "26"
  return `${seqInMonth}${month}${year}`
}

/**
 * Generate B2B invoice number
 * Format: YY/NN — e.g., "26/03"
 */
export function generateB2BInvoiceNumber(seq, date = new Date()) {
  const year = String(date.getFullYear()).slice(-2)
  return `${year}/${String(seq).padStart(2, '0')}`
}

/**
 * Get initials from a name (up to 2 chars)
 */
export function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Today's date as ISO string (YYYY-MM-DD)
 */
export function todayISO() {
  return new Date().toISOString().split('T')[0]
}
