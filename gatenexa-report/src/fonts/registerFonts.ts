/**
 * src/fonts/registerFonts.ts
 *
 * Registers embedded fonts with @react-pdf/renderer.
 *
 * IMPORTANT: react-pdf renders text with the font it is given — it does NOT
 * fall back to system fonts. Inter (Google Fonts) has full Latin + General
 * Punctuation coverage, but the ₹ (U+20B9) glyph is NOT in Inter. We register
 * Noto Sans as a secondary/fallback family specifically for currency and any
 * additional Unicode symbols, and use `Font.registerHyphenationCallback` to
 * disable hyphenation (which otherwise breaks Indian institute names oddly).
 *
 * All URLs point at static, versioned TTF files so builds are reproducible.
 * If you are building in a fully offline / air-gapped environment, download
 * these once and swap the `src` for local file paths under ./assets.
 */
import { Font } from '@react-pdf/renderer';

let registered = false;

export function registerFonts(): void {
  if (registered) return;

  Font.register({
    family: 'Inter',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.ttf',
        fontWeight: 500,
      },
      {
        src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.ttf',
        fontWeight: 700,
      },
    ],
  });

  // Dedicated weight-specific families for React PDF's `fontWeight`
  // handling, which can be inconsistent across renderers — using discrete
  // families keeps SemiBold/Bold crisp in every viewer/printer.
  Font.register({
    family: 'Inter-SemiBold',
    src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.ttf',
  });

  Font.register({
    family: 'Inter-Bold',
    src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.ttf',
  });

  // Monospace family for numeric/table alignment (scores, cutoffs, IDs).
  Font.register({
    family: 'RobotoMono',
    fonts: [
      {
        src: 'https://fonts.gstatic.com/s/robotomono/v23/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_3vqrq3M.ttf',
        fontWeight: 400,
      },
      {
        src: 'https://fonts.gstatic.com/s/robotomono/v23/L0xuDF4xlVMF-BfR8bXMIhJHg45mwgGEFl0_3vd7q3M.ttf',
        fontWeight: 700,
      },
    ],
  });

  // Noto Sans provides the ₹ (U+20B9) rupee glyph plus broad Unicode
  // coverage (Devanagari-adjacent punctuation, em-dashes, etc.) that some
  // trimmed Inter subsets omit.
  Font.register({
    family: 'NotoSans',
    src: 'https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNb4j5Ba_2c7A.ttf',
  });

  // react-pdf's default hyphenation engine breaks proper nouns like
  // "Dharwad" mid-word when a table cell is tight. Disable it globally and
  // let our column widths + font sizes handle wrapping instead.
  Font.registerHyphenationCallback((word) => [word]);

  registered = true;
}

/** Font family name to use anywhere a ₹ symbol or other special glyph may appear. */
export const CURRENCY_FONT_FALLBACK = 'NotoSans';
