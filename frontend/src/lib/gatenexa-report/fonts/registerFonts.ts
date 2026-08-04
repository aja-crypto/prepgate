import { Font } from '@react-pdf/renderer';

let registered = false;

export function registerFonts(): void {
  if (registered) return;
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
