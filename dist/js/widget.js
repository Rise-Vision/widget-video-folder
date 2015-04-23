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
      .value("STORAGE_MODAL", "http://storage-stage-rva-test.risevision.com/modal.html");
  }
}

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

var RiseVision = RiseVision || {};
RiseVision.Common = RiseVision.Common || {};

RiseVision.Common.Background = function (data) {
  "use strict";

  var _callback = null,
    _ready = false,
    _background = null,
    _storage = null,
    _refreshDuration = 900000, // 15 minutes
    _isStorageFile = false,
    _separator = "";

  /*
   * Private Methods
   */
  function _refreshTimer() {
    setTimeout(function backgroundRefresh() {
      _background.style.backgroundImage = "url(" + data.background.image.url + _separator + "cb=" + new Date().getTime() + ")";
      _refreshTimer();
    }, _refreshDuration);
  }

  function _backgroundReady() {
    _ready = true;

    if (data.background.useImage && !_isStorageFile) {
      // start the refresh poll for non-storage background image
      _refreshTimer();
    }

    if (_callback && typeof _callback === "function") {
      _callback();
    }
  }

  function _configure() {
    var str;

    _background = document.getElementById("background");
    _storage = document.getElementById("backgroundStorage");

    // set the document background
    document.body.style.background = data.background.color;

    if (_background) {
      if (data.background.useImage) {
        _background.className = data.background.image.position;
        _background.className = data.background.image.scale ? _background.className + " scale-to-fit"
          : _background.className;

        _isStorageFile = (Object.keys(data.backgroundStorage).length !== 0);

        if (!_isStorageFile) {
          str = data.background.image.url.split("?");

          // store this for the refresh timer
          _separator = (str.length === 1) ? "?" : "&";

          _background.style.backgroundImage = "url(" + data.background.image.url + ")";
          _backgroundReady();
        } else {
          if (_storage) {
            // Rise Storage
            _storage.addEventListener("rise-storage-response", function (e) {
              if (e.detail && e.detail.files && e.detail.files.length > 0) {
                _background.style.backgroundImage = "url(" + e.detail.files[0].url + ")";
              }

              if (!_ready) {
                _backgroundReady();
              }
            });

            _storage.setAttribute("folder", data.backgroundStorage.folder);
            _storage.setAttribute("fileName", data.backgroundStorage.fileName);
            _storage.setAttribute("companyId", data.backgroundStorage.companyId);
            _storage.go();
          } else {
            console.log("Missing element with id value of 'backgroundStorage'");
          }
        }
      } else {
        _backgroundReady();
      }
    } else {
      console.log("Missing element with id value of 'background'");
    }
  }

  /*
   *  Public Methods
   */
  function init(cb) {
    if (!_ready) {
      if (cb) {
        _callback = cb;
      }

      _configure();

    } else if (cb && typeof cb === "function") {
      cb();
    }
  }

  return {
    "init": init
  };
};

var RiseVision = RiseVision || {};
RiseVision.VideoFolder = RiseVision.VideoFolder || {};

RiseVision.VideoFolder.Storage = function (data) {
  "use strict";

  var _initialLoad = true;

  /*
   *  Public Methods
   */
  function init() {
    var storage = document.getElementById("videoFolderStorage"),
      sort = "",
      sortDirection = "";

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

    // Sorting
    switch (data.order) {
      case "alpha-asc":
        sort = "name";
        sortDirection = "asc";
        break;
      case "alpha-desc":
        sort = "name";
        sortDirection = "desc";
        break;
      case "date-asc":
        sort = "date";
        sortDirection = "asc";
        break;
      case "date-desc":
        sort = "date";
        sortDirection = "desc";
        break;
      case "random":
        sort = "random";
        break;
      default:
        sort = "name";
        sortDirection = "asc";
    }

    storage.setAttribute("sort", sort);
    storage.setAttribute("sortDirection", sortDirection);
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
