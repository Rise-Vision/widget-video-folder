/* global gadgets, config */

var RiseVision = RiseVision || {};
RiseVision.VideoFolder = {};

RiseVision.VideoFolder = (function (gadgets) {
  "use strict";

  var _additionalParams;

  var _prefs = null,
    _storage = null,
    _frameController = null;

  var _initialized = false,
    _playbackError = false;

  var _currentFiles, _currentFrame;

  /*
   *  Private Methods
   */
  function _done() {
    gadgets.rpc.call("", "rsevent_done", null, _prefs.getString("id"));
  }

  function _ready() {
    console.log("video-folder.js::_ready()", _additionalParams.storage.folder);

    gadgets.rpc.call("", "rsevent_ready", null, _prefs.getString("id"),
      true, true, true, true, true);
  }

  /*
   *  Public Methods
   */
  function onStorageInit(urls) {
    console.log("video-folder.js::onStorageInit", urls);
    _currentFiles = urls;

    // create the FrameController module instance
    _frameController = new RiseVision.Common.Video.FrameController();

    _currentFrame = 0;
    _initialized = true;

    _ready();
  }

  function onStorageRefresh(urls) {
    console.log("video-folder.js::onStorageRefresh", urls);
    _currentFiles = urls;

    // in case refreshed files fix an error with previous setup or initial file problem,
    // ensure flag is removed so playback is attempted again
    _playbackError = false;
  }

  function pause() {
    var frameObj = _frameController.getFrameObject(_currentFrame);

    if (frameObj) {
      frameObj.pause();
    }
  }

  function play() {
    var frameObj = _frameController.getFrameObject(_currentFrame);

    if (!_playbackError) {
      if (frameObj) {
        frameObj.play();
      } else {

        // check the list isn't empty
        if (_currentFiles && _currentFiles.length > 0) {

          // add frame and create the player
          _frameController.add(0);
          _frameController.createFramePlayer(0, _additionalParams, _currentFiles, config.SKIN, "player.html");

        } else {
          _done();
        }

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

        // create and initialize the Storage module instance
        _storage = new RiseVision.VideoFolder.Storage(_additionalParams);
        _storage.init();
      }
    }
  }

  function playerEnded() {
    _frameController.remove(_currentFrame, function () {
      _done();
    });
  }

  function playerReady() {
    var frameObj = _frameController.getFrameObject(_currentFrame);
    frameObj.play();
  }

  function playerError(error) {
    console.debug("video-folder::playerError()", error);

    if (error.type === "setup" || error.index === 0) {
      // Files caused an error in setup or first video has an issue, flag this
      _playbackError = true;
    }

    // force widget to act as though the playlist is done
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
