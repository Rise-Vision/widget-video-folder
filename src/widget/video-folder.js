/* global gadgets */

var RiseVision = RiseVision || {};
RiseVision.VideoFolder = {};

RiseVision.VideoFolder = (function (document, gadgets) {
  "use strict";

  var _prefs = null,
    _additionalParams = {},
    _background = null,
    _slider = null;

  /*
   *  Private Methods
   */
  function _done() {
    gadgets.rpc.call("", "rsevent_done", null, _prefs.getString("id"));
  }

  function _ready() {
    gadgets.rpc.call("", "rsevent_ready", null, _prefs.getString("id"),
      true, true, true, true, true);
  }

  function _backgroundReady() {
    // create and initialize the Player instance
    _slider = new RiseVision.VideoFolder.Slider(_additionalParams);
    _slider.init();
  }

  /*
   *  Public Methods
   */
  function pause() {
    _slider.pause();
  }

  function play() {
    _slider.play();
  }

  function setAdditionalParams(params) {
    _prefs = new gadgets.Prefs();
    _additionalParams = params;
    _additionalParams.width = _prefs.getInt("rsW");
    _additionalParams.height = _prefs.getInt("rsH");

    document.getElementById("container").style.height = _prefs.getInt("rsH") + "px";
    document.getElementById("preloader").style.height = _prefs.getInt("rsH") + "px";

    // create and initialize the Background instance
    _background = new RiseVision.Common.Background(_additionalParams);
    _background.init(_backgroundReady);
  }

  function sliderDone() {
    _done();
  }

  function sliderReady() {
    _ready();
  }

  function stop() {
    pause();
  }

  return {
    "pause": pause,
    "play": play,
    "setAdditionalParams": setAdditionalParams,
    "sliderDone": sliderDone,
    "sliderReady": sliderReady,
    "stop": stop
  };

})(document, gadgets);
