var RiseVision = RiseVision || {};
RiseVision.VideoFolder = RiseVision.VideoFolder || {};

RiseVision.VideoFolder.Preloader = function (target) {
  "use strict";

  var _spinner = null;

  /*
   *  Private Methods
   */

  /*
   *  Public Methods
   */
  function hide() {
    _spinner.stop();
    target.style.visibility = "hidden";
  }

  function show() {
    target.style.visibility = "visible";
    _spinner.spin(target);
  }

  function init() {
    var opts = {
      lines: 12, // The number of lines to draw
      length: 20, // The length of each line
      width: 10, // The line thickness
      radius: 30, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      rotate: 0, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: "#fff", // #rgb or #rrggbb or array of colors
      speed: 1, // Rounds per second
      trail: 60, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: false, // Whether to use hardware acceleration
      className: "spinner", // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: "50%", // Top position relative to parent
      left: "50%" // Left position relative to parent
    };

    if (typeof target !== "undefined" && target) {
      target.style.visibility = "visible";
      _spinner = new Spinner(opts).spin(target);
    }

  }

  return {
    "init": init,
    "show": show,
    "hide": hide
  };
};
