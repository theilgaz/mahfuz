/**
 * Tecvidli HTML metnini React elementlerine dönüştürür.
 *
 * API formatı: <tajweed class=RULE_NAME>harfler</tajweed>  (iç içe olabilir)
 * Çıktı:       <span className="tajweed-RULE_NAME">harfler</span>
 */

import type { ReactNode } from "react";

const OPEN_TAG = "<tajweed class=";
const CLOSE_TAG = "</tajweed>";

/** U+06D6 … U+06DC arası secavend/vakıf işaretleri (split-words ile uyumlu) */
const SECAVEND_RE = /^[ۖ-ۜ]+$/;

/**
 * Tecvidli HTML string'ini React elementlerine parse eder.
 * İç içe (nested) tag'ları destekler.
 * showTajweed=false ise sadece düz metni döner (renksiz).
 */
export function parseTajweed(html: string, showTajweed: boolean): ReactNode[] {
  if (!showTajweed) {
    return [html.replace(/<\/?tajweed[^>]*>/g, "")];
  }

  let pos = 0;
  let key = 0;

  function parseNodes(until?: string): ReactNode[] {
    const nodes: ReactNode[] = [];
    let textStart = pos;

    while (pos < html.length) {
      // Kapanış tag'ı kontrolü
      if (until && html.startsWith(until, pos)) {
        if (pos > textStart) nodes.push(html.slice(textStart, pos));
        pos += until.length;
        return nodes;
      }

      // Açılış tag'ı kontrolü
      if (html.startsWith(OPEN_TAG, pos)) {
        if (pos > textStart) nodes.push(html.slice(textStart, pos));
        const classStart = pos + OPEN_TAG.length;
        const gt = html.indexOf(">", classStart);
        if (gt === -1) { pos++; continue; }
        const rule = html.slice(classStart, gt);
        pos = gt + 1;
        const children = parseNodes(CLOSE_TAG);
        nodes.push(
          <span key={key++} className={`tajweed-${rule}`}>
            {children}
          </span>,
        );
        textStart = pos;
        continue;
      }

      pos++;
    }

    if (pos > textStart) nodes.push(html.slice(textStart, pos));
    return nodes;
  }

  return parseNodes();
}

type TajweedToken =
  | { type: "open"; rule: string }
  | { type: "close" }
  | { type: "text"; text: string }
  | { type: "space" };

function tokenize(html: string): TajweedToken[] {
  const tokens: TajweedToken[] = [];
  let i = 0;
  while (i < html.length) {
    if (html.startsWith(OPEN_TAG, i)) {
      const gt = html.indexOf(">", i + OPEN_TAG.length);
      if (gt === -1) { i++; continue; }
      const rule = html.slice(i + OPEN_TAG.length, gt);
      tokens.push({ type: "open", rule });
      i = gt + 1;
      continue;
    }
    if (html.startsWith(CLOSE_TAG, i)) {
      tokens.push({ type: "close" });
      i += CLOSE_TAG.length;
      continue;
    }
    // Read until next tag
    let j = i;
    while (j < html.length && !html.startsWith(OPEN_TAG, j) && !html.startsWith(CLOSE_TAG, j)) j++;
    const chunk = html.slice(i, j);
    // Split chunk into text and space tokens
    const parts = chunk.split(/(\s+)/);
    for (const part of parts) {
      if (part === "") continue;
      if (/^\s+$/.test(part)) tokens.push({ type: "space" });
      else tokens.push({ type: "text", text: part });
    }
    i = j;
  }
  return tokens;
}

/**
 * Tecvidli HTML'i boşluklarla ayrılmış kelimelere böler. Her kelime için
 * o kelimedeki harfleri kapsayan tajweed span'ları korunur. Kelime sınırını
 * geçen bir tajweed kuralı her iki kelime için ayrı ayrı render edilir.
 *
 * Secavend (U+06D6…U+06DC) işaretleri tek başına bir token olarak gelirse
 * önceki kelimeye non-breaking space ile eklenir (splitWords ile uyumlu).
 */
export function parseTajweedWords(html: string): ReactNode[][] {
  const tokens = tokenize(html);
  const words: ReactNode[][] = [];
  let currentWord: ReactNode[] = [];
  let currentText = ""; // plain text of currentWord, for secavend detection
  type StackFrame = { rule: string; children: ReactNode[] };
  const stack: StackFrame[] = [];
  let key = 0;

  function pushChild(node: ReactNode) {
    if (stack.length > 0) stack[stack.length - 1].children.push(node);
    else currentWord.push(node);
  }

  function finalizeWord() {
    // Close open tags from innermost to outermost, wrapping children in spans
    const stillOpen = stack.map((s) => s.rule);
    while (stack.length > 0) {
      const top = stack.pop()!;
      const node = (
        <span key={key++} className={`tajweed-${top.rule}`}>
          {top.children}
        </span>
      );
      if (stack.length > 0) stack[stack.length - 1].children.push(node);
      else currentWord.push(node);
    }
    if (currentWord.length === 0) {
      // Re-open for next word and skip empty
      for (const rule of stillOpen) stack.push({ rule, children: [] });
      currentText = "";
      return;
    }
    // Secavend mark on its own: attach to previous word with non-breaking space
    if (SECAVEND_RE.test(currentText) && words.length > 0) {
      const prev = words[words.length - 1];
      prev.push(" ", ...currentWord);
    } else {
      words.push(currentWord);
    }
    currentWord = [];
    currentText = "";
    for (const rule of stillOpen) stack.push({ rule, children: [] });
  }

  for (const tok of tokens) {
    if (tok.type === "open") {
      stack.push({ rule: tok.rule, children: [] });
    } else if (tok.type === "close") {
      const top = stack.pop();
      if (!top) continue;
      const node = (
        <span key={key++} className={`tajweed-${top.rule}`}>
          {top.children}
        </span>
      );
      pushChild(node);
    } else if (tok.type === "text") {
      pushChild(tok.text);
      currentText += tok.text;
    } else if (tok.type === "space") {
      finalizeWord();
    }
  }
  finalizeWord();
  return words;
}
