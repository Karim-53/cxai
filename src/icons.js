import React from "react";

/* Inline SVG icons (stroke = currentColor).
   Self-hosted on purpose: the site used to pull Font-Awesome from a CDN that no
   longer exists, which silently removed every checkbox / caret from the UI. */

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": "true",
  focusable: "false",
};

const solid = { viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", focusable: "false" };

export const IconMenu = (p) => (
  <svg {...base} {...p}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
);

export const IconClose = (p) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
);

export const IconSun = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

export const IconMoon = (p) => (
  <svg {...base} {...p}><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" /></svg>
);

export const IconExternal = (p) => (
  <svg {...base} {...p}><path d="M14 4h6v6M20 4l-8.5 8.5M18 14v4.5A1.5 1.5 0 0116.5 20h-11A1.5 1.5 0 014 18.5v-11A1.5 1.5 0 015.5 6H10" /></svg>
);

export const IconGithub = (p) => (
  <svg {...solid} {...p}>
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.5 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.05 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.72 0 0 .84-.28 2.75 1.05a9.3 9.3 0 015 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.42.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.92-2.34 4.79-4.57 5.04.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.59.69.49A10.06 10.06 0 0022 12.25C22 6.58 17.52 2 12 2z" />
  </svg>
);

export const IconPaper = (p) => (
  <svg {...base} {...p}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8zM14 3v5h5M9 13h6M9 17h4" /></svg>
);

export const IconDownload = (p) => (
  <svg {...base} {...p}><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" /></svg>
);

export const IconFilter = (p) => (
  <svg {...base} {...p}><path d="M3 5h18l-7 8v6l-4 2v-8z" /></svg>
);

export const IconChart = (p) => (
  <svg {...base} {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></svg>
);

export const IconInfoCircle = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>
);

export const IconAlert = (p) => (
  <svg {...base} {...p}><path d="M10.3 4.3L2.6 17.6A2 2 0 004.3 20.6h15.4a2 2 0 001.7-3L13.7 4.3a2 2 0 00-3.4 0z" /><path d="M12 9v4M12 17h.01" /></svg>
);

export const IconList = (p) => (
  <svg {...base} {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
);

export const IconPointer = (p) => (
  <svg {...base} {...p}><path d="M5 3l14 7.5-6.2 1.6L9.6 19z" /></svg>
);

export const IconCopy = (p) => (
  <svg {...base} {...p}><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 012-2h10" /></svg>
);

export const IconCheck = (p) => (
  <svg {...base} {...p}><path d="M4 12.5l5 5L20 6.5" /></svg>
);

export const IconChevronRight = (p) => (
  <svg {...base} {...p}><path d="M9 5l7 7-7 7" /></svg>
);

export const IconChevronDown = (p) => (
  <svg {...base} {...p}><path d="M5 9l7 7 7-7" /></svg>
);

/* --- checkbox glyphs for react-checkbox-tree ---------------------------- */
export const IconSquare = (p) => (
  <svg {...base} {...p}><rect x="4" y="4" width="16" height="16" rx="4" /></svg>
);

export const IconSquareChecked = (p) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor" />
    <path d="M8 12.3l2.6 2.6L16 9.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

export const IconSquareHalf = (p) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false" {...p}>
    <rect x="4" y="4" width="16" height="16" rx="4" fill="currentColor" />
    <path d="M8.5 12h7" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);
