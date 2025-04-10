import { Image as ImageBase, Pattern, util } from "@designcombo/timeline";
import { createResizeControls } from "../controls";

class Image extends ImageBase {
  static type = "Image";

  static createControls() {
    return { controls: createResizeControls() };
  }

  constructor(props) {
    super(props);
    this.loadImage();
  }

  _render(ctx) {
    super._render(ctx);
    this.updateSelected(ctx);
  }

  loadImage() {
    util.loadImage(this.src).then((img) => {
      const imgHeight = img.height;
      const rectHeight = this.height;
      const scaleY = rectHeight / imgHeight;
      const pattern = new Pattern({
        source: img,
        repeat: "repeat-x",
        patternTransform: [scaleY, 0, 0, scaleY, 0, 0],
      });
      this.set("fill", pattern);
      this.canvas?.requestRenderAll();
    });
  }

  setSrc(src) {
    this.src = src;
    this.loadImage();
    this.canvas?.requestRenderAll();
  }
}

export default Image;
