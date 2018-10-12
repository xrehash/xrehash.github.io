//require("knockout-3.4.2.js");
//console.log("script-0");
import {Network as Net} from "./app/core.js";
import * as om from "./app/thing.js";
//import * as ko from "/lib/knockout-3.4.2.js";

document.onreadystatechange = function (evt) {
    if (document.readyState == 'complete') {
      // initialize application
      let app = new om.OnMark();
      ko.applyBindings(app);
      //app.Lists.pu
      console.log("Wee Home",ko);
    }
  };

