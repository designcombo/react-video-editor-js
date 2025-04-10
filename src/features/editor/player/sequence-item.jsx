import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence } from "remotion";
import TextLayer from "./editable-text";
import { calculateFrames } from "../utils/frames";
import { Animated } from "./animated";
import {
  calculateContainerStyles,
  calculateMediaStyles,
  calculateTextStyles,
} from "./styles";
import { getAnimations } from "../utils/get-animations";

export const SequenceItem = {
  text: (item, options) => {
    const { handleTextChange, onTextBlur, fps, editableTextId, zIndex } =
      options;
    const { id, details, animations } = item;
    const { from, durationInFrames } = calculateFrames(item.display, fps);
    const { animationIn, animationOut } = getAnimations(animations, item);
    return (
      <Sequence
        key={item.id}
        from={from}
        durationInFrames={durationInFrames}
        style={{ pointerEvents: "none", zIndex }}
      >
        {/* positioning layer */}
        <AbsoluteFill
          data-track-item="transition-element"
          className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
          style={calculateContainerStyles(details)}
        >
          {/* animation layer */}
          <Animated
            style={calculateContainerStyles(details)}
            animationIn={editableTextId === id ? null : animationIn}
            animationOut={editableTextId === id ? null : animationOut}
            durationInFrames={durationInFrames}
          >
            {/* text layer */}
            <TextLayer
              key={id}
              id={id}
              content={details.text}
              editable={editableTextId === id}
              onChange={handleTextChange}
              onBlur={onTextBlur}
              style={calculateTextStyles(details)}
            />
          </Animated>
        </AbsoluteFill>
      </Sequence>
    );
  },

  image: (item, options) => {
    const { fps, zIndex } = options;
    const { details, animations } = item;
    const { from, durationInFrames } = calculateFrames(item.display, fps);
    const { animationIn, animationOut } = getAnimations(animations, item);
    const crop = details.crop || {
      x: 0,
      y: 0,
      width: item.details.width,
      height: item.details.height,
    };
    return (
      <Sequence
        key={item.id}
        from={from}
        durationInFrames={durationInFrames}
        style={{ pointerEvents: "none", zIndex }}
      >
        {/* position layer */}
        <AbsoluteFill
          data-track-item="transition-element"
          className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
          style={calculateContainerStyles(details, crop)}
        >
          {/* animation layer */}
          <Animated
            style={calculateContainerStyles(details, crop, {
              overflow: "hidden",
            })}
            animationIn={animationIn}
            animationOut={animationOut}
            durationInFrames={durationInFrames}
          >
            <div style={calculateMediaStyles(details, crop)}>
              <Img data-id={item.id} src={details.src} />
            </div>
          </Animated>
        </AbsoluteFill>
      </Sequence>
    );
  },
  video: (item, options) => {
    const { fps, zIndex } = options;
    const { details, animations } = item;
    const { animationIn, animationOut } = getAnimations(animations, item);
    const playbackRate = item.playbackRate || 1;
    const { from, durationInFrames } = calculateFrames(
      {
        from: item.display.from / playbackRate,
        to: item.display.to / playbackRate,
      },
      fps
    );
    const crop = details.crop || {
      x: 0,
      y: 0,
      width: item.details.width,
      height: item.details.height,
    };

    return (
      <Sequence
        key={item.id}
        from={from}
        durationInFrames={durationInFrames}
        style={{ pointerEvents: "none", zIndex }}
      >
        <AbsoluteFill
          data-track-item="transition-element"
          className={`designcombo-scene-item id-${item.id} designcombo-scene-item-type-${item.type}`}
          style={calculateContainerStyles(details, crop)}
        >
          {/* animation layer */}
          <Animated
            style={calculateContainerStyles(details, crop, {
              overflow: "hidden",
            })}
            animationIn={animationIn}
            animationOut={animationOut}
            durationInFrames={durationInFrames}
          >
            <div style={calculateMediaStyles(details, crop)}>
              <OffthreadVideo
                startFrom={(item.trim?.from / 1000) * fps}
                endAt={(item.trim?.to / 1000) * fps}
                playbackRate={playbackRate}
                src={details.src}
                volume={details.volume || 0 / 100}
              />
            </div>
          </Animated>
        </AbsoluteFill>
      </Sequence>
    );
  },
  audio: (item, options) => {
    const { fps, zIndex } = options;
    const { details } = item;
    const playbackRate = item.playbackRate || 1;
    const { from, durationInFrames } = calculateFrames(
      {
        from: item.display.from / playbackRate,
        to: item.display.to / playbackRate,
      },
      fps
    );
    return (
      <Sequence
        key={item.id}
        from={from}
        durationInFrames={durationInFrames}
        style={{
          userSelect: "none",
          pointerEvents: "none",
          zIndex,
        }}
      >
        <AbsoluteFill>
          <Audio
            startFrom={(item.trim?.from / 1000) * fps}
            endAt={(item.trim?.to / 1000) * fps}
            playbackRate={playbackRate}
            src={details.src}
            volume={details.volume / 100}
          />
        </AbsoluteFill>
      </Sequence>
    );
  },
};
