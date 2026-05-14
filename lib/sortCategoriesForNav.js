/**
 * Puts primary gender/age categories first: Men, Women, Kids — then the rest (stable by name).
 * Matches common API labels (Men, Women's, Kids, etc.).
 */
function navOrderRank(name) {
  const n = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "'");

  if (n.includes("women") || /\bwoman\b/.test(n) || n === "womens") return 2;
  if (/\bmen\b/.test(n) || /^men'/.test(n) || n === "mens" || n === "man") return 1;
  if (/\bkids?\b/.test(n) || /\bchild(ren)?\b/.test(n) || n.includes("kidswear")) return 3;
  return 100;
}

export function sortCategoriesForNav(categories) {
  if (!Array.isArray(categories) || categories.length === 0) return [];
  return [...categories].sort((a, b) => {
    const ra = navOrderRank(a?.name);
    const rb = navOrderRank(b?.name);
    if (ra !== rb) return ra - rb;
    return String(a?.name || "").localeCompare(String(b?.name || ""), undefined, { sensitivity: "base" });
  });
}
