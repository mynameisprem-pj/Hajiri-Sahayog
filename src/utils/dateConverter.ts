import NepaliDate from 'nepali-date-converter'
import { BS_MONTHS, AD_MONTHS } from '@/types'
import type { DateSystem } from '@/types'

// ─── Core Conversion ──────────────────────────────────────────────────────────

/** Convert an AD date string (YYYY-MM-DD) to a NepaliDate object */
export function adToNepali(adDateString: string): NepaliDate {
  const [year, month, day] = adDateString.split('-').map(Number)
  const jsDate = new Date(year, month - 1, day)
  return new NepaliDate(jsDate)
}

/** Convert a BS year/month/day to an AD date string (YYYY-MM-DD) */
export function nepaliToAd(year: number, month: number, day: number): string {
  const nd = new NepaliDate(year, month - 1, day) // month is 0-indexed in NepaliDate
  const jsDate = nd.toJsDate()
  return jsDate.toISOString().split('T')[0]
}

// ─── Display Formatting ───────────────────────────────────────────────────────

/**
 * Format an AD date string for display based on the user's date system.
 * e.g. "2025-04-14" → "14 Baisakh 2082" (BS) or "14 April 2025" (AD)
 */
export function formatDate(adDateString: string, system: DateSystem): string {
  if (!adDateString) return ''
  try {
    if (system === 'BS') {
      const nd = adToNepali(adDateString)
      const day = nd.getDate()
      const monthName = BS_MONTHS[nd.getMonth()] // getMonth() is 0-indexed
      const year = nd.getYear()
      return `${day} ${monthName} ${year}`
    } else {
      const [year, month, day] = adDateString.split('-').map(Number)
      const monthName = AD_MONTHS[month - 1]
      return `${day} ${monthName} ${year}`
    }
  } catch {
    return adDateString
  }
}

/**
 * Format date as short form.
 * e.g. "2025-04-14" → "14 Bai" (BS) or "14 Apr" (AD)
 */
export function formatDateShort(adDateString: string, system: DateSystem): string {
  if (!adDateString) return ''
  try {
    if (system === 'BS') {
      const nd = adToNepali(adDateString)
      const day = nd.getDate()
      const monthName = BS_MONTHS[nd.getMonth()].slice(0, 3)
      return `${day} ${monthName}`
    } else {
      const [, month, day] = adDateString.split('-').map(Number)
      const monthName = AD_MONTHS[month - 1].slice(0, 3)
      return `${day} ${monthName}`
    }
  } catch {
    return adDateString
  }
}

/**
 * Get today's date as a display string.
 */
export function formatToday(system: DateSystem): string {
  return formatDate(todayAD(), system)
}

/**
 * Get the month + year label for a given AD month prefix (YYYY-MM).
 * e.g. "2025-04" → "Baisakh 2082" (BS) or "April 2025" (AD)
 */
export function formatMonthLabel(monthPrefix: string, system: DateSystem): string {
  // Use the 15th as a representative day for the month
  const adDateString = `${monthPrefix}-15`
  try {
    if (system === 'BS') {
      const nd = adToNepali(adDateString)
      const monthName = BS_MONTHS[nd.getMonth()]
      const year = nd.getYear()
      return `${monthName} ${year}`
    } else {
      const [year, month] = monthPrefix.split('-').map(Number)
      const monthName = AD_MONTHS[month - 1]
      return `${monthName} ${year}`
    }
  } catch {
    return monthPrefix
  }
}

/**
 * Get the day-of-week label for an AD date string.
 * e.g. "2025-04-14" → "Monday"
 */
export function getDayOfWeek(adDateString: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const [year, month, day] = adDateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return days[date.getDay()]
}

/**
 * Get a short day-of-week label.
 * e.g. "2025-04-14" → "Mon"
 */
export function getDayOfWeekShort(adDateString: string): string {
  return getDayOfWeek(adDateString).slice(0, 3)
}

// ─── Today ────────────────────────────────────────────────────────────────────

/** Returns today as an AD date string (YYYY-MM-DD) */
export function todayAD(): string {
  return new Date().toISOString().split('T')[0]
}

/** Returns today's BS year, month (1-indexed), day */
export function todayBS(): { year: number; month: number; day: number } {
  const nd = new NepaliDate(new Date())
  return {
    year: nd.getYear(),
    month: nd.getMonth() + 1, // convert to 1-indexed
    day: nd.getDate(),
  }
}

// ─── Month Navigation ─────────────────────────────────────────────────────────

/**
 * Get all unique month prefixes (YYYY-MM) that exist in a list of date strings,
 * sorted descending (most recent first).
 */
export function getUniqueMonths(dates: string[]): string[] {
  const months = new Set(dates.map(d => d.slice(0, 7)))
  return [...months].sort((a, b) => b.localeCompare(a))
}

/**
 * Get the previous month prefix from a given "YYYY-MM".
 */
export function prevMonthPrefix(prefix: string): string {
  const [year, month] = prefix.split('-').map(Number)
  if (month === 1) return `${year - 1}-12`
  return `${year}-${String(month - 1).padStart(2, '0')}`
}

/**
 * Get the next month prefix from a given "YYYY-MM".
 */
export function nextMonthPrefix(prefix: string): string {
  const [year, month] = prefix.split('-').map(Number)
  if (month === 12) return `${year + 1}-01`
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

/**
 * Get the current month prefix in YYYY-MM format.
 */
export function currentMonthPrefix(): string {
  return todayAD().slice(0, 7)
}

// ─── Date Comparison Helpers ──────────────────────────────────────────────────

export function isToday(adDateString: string): boolean {
  return adDateString === todayAD()
}

export function isFutureDate(adDateString: string): boolean {
  return adDateString > todayAD()
}

export function isPastDate(adDateString: string): boolean {
  return adDateString < todayAD()
}

// ─── BS Date Picker Helpers ───────────────────────────────────────────────────

/**
 * Get a list of BS years for a date picker (e.g. last 2 years to +1 future).
 */
export function getBSYearRange(): number[] {
  const { year } = todayBS()
  const years: number[] = []
  for (let y = year - 2; y <= year + 1; y++) years.push(y)
  return years
}

/**
 * Get the number of days in a given BS month/year.
 * Uses NepaliDate to calculate this correctly.
 */
export function getDaysInBSMonth(year: number, month: number): number {
  try {
    // Find days by checking when the next month starts
    // const nd = new NepaliDate(year, month - 1, 1)
 // first of this month
    // Try day 32 — it will overflow to next month; subtract to find max
    let days = 30
    for (let d = 32; d >= 28; d--) {
      try {
        const test = new NepaliDate(year, month - 1, d)
        if (test.getMonth() === month - 1) {
          days = d
          break
        }
      } catch {
        // day doesn't exist in this month
      }
    }
    return days
  } catch {
    return 30
  }
}

/**
 * Convert a BS date picker selection (year, month 1-indexed, day) to an AD string.
 */
export function bsPickerToAD(year: number, month: number, day: number): string {
  return nepaliToAd(year, month, day)
}

/**
 * Parse an AD date string into BS picker values.
 */
export function adToBSPicker(adDateString: string): { year: number; month: number; day: number } {
  const nd = adToNepali(adDateString)
  return {
    year: nd.getYear(),
    month: nd.getMonth() + 1,
    day: nd.getDate(),
  }
}

// ─── Holiday Check (two-layer) ────────────────────────────────────────────────

/**
 * Check if a given AD date string is a recurring weekly off day.
 * weeklyOffDays: array of JS day numbers (0=Sun, 6=Sat)
 */
export function isWeeklyOffDay(adDateString: string, weeklyOffDays: number[]): boolean {
  if (!weeklyOffDays.length) return false
  const [year, month, day] = adDateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return weeklyOffDays.includes(date.getDay())
}

/**
 * Two-layer holiday check.
 * DB record (one-time) takes priority → then recurring weekly check.
 * If a DB attendance record exists for the date, recurring check is skipped
 * (teacher may have held a makeup class on a normally-off day).
 */
export function isHolidayDate(
  adDateString: string,
  oneTimeHolidayDates: string[],
  weeklyOffDays: number[],
): boolean {
  if (oneTimeHolidayDates.includes(adDateString)) return true
  return isWeeklyOffDay(adDateString, weeklyOffDays)
}

/**
 * Get all recurring off-day dates within a month (YYYY-MM prefix).
 * Used to generate holiday entries in student history for days with no DB record.
 */
export function getWeeklyOffDaysInMonth(
  monthPrefix: string,
  weeklyOffDays: number[],
): string[] {
  if (!weeklyOffDays.length) return []
  const [year, month] = monthPrefix.split('-').map(Number)
  const result: string[] = []
  const daysInMonth = new Date(year, month, 0).getDate()
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const dow = new Date(year, month - 1, d).getDay()
    if (weeklyOffDays.includes(dow)) result.push(dateStr)
  }
  return result
}

/**
 * Get the day-of-week number for an AD date string (0=Sun, 6=Sat).
 */
export function getDayOfWeekNumber(adDateString: string): number {
  const [year, month, day] = adDateString.split('-').map(Number)
  return new Date(year, month - 1, day).getDay()
}