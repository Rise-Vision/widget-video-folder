/* global gadgets */

var RiseVision = RiseVision || {};
RiseVision.VideoFolder = {};

RiseVision.VideoFolder = (function (gadgets) {
  "use strict";

  var _additionalParams;

  var _prefs = null,
    _background = null,
    _storage = null;

  var _initialized = false,
    _ended = false,
    _setupError = false;

  var _currentFiles;

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

  function _getFrameObject() {
    var iframe = document.querySelector("#videoContainer iframe");

    if (iframe) {
      return (iframe.contentWindow) ? iframe.contentWindow :
        (iframe.contentDocument.document) ? iframe.contentDocument.document : iframe.contentDocument;
    }

    return null;
  }

  function _addFrame() {
    var container = document.getElementById("videoContainer"),
      iframe;

    iframe = document.createElement("iframe");
    iframe.setAttribute("allowTransparency", true);
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("scrolling", "no");

    container.appendChild(iframe);
  }

  function _backgroundReady() {
    _storage = new RiseVision.VideoFolder.Storage(_additionalParams);
    _storage.init();
  }

  function _createPlayer() {
    var html = RiseVision.VideoFolder.Template.getHTML(_additionalParams, _currentFiles),
      myFrameObj = _getFrameObject();

    if (myFrameObj) {
      myFrameObj.document.open();
      myFrameObj.document.write(html);
      myFrameObj.document.close();
    }
  }

  /*
   *  Public Methods
   */
  function onStorageInit(urls) {
    _currentFiles = urls;
    _addFrame();
    _createPlayer();
  }

  function onStorageRefresh(/*urls*/) {
    //TODO: handle a refresh
  }

  function pause() {
    var frameObj = _getFrameObject();

    if (frameObj) {
      frameObj.pause();
    }
  }

  function play() {
    var frameObj = _getFrameObject();

    if (!_setupError) {
      if (frameObj) {
        frameObj.play();
      } else {
        _addFrame();
        _createPlayer();
      }
    } else {
      _done();
    }

  }

  function setAdditionalParams(names, values) {
    if (Array.isArray(names) && names.length > 0 && names[0] === "additionalParams") {
      if (Array.isArray(values) && values.length > 0) {
        _additionalParams = JSON.parse(values[0]);
        _prefs = new gadgets.Prefs();

        document.getElementById("videoContainer").style.height = _prefs.getInt("rsH") + "px";

        _additionalParams.width = _prefs.getInt("rsW");
        _additionalParams.height = _prefs.getInt("rsH");

        // create and initialize the Background instance
        _background = new RiseVision.Common.Background(_additionalParams);
        _background.init(_backgroundReady);
      }
    }
  }

  function playerEnded() {
    var container = document.getElementById("videoContainer"),
      myFrameObj = _getFrameObject();

    if (myFrameObj) {
      myFrameObj.remove();
      myFrameObj.location.reload();

      setTimeout(function () {
        _ended = true;

        // remove the iframe by clearing all elements inside div container
        while (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        _done();
      }, 200);
    }

  }

  function playerReady() {
    if (!_initialized) {
      _initialized = true;
      _ready();
    } else {
      play();
    }
  }

  function playerError(error) {
    console.debug("video-folder::playerError()", error);

    if (error.type === "setup" || error.index === 0) {
      _setupError = true;
    }

    playerEnded();
  }

  function stop() {
    pause();
  }

  return {
    "onStorageInit": onStorageInit,
    "onStorageRefresh": onStorageRefresh,
    "pause": pause,
    "play": play,
    "setAdditionalParams": setAdditionalParams,
    "playerEnded": playerEnded,
    "playerReady": playerReady,
    "playerError": playerError,
    "stop": stop
  };

})(gadgets);
