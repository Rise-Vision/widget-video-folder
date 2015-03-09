/* global gadgets */

var RiseVision = RiseVision || {};
RiseVision.VideoFolder = {};

RiseVision.VideoFolder = (function (document, gadgets) {
  "use strict";

  var _prefs = null,
    _additionalParams = {},
    _background = null;

  /*
   *  Private Methods
   */
  function _ready() {
    gadgets.rpc.call("", "rsevent_ready", null, _prefs.getString("id"),
      true, true, true, true, true);
  }

  function _backgroundReady() {
    // TODO: continue development of playing videos from here, temporarily call _ready()
    _ready();
  }

  /*
   *  Public Methods
   */
  function pause() {

  }

  function play() {

  }

  function setAdditionalParams(params) {
    _prefs = new gadgets.Prefs();
    _additionalParams = params;

    // create and initialize the Background instance
    _background = new RiseVision.Common.Background(_additionalParams);
    _background.init(_backgroundReady);
  }

  function stop() {

  }

  return {
    "pause": pause,
    "play": play,
    "setAdditionalParams": setAdditionalParams,
    "stop": stop
  };

})(document, gadgets);
