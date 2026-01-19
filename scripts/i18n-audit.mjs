import fs from 'node:fs';
import path from 'node:path';

const PROJECT_ROOT = process.cwd();
const SRC_DIR = path.join(PROJECT_ROOT, 'src');
const OUT_DIR = path.join(PROJECT_ROOT, 'audit');
const OUT_JSON = path.join(OUT_DIR, 'i18n-audit.json');
const OUT_MD = path.join(OUT_DIR, 'i18n-audit.md');

const TEXT_FILE_EXTS = new Set(['.ts', '.tsx']);

function isIgnoredPath(p) {
  const norm = p.split(path.sep).join('/');
  if (norm.includes('/node_modules/')) return true;
  if (norm.includes('/dist/')) return true;
  if (norm.includes('/build/')) return true;
  if (norm.includes('/.next/')) return true;
  if (norm.includes('/.git/')) return true;
  // Exclude translation resources themselves
  if (norm.includes('/src/i18n/locales/')) return true;
  // Generated or vendor-like files
  if (norm.endsWith('/vite-env.d.ts')) return true;
  if (norm.includes('/integrations/supabase/types.ts')) return true;
  return false;
}

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (isIgnoredPath(abs)) continue;
    if (e.isDirectory()) {
      walk(abs, files);
    } else {
      const ext = path.extname(e.name);
      if (TEXT_FILE_EXTS.has(ext)) files.push(abs);
    }
  }
  return files;
}

function toPos(line, col) {
  return { line: line + 1, col: col + 1 };
}

function getLineCol(text, index) {
  // Fast-ish line/col computation.
  let line = 0;
  let lastNl = -1;
  for (let i = 0; i < index; i++) {
    if (text.charCodeAt(i) === 10) {
      line++;
      lastNl = i;
    }
  }
  return toPos(line, index - lastNl - 1);
}

function addMatch(out, file, fullText, startIndex, rawText, kind) {
  const trimmed = (rawText ?? '').trim();
  if (!trimmed) return;

  // Ignore parsing artifacts that are not user-facing
  if (trimmed === ') : (' || trimmed === '):(') return;
  if (trimmed.includes('case "') || trimmed.includes('default: return')) return;
  if (trimmed === '\u00A0') return;
  if (trimmed.replace(/\u00A0/g, '').trim() === '') return;

  // Ignore template placeholders and debug interpolation markers
  if (trimmed.includes('${') && trimmed.includes('}')) return;

  // Ignore colors
  if (/^#([0-9a-f]{3,8})$/i.test(trimmed)) return;
  if (/^hsl\(/i.test(trimmed)) return;

  // Ignore date-fns-like format strings
  if (/^[dMyHhmsSE, :/\-]+$/.test(trimmed) && trimmed.length <= 25) return;

  // Ignore code-ish artifacts sometimes captured as JSX text
  if (trimmed.includes('useState(') || trimmed.includes('useRef(') || trimmed.includes('useEffect(')) return;
  if (trimmed.includes('Math.random') || trimmed.includes('Date.now')) return;
  if (trimmed.includes('return (') || trimmed.includes('return(')) return;
  if (trimmed.includes('const [') && trimmed.includes('set') && trimmed.includes('= useState')) return;
  if (trimmed === '0 && (' || trimmed === '0 &&') return;
  if (trimmed.startsWith('0 &&')) return;

  // Ignore SVG path data
  if (/^[MmZzLlHhVvCcSsQqTtAa0-9, .\-]+$/.test(trimmed) && trimmed.length > 30) return;

  // Ignore Tailwind / className-like strings
  if (
    /[\s]/.test(trimmed) &&
    /^[a-z0-9\-\[\]_:/.%!,\s]+$/i.test(trimmed) &&
    (trimmed.includes('bg-') || trimmed.includes('text-') || trimmed.includes('border-') || trimmed.includes('flex') || trimmed.includes('grid') || trimmed.includes('rounded') || trimmed.includes('shadow'))
  ) return;

  // Ignore obvious log labels
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return;
  if (trimmed.startsWith('[google-sync]')) return;
  if (trimmed.toLowerCase().startsWith('error') && trimmed.endsWith(':')) return;

  // Ignore very short/likely-non-UI strings
  if (trimmed.length < 2) return;

  // Ignore obvious non-UI strings
  const lower = trimmed.toLowerCase();
  if (lower === 'ok' || lower === 'px' || lower === 'sm' || lower === 'md') return;
  if (lower.startsWith('http://') || lower.startsWith('https://')) return;
  if (lower === 'noopener noreferrer') return;

  // Ignore a lot of technical literals
  if (/^[-_a-z0-9]+$/i.test(trimmed) && trimmed.length <= 20) return; // ids, keys, enums
  if (/(^|\b)(place_id|user_id|is_active|updated_at|inserted_at|created_at|last_analyzed_at|avis_id)\b/i.test(trimmed)) return;
  if (trimmed === 'établissements') return;
  // Ignore i18n keys that are already translated through t('a.b.c')
  if (/^[a-z][a-z0-9_-]*(\.[a-z0-9_-]+)+$/i.test(trimmed)) return;
  if (trimmed.includes('data-testid')) return;
  if (trimmed.startsWith('sb-') || trimmed.includes('supabase')) return;

  const pos = getLineCol(fullText, startIndex);

  out.push({
    file: path.relative(PROJECT_ROOT, file).split(path.sep).join('/'),
    line: pos.line,
    col: pos.col,
    kind,
    text: trimmed,
  });
}

function extractFromFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const results = [];

  // 1) JSX text nodes: > ... < (very heuristic, but catches most hardcoded UI)
  // Avoid matching tags like </div>
  const jsxTextRe = />\s*([^<>{}\n][^<>{}]*?)\s*</g;
  for (const m of content.matchAll(jsxTextRe)) {
    addMatch(results, file, content, m.index ?? 0, m[1], 'jsx_text');
  }

  // 2) Common UI attributes (placeholder/title/aria-label/label)
  // placeholder="..." OR placeholder={"..."}
  const attrRe = /(placeholder|title|aria-label|label|alt)=\{?"([^"\\]*(?:\\.[^"\\]*)*)"\}?/g;
  for (const m of content.matchAll(attrRe)) {
    addMatch(results, file, content, m.index ?? 0, m[2], `attr:${m[1]}`);
  }

  // 3) Toasts / notifications: toast.*('...') / sonnerToast.*("...")
  const toastRe = /(toast|sonnerToast)\.(success|error|info|warning|message)\(\s*(?:\{\s*)?"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  for (const m of content.matchAll(toastRe)) {
    addMatch(results, file, content, m.index ?? 0, m[3], `toast:${m[2]}`);
  }

  // 4) Generic string literals that contain letters (fallback), excluding import lines
  // NOTE: large net, but we filter aggressively.
  const stringRe = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
  for (const m of content.matchAll(stringRe)) {
    const idx = m.index ?? 0;
    // Skip import/export lines quickly
    const lineStart = content.lastIndexOf('\n', idx) + 1;
    const lineEnd = content.indexOf('\n', idx);
    const line = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd);
    if (/^\s*import\s/.test(line)) continue;
    if (/^\s*export\s/.test(line)) continue;
    // Skip line comments
    if (/^\s*\/\//.test(line)) continue;
    // Skip block comments lines
    if (/^\s*\*/.test(line) || /^\s*\/\*/.test(line)) continue;
    // Skip JSX comments like {/* ... */}
    if (line.includes('{/*') && line.includes('*/}')) continue;

    const val = m[1];
    // Only keep if it has at least one letter (incl accents)
    if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(val)) continue;

    // Skip className / Tailwind-heavy strings
    if (/\b(className|class)\s*=/.test(line)) continue;

    // Skip routes/paths
    if (val.startsWith('/') || val.includes('.tsx') || val.includes('.ts')) continue;

    addMatch(results, file, content, idx, val, 'string');
  }

  return results;
}

function groupByFile(items) {
  const map = new Map();
  for (const it of items) {
    if (!map.has(it.file)) map.set(it.file, []);
    map.get(it.file).push(it);
  }
  return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function uniqueByKey(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const key = `${it.file}:${it.line}:${it.col}:${it.kind}:${it.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

function writeOutputs(items) {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const payload = {
    generatedAt: new Date().toISOString(),
    root: path.relative(PROJECT_ROOT, SRC_DIR).split(path.sep).join('/'),
    total: items.length,
    items,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), 'utf8');

  const byFile = groupByFile(items);
  const lines = [];
  lines.push(`# i18n Audit (hardcoded texts)\n`);
  lines.push(`Generated at: ${payload.generatedAt}  `);
  lines.push(`Total extracted strings: **${payload.total}**\n`);

  for (const [file, arr] of byFile) {
    lines.push(`## ${file} (x${arr.length})\n`);
    for (const it of arr.sort((a, b) => (a.line - b.line) || (a.col - b.col))) {
      const safe = it.text.replace(/\n/g, ' ');
      lines.push(`- L${it.line}:${it.col} **[${it.kind}]** ${safe}`);
    }
    lines.push('');
  }

  fs.writeFileSync(OUT_MD, lines.join('\n'), 'utf8');
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(`Cannot find src directory: ${SRC_DIR}`);
    process.exit(1);
  }

  const files = walk(SRC_DIR);
  const all = [];

  for (const f of files) {
    try {
      const extracted = extractFromFile(f);
      for (const it of extracted) all.push(it);
    } catch (e) {
      console.warn(`Failed to scan ${f}:`, e?.message || e);
    }
  }

  const deduped = uniqueByKey(all);
  writeOutputs(deduped);

  console.log(`i18n audit done.`);
  console.log(`- ${path.relative(PROJECT_ROOT, OUT_JSON)}`);
  console.log(`- ${path.relative(PROJECT_ROOT, OUT_MD)}`);
}

main();
