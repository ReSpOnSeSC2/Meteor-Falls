/**
 * German string stub — the EXTENSIBILITY PROOF, not a real localization. Only a
 * handful of keys are translated; every other key intentionally falls back to
 * en (src/engine/i18n.ts resolves de → en for anything missing here). Typed as
 * a Partial over the canonical StringKey set so a typo'd key fails the build.
 *
 * Phaser-free pure data. Adding more is just adding entries; a full locale is
 * this same file with the whole key set filled in.
 */
import type { StringKey } from '../../engine/i18n';

export const de: Partial<Record<StringKey, string>> = {
  'common.on': 'AN',
  'common.off': 'AUS',
  'common.back': 'Zurück',
  'menu.setup': 'EINSTELLUNGEN',
  'setup.sound': 'Ton: {value}',
};
