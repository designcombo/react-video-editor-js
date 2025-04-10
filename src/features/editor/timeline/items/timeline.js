import TimelineBase from "@designcombo/timeline";
import Video from "./video";
import { throttle } from "lodash";
import Audio from "./audio";

class Timeline extends TimelineBase {
  isShiftKey = false;
  constructor(canvasEl, options) {
    super(canvasEl, options); // Call the parent class constructor

    // Add shift keyboard listener
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  handleKeyDown = (event) => {
    if (event.key === "Shift") {
      this.isShiftKey = true;
    }
  };

  handleKeyUp = (event) => {
    if (event.key === "Shift") {
      this.isShiftKey = false;
    }
  };

  purge() {
    super.purge();

    // Cleanup event listener for Shift key
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
  }

  setViewportPos(posX, posY) {
    const limitedPos = this.getViewportPos(posX, posY);
    const vt = this.viewportTransform;
    vt[4] = limitedPos.x;
    vt[5] = limitedPos.y;
    this.requestRenderAll();
    this.setActiveTrackItemCoords();
    this.onScrollChange();

    this.onScroll?.({
      scrollTop: limitedPos.y,
      scrollLeft: limitedPos.x - this.spacing.left,
    });
  }

  onScrollChange = throttle(async () => {
    const objects = this.getObjects();
    const viewportTransform = this.viewportTransform;
    const scrollLeft = viewportTransform[4];
    for (const object of objects) {
      if (object instanceof Video || object instanceof Audio) {
        object.onScrollChange({ scrollLeft });
      }
    }
  }, 250);

  scrollTo({ scrollLeft, scrollTop }) {
    const vt = this.viewportTransform; // Create a shallow copy
    let hasChanged = false;

    if (typeof scrollLeft === "number") {
      vt[4] = -scrollLeft + this.spacing.left;
      hasChanged = true;
    }
    if (typeof scrollTop === "number") {
      vt[5] = -scrollTop;
      hasChanged = true;
    }

    if (hasChanged) {
      this.viewportTransform = vt;
      this.getActiveObject()?.setCoords();
      this.onScrollChange();
      this.requestRenderAll();
    }
  }
}

export default Timeline;
