// spy.js — pick the active section for the sidebar scroll-spy.

/**
 * @param {number[]} tops  getBoundingClientRect().top of each section, in page order
 * @param {{ scrollY: number, innerHeight: number, scrollHeight: number, offset: number }} view
 * @returns {number} index of the active section, or -1 when there are none
 */
export function activeIndex(tops, { scrollY, innerHeight, scrollHeight, offset }) {
  if (!tops.length) return -1;
  // At the bottom the last section may never reach the offset — it still counts as read.
  if (innerHeight + scrollY >= scrollHeight - 2) return tops.length - 1;
  let idx = 0;
  tops.forEach((t, i) => { if (t <= offset) idx = i; });
  return idx;
}
