/**
 * CP-STU (DEC-040): a small, dependency-free PDF 1.4 writer for Studio documents.
 *
 * It uses the two standard Helvetica faces every PDF reader provides, so no font
 * file is bundled and nothing is fetched. Text is encoded in WinAnsiEncoding;
 * characters outside it are simplified (é stays é, ő becomes o, → becomes ->)
 * or replaced with “?”, and the caller is told how many were changed.
 * Works offline and in Node (tests) — it only builds bytes.
 */
export type PdfFont = 'regular' | 'bold';
export type Rgb = readonly [number, number, number];
export interface PdfText { x: number; y: number; size: number; font: PdfFont; text: string; color: Rgb }
export interface PdfRule { x1: number; y1: number; x2: number; y2: number; width: number; color: Rgb }
export interface PdfPage { texts: PdfText[]; rules: PdfRule[] }
export interface PdfInfo { title: string; createdAt: Date }

/** A4 in PDF points. */
export const PAGE_WIDTH = 595.28, PAGE_HEIGHT = 841.89;

// Helvetica and Helvetica-Bold advance widths (1/1000 em) for WinAnsi bytes 32–255.
// Extracted once from the Adobe core-font metrics; 0 marks a byte WinAnsi leaves undefined.
const REGULAR = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,0,556,0,222,556,333,1000,556,556,333,1000,667,333,1000,0,611,0,0,222,222,333,333,350,556,1000,333,1000,500,333,944,0,500,667,278,333,556,556,556,556,260,556,333,737,370,556,584,333,737,333,400,584,333,333,333,556,537,278,333,333,365,556,834,834,834,611,667,667,667,667,667,667,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,500,556,556,556,556,278,278,278,278,556,556,556,556,556,556,556,584,611,556,556,556,556,500,556,500];
const BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,0,556,0,278,556,500,1000,556,556,333,1000,667,333,1000,0,611,0,0,278,278,500,500,350,556,1000,333,1000,556,333,944,0,500,667,278,333,556,556,556,556,280,556,333,737,370,556,584,333,737,333,400,584,333,333,333,611,556,278,333,333,365,556,834,834,834,611,722,722,722,722,722,722,1000,722,667,667,667,667,278,278,278,278,722,722,778,778,778,778,778,584,778,722,722,722,722,667,667,611,556,556,556,556,556,556,889,556,556,556,556,556,278,278,278,278,611,611,611,611,611,611,611,584,611,611,611,611,611,556,611,556];
/** Unicode code points that WinAnsi places in 0x80–0x9F. */
const CP1252: Record<number, number> = {8364:128,8218:130,402:131,8222:132,8230:133,8224:134,8225:135,710:136,8240:137,352:138,8249:139,338:140,381:142,8216:145,8217:146,8220:147,8221:148,8226:149,8211:150,8212:151,732:152,8482:153,353:154,8250:155,339:156,382:158,376:159};
/** Common characters with no WinAnsi glyph, written the way a person would type them. */
const SIMPLE: Record<string, string> = {
  '→':'->','←':'<-','⇒':'=>','↔':'<->','≥':'>=','≤':'<=','≠':'!=','≈':'~','−':'-','‐':'-','‑':'-','‒':'-','―':'—',
  ' ':' ',' ':' ',' ':' ',' ':' ',' ':' ','​':'','⁠':'','﻿':'',
  '✓':'v','✔':'v','✗':'x','★':'*','☆':'*','▪':'•','◦':'•','●':'•','‣':'•','′':"'",'″':'"'
};
function byteFor(code: number): number | null {
  if (code === 9) return 32;
  if (code >= 32 && code <= 126) return code;
  if (code >= 160 && code <= 255) return code;
  return CP1252[code] ?? null;
}
/** `simplified`: written another way (→ as ->, ő as o). `unsupported`: no equivalent, written as “?”. */
export interface Encoded { bytes: number[]; simplified: number; unsupported: number }
/** Encode text for a WinAnsi Helvetica string, counting every character that had to change. */
export function encodeWinAnsi(input: string): Encoded {
  const bytes: number[] = []; let simplified = 0, unsupported = 0;
  for (const ch of input.normalize('NFC')) {
    const direct = byteFor(ch.codePointAt(0)!);
    if (direct !== null) { bytes.push(direct); continue; }
    const simple = SIMPLE[ch];
    if (simple !== undefined) { simplified++; for (const s of simple) { const b = byteFor(s.codePointAt(0)!); if (b !== null) bytes.push(b); } continue; }
    // Drop accents the encoding lacks (ő → o): decompose and keep the base letter.
    const baseLetter = [...ch.normalize('NFD')][0]!;
    const base = baseLetter !== ch ? byteFor(baseLetter.codePointAt(0)!) : null;
    if (base !== null) { simplified++; bytes.push(base); } else { unsupported++; bytes.push(63); }
  }
  return { bytes, simplified, unsupported };
}
function widthOfBytes(bytes: number[], font: PdfFont, size: number): number {
  const table = font === 'bold' ? BOLD : REGULAR;
  let total = 0;
  for (const b of bytes) total += table[b - 32] ?? 556;
  return total * size / 1000;
}
export function textWidth(text: string, font: PdfFont, size: number): number { return widthOfBytes(encodeWinAnsi(text).bytes, font, size); }
/**
 * Break text into lines no wider than `maxWidth`. Existing line breaks are kept;
 * a single word wider than the line is split by character so nothing overflows.
 */
export function wrapText(text: string, font: PdfFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.replace(/\r\n?/g, '\n').split('\n')) {
    const words = paragraph.split(/[ \t]+/).filter(Boolean);
    if (!words.length) { lines.push(''); continue; }
    let line = '';
    for (const word of words) {
      const candidate = line ? line + ' ' + word : word;
      if (textWidth(candidate, font, size) <= maxWidth) { line = candidate; continue; }
      if (line) lines.push(line);
      if (textWidth(word, font, size) <= maxWidth) { line = word; continue; }
      let piece = '';
      for (const ch of word) {
        if (textWidth(piece + ch, font, size) > maxWidth && piece) { lines.push(piece); piece = ch; } else piece += ch;
      }
      line = piece;
    }
    lines.push(line);
  }
  return lines;
}
const num = (v: number) => (Math.round(v * 100) / 100).toString();
const hex = (bytes: number[]) => bytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
/** A PDF text string for Info entries: UTF-16BE with byte-order mark, so any title is kept exactly. */
function utf16(text: string): string {
  let out = 'FEFF';
  for (let i = 0; i < text.length; i++) out += text.charCodeAt(i).toString(16).padStart(4, '0').toUpperCase();
  return '<' + out + '>';
}
function pdfDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `D:${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`;
}
function contentStream(page: PdfPage): string {
  const ops: string[] = [];
  for (const r of page.rules) ops.push(`${r.color.map(num).join(' ')} RG ${num(r.width)} w ${num(r.x1)} ${num(r.y1)} m ${num(r.x2)} ${num(r.y2)} l S`);
  for (const t of page.texts) {
    if (!t.text) continue;
    ops.push(`BT /${t.font === 'bold' ? 'F2' : 'F1'} ${num(t.size)} Tf ${t.color.map(num).join(' ')} rg ${num(t.x)} ${num(t.y)} Td <${hex(encodeWinAnsi(t.text).bytes)}> Tj ET`);
  }
  return ops.join('\n');
}
/** Serialize pages into a complete PDF file. Every object offset in the cross-reference table is exact. */
export function buildPdf(pages: PdfPage[], info: PdfInfo): Uint8Array {
  const all = pages.length ? pages : [{ texts: [], rules: [] }];
  const objects: string[] = [];
  const pageIds = all.map((_, i) => 6 + i * 2);
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => id + ' 0 R').join(' ')}] /Count ${all.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
  objects[5] = `<< /Title ${utf16(info.title)} /Producer ${utf16('CareerProof OS')} /CreationDate (${pdfDate(info.createdAt)}) >>`;
  all.forEach((page, i) => {
    const stream = contentStream(page);
    objects[pageIds[i]!] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${num(PAGE_WIDTH)} ${num(PAGE_HEIGHT)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageIds[i]! + 1} 0 R >>`;
    // The stream holds only ASCII (text is hex encoded), so its length in bytes equals its length in characters.
    objects[pageIds[i]! + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  let out = '%PDF-1.4\n%âãÏÓ\n';
  const offsets: number[] = [];
  const size = objects.length;
  const latin1Length = (s: string) => s.length; // every character below is a single byte (U+0000–U+00FF)
  let position = latin1Length(out);
  for (let id = 1; id < size; id++) {
    const body = `${id} 0 obj\n${objects[id]}\nendobj\n`;
    offsets[id] = position; out += body; position += latin1Length(body);
  }
  const xref = position;
  out += `xref\n0 ${size}\n0000000000 65535 f \n` + offsets.slice(1).map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('');
  out += `trailer\n<< /Size ${size} /Root 1 0 R /Info 5 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return bytes;
}
