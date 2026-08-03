/**
 * Generates a member ID in the form PDP-<year>-<6 digits>, e.g. PDP-2026-453716.
 *
 * The 6 digits come from the millisecond clock plus a small random spread, so
 * two submissions in the same second are very unlikely to collide. The caller
 * additionally verifies uniqueness against KV and regenerates on the rare clash,
 * which makes the ID effectively guaranteed-unique when KV is connected.
 */
export function generateMembershipId(date = new Date()) {
  const year = date.getFullYear();
  const base = Date.now().toString().slice(-4); // last 4 of the ms clock
  const rand = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `PDP-${year}-${base}${rand}`;
}
