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
      "order": "alpha-asc",
      "pause": 10,
      "autoHide": false,
      "video": {
        "autoplay": true,
        "scaleToFit": true,
        "volume": 50
      },
      "background": {
        "color": "rgba(255,255,255,0)",
        "useImage": false,
        "image": {
          "url": "",
          "position": "top-left",
          "scale": true
        }
      },
      "backgroundStorage": {}
    }
  };


})(window);
