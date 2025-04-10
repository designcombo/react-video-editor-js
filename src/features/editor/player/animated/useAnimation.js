import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

const createPropertyHandler = () => ({
  scale: (value) => ({ transform: `scale(${value})` }),
  opacity: (value) => ({ opacity: value }),
  translateX: (value) => ({ transform: `translateX(${value}px)` }),
  translateY: (value) => ({ transform: `translateY(${value}px)` }),
  rotate: (value) => ({ transform: `rotate(${value}deg)` }),
  default: () => ({}),
});

const interpolateValue = (
  frame,
  animation,
  durationInFrames,
  isOut = false
) => {
  const { from, to, ease } = animation;
  const animationDurationInFrames = animation.durationInFrames || 30;

  const safeFrom = Number(from);
  const safeTo = Number(to);
  const safeDuration = Math.max(1, Number(animationDurationInFrames || 1));

  if (isNaN(safeFrom) || isNaN(safeTo)) {
    console.error("Invalid animation values:", {
      from,
      to,
      animationDurationInFrames,
      property: animation.property,
    });
    return safeFrom;
  }

  if (animationDurationInFrames === undefined) {
    console.warn(
      `durationInFrames is undefined for animation: ${animation.property}. Using 1 frame as default.`
    );
  }

  const inputRange = isOut
    ? [durationInFrames - animationDurationInFrames, durationInFrames]
    : [0, safeDuration];

  return interpolate(frame, inputRange, [safeFrom, safeTo], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
};
const calculateStyle = (animation, frame, durationInFrames, isOut) => {
  const { property, durationInFrames: animationDurationInFrames } = animation;
  if (!isOut && frame > animationDurationInFrames) return {};
  // const adjustedFrame = frame - startFrame;
  const value = interpolateValue(frame, animation, durationInFrames, isOut);
  const propertyHandler = createPropertyHandler();
  return (propertyHandler[property] || propertyHandler.default)(value);
};

export const useAnimation = (animations, durationInFrames, isOut = false) => {
  const frame = useCurrentFrame();
  return React.useMemo(() => {
    if (animations.length === 0) return {};

    return (
      animations.reduce <
      React.CSSProperties >
      ((style, anim) => {
        if (anim?.from === undefined || anim?.to === undefined) {
          console.error("Invalid animation object:", anim);
          return style;
        }
        const newStyle = calculateStyle(anim, frame, durationInFrames, isOut);

        return { ...style, ...newStyle };
      },
      {})
    );
  }, [animations, frame, durationInFrames, isOut]);
};

export const combineAnimations = (animations) => {
  if (!animations) return [];
  return Array.isArray(animations) ? animations : [animations];
};
