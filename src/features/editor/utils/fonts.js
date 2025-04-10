import { groupBy } from "lodash";

export const loadFonts = (fonts) => {
  const promisesList = fonts.map((font) => {
    return new FontFace(font.name, `url(${font.url})`)
      .load()
      .catch((err) => err);
  });
  return new Promise((resolve, reject) => {
    Promise.all(promisesList)
      .then((res) => {
        res.forEach((uniqueFont) => {
          if (uniqueFont && uniqueFont.family) {
            document.fonts.add(uniqueFont);
            resolve(true);
          }
        });
      })
      .catch((err) => reject(err));
  });
};

const findDefaultFont = (fonts) => {
  const regularFont = fonts.find((font) =>
    font.fullName.toLowerCase().includes("regular")
  );

  return regularFont ? regularFont : fonts[0];
};

export const getCompactFontData = (fonts) => {
  const compactFontsMap = {};
  // lodash groupby
  const fontsGroupedByFamily = groupBy(fonts, (font) => font.family);

  Object.keys(fontsGroupedByFamily).forEach((family) => {
    const fontsInFamily = fontsGroupedByFamily[family];
    const defaultFont = findDefaultFont(fontsInFamily);
    const compactFont = {
      family: family,
      styles: fontsInFamily,
      default: defaultFont,
    };
    compactFontsMap[family] = compactFont;
  });

  return Object.values(compactFontsMap);
};
