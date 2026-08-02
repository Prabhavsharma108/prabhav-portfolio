/**
 * Font paths for 3D text (drei <Text> / troika).
 *
 * troika parses the font file itself rather than going through CSS, so it needs
 * a direct URL — and it must be a static TTF. Variable woff2 (what the DOM uses
 * via @font-face) makes troika's parser hang without ever calling back, which
 * suspends the whole scene forever rather than failing loudly.
 *
 * So these are latin-subset static TTFs, ~10-17KB each, separate from the woff2
 * files _base.scss loads for the interface.
 *
 * Kept here rather than inline so a typeface change is a one-line edit — the
 * scene references these in ~35 places.
 */

/** Headings, door labels, anything that needs presence. */
export const FONT_DISPLAY = '/fonts/SpaceGrotesk.ttf';

/** Annotations, dimensions, body copy — the blueprint's working voice. */
export const FONT_MONO = '/fonts/JetBrainsMono.ttf';
