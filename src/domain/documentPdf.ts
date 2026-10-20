/**
 * CP-STU (DEC-040): lays a Studio document out on A4 pages for the PDF writer.
 *
 * Three plain, one-column layouts: the performance review, Professional
 * Standard and Technical Specialist CVs. Text is real PDF text (selectable and
 * readable by applicant tracking systems); there are no images, skill bars or
 * columns. Hidden sections and empty blocks are left out.
 */
import type { CareerDocument, ContentBlock } from './models.js';
import { blocksOf, periodLong, sectionLabel } from './studio.js';
import { buildPdf, encodeWinAnsi, textWidth, wrapText, PAGE_HEIGHT, PAGE_WIDTH, type PdfFont, type PdfPage, type Rgb } from './pdf.js';

const NAVY: Rgb = [0.078, 0.173, 0.251], INK: Rgb = [0.114, 0.188, 0.259], MUTED: Rgb = [0.357, 0.424, 0.486], TEAL: Rgb = [0.09, 0.42, 0.451], RULE: Rgb = [0.85, 0.87, 0.89];
const LEFT = 56, RIGHT = PAGE_WIDTH - 56, TOP = PAGE_HEIGHT - 58, BOTTOM = 64, WIDTH = RIGHT - LEFT;
export interface PdfHeader { name: string; subtitle: string }
export interface DocumentPdf { bytes: Uint8Array; pages: number; simplified: number; unsupported: number }

class Layout {
  pages: PdfPage[] = [];
  private page!: PdfPage;
  y = TOP;
  simplified = 0;
  unsupported = 0;
  constructor() { this.newPage(); }
  newPage(): void { this.page = { texts: [], rules: [] }; this.pages.push(this.page); this.y = TOP; }
  ensure(height: number): void { if (this.y - height < BOTTOM) this.newPage(); }
  count(text: string): void { const e = encodeWinAnsi(text); this.simplified += e.simplified; this.unsupported += e.unsupported; }
  text(x: number, text: string, font: PdfFont, size: number, color: Rgb): void { this.page.texts.push({ x, y: this.y, size, font, text, color }); }
  rule(x1: number, x2: number, width: number, color: Rgb, offset = 0): void { this.page.rules.push({ x1, y1: this.y + offset, x2, y2: this.y + offset, width, color }); }
  /** Wrapped lines; a page breaks between lines, never inside one. */
  lines(text: string, x: number, width: number, font: PdfFont, size: number, color: Rgb, leading = size * 1.42): void {
    this.count(text);
    for (const line of wrapText(text, font, size, width)) { this.ensure(leading); this.y -= leading; this.text(x, line, font, size, color); }
  }
  /** Body text where lines starting "- " or "• " become bullets with a hanging indent. */
  body(text: string, x: number, width: number, size: number): void {
    for (const raw of text.split('\n')) {
      const m = /^\s*(?:[-•*]\s+)(.*)$/.exec(raw);
      if (m) this.bullet(m[1]!, x, width, size); else if (raw.trim()) this.lines(raw, x, width, 'regular', size, INK); else this.y -= size * 0.6;
    }
  }
  bullet(text: string, x: number, width: number, size: number): void {
    this.count(text);
    const leading = size * 1.42, lines = wrapText(text, 'regular', size, width - 11);
    lines.forEach((line, i) => { this.ensure(leading); this.y -= leading; if (i === 0) this.text(x + 1, '•', 'regular', size, INK); this.text(x + 11, line, 'regular', size, INK); });
  }
  gap(v: number): void { this.y -= v; }
}
const visibleSections = (doc: CareerDocument) => doc.sections.filter(s => s.visible && s.key !== 'contact');
const hasContent = (b: ContentBlock) => Boolean(b.heading.trim() || b.text.trim() || b.meta.trim() || b.date.trim());

function sectionHeading(l: Layout, doc: CareerDocument, title: string): void {
  const professional = doc.templateId === 'cv-professional';
  l.ensure(56); l.gap(professional ? 18 : 20);
  l.text(LEFT, title.toUpperCase(), 'bold', 9.5, professional ? NAVY : TEAL);
  if (professional) l.rule(LEFT, RIGHT, 0.8, NAVY, -4);
  l.gap(professional ? 6 : 4);
}
/** A heading on the left with its date right-aligned on the same line; long headings wrap clear of the date. */
function entryHeading(l: Layout, heading: string, date: string, size: number): void {
  l.count(heading); l.count(date);
  const dateWidth = date ? textWidth(date, 'regular', size - 1) : 0;
  const lines = wrapText(heading || ' ', 'bold', size, WIDTH - (date ? dateWidth + 14 : 0));
  lines.forEach((line, i) => {
    l.ensure(size * 1.45); l.y -= size * 1.45;
    l.text(LEFT, line, 'bold', size, NAVY);
    if (i === 0 && date) l.text(RIGHT - dateWidth, date, 'regular', size - 1, MUTED);
  });
}
function block(l: Layout, doc: CareerDocument, b: ContentBlock): void {
  if (!hasContent(b)) return;
  const size = doc.documentType === 'review' ? 10 : 9.8;
  switch (b.kind) {
    case 'paragraph': l.body(b.text, LEFT, WIDTH, size); l.gap(3); break;
    case 'bullet': l.bullet(b.text || b.heading, LEFT, WIDTH, size); break;
    case 'item':
      l.ensure(48); l.gap(6);
      if (b.heading.trim()) l.lines(b.heading, LEFT, WIDTH, 'bold', 10.5, NAVY);
      if (b.meta.trim()) l.lines(b.meta, LEFT, WIDTH, 'regular', 8.8, MUTED, 12.5);
      if (b.text.trim()) l.body(b.text, LEFT, WIDTH, size);
      break;
    case 'entry':
      l.ensure(40); l.gap(7);
      entryHeading(l, b.heading, b.date, 10.3);
      if (b.meta.trim()) l.lines(b.meta, LEFT, WIDTH, 'regular', 9.2, MUTED, 13);
      if (b.text.trim()) { l.gap(1); l.body(b.text, LEFT, WIDTH, size); }
      l.gap(1);
      break;
  }
}
function reviewHeader(l: Layout, doc: CareerDocument, header: PdfHeader): void {
  const rightTitle = 'Performance Review', period = periodLong(doc.periodStart, doc.periodEnd);
  l.y -= 20;
  const name = header.name || doc.title;
  l.count(name); l.count(header.subtitle);
  const nameLines = wrapText(name, 'bold', 18, WIDTH * 0.58);
  const top = l.y;
  nameLines.forEach((line, i) => { l.y = top - i * 22; l.text(LEFT, line, 'bold', 18, NAVY); });
  l.y = top; l.text(RIGHT - textWidth(rightTitle, 'bold', 11.5), rightTitle, 'bold', 11.5, NAVY);
  if (period) { l.y = top - 15; l.text(RIGHT - textWidth(period, 'regular', 10), period, 'regular', 10, MUTED); }
  l.y = top - (nameLines.length - 1) * 22;
  if (header.subtitle) l.lines(header.subtitle, LEFT, WIDTH * 0.58, 'regular', 10, MUTED, 15);
  l.y = Math.min(l.y, top - 16) - 10;
  l.rule(LEFT, RIGHT, 1.6, NAVY);
  l.gap(2);
}
function cvHeader(l: Layout, doc: CareerDocument): void {
  const contact = blocksOf(doc, 'contact')[0];
  const shown = doc.sections.find(s => s.key === 'contact')?.visible !== false;
  if (!contact || !shown) return;
  const centered = doc.templateId === 'cv-professional';
  const put = (text: string, font: PdfFont, size: number, color: Rgb, leading: number) => {
    l.count(text);
    for (const line of wrapText(text, font, size, WIDTH)) {
      l.y -= leading; l.text(centered ? (PAGE_WIDTH - textWidth(line, font, size)) / 2 : LEFT, line, font, size, color);
    }
  };
  if (contact.heading.trim()) put(contact.heading, 'bold', 22, NAVY, 24);
  if (contact.meta.trim()) put(contact.meta, 'regular', 11, INK, 16);
  if (contact.text.trim()) put(contact.text, 'regular', 9.5, MUTED, 14);
  l.gap(4);
}
function footer(pages: PdfPage[], doc: CareerDocument, preparedOn: string): void {
  pages.forEach((page, i) => {
    const label = `Page ${i + 1} of ${pages.length}`;
    if (doc.documentType === 'review') {
      page.rules.push({ x1: LEFT, y1: 46, x2: RIGHT, y2: 46, width: 0.6, color: RULE });
      page.texts.push({ x: LEFT, y: 34, size: 8.3, font: 'regular', text: `Prepared from my own CareerProof record, ${preparedOn}. Self-reported.`, color: MUTED });
    }
    if (doc.documentType === 'review' || pages.length > 1)
      page.texts.push({ x: RIGHT - textWidth(label, 'regular', 8.3), y: 34, size: 8.3, font: 'regular', text: label, color: MUTED });
  });
}
/** "20 Oct 2026" in fixed English, for the review footer. */
export function preparedDate(d: Date): string {
  return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getFullYear()}`;
}
export function documentPdf(doc: CareerDocument, header: PdfHeader, createdAt: Date): DocumentPdf {
  const l = new Layout();
  if (doc.documentType === 'review') reviewHeader(l, doc, header); else cvHeader(l, doc);
  for (const s of visibleSections(doc)) {
    const blocks = blocksOf(doc, s.key).filter(hasContent);
    if (!blocks.length) continue;
    sectionHeading(l, doc, sectionLabel(doc, s.key));
    for (const b of blocks) block(l, doc, b);
  }
  footer(l.pages, doc, preparedDate(createdAt));
  return { bytes: buildPdf(l.pages, { title: doc.title, createdAt }), pages: l.pages.length, simplified: l.simplified, unsupported: l.unsupported };
}
/** A safe file name: "CareerProof_CV_General_2026-10-20.pdf". */
export function pdfFileName(doc: Pick<CareerDocument, 'title'>, day: string): string {
  const stem = doc.title.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60) || 'Document';
  return `CareerProof_${stem}_${day}.pdf`;
}
