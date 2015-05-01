/* global config: true */
/* exported config */
if (typeof config === "undefined") {
  var config = {
    /*
     NOTE: Relative path to skin file does not work when viewing/testing locally using Preview app

     When needing to work on skin file "six.xml", upload file to server and change SKIN value to point to server location
     CORS will be required. Handy CORS Chrome extension can be found here
     https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi?hl=en
     */
    SKIN: ""
  };

  if (typeof angular !== "undefined") {
    angular.module("risevision.common.i18n.config", [])
      .constant("LOCALES_PREFIX", "components/rv-common-i18n/dist/locales/translation_")
      .constant("LOCALES_SUFIX", ".json");

    angular.module("risevision.widget.common.storage-selector.config")
      .value("STORAGE_MODAL", "https://storage-stage-rva-test.risevision.com/files/");
  }
}

/* global gadgets */

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

  function _refreshFrame(frameIndex) {
    _frameController.remove(frameIndex, function () {
      _frameController.add(frameIndex);
      _frameController.hide(frameIndex);
      _frameController.createFramePlayer(frameIndex, _additionalParams, _currentFiles);
    });
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

  function onStorageRefresh(urls) {
    var currentFrameObj = _frameController.getFrameObject(_currentFrame),
      hiddenFrameIndex = (_currentFrame === 0) ? 1 : 0,
      currentFrameData;

    _currentFiles = urls;

    // It is best to let refreshing the frame playlist happen in the normal cycle of frame swapping (playlist completion)
    // Below is the only criteria for safely forcing a refresh of hidden frame while Widget is in a "play" or "pause" state

    // Widget is in a state of "play" or "pause" and playlist has not completed. A hidden frame definitely exists
    if (currentFrameObj) {
      // Only if there are no video controls.
      // User interacting with controls, particularly seeking and skipping videos, would cause issues
      if (!_additionalParams.video.controls) {
        currentFrameData = currentFrameObj.getPlaybackData();

        if (currentFrameData.total === (currentFrameData.index + 1)) {
          // To be safe, only refresh the frame that's currently hidden if at least 15 seconds are left of final video
          if ((currentFrameData.duration - currentFrameData.position) >= 15) {
            _refreshFrame(hiddenFrameIndex);
          }
        } else {
          // Current frame is not playing last video in list, safe to refresh the frame that's currently hidden
          _refreshFrame(hiddenFrameIndex);
        }
      }
    }

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
    } else {
      // This flag only got set upon a refresh of hidden frame and there was an error in setup or first video
      // Send Viewer "done"
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
    if (_playbackError) {
      // This flag only gets set upon a refresh of hidden frame and there was an error in setup or first video
      _frameController.remove(_currentFrame);
      _frameController.remove((_currentFrame === 0) ? 1 : 0);

      _done();

    } else {
      _frameController.show((_currentFrame === 0) ? 1 : 0);
      _frameController.remove(_currentFrame, function () {
        _done();
      });
    }

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
      if (error.type === "setup" || error.index === 0) {
        // This only happens in the event of a refresh. New files caused an error in setup or first video has an issue
        // The error event will be coming from the currently hidden frame when it got recreated with new files to use
        _playbackError = true;
      } else {
        // force widget to act as though the playlist is done
        playerEnded();
      }
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

var RiseVision = RiseVision || {};
RiseVision.VideoFolder = RiseVision.VideoFolder || {};

RiseVision.VideoFolder.Storage = function (data) {
  "use strict";

  var _initialLoad = true;

  /*
   *  Public Methods
   */
  function init() {
    var storage = document.getElementById("videoFolderStorage");

    if (!storage) {
      return;
    }

    storage.addEventListener("rise-storage-response", function(e) {
      var urls = [];

      if (e.detail && e.detail.files && e.detail.files.length > 0) {
        e.detail.files.forEach(function(file) {
          urls.push(file.url);
        });

        if (_initialLoad) {
          _initialLoad = false;

          RiseVision.VideoFolder.onStorageInit(urls);

        } else {
          RiseVision.VideoFolder.onStorageRefresh(urls);
        }
      }

    });

    storage.setAttribute("companyId", data.storage.companyId);
    storage.setAttribute("folder", data.storage.folder);

    storage.go();
  }

  return {
    "init": init
  };
};

/* global config */

var RiseVision = RiseVision || {};
RiseVision.VideoFolder = RiseVision.VideoFolder || {};

RiseVision.VideoFolder.FrameController = function () {
  "use strict";

  var PREFIX = "if_";

  /*
   *  Private Methods
   */
  function _clear(index) {
    var frameContainer = document.getElementById(PREFIX + index),
      iframe, frameObj;

    try {
      iframe = frameContainer.querySelector("iframe");
      frameObj = (iframe.contentWindow) ? iframe.contentWindow :
        (iframe.contentDocument.document) ? iframe.contentDocument.document : iframe.contentDocument;
      frameObj.remove();
      iframe.setAttribute("src", "about:blank");
    }
    catch (e) {
      console.debug(e);
    }

  }

  /*
   *  Public Methods
   */

  function add(index) {
    var frameContainer, iframe;

    frameContainer = document.getElementById(PREFIX + index);

    iframe = document.createElement("iframe");
    iframe.setAttribute("allowTransparency", true);
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("scrolling", "no");

    frameContainer.appendChild(iframe);
  }

  function createFramePlayer(index, params, files) {
    var frameContainer = document.getElementById(PREFIX + index),
      iframe;

    iframe = frameContainer.querySelector("iframe");

    if (iframe) {
      iframe.onload = function () {
        iframe.onload = null;

        var frameObj = (iframe.contentWindow) ? iframe.contentWindow :
          (iframe.contentDocument.document) ? iframe.contentDocument.document : iframe.contentDocument;

        // initialize and load the player inside the iframe
        frameObj.init(params, files, config.SKIN);
      };

      iframe.setAttribute("src", "player.html");
    }

  }

  function getFrameObject(index) {
    var frameContainer = document.getElementById(PREFIX + index),
      iframe;

    iframe = frameContainer.querySelector("iframe");

    if (iframe) {
      return (iframe.contentWindow) ? iframe.contentWindow :
        (iframe.contentDocument.document) ? iframe.contentDocument.document : iframe.contentDocument;
    }

    return null;
  }

  function hide(index) {
    document.getElementById(PREFIX + index).style.visibility = "hidden";
  }

  function remove(index, callback) {
    var frameContainer = document.getElementById(PREFIX + index);

    _clear(index);

    setTimeout(function () {
      // remove the iframe by clearing all elements inside div container
      while (frameContainer.firstChild) {
        frameContainer.removeChild(frameContainer.firstChild);
      }

      if (callback && typeof callback === "function") {
        callback();
      }
    }, 200);
  }

  function show(index) {
    document.getElementById(PREFIX + index).style.visibility = "visible";
  }

  return {
    add: add,
    createFramePlayer: createFramePlayer,
    getFrameObject: getFrameObject,
    hide: hide,
    remove: remove,
    show: show
  };
};

/* global gadgets, RiseVision */

(function (window, gadgets) {
  "use strict";

  var prefs = new gadgets.Prefs(),
    id = prefs.getString("id");

  // Disable context menu (right click menu)
  window.oncontextmenu = function () {
    return false;
  };

  function play() {
    RiseVision.VideoFolder.play();
  }

  function pause() {
    RiseVision.VideoFolder.pause();
  }

  function stop() {
    RiseVision.VideoFolder.stop();
  }

  function polymerReady() {
    window.removeEventListener("polymer-ready", polymerReady);

    if (id && id !== "") {
      gadgets.rpc.register("rscmd_play_" + id, play);
      gadgets.rpc.register("rscmd_pause_" + id, pause);
      gadgets.rpc.register("rscmd_stop_" + id, stop);

      gadgets.rpc.register("rsparam_set_" + id, RiseVision.VideoFolder.setAdditionalParams);
      gadgets.rpc.call("", "rsparam_get", null, id, ["additionalParams"]);
    }
  }

  window.addEventListener("polymer-ready", polymerReady);

})(window, gadgets);



/* jshint ignore:start */
var _gaq = _gaq || [];

_gaq.push(['_setAccount', 'UA-57092159-4']);
_gaq.push(['_trackPageview']);

(function() {
  var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
  ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
  var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();
/* jshint ignore:end */
