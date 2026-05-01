/**
 * Minimal RFC 4180-compatible CSV parser.
 *
 * Handles:
 *   - Double-quoted fields with embedded commas, newlines, and "" escapes.
 *   - LF / CRLF / CR line endings.
 *   - Optional leading UTF-8 BOM.
 *   - Configurable delimiter (auto-detected from `,`, `;`, `\t` when unspecified).
 *
 * Returns typed rows as `Record<headerName, string>` and surfaces soft
 * warnings so the caller can show them to the user.
 */

export interface ParsedCsv {
  columns: string[];
  rows: Array<Record<string, string>>;
  warnings: string[];
}

export interface ParseOptions {
  delimiter?: ',' | ';' | '\t';
  /** Hard cap on rows (excluding header). Excess rows are truncated with a warning. */
  maxRows?: number;
}

export function parseCsv(raw: string, opts: ParseOptions = {}): ParsedCsv {
  const warnings: string[] = [];
  let text = raw;

  // Strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const delimiter = opts.delimiter ?? detectDelimiter(text);

  const allRows = tokenize(text, delimiter, warnings);
  if (allRows.length === 0) {
    return { columns: [], rows: [], warnings: ['CSV is empty'] };
  }

  const rawHeader = allRows[0]!;
  const { columns, headerWarnings } = normalizeHeader(rawHeader);
  warnings.push(...headerWarnings);

  const bodyRows = allRows.slice(1);
  const limit = opts.maxRows ?? Number.POSITIVE_INFINITY;
  const effectiveRows = bodyRows.length > limit ? bodyRows.slice(0, limit) : bodyRows;
  if (bodyRows.length > limit) {
    warnings.push(`File truncated at ${limit} rows (total was ${bodyRows.length}).`);
  }

  const rows: Array<Record<string, string>> = [];
  for (let i = 0; i < effectiveRows.length; i++) {
    const cells = effectiveRows[i]!;
    // Skip empty lines (common trailing newline).
    if (cells.length === 1 && cells[0]!.trim() === '') continue;

    const row: Record<string, string> = {};
    for (let c = 0; c < columns.length; c++) {
      row[columns[c]!] = (cells[c] ?? '').trim();
    }
    rows.push(row);
  }

  return { columns, rows, warnings };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

function detectDelimiter(sample: string): ',' | ';' | '\t' {
  // Look only at the first line.
  const end = sample.search(/[\r\n]/);
  const first = end === -1 ? sample : sample.slice(0, end);
  const count = (ch: string) => (first.match(new RegExp(`\\${ch}`, 'g')) ?? []).length;
  const scores: Array<[',' | ';' | '\t', number]> = [
    [',', count(',')],
    [';', count(';')],
    ['\t', (first.match(/\t/g) ?? []).length],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  return scores[0]![1] > 0 ? scores[0]![0] : ',';
}

function tokenize(text: string, delimiter: string, warnings: string[]): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const ch = text[i]!;

    if (inQuotes) {
      if (ch === '"') {
        // Escaped quote ("") or end of quoted field.
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      if (field.length > 0) {
        // Quote in the middle of an unquoted field — treat as literal but warn.
        warnings.push('Unexpected quote inside an unquoted field — treated as literal.');
        field += ch;
        i++;
        continue;
      }
      inQuotes = true;
      i++;
      continue;
    }

    if (ch === delimiter) {
      row.push(field);
      field = '';
      i++;
      continue;
    }

    if (ch === '\r') {
      // Normalize CRLF / CR.
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += text[i + 1] === '\n' ? 2 : 1;
      continue;
    }
    if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i++;
      continue;
    }

    field += ch;
    i++;
  }

  // Final field / row
  if (inQuotes) {
    warnings.push('CSV ended inside a quoted field — data may be truncated.');
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function normalizeHeader(raw: string[]): { columns: string[]; headerWarnings: string[] } {
  const headerWarnings: string[] = [];
  const seen = new Map<string, number>();
  const columns = raw.map((name) => {
    const trimmed = name.trim();
    if (!trimmed) {
      headerWarnings.push('Empty header cell — renamed to "column_N".');
    }
    const base = trimmed || 'column';
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    if (count > 1) {
      headerWarnings.push(`Duplicate header "${base}" — renamed to "${base}_${count}".`);
      return `${base}_${count}`;
    }
    return base;
  });
  return { columns, headerWarnings };
}
