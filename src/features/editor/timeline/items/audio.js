import {
  Audio as AudioBase,
  Pattern,
  timeMsToUnits,
  unitsToTimeMs,
} from "@designcombo/timeline";
import { getAudioData, getWaveformPortion } from "@remotion/media-utils";
import { createAudioControls } from "../controls";

const MAX_CANVAS_WIDTH = 12000; // Keep canvas size reasonable
const CANVAS_SAFE_DRAWING = 2000;
const EMPTY_FILMSTRIP = {
  offset: 0,
  startTime: 0,
  thumbnailsCount: 0,
  widthOnScreen: 0,
};

export const calculateOffscreenSegments = (
  offscreenHeight,
  trimFromSize,
  segmentSize
) => {
  const offscreenSegments = Math.floor(
    (offscreenHeight + trimFromSize) / segmentSize
  );
  return offscreenSegments;
};

class Audio extends AudioBase {
  static type = "Audio";
  barData;
  tScale;
  offscreenCanvas = null;
  offscreenCtx = null;
  fallbackSegmentIndex = 0;

  thumbnailsPerSegment = 0;
  scrollLeft = 0;
  segmentSize = 0;
  display;
  isDirty = true;
  fallbackSegmentsCount = 0;
  thumbnailWidth = 8;
  isFetchingThumbnails = false;
  nextFilmstrip = { ...EMPTY_FILMSTRIP, segmentIndex: 0 };
  loadingFilmstrip = EMPTY_FILMSTRIP;
  playbackRate;
  barsCache = new Map();
  bars = [];

  static createControls() {
    return { controls: createAudioControls() };
  }

  constructor(props) {
    super(props);
    this.display = props.display;
    this.fill = "#00586c";
    this.objectCaching = false;
    this.initOffscreenCanvas();
    this.initialize();
  }

  // Update the _render method to handle the visible portion
  _render(ctx) {
    super._render(ctx);
    this.updateSelected(ctx);

    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);

    // Clip the area to prevent drawing outside
    ctx.beginPath();
    ctx.rect(0, 0, this.width, this.height);
    ctx.clip();

    this.renderToOffscreen();

    // Draw only the visible portion
    const displayFromInUnits = timeMsToUnits(this.display.from, this.tScale);
    const scrollLeft = this.scrollLeft + displayFromInUnits;
    const visibleStart = Math.max(0, -scrollLeft) - CANVAS_SAFE_DRAWING;
    ctx.drawImage(
      this.offscreenCanvas,
      0,
      0,
      this.offscreenCanvas.width,
      this.height,
      visibleStart,
      0,
      this.offscreenCanvas.width,
      this.height
    );

    ctx.restore();
    this.canvas?.requestRenderAll();
  }

  async initialize() {
    this.initDimensions();
    const audioData = await getAudioData(this.src);
    this.barData = audioData;
    this.bars = this.getBars(0, 0);
    this.canvas?.requestRenderAll();
    this.onScrollChange({ scrollLeft: 0 });
  }

  initDimensions() {
    this.segmentSize = 1200;
  }

  getBars(start, duration) {
    if (!this.barData) return;

    // Create a cache key based on the parameters
    const cacheKey = `${start}-${duration}-${this.width}`;

    // Return cached data if available
    if (this.barsCache.has(cacheKey)) {
      return this.barsCache.get(cacheKey);
    }
    const durationInUnits = timeMsToUnits(
      this.duration,
      this.tScale,
      this.playbackRate
    );

    const bars = getWaveformPortion({
      audioData: this.barData,
      startTimeInSeconds: start / 1000 || 0,
      durationInSeconds: duration || this.barData.durationInSeconds,
      numberOfSamples: Math.round(durationInUnits / 4),
    });

    // Cache the result
    this.barsCache.set(cacheKey, bars);
    return bars;
  }

  initOffscreenCanvas() {
    if (!this.offscreenCanvas) {
      this.offscreenCanvas = new OffscreenCanvas(this.width, this.height);
      this.offscreenCtx = this.offscreenCanvas.getContext("2d");
    }

    // Resize if dimensions changed
    if (
      this.offscreenCanvas.width !== this.width ||
      this.offscreenCanvas.height !== this.height
    ) {
      this.offscreenCanvas.width = this.width;
      this.offscreenCanvas.height = this.height;
      this.isDirty = true;
    }
  }

  updateSelected(ctx) {
    const borderColor = this.isSelected
      ? "rgba(255, 255, 255,1.0)"
      : "rgba(255, 255, 255,0.1)";
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height,
      6
    );
    ctx.lineWidth = 1;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
    ctx.restore();
  }

  calculateOffscreenWidth({ scrollLeft }) {
    const offscreenWidth = Math.min(this.left + scrollLeft, 0);

    return Math.abs(offscreenWidth);
  }

  calulateWidthOnScreen() {
    const canvasEl = document.getElementById("designcombo-timeline-canvas");
    const canvasWidth = canvasEl?.clientWidth;
    const scrollLeft = this.scrollLeft;
    const timelineWidth = canvasWidth;
    const cutFromBottomEdge = Math.max(
      timelineWidth - (this.width + this.left + scrollLeft),
      0
    );
    const visibleHeight = Math.min(
      timelineWidth - this.left - scrollLeft,
      timelineWidth
    );

    return Math.max(visibleHeight - cutFromBottomEdge, 0);
  }

  calculateFilmstripDimensions({ segmentIndex, widthOnScreen }) {
    const filmstripOffset = segmentIndex * this.segmentSize;
    const shouldUseLeftBacklog = segmentIndex > 0;
    const leftBacklogSize = shouldUseLeftBacklog ? this.segmentSize : 0;
    const duration = (this.display?.to || 0) - (this.display?.from || 0);

    const totalWidth = timeMsToUnits(duration, this.tScale);

    const rightRemainingSize =
      totalWidth - widthOnScreen - leftBacklogSize - filmstripOffset;
    const rightBacklogSize = Math.min(this.segmentSize, rightRemainingSize);

    const filmstripStartTime = unitsToTimeMs(filmstripOffset, this.tScale);
    const filmstrimpThumbnailsCount =
      1 +
      Math.round(
        (widthOnScreen + leftBacklogSize + rightBacklogSize) /
          this.thumbnailWidth
      );

    return {
      filmstripOffset,
      leftBacklogSize,
      rightBacklogSize,
      filmstripStartTime,
      filmstrimpThumbnailsCount,
    };
  }

  onScrollChange({ scrollLeft }) {
    const offscreenWidth = this.calculateOffscreenWidth({ scrollLeft });

    const trimFromSize = timeMsToUnits(this.trim.from, this.tScale);

    const offscreenSegments = calculateOffscreenSegments(
      offscreenWidth,
      trimFromSize,
      this.segmentSize
    );

    // calculate start segment to draw
    const segmentToDraw = offscreenSegments;

    if (segmentToDraw !== this.fallbackSegmentIndex) {
      const fillPattern = this.fill;
      if (fillPattern instanceof Pattern) {
        fillPattern.offsetX =
          this.segmentSize *
          (segmentToDraw - Math.floor(this.fallbackSegmentsCount / 2));
      }

      this.fallbackSegmentIndex = segmentToDraw;
    }

    if (!this.isFetchingThumbnails) {
      this.scrollLeft = scrollLeft;
      const widthOnScreen = this.calulateWidthOnScreen();
      // With these lines:
      const { filmstripOffset, filmstripStartTime, filmstrimpThumbnailsCount } =
        this.calculateFilmstripDimensions({
          widthOnScreen: this.calulateWidthOnScreen(),
          segmentIndex: segmentToDraw,
        });

      this.nextFilmstrip = {
        segmentIndex: segmentToDraw,
        offset: filmstripOffset,
        startTime: filmstripStartTime,
        thumbnailsCount: filmstrimpThumbnailsCount,
        widthOnScreen,
      };
      this.isDirty = true; // Mark as dirty after preparing new thumbnails
    }
  }
  renderToOffscreen(force) {
    if (!this.offscreenCtx) return;
    if (!this.isDirty && !force) return;

    this.offscreenCanvas.width = MAX_CANVAS_WIDTH;
    this.offscreenCanvas.height = this.height;

    const ctx = this.offscreenCtx;
    // Calculate visible range
    const displayFromInUnits = timeMsToUnits(this.display.from, this.tScale);
    const scrollLeft = this.scrollLeft + displayFromInUnits;

    // Calculate the offset caused by the trimming
    const trimFromSize = timeMsToUnits(
      this.trim.from,
      this.tScale,
      this.playbackRate
    );

    const visibleStart =
      Math.max(0, -scrollLeft) - CANVAS_SAFE_DRAWING + trimFromSize;
    const visibleWidth = MAX_CANVAS_WIDTH;

    const bars = this.bars;
    if (!bars) return;

    // Clear the offscreen canvas
    ctx.clearRect(0, 0, this.offscreenCanvas.width, this.height);

    // Clip with rounded corners
    ctx.beginPath();
    ctx.roundRect(0, 0, this.offscreenCanvas.width, this.height, this.rx);
    ctx.clip();

    // Draw waveform
    ctx.fillStyle = "#f4f4f5";
    ctx.imageSmoothingEnabled = false;

    // Calculate which bars are visible
    const barWidth = 4; // 1px bar + 3px space
    const startBarIndex = Math.floor(visibleStart / barWidth);
    const endBarIndex = Math.ceil((visibleStart + visibleWidth) / barWidth);
    // Only draw visible bars
    ctx.beginPath();

    for (let i = startBarIndex; i < endBarIndex && i < bars.length; i++) {
      const bar = bars[i];
      if (bar) {
        const x = Math.round(i * barWidth - visibleStart);
        if (x >= 0 && x < this.offscreenCanvas.width) {
          const amplitude = bar.amplitude || 0;
          const height = Math.round(amplitude * 15);
          const y = Math.round((20 - height) / 2 + 8);
          ctx.rect(x, y, 1, height);
        }
      }
    }
    ctx.fill();
    this.isDirty = false;
  }

  onResizeSnap() {
    this.renderToOffscreen(true);
  }

  onResize() {
    this.renderToOffscreen(true);
  }

  onScale() {
    this.barsCache.clear(); // Clear cache on scale change
    this.bars = this.getBars(0, 0);
    this.isFetchingThumbnails = false;
    this.nextFilmstrip = { ...EMPTY_FILMSTRIP, segmentIndex: 0 };
    this.loadingFilmstrip = { ...EMPTY_FILMSTRIP };
    this.onScrollChange({ scrollLeft: this.scrollLeft });
  }
}

export default Audio;
