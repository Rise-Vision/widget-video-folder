/* global gadgets */

var RiseVision = RiseVision || {};
RiseVision.VideoFolder = {};

RiseVision.VideoFolder = (function (gadgets) {
  "use strict";

  var _additionalParams;

  var _prefs = null,
    _background = null,
    _storage = null,
    _frameController = null;

  var _initialized = false;

  var _currentFiles, _currentFrame;

  var _frameCount = 0;

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
    _storage = new RiseVision.VideoFolder.Storage(_additionalParams);
    _storage.init();
  }

  /*
   *  Public Methods
   */
  function onStorageInit(urls) {
    _currentFiles = urls;

    _frameController = new RiseVision.VideoFolder.FrameController();

    // add the first frame and create its player
    _frameController.add(0);
    _currentFrame = 0;
    _frameCount = 1;
    _frameController.createFramePlayer(0, _additionalParams, _currentFiles);
  }

  function onStorageRefresh(/*urls*/) {
    //TODO: handle a refresh
  }

  function pause() {
    var frameObj = _frameController.getFrameObject(_currentFrame);

    if (frameObj) {
      frameObj.pause();
    }
  }

  function play() {
    var frameObj = _frameController.getFrameObject(_currentFrame);

    if (frameObj) {
      frameObj.play();
    } else {
      // set current frame to be the one visible
      _currentFrame = (_currentFrame === 0) ? 1 : 0;

      // play the current frame video
      frameObj = _frameController.getFrameObject(_currentFrame);
      frameObj.play();

      // re-add previously removed frame and create the player, but hide visibility
      _frameController.add(((_currentFrame === 0) ? 1 : 0));
      _frameController.hide(((_currentFrame === 0) ? 1 : 0));
      _frameController.createFramePlayer(((_currentFrame === 0) ? 1 : 0), _additionalParams, _currentFiles);
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
    _frameController.show((_currentFrame === 0) ? 1 : 0);
    _frameController.remove(_currentFrame, function () {
      _done();
    });
  }

  function playerReady() {
    if (!_initialized) {
      if (_frameCount === 2) {
        // both frames have been created and loaded, can notify Viewer widget is ready
        _initialized = true;
        _ready();
      } else {
        // first frame player was successful and ready, create the second one but hide it
        _frameController.add(1);
        _frameController.hide(1);
        _frameCount = 2;
        _frameController.createFramePlayer(1, _additionalParams, _currentFiles);
      }
    }
  }

  function playerError(error) {
    console.debug("video-folder::playerError()", error);

    if (!_initialized) {
      // Widget has not sent "ready" yet and there is an error (setup or playback of first video, doesn't matter which)
      _frameController.remove(_currentFrame);

      // do nothing more, ensure "ready" is not sent to Viewer so that this widget can be skipped

    } else {
      // force widget to act as though the playlist is done
      playerEnded();
    }

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
