import { Helper as HelperBase } from "@designcombo/timeline";

class Helper extends HelperBase {
  static type = "Helper";

  constructor(props) {
    props.activeGuideFill = "#ffffff";
    super(props);
  }
}

export default Helper;
