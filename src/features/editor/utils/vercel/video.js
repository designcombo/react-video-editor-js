

export const getVideoInfo = (src) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    // video.crossOrigin = "anonymous"; // Enable cross-origin access if video is hosted elsewhere
    video.preload = "auto";

    video.addEventListener("loadedmetadata", () => {
      const duration = video.duration * 1000;
      const width = video.videoWidth;
      const height = video.videoHeight;

      resolve({ duration, width, height });
    });

    video.addEventListener("error", (error) => {
      reject(error);
    });

    video.src = src;
    video.load();
  });
};

export const getIVideotemInfo = async (item) => {
  const duration = item.duration;
  const width = item.details?.width;
  const height = item.details?.height;
  if (duration && width && height) {
    return { duration, width, height };
  }
  return getVideoInfo(item.details.src);
};



function getInitialPosition(options, info){
  const scaleMode = options.scaleMode;

  // Calculate the center of the scene
  const sceneCenter = {
    x: options.size.width / 2,
    y: options.size.height / 2,
  };

  // Calculate the center of the image
  const imageCenter = { x: info.width / 2, y: info.height / 2 };

  // Calculate the scale factor based on scaleMode
  let scaleFactor;
  if (scaleMode === "fill") {
    scaleFactor = Math.max(
      options.size.width / info.width,
      options.size.height / info.height,
    );
  } else if (scaleMode === "fit") {
    scaleFactor = Math.min(
      options.size.width / info.width,
      options.size.height / info.height,
    );
  } else {
    // Default behavior (unchanged)
    scaleFactor = Math.min(
      options.size.width / info.width,
      options.size.height / info.height,
    );
  }

  // Calculate the transform values
  const transformX = sceneCenter.x - imageCenter.x;
  const transformY = sceneCenter.y - imageCenter.y;

  return {
    top: `${transformY}px`,
    left: `${transformX}px`,
    transform: `scale(${scaleFactor})`,
  };
}

const getDisplay = (display, options) => {
  let defaultDuration = options?.trim
    ? options.trim.to - options.trim.from
    : options?.duration || 5000;

  // Default range
  const defaultDisplay = {
    from: 0,
    to: defaultDuration,
  };

  // If no display object is provided, return the default range
  if (!display) {
    return defaultDisplay;
  }

  // Validation: 'from' should be a non-negative number
  if (display.from < 0) {
    console.error(
      "'from' must be a non-negative number. Returning default display.",
    );
    return defaultDisplay;
  }

  // If 'from' is provided (including if it's 0) and 'to' is not, calculate 'to' based on duration
  if (display.from !== undefined && display.to === undefined) {
    return {
      from: display.from,
      to: display.from + defaultDuration,
    };
  }

  // Validation: 'to' should be a non-negative number and greater than or equal to 'from'
  if (display.to !== undefined) {
    if (display.to < 0) {
      console.error(
        "'to' must be a non-negative number. Returning default display.",
      );
      return defaultDisplay;
    }
    if (display.to < display.from) {
      console.error(
        "'to' must be greater than or equal to 'from'. Returning default display.",
      );
      return defaultDisplay;
    }
  }

  return display;
};

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

const defaultShadow = {
  color: "#000000",
  x: 0,
  y: 0,
  blur: 0,
};

export const loadVideoItem = async (layer, options) => {
  const src = layer.details.src;
  const videoInfo = await getIVideotemInfo(layer);
  const position = getInitialPosition(options, {
    ...videoInfo,
  });

  const trim = getTrim(layer.trim, { duration: videoInfo.duration });
  const details = {
    width: videoInfo.width,
    height: videoInfo.height,
    opacity: 100,
    src: src,
    volume: layer.details.volume ?? 100, // Default volume
    borderRadius: layer.details.borderRadius ?? 0, // Default border radius
    borderWidth: layer.details.borderWidth ?? 0, // Default border width
    borderColor: layer.details.borderColor || "#000000", // Default border color
    boxShadow: layer.details.boxShadow || defaultShadow,
    top: layer.details.top || position.top || "0px", // Default top
    left: layer.details.left || position.left || "0px", // Default left
    transform: layer.details.transform || position.transform, // Default transform
    blur: layer.details.blur || 0,
    brightness: layer.details.brightness || 100,
    flipX: layer.details.flipX || false,
    flipY: layer.details.flipY || false,
    rotate: layer.details.rotate || "0deg",
    visibility: layer.details.visibility || "visible",
  };

  const videoItem = {
    ...layer,
    trim: trim,
    type: "video",
    name: "video",
    details,
    playbackRate: layer.playbackRate || 1,
    display: getDisplay(layer.display, { duration: videoInfo.duration, trim }),
    duration: videoInfo.duration,
  };
  return videoItem;
};