import { Font } from '@react-pdf/renderer';
let registered = false;
export function registerFonts(): void {
  if (registered) return;
  try {
    Font.register({
      family: 'NotoSans',
      fonts: [
        { src: 'https://fonts.gstatic.com/s/notosans/v36/o-0mIpQlx3QUlC5A4PNb4j5Ba_2c7A.ttf', fontWeight: 400 },
      ],
    });
  } catch(e) {}
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}
export const CURRENCY_FONT_FALLBACK = 'NotoSans';
