import "@fontsource/anton/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/700.css";
import { continueRender, delayRender } from "remotion";

// Segura a renderização até as fontes carregarem, senão o primeiro quadro sai com a fonte reserva.
const espera = delayRender("Carregando fontes");

Promise.all([
  document.fonts.load('100px "Anton"'),
  document.fonts.load('italic 100px "Instrument Serif"'),
  document.fonts.load('500 100px "DM Sans"'),
  document.fonts.load('700 100px "DM Sans"'),
])
  .then(() => continueRender(espera))
  .catch(() => continueRender(espera));
