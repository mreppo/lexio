/**
 * Part-of-speech types and constants shared between AddWordModal and tests.
 * Kept in a separate file to satisfy react-refresh/only-export-components rule.
 */

/** Part-of-speech options per design spec §6 Add Word. */
export type PartOfSpeech = 'noun' | 'verb' | 'adj' | 'adv' | 'phrase'

/** All valid PoS options in display order. */
export const PART_OF_SPEECH_OPTIONS: readonly PartOfSpeech[] = [
  'noun',
  'verb',
  'adj',
  'adv',
  'phrase',
]
