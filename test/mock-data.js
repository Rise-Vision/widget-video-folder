(function(window) {
  "use strict";

  window.gadget = window.gadget || {};

  window.gadget.settings = {
    "params": {},
    "additionalParams": {
      "url": "https://www.googleapis.com/storage/v1/b/risemedialibrary-abc123/o?prefix=Widgets%2Fvideos%2F",
      "storage": {
        "companyId": "abc123",
        "folder": "Widgets/videos/",
        "fileName": ""
      },
      "video": {
        "scaleToFit": true,
        "volume":50,
        "controls": true,
        "autoplay":true,
        "pause": 10
      }
    }
  };

})(window);
