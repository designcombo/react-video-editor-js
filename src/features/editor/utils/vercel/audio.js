
const getTrim = (trim, options) => {
    if (!trim)
      return {
        from: 0,
        to: options.duration,
      };
    if (trim.from && !trim.to) {
      return {
        from: trim.from,
        to: options.duration,
      };
    }
    return trim;
  };

export const loadAudioItem = async (layer) => {
  const src = layer.details.src;


  const trim = getTrim(layer.trim, { duration: layer.duration });
  const details = {
    src: src,
    volume: layer.details.volume ?? 100, // Default volume
  };

  const videoItem = {
    ...layer,
    trim: trim,
    type: "audio",
    name: "audio",
    details,
    playbackRate: layer.playbackRate || 1,
    display: layer.display,
    //duration: layer.duration,
  };
  return videoItem;
};