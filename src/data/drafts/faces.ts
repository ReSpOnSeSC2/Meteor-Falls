/**
 * FORGED FACE PICKS (S15g Movement 3b, ADR-046) — the human-recorded sprite
 * choices for forged grunts. DRAFTS ARE NOT CONTENT (Prime Law 1): this lives
 * under src/data/drafts/**, is injected into the RUNTIME only by the LEVELKIT
 * LAB (never the canon ENEMIES source), and is excluded from every manifest and
 * the §B4 sweep — a face is real only when a human picks it (promotion is a
 * human act). Each entry is a stable PartsSpec: part ids + the seed that
 * composed them, so the chosen look reproduces byte-for-byte forever.
 *
 * A forged enemy WITHOUT a pick here keeps its borrowed shipped placeholder —
 * the forge offers candidates; it never decides the face. Picks are taken from
 * the Sprite Lab (`npm run art:facesheet` → .shots/forge_faces.png, the in-game
 * SPRITE LAB → THE FORGE page): the human reads the candidates and names one,
 * and `proposeCandidates(id, role, chapter)[k]` is copied in verbatim.
 */
import type { PartsSpec } from '../../schemas';

export const FACE_PICKS: Record<string, PartsSpec> = {
  // Ch.3 (Wintermoor Academy — the foggy academy): the first forged roster gets
  // its faces. Each is a candidate from `proposeCandidates(id, role, 3)`, chosen
  // to read for its draft name. Verbatim copies (parts + seed reproduce forever).
  // The human (jay) confirms/swaps these from the Sprite Lab; swap = a different
  // candidate index from .shots/forge_faces.png.
  forge_ch3_grunt_0: { silhouette: 'blob', material: 'iron', accessory: 'dots', wear: 'dents', region: 'fog', seed: 940144808 }, // "Tardy Drone" — pewter drone, blank stare
  forge_ch3_bruiser_1: { silhouette: 'cabinet', material: 'iron', accessory: 'grin', wear: 'dents', region: 'fog', seed: 2802890885 }, // "Foggy Locker" — a tall, squared, grinning metal locker (vents + latch), denting as it loses HP
  forge_ch3_caster_2: { silhouette: 'totem', material: 'lacquer', accessory: 'cyclops', wear: 'cracks', region: 'fog', seed: 3603594537 }, // "Detention Inkwell" — a glossy dark idol, one eye
  forge_ch3_lurker_3: { silhouette: 'wisp', material: 'stone', accessory: 'cyclops', wear: 'scorch', region: 'fog', seed: 427607496 }, // "Foggy Inkwell" — a pale carved watcher
  forge_ch3_grunt_4: { silhouette: 'blob', material: 'cloth', accessory: 'glare', wear: 'dents', region: 'fog', seed: 723260049 }, // "Prefect Inkwell" — a grumpy satchel-brown blob
  forge_ch3_caster_5: { silhouette: 'wisp', material: 'ember', accessory: 'cyclops', wear: 'scorch', region: 'fog', seed: 3953429982 }, // "Foggy Inkwell" — a warm ember spirit, one eye
};
