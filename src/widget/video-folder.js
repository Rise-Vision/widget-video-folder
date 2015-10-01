/* global gadgets, config */

var RiseVision = RiseVision || {};
RiseVision.VideoFolder = {};

RiseVision.VideoFolder = (function (gadgets) {
  "use strict";

  var _additionalParams;

  var _prefs = null,
    _message = null,
    _storage = null,
    _frameController = null;

  var _playbackError = false,
    _viewerPaused = true;

  var _noFilesTimer = null,
    _noFilesFlag = false;

  var _currentFiles = [],
    _currentFrame = 0;

  /*
   *  Private Methods
   */
  function _clearNoFilesTimer() {
    clearTimeout(_noFilesTimer);
    _noFilesTimer = null;
  }

  function _done() {
    gadgets.rpc.call("", "rsevent_done", null, _prefs.getString("id"));
  }

  function _ready() {
    gadgets.rpc.call("", "rsevent_ready", null, _prefs.getString("id"),
      true, true, true, true, true);
  }

  function _startNoFilesTimer() {
    _clearNoFilesTimer();

    _noFilesTimer = setTimeout(function () {
      // notify Viewer widget is done
      _done();
    }, 5000);
  }

  /*
   *  Public Methods
   */
  function noFiles(type) {
    _noFilesFlag = true;
    _currentFiles = [];

    if (type === "empty") {
      _message.show("The selected folder does not contain any videos.");
    } else if (type === "noexist") {
      _message.show("The selected folder does not exist.");
    }

    _frameController.remove(_currentFrame, function () {
      // if Widget is playing right now, run the timer
      if (!_viewerPaused) {
        _startNoFilesTimer();
      }
    });

  }

  function onStorageInit(urls) {
    _currentFiles = urls;

    _message.hide();

    if (!_viewerPaused) {
      play();
    }
  }

  function onStorageRefresh(urls) {
    _currentFiles = urls;

    // in case refreshed files fix an error with previous setup or initial file problem,
    // ensure flag is removed so playback is attempted again
    _playbackError = false;
  }

  function pause() {
    var frameObj = _frameController.getFrameObject(_currentFrame);

    _viewerPaused = true;

    if (_noFilesFlag) {
      _clearNoFilesTimer();
      return;
    }

    if (frameObj) {
      frameObj.pause();
    }
  }

  function play() {
    var frameObj = _frameController.getFrameObject(_currentFrame);

    _viewerPaused = false;

    if (_noFilesFlag) {
      _startNoFilesTimer();
      return;
    }

    if (!_playbackError) {
      if (frameObj) {
        frameObj.play();
      } else {

        // check the list isn't empty
        if (_currentFiles && _currentFiles.length > 0) {

          // add frame and create the player
          _frameController.add(0);
          _frameController.createFramePlayer(0, _additionalParams, _currentFiles, config.SKIN, "player.html");

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

        _message = new RiseVision.Common.Message(document.getElementById("videoContainer"),
          document.getElementById("messageContainer"));

        // show wait message while Storage initializes
        _message.show("Please wait while your video is downloaded.");

        // create the FrameController module instance
        _frameController = new RiseVision.Common.Video.FrameController();

        // create and initialize the Storage module instance
        _storage = new RiseVision.VideoFolder.Storage(_additionalParams);
        _storage.init();

        _ready();
      }
    }
  }

  function playerEnded() {
    _frameController.remove(_currentFrame, function () {
      _done();
    });
  }

  function playerReady() {
    if (!_viewerPaused) {
      var frameObj = _frameController.getFrameObject(_currentFrame);
      frameObj.play();
    }
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
    "noFiles": noFiles,
    "playerEnded": playerEnded,
    "playerReady": playerReady,
    "playerError": playerError,
    "stop": stop
  };

})(gadgets);
