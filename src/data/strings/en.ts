/**
 * The canonical English UI string table (i18n seed, ADR-pending). This is the
 * SOURCE OF TRUTH for the key set: `StringKey = keyof typeof en` (src/engine/
 * i18n.ts), so every other locale is a `Partial<Record<StringKey, string>>`
 * that falls back here. Keys are dot-namespaced (`menu.*`, `common.*`,
 * `setup.*`, `controls.*`, `grid.*`, `ui.*`); values are the EXACT current
 * hardcoded English, harvested verbatim from MenuScene/lettergrid/UIScene so a
 * later call-site migration is a pure swap with no visible text change.
 *
 * Phaser-free pure data. `as const` is load-bearing — it gives literal value
 * types and lets t() require a real StringKey at compile time.
 *
 * Some values intentionally carry the existing pipeline's tokens INTACT:
 *  - `{token}` (e.g. {playername}) is resolved later by src/ui/text.ts vars().
 *  - `{g:NAME}` flair glyphs are consumed by the FlairLine typewriter.
 *  - explicit `{var}` placeholders (e.g. {value}, {flavor}) are interpolated by
 *    t() ONLY from caller-supplied vars; the GS pipeline never touches them.
 * t() leaves the first two untouched and fills only the third — see i18n.ts.
 */
export const en = {
  // ── shared atoms (reused across pages: status flags, yes/no) ──
  'common.on': 'ON',
  'common.off': 'OFF',
  'common.back': 'Back',
  'common.nothing': 'Nothing',
  'common.remove': 'Remove',

  // ── the EB command list (MenuScene.mainLoop) ──
  'menu.items': 'ITEMS',
  'menu.status': 'STATUS',
  'menu.vibe': 'VIBE',
  'menu.equip': 'EQUIP',
  'menu.journal': 'JOURNAL',
  'menu.locket': 'LOCKET',
  'menu.setup': 'SETUP',

  // ── item action rows (MenuScene.itemActions) ──
  'menu.action.equip': 'Equip',
  'menu.action.use': 'Use',
  'menu.action.give': 'Give',
  'menu.action.drop': 'Drop',

  // ── SETUP page rows (MenuScene.setupPage ~718-726) ──
  // Sound/TextSpeed/WindowFlavor carry an explicit {value} t() interpolates
  // from the caller (the live ON/OFF, pace name, or flavor name).
  'setup.title': 'SETUP',
  'setup.sound': 'Sound: {value}',
  'setup.textSpeed': 'Text speed: {value}',
  'setup.windowFlavor': 'Window flavor: {value}',
  'setup.mainControls': 'Main Controls',
  'setup.basketballControls': 'Basketball Controls',
  'setup.returnToTitle': 'Return to Title',
  'setup.hint': '(M on a keyboard flips sound anywhere)',

  // text-speed pace names (MenuScene.setupPage SPEEDS)
  'setup.speed.patient': 'PATIENT',
  'setup.speed.normal': 'NORMAL',
  'setup.speed.brisk': 'BRISK',

  // ── CONTROLS sub-page (MenuScene.controlsPage) ──
  'controls.main.title': 'MAIN CONTROLS',
  'controls.hoops.title': 'HOOPS CONTROLS',
  'controls.resetDefaults': 'Reset to defaults',

  // ── the shared on-screen keyboard buttons (ui/lettergrid BTN_DEFS) ──
  'grid.space': 'SPACE',
  'grid.back': 'BACK',
  'grid.random': 'RANDOM',
  'grid.ok': 'OK',

  // ── always-on overlay toasts (UIScene) ──
  'ui.soundOff': 'Sound OFF',
  'ui.soundOn': 'Sound ON',
  'ui.controllerDisconnected': 'Controller disconnected',

  // ── infrastructure fixture (NOT a UI string) ──
  // Pins the cross-pipeline contract for i18n.test.ts: this one key carries all
  // three placeholder kinds at once — an explicit {value} t() owns, a game-state
  // {playername} that ui/text.ts vars() resolves later, and a {g:fire} flair
  // glyph the FlairLine typewriter consumes. t() must fill ONLY {value} and
  // leave the other two byte-for-byte. Never rendered; safe to keep as a guard.
  'i18n.flairProof': 'Heat {value} {g:fire} for {playername}',
} as const;
