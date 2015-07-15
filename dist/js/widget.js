/* global config: true */
/* exported config */
if (typeof config === "undefined") {
  var config = {
    SKIN: "skin/RVSkin.xml"
  };

  if (typeof angular !== "undefined") {
    angular.module("risevision.common.i18n.config", [])
      .constant("LOCALES_PREFIX", "locales/translation_")
      .constant("LOCALES_SUFIX", ".json");
  }
}

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

  function _init() {
    _frameController = new RiseVision.Common.Video.FrameController();

    // add the first frame and create its player
    _frameController.add(0);
    _currentFrame = 0;
    _frameController.createFramePlayer(0, _additionalParams, _currentFiles, config.SKIN, "player.html");
  }

  /*
   *  Public Methods
   */
  function onStorageInit(urls) {
    _currentFiles = urls;

    _init();
  }

  function onStorageRefresh(urls) {
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

        // re-add previously removed frame and create the player, but hide visibility
        _frameController.add(0);
        _frameController.createFramePlayer(0, _additionalParams, _currentFiles, config.SKIN, "player.html");

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
    _frameController.remove(_currentFrame, function () {
      _done();
    });
  }

  function playerReady() {
    var frameObj;

    if (!_initialized) {
      _initialized = true;
      _ready();
    } else {
      frameObj = _frameController.getFrameObject(_currentFrame);
      frameObj.play();
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
        _playbackError = true;
      }

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

var RiseVision = RiseVision || {};
RiseVision.Common = RiseVision.Common || {};

RiseVision.Common.Video = RiseVision.Common.Video || {};

RiseVision.Common.Video.FrameController = function () {
  "use strict";

  var PREFIX = "if_";

  function getFrameContainer(index) {
    return document.getElementById(PREFIX + index);
  }

  function getFrameObject(index) {
    var frameContainer = getFrameContainer(index),
      iframe;

    iframe = frameContainer.querySelector("iframe");

    if (iframe) {
      return (iframe.contentWindow) ? iframe.contentWindow :
        (iframe.contentDocument.document) ? iframe.contentDocument.document : iframe.contentDocument;
    }

    return null;
  }

  function _clear(index) {
    var frameContainer = getFrameContainer(index),
      frameObj = getFrameObject(index),
      iframe;

    if (frameObj) {
      iframe = frameContainer.querySelector("iframe");
      frameObj.remove();
      iframe.setAttribute("src", "about:blank");
    }
  }

  function add(index) {
    var frameContainer = getFrameContainer(index),
      iframe = document.createElement("iframe");

    iframe.setAttribute("allowTransparency", true);
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("scrolling", "no");

    frameContainer.appendChild(iframe);
  }

  function createFramePlayer(index, params, files, skin, src) {
    var frameContainer = getFrameContainer(index),
      frameObj = getFrameObject(index),
      iframe;

    if (frameObj) {
      iframe = frameContainer.querySelector("iframe");

      iframe.onload = function () {
        iframe.onload = null;

        // initialize and load the player inside the iframe
        frameObj.init(params, files, skin);
        frameObj.load();
      };

      iframe.setAttribute("src", src);
    }

  }

  function hide(index) {
    var frameContainer = getFrameContainer(index);

    frameContainer.style.visibility = "hidden";
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
    var frameContainer = getFrameContainer(index);

    frameContainer.style.visibility = "visible";
  }

  return {
    add: add,
    createFramePlayer: createFramePlayer,
    getFrameContainer: getFrameContainer,
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
