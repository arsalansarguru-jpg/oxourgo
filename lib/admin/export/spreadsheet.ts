/** CSV and Excel-compatible export builders (no external spreadsheet deps). */

export type ExportColumn = { key: string; header: string }

export type ExportRow = Record<string, string | number | boolean | null | undefined>

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

export function rowsToCsv(columns: ExportColumn[], rows: ExportRow[]): string {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(',')
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvCell(String(row[c.key] ?? ''))).join(','),
  )
  return `\uFEFF${[header, ...lines].join('\r\n')}`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Excel opens HTML tables saved as .xls — reliable without xlsx npm package. */
export function rowsToExcelHtml(sheetName: string, columns: ExportColumn[], rows: ExportRow[]): string {
  const th = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('')
  const body = rows
    .map((row) => {
      const tds = columns.map((c) => `<td>${escapeHtml(String(row[c.key] ?? ''))}</td>`).join('')
      return `<tr>${tds}</tr>`
    })
    .join('')

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="UTF-8" />
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>${escapeHtml(sheetName.slice(0, 31))}</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>table{border-collapse:collapse}th,td{border:1px solid #ccc;padding:6px 10px;font-family:Segoe UI,Arial,sans-serif;font-size:11pt}th{background:#1e293b;color:#f8fafc}</style>
</head>
<body><table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table></body></html>`
}

export function exportFilename(base: string, format: 'csv' | 'xlsx', from?: string, to?: string): string {
  const range = from && to ? `_${from}_${to}` : from ? `_from_${from}` : ''
  const ext = format === 'csv' ? 'csv' : 'xls'
  return `${base}${range}.${ext}`
}
