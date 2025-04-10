import {
  Pattern,
  Video as VideoBase,
  timeMsToUnits,
  unitsToTimeMs,
} from "@designcombo/timeline";
import ThumbnailCache from "../../utils/thumbnail-cache";
import {
  calculateOffscreenSegments,
  calculateThumbnailSegmentLayout,
} from "../../utils/filmstrip";
import { getFileFromUrl } from "../../utils/file";
import { createMediaControls } from "../controls";

const EMPTY_FILMSTRIP = {
  offset: 0,
  startTime: 0,
  thumbnailsCount: 0,
  widthOnScreen: 0,
};

class Video extends VideoBase {
  static type = "Video";
  clip;
  id;
  resourceId = "";
  tScale;
  isSelected = false;
  display;
  trim;
  playbackRate;
  duration;
  prevDuration;
  itemType = "video";
  metadata;
  src;

  aspectRatio = 1;
  scrollLeft = 0;
  filmstripBacklogOptions;
  thumbnailsPerSegment = 0;
  segmentSize = 0;

  offscreenSegments = 0;
  thumbnailWidth = 0;
  thumbnailHeight = 40;
  thumbnailsList = [];
  isFetchingThumbnails = false;
  thumbnailCache = new ThumbnailCache();

  currentFilmstrip = EMPTY_FILMSTRIP;
  nextFilmstrip = { ...EMPTY_FILMSTRIP, segmentIndex: 0 };
  loadingFilmstrip = EMPTY_FILMSTRIP;

  offscreenCanvas = null;
  offscreenCtx = null;

  isDirty = true;

  fallbackSegmentIndex = 0;
  fallbackSegmentsCount = 0;
  previewUrl = "";

  static createControls() {
    return { controls: createMediaControls() };
  }

  constructor(props) {
    super(props);
    this.id = props.id;
    this.tScale = props.tScale;
    this.objectCaching = false;
    this.rx = 4;
    this.ry = 4;
    this.display = props.display;
    this.trim = props.trim;
    this.duration = props.duration;
    this.prevDuration = props.duration;
    this.fill = "#27272a";
    this.borderOpacityWhenMoving = 1;
    this.metadata = props.metadata;

    this.aspectRatio = props.aspectRatio;

    this.src = props.src;
    this.strokeWidth = 0;

    this.transparentCorners = false;
    this.hasBorders = false;

    this.previewUrl = props.metadata?.previewUrl;
    this.initOffscreenCanvas();
    this.initialize();
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

  initDimensions() {
    this.thumbnailWidth = this.thumbnailHeight * this.aspectRatio;

    const segmentOptions = calculateThumbnailSegmentLayout(this.thumbnailWidth);
    this.thumbnailsPerSegment = segmentOptions.thumbnailsPerSegment;
    this.segmentSize = segmentOptions.segmentSize;
  }

  async initialize() {
    await this.loadFallbackThumbnail();

    this.initDimensions();
    this.onScrollChange({ scrollLeft: 0 });

    this.canvas?.requestRenderAll();

    this.createFallbackPattern();
    await this.prepareAssets();

    this.onScrollChange({ scrollLeft: 0 });
  }

  async prepareAssets() {
    if (typeof window === "undefined") return;

    try {
      const { MP4Clip } = await import("@designcombo/frames");
      const file = await getFileFromUrl(this.src);
      const stream = file.stream();
      this.clip = new MP4Clip(stream);
    } catch (error) {
      console.error("Error loading MP4Clip:", error);
    }
  }

  calculateFilmstripDimensions({ segmentIndex, widthOnScreen }) {
    const filmstripOffset = segmentIndex * this.segmentSize;
    const shouldUseLeftBacklog = segmentIndex > 0;
    const leftBacklogSize = shouldUseLeftBacklog ? this.segmentSize : 0;

    const totalWidth = timeMsToUnits(
      this.duration,
      this.tScale,
      this.playbackRate
    );

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

  // load fallback thumbnail, resize it and cache it
  async loadFallbackThumbnail() {
    const fallbackThumbnail = this.previewUrl;
    if (!fallbackThumbnail) return;

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = fallbackThumbnail + "?t=" + Date.now();
      img.onload = () => {
        // Create a temporary canvas to resize the image
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Calculate new width maintaining aspect ratio
        const aspectRatio = img.width / img.height;
        const targetHeight = 40;
        const targetWidth = Math.round(targetHeight * aspectRatio);
        // Set canvas size and draw resized image
        canvas.height = targetHeight;
        canvas.width = targetWidth;
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        // Create new image from resized canvas
        const resizedImg = new Image();
        resizedImg.src = canvas.toDataURL();
        // Update aspect ratio and cache the resized image
        this.aspectRatio = aspectRatio;
        this.thumbnailWidth = targetWidth;
        this.thumbnailCache.setThumbnail("fallback", resizedImg);
        resolve();
      };
    });
  }

  generateTimestamps(startTime, count) {
    const timePerThumbnail = unitsToTimeMs(
      this.thumbnailWidth,
      this.tScale,
      this.playbackRate
    );

    return Array.from({ length: count }, (_, i) => {
      const timeInFilmstripe = startTime + i * timePerThumbnail;
      return Math.ceil(timeInFilmstripe / 1000);
    });
  }

  createFallbackPattern() {
    const canvas = this.canvas;
    if (!canvas) return;

    const canvasWidth = this.canvas.width;
    const maxPatternSize = 12000;
    const fallbackSource = this.thumbnailCache.getThumbnail("fallback");

    if (!fallbackSource) return;

    // Compute the total width and number of segments needed
    const totalWidthNeeded = Math.min(canvasWidth * 20, maxPatternSize);
    const segmentsRequired = Math.ceil(totalWidthNeeded / this.segmentSize);
    this.fallbackSegmentsCount = segmentsRequired;
    const patternWidth = segmentsRequired * this.segmentSize;

    // Setup canvas dimensions
    const offCanvas = document.createElement("canvas");
    offCanvas.height = this.thumbnailHeight;
    offCanvas.width = patternWidth;

    const context = offCanvas.getContext("2d");
    const thumbnailsTotal = segmentsRequired * this.thumbnailsPerSegment;

    // Draw the fallback image across the entirety of the canvas horizontally
    for (let i = 0; i < thumbnailsTotal; i++) {
      const x = i * this.thumbnailWidth;
      context.drawImage(
        fallbackSource,
        x,
        0,
        this.thumbnailWidth,
        this.thumbnailHeight
      );
    }

    // Create the pattern and apply it
    const fillPattern = new Pattern({
      source: offCanvas,
      repeat: "no-repeat",
      offsetX: 0,
    });

    this.set("fill", fillPattern);
    this.canvas?.requestRenderAll();
  }
  async loadAndRenderThumbnails() {
    if (this.isFetchingThumbnails || !this.clip) return;
    // set segmentDrawn to segmentToDraw
    this.loadingFilmstrip = { ...this.nextFilmstrip };
    this.isFetchingThumbnails = true;

    // Calculate dimensions and offsets
    const { startTime, thumbnailsCount } = this.loadingFilmstrip;

    // Generate required timestamps
    const timestamps = this.generateTimestamps(startTime, thumbnailsCount);

    // Match and prepare thumbnails
    let thumbnailsArr = await this.clip.thumbnailsList(this.thumbnailWidth, {
      timestamps: timestamps.map((timestamp) => timestamp * 1e6),
    });

    const updatedThumbnails = thumbnailsArr.map((thumbnail) => {
      return {
        ts: Math.round(thumbnail.ts / 1e6),
        img: thumbnail.img,
      };
    });

    // Load all thumbnails in parallel
    await this.loadThumbnailBatch(updatedThumbnails);

    this.isDirty = true; // Mark as dirty after preparing new thumbnails
    // this.isFallbackDirty = true;
    this.isFetchingThumbnails = false;

    this.currentFilmstrip = { ...this.loadingFilmstrip };

    requestAnimationFrame(() => {
      this.canvas?.requestRenderAll();
    });
  }

  async loadThumbnailBatch(thumbnails) {
    const loadPromises = thumbnails.map(async (thumbnail) => {
      if (this.thumbnailCache.getThumbnail(thumbnail.ts)) return;

      return new Promise((resolve) => {
        const img = new Image();
        img.src = URL.createObjectURL(thumbnail.img);
        img.onload = () => {
          URL.revokeObjectURL(img.src); // Clean up the blob URL after image loads
          this.thumbnailCache.setThumbnail(thumbnail.ts, img);
          resolve();
        };
      });
    });

    await Promise.all(loadPromises);
  }

  _render(ctx) {
    super._render(ctx);

    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);

    // Clip the area to prevent drawing outside
    ctx.beginPath();
    ctx.rect(0, 0, this.width, this.height);
    ctx.clip();

    this.renderToOffscreen();

    ctx.drawImage(this.offscreenCanvas, 0, 0);

    ctx.restore();
    // this.drawTextIdentity(ctx);
    this.updateSelected(ctx);
  }

  setDuration(duration) {
    this.duration = duration;
    this.prevDuration = duration;
  }

  async setSrc(src) {
    super.setSrc(src);
    this.clip = null;
    await this.initialize();
    await this.prepareAssets();
    this.thumbnailCache.clearCacheButFallback();
    this.onScale();
  }
  onResizeSnap() {
    this.renderToOffscreen(true);
  }
  onResize() {
    this.renderToOffscreen(true);
  }

  renderToOffscreen(force) {
    if (!this.offscreenCtx) return;
    if (!this.isDirty && !force) return;

    this.offscreenCanvas.width = this.width;
    const ctx = this.offscreenCtx;
    const { startTime, offset, thumbnailsCount } = this.currentFilmstrip;
    const thumbnailWidth = this.thumbnailWidth;
    const thumbnailHeight = this.thumbnailHeight;

    // Calculate the offset caused by the trimming
    const trimFromSize = timeMsToUnits(
      this.trim.from,
      this.tScale,
      this.playbackRate
    );

    let timeInFilmstripe = startTime;
    const timePerThumbnail = unitsToTimeMs(
      thumbnailWidth,
      this.tScale,
      this.playbackRate
    );

    // Clear the offscreen canvas
    ctx.clearRect(0, 0, this.width, this.height);

    // Clip with rounded corners
    ctx.beginPath();
    ctx.roundRect(0, 0, this.width, this.height, this.rx);
    ctx.clip();
    // Draw thumbnails
    for (let i = 0; i < thumbnailsCount; i++) {
      let img = this.thumbnailCache.getThumbnail(
        Math.ceil(timeInFilmstripe / 1000)
      );

      if (!img) {
        img = this.thumbnailCache.getThumbnail("fallback");
      }

      if (img && img.complete) {
        const xPosition = i * thumbnailWidth + offset - trimFromSize;

        ctx.drawImage(img, xPosition, 0, thumbnailWidth, thumbnailHeight);
        timeInFilmstripe += timePerThumbnail;
      }
    }

    this.isDirty = false;
  }

  drawTextIdentity(ctx) {
    const iconPath = new Path2D(
      "M16.5625 0.925L12.5 3.275V0.625L11.875 0H0.625L0 0.625V9.375L0.625 10H11.875L12.5 9.375V6.875L16.5625 9.2125L17.5 8.625V1.475L16.5625 0.925ZM11.25 8.75H1.25V1.25H11.25V8.75ZM16.25 7.5L12.5 5.375V4.725L16.25 2.5V7.5Z"
    );
    ctx.save();
    ctx.translate(-this.width / 2, -this.height / 2);
    ctx.translate(0, 14);
    ctx.font = "600 12px 'Geist variable'";
    ctx.fillStyle = "#f4f4f5";
    ctx.textAlign = "left";
    ctx.clip();
    ctx.fillText("Video", 36, 10);

    ctx.translate(8, 1);

    ctx.fillStyle = "#f4f4f5";
    ctx.fill(iconPath);
    ctx.restore();
  }

  setSelected(selected) {
    this.isSelected = selected;
    this.set({ dirty: true });
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

  // Calculate the width that is not visible on the screen measured from the left
  calculateOffscreenWidth({ scrollLeft }) {
    const offscreenWidth = Math.min(this.left + scrollLeft, 0);

    return Math.abs(offscreenWidth);
  }

  onScrollChange({ scrollLeft, force }) {
    const offscreenWidth = this.calculateOffscreenWidth({ scrollLeft });
    const trimFromSize = timeMsToUnits(
      this.trim.from,
      this.tScale,
      this.playbackRate
    );

    const offscreenSegments = calculateOffscreenSegments(
      offscreenWidth,
      trimFromSize,
      this.segmentSize
    );

    this.offscreenSegments = offscreenSegments;

    // calculate start segment to draw
    const segmentToDraw = offscreenSegments;

    if (this.currentFilmstrip.segmentIndex === segmentToDraw) {
      return false;
    }

    if (segmentToDraw !== this.fallbackSegmentIndex) {
      const fillPattern = this.fill;
      if (fillPattern instanceof Pattern) {
        fillPattern.offsetX =
          this.segmentSize *
          (segmentToDraw - Math.floor(this.fallbackSegmentsCount / 2));
      }

      this.fallbackSegmentIndex = segmentToDraw;
    }
    if (!this.isFetchingThumbnails || force) {
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

      this.loadAndRenderThumbnails();
    }
  }
  onScale() {
    this.currentFilmstrip = { ...EMPTY_FILMSTRIP };
    this.nextFilmstrip = { ...EMPTY_FILMSTRIP, segmentIndex: 0 };
    this.loadingFilmstrip = { ...EMPTY_FILMSTRIP };
    this.onScrollChange({ scrollLeft: this.scrollLeft, force: true });
  }
}

export default Video;
