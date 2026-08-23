export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number | null | undefined;
}

/** Cells starting with any of these are interpreted as formulas by Excel and Sheets. */
const FORMULA_PREFIXES = ['=', '+', '-', '@', '\t', '\r'];

function escapeCell(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  let value = String(raw);

  // Formula injection: a reference field of `=HYPERLINK(...)` would execute on open.
  // Prefixing an apostrophe is the standard neutraliser and stays human-readable.
  if (FORMULA_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    value = `'${value}`;
  }

  // Quote only when needed, doubling any embedded quote.
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Render rows as CSV.
 *
 * Leads with a UTF-8 BOM and uses CRLF line endings, both because Excel needs them:
 * without the BOM it mis-decodes non-ASCII names, and without CRLF it can run rows
 * together on Windows.
 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines = [columns.map((column) => escapeCell(column.header)).join(',')];
  for (const row of rows) {
    lines.push(columns.map((column) => escapeCell(column.value(row))).join(','));
  }
  // \uFEFF as an escape, not a literal BOM character, so the source stays ASCII.
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

/** Strip anything that would let a filename break out of a Content-Disposition header. */
export function csvFileName(base: string): string {
  const safe = base.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-{2,}/g, '-');
  return `${safe.replace(/^-|-$/g, '') || 'export'}.csv`;
}
