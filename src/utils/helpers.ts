import { isValidBackup } from '@/db/schema'
import type { BackupData } from '@/types'

// ─── CSV Parser for Bulk Student Import ───────────────────────────────────────

export interface ParsedStudent {
  rollNo: number
  name: string
}

export interface CSVParseResult {
  success: boolean
  students: ParsedStudent[]
  errors: string[]
  totalRows: number
  validRows: number
}

/**
 * Parse a CSV file for bulk student import.
 *
 * Expected CSV format (with or without header):
 *   rollNo,name
 *   1,Ram Bahadur
 *   2,Sita Kumari
 *
 * Also handles:
 *   - Header row detection (skipped if first cell is non-numeric)
 *   - Whitespace trimming
 *   - Duplicate roll number detection
 *   - Empty row skipping
 */
export async function parseStudentCSV(file: File): Promise<CSVParseResult> {
  const errors: string[] = []
  const students: ParsedStudent[] = []
  const seenRollNos = new Set<number>()

  try {
    const text = await file.text()
    const lines = text
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0)

    if (lines.length === 0) {
      return { success: false, students: [], errors: ['File is empty.'], totalRows: 0, validRows: 0 }
    }

    let startIndex = 0

    // Detect and skip header row
    const firstCells = lines[0].split(',')
    const firstCell = firstCells[0]?.trim().toLowerCase()
    if (isNaN(Number(firstCell)) || firstCell === 'rollno' || firstCell === 'roll no' || firstCell === 'roll_no') {
      startIndex = 1
    }

    const dataLines = lines.slice(startIndex)
    const totalRows = dataLines.length

    dataLines.forEach((line, index) => {
      const rowNum = index + startIndex + 1
      const cells = line.split(',').map(c => c.trim())

      if (cells.length < 2) {
        errors.push(`Row ${rowNum}: Expected 2 columns (rollNo, name), got ${cells.length}.`)
        return
      }

      const rollNoRaw = cells[0]
      const name = cells.slice(1).join(',').trim() // handle names with commas

      const rollNo = parseInt(rollNoRaw, 10)

      if (isNaN(rollNo) || rollNo <= 0) {
        errors.push(`Row ${rowNum}: Invalid roll number "${rollNoRaw}".`)
        return
      }

      if (!name || name.length === 0) {
        errors.push(`Row ${rowNum}: Name is empty.`)
        return
      }

      if (name.length > 100) {
        errors.push(`Row ${rowNum}: Name is too long (max 100 characters).`)
        return
      }

      if (seenRollNos.has(rollNo)) {
        errors.push(`Row ${rowNum}: Duplicate roll number ${rollNo}.`)
        return
      }

      seenRollNos.add(rollNo)
      students.push({ rollNo, name })
    })

    return {
      success: students.length > 0,
      students,
      errors,
      totalRows,
      validRows: students.length,
    }
  } catch (err) {
    return {
      success: false,
      students: [],
      errors: ['Failed to read file. Make sure it is a valid CSV.'],
      totalRows: 0,
      validRows: 0,
    }
  }
}

// ─── Sample CSV Generator ──────────────────────────────────────────────────────

/**
 * Generate and download a sample CSV template for bulk import.
 */
export function downloadSampleCSV(): void {
  const csv = [
    'rollNo,name',
    '1,Ram Bahadur Sharma',
    '2,Sita Kumari Thapa',
    '3,Hari Prasad Adhikari',
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'hajiri-student-template.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ─── Backup File Validator ────────────────────────────────────────────────────

/**
 * Read and validate a backup JSON file before importing.
 * Returns the parsed data or throws with a user-friendly message.
 */
export async function readBackupFile(file: File): Promise<BackupData> {
  if (!file.name.endsWith('.json')) {
    throw new Error('Please select a valid .json backup file.')
  }

  if (file.size > 50 * 1024 * 1024) {
    throw new Error('File is too large. Maximum size is 50MB.')
  }

  let parsed: unknown
  try {
    const text = await file.text()
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Invalid file. Could not parse JSON.')
  }

  if (!isValidBackup(parsed)) {
    throw new Error('Invalid backup file. This file was not exported from Hajiri Sahayog.')
  }

  return parsed as BackupData
}

// ─── File Picker Helpers ──────────────────────────────────────────────────────

/**
 * Open a file picker for CSV files and return the selected file.
 */
export function pickCSVFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,text/csv'
    input.onchange = () => {
      resolve(input.files?.[0] ?? null)
    }
    input.oncancel = () => resolve(null)
    document.body.appendChild(input)
    input.click()
    document.body.removeChild(input)
  })
}

/**
 * Open a file picker for JSON backup files and return the selected file.
 */
export function pickBackupFile(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      resolve(input.files?.[0] ?? null)
    }
    input.oncancel = () => resolve(null)
    document.body.appendChild(input)
    input.click()
    document.body.removeChild(input)
  })
}

// ─── String Helpers ───────────────────────────────────────────────────────────

/**
 * Capitalize the first letter of each word (for name formatting).
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Sanitize a student name — trim, collapse spaces, title case.
 */
export function sanitizeName(name: string): string {
  return toTitleCase(name.trim().replace(/\s+/g, ' '))
}

/**
 * Format a file size in bytes to a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}