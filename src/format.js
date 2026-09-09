import React from "react";

/** Mean of the numeric entries, ignoring nulls.
 *  The previous implementation tested `if (data[i])`, which threw away every
 *  score equal to 0 - a real score in this benchmark - and inflated averages. */
export function average(values) {
  let sum = 0;
  let count = 0;
  values.forEach((value) => {
    const number = Number(value);
    if (value !== null && value !== undefined && Number.isFinite(number)) {
      sum += number;
      count += 1;
    }
  });
  return count ? sum / count : null;
}

export const isMissing = (value) => value === null || value === undefined || value === "";

/** Percentage with one decimal, e.g. 82.5 */
export function formatScore(value) {
  const number = Number(value);
  if (isMissing(value) || !Number.isFinite(number)) return null;
  return number.toFixed(1);
}

/** Seconds, readable across the 5 orders of magnitude present in the data. */
export function formatSeconds(value) {
  const number = Number(value);
  if (isMissing(value) || !Number.isFinite(number)) return null;
  if (number === 0) return "0";
  if (number < 0.001) return number.toExponential(1);
  if (number < 1) return String(Number(number.toPrecision(2)));
  if (number < 100) return number.toFixed(2);
  return Math.round(number).toLocaleString("en-US");
}

export function formatDate(value) {
  if (isMissing(value)) return null;
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const URL_PATTERN = /(https?:\/\/[^\s<>"')\]]+)/g;
const CITE_PATTERN = /\\cite[tp]?\{([^}]*)\}/g;

/** Renders one line of database text: turns URLs into links and LaTeX \cite{}
 *  leftovers into a discreet tag instead of showing raw markup to the reader. */
function renderInline(text, keyPrefix) {
  const parts = [];
  let index = 0;
  String(text)
    .split(URL_PATTERN)
    .forEach((chunk) => {
      if (!chunk) return;
      index += 1;
      if (/^https?:\/\//.test(chunk)) {
        parts.push(
          <a key={`${keyPrefix}-l${index}`} href={chunk} target="_blank" rel="noopener noreferrer">
            {chunk.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </a>
        );
        return;
      }
      let last = 0;
      let match;
      CITE_PATTERN.lastIndex = 0;
      while ((match = CITE_PATTERN.exec(chunk)) !== null) {
        if (match.index > last) parts.push(chunk.slice(last, match.index));
        parts.push(
          <span key={`${keyPrefix}-c${index}-${match.index}`} className="cite-tag" title="Reference key from the paper">
            {match[1]}
          </span>
        );
        last = match.index + match[0].length;
      }
      parts.push(chunk.slice(last));
    });
  return parts;
}

/** Several database fields hold "\n\t\t\t - item" bullet lists. Render them as
 *  a real list instead of relying on <pre> whitespace. */
export function renderText(value, keyPrefix = "t") {
  if (isMissing(value)) return <span className="muted">Not documented yet.</span>;
  const lines = String(value)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const bullets = lines.filter((line) => /^[-*]\s*/.test(line));
  if (bullets.length && bullets.length === lines.length) {
    return (
      <ul>
        {lines.map((line, i) => (
          <li key={`${keyPrefix}-${i}`}>{renderInline(line.replace(/^[-*]\s*/, ""), `${keyPrefix}-${i}`)}</li>
        ))}
      </ul>
    );
  }
  return lines.map((line, i) => <p key={`${keyPrefix}-${i}`}>{renderInline(line, `${keyPrefix}-${i}`)}</p>);
}

/** Minimal BibTeX reader - enough to print a readable citation line. */
export function parseBibtex(raw) {
  if (isMissing(raw)) return null;
  const text = String(raw);
  const fields = {};
  const pattern = /(\w+)\s*=\s*(\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}|"([^"]*)"|(\d+))/g;
  let match;
  while ((match = pattern.exec(text)) !== null) {
    fields[match[1].toLowerCase()] = (match[3] || match[4] || match[5] || "").replace(/[{}]/g, "").trim();
  }
  if (!fields.title && !fields.author) return null;
  const authors = fields.author ? fields.author.split(/\s+and\s+/).map((a) => a.trim()) : [];
  return {
    title: fields.title || null,
    authors,
    year: fields.year || null,
    venue: fields.journal || fields.booktitle || fields.publisher || null,
    url: fields.url || (fields.doi ? `https://doi.org/${fields.doi}` : null),
    raw: text.trim(),
  };
}

export function formatAuthors(authors) {
  if (!authors || !authors.length) return null;
  const names = authors.map((author) => {
    if (author.includes(",")) {
      const [family, given] = author.split(",");
      return `${given.trim().charAt(0)}. ${family.trim()}`;
    }
    const parts = author.split(/\s+/);
    const family = parts.pop();
    return `${parts.map((p) => `${p.charAt(0)}.`).join(" ")} ${family}`.trim();
  });
  if (names.length <= 3) return names.join(", ");
  return `${names.slice(0, 3).join(", ")} et al.`;
}
