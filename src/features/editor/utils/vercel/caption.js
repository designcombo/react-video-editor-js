
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

export async function fetchJsonFromUrl(url) {
    try {
      const response = await fetch(url);
  
      if (!response.ok) {
        throw new Error(`Error fetching JSON: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch JSON data:", error);
      throw error; // Optionally rethrow to handle it in the caller
    }
  }