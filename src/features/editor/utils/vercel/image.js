

function getInitialPosition(options, info) {
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
      options.size.height / info.height
    );
  } else if (scaleMode === "fit") {
    scaleFactor = Math.min(
      options.size.width / info.width,
      options.size.height / info.height
    );
  } else {
    // Default behavior (unchanged)
    scaleFactor = Math.min(
      options.size.width / info.width,
      options.size.height / info.height
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

const defaultShadow = {
  color: "#000000",
  x: 0,
  y: 0,
  blur: 0,
};

export const loadImageItem = async (layer, options) => {
  const src = layer.details.src;
  const position = getInitialPosition(options, {
    width: layer.width,
    height: layer.height,
  });

  const details = {
    width: layer.width,
    height: layer.height,
    opacity: 100,
    src: src,
    borderRadius: layer.details.borderRadius ?? 0, // Default border radius
    borderWidth: layer.details.borderWidth ?? 0, // Default border width
    borderColor: layer.details.borderColor || "#000000", // Default border color
    boxShadow: layer.details.boxShadow || defaultShadow,
    top: layer.details.top || position.top || "0px", // Default top
    left: layer.details.left || position.left || "0px", // Default left
    transform: layer.details.transform || position.transform, // Default transform
    //transform: "scale(0.84375)",
    border: "none",
    blur: layer.details.blur || 0,
    brightness: layer.details.brightness || 100,
    flipX: layer.details.flipX || false,
    flipY: layer.details.flipY || false,
    rotate: layer.details.rotate || "0deg",
    visibility: layer.details.visibility || "visible",
  };

  const videoItem = {
    ...layer,
    type: "image",
    name: "image",
    details,
    playbackRate: layer.playbackRate || 1,
    display: layer.display,
    duration: layer.duration,
  };
  return videoItem;
};
