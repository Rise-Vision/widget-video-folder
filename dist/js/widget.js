/* global config: true */
/* exported config */
if (typeof config === "undefined") {
  var config = {
    // variables go here
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

var files;
var volume, autoPlay, scaleToFit, pauseDuration;
var width, height;

var viewerPaused = false;
var pauseTimer = null;

var player = null;

function doneEvent() {
  parent.RiseVision.VideoFolder.playerEnded();
}

function readyEvent() {
  parent.RiseVision.VideoFolder.playerReady();
}

function errorEvent(data) {
  parent.RiseVision.VideoFolder.playerError(data);
}

function loadVideo(widthParam, heightParam, volumeParam, autoPlayParam, scaleToFitParam, pauseParam, filesParam) {
  width = widthParam;
  height = heightParam;
  volume = volumeParam;
  autoPlay = autoPlayParam;
  scaleToFit = scaleToFitParam;
  pauseDuration = pauseParam;
  files = filesParam.split(",");

  if (player) {
    player.loadVideo();
  }
}

function play() {
  player.play();
}

function pause() {
  player.pause();
}

function stop() {
  player.stop();
}

function remove() {
  player.remove();
}

function PlayerJW() {
  function getVideoFileType(url) {
    var extensions = [".mp4", ".webm", ".ogg", ".ogv"],
      urlLowercase = url.toLowerCase(),
      type = null,
      i;

    for (i = 0; i <= extensions.length; i += 1) {
      if (urlLowercase.indexOf(extensions[i]) !== -1) {
        type = extensions[i].substr(extensions[i].lastIndexOf(".") + 1);
        break;
      }
    }

    if (type === "ogv") {
      type = "ogg";
    }

    return type;
  }

  function getPlaylist() {
    var playlist = [];

    for (var i = 0; i < files.length; i += 1) {
      playlist.push({
        sources: [{
          file: files[i],
          type: getVideoFileType(files[i])
        }]
      });
    }

    return playlist;
  }

  function onPlaylistComplete() {
    doneEvent();
  }

  function onPlay() {
    clearTimeout(pauseTimer);
  }

  function onPause() {
    if (!viewerPaused) {
      // user has paused, set a timer to play again
      clearTimeout(pauseTimer);

      pauseTimer = setTimeout(function() {
        // continue playing the current video
        jwplayer().play();

        // workaround for controls remaining visible, turn them off and on again
        jwplayer().setControls(false);
        jwplayer().setControls(true);

      }, pauseDuration * 1000);
    }
  }

  function onPlayerError(error) {
    if (error) {
      errorEvent({
        type: "video",
        index: jwplayer().getPlaylistIndex()
      });
    }
  }

  function onSetupError(error) {
    if (error) {
      errorEvent({
        type: "setup",
        index: 0
      });
    }
  }

  this.loadVideo = function() {
    jwplayer("player").setup({
      playlist: getPlaylist(),
      width : width,
      height : height,
      controls: !autoPlay,
      stretching : scaleToFit ? "uniform" : "none"
    });

    jwplayer().onSetupError(function (error) {
      onSetupError(error);
    });

    jwplayer().onReady(function () {
      var elements = document.getElementById("player").getElementsByTagName("*"),
        total = elements.length,
        i;

      // Workaround for Chrome App Player <webview> not handling CSS3 transition
      for (i = 0; i < total; i += 1) {
        elements[i].className += " notransition";
      }

      document.getElementById("player").className += " notransition";

      jwplayer().setMute(false);
      jwplayer().setVolume(volume);

      jwplayer().onPlaylistComplete(function () {
        onPlaylistComplete();
      });

      jwplayer().onPause(function () {
        onPause();
      });

      jwplayer().onPlay(function () {
        onPlay();
      });

      jwplayer().onError(function (error) {
        onPlayerError(error);
      });

      setTimeout(function () {
        readyEvent();
      }, 200);

    });
  };

  this.play = function() {
    viewerPaused = false;
    if (autoPlay) {
      jwplayer().play();
    }
  };

  this.pause = function() {
    viewerPaused = true;
    clearTimeout(pauseTimer);
    jwplayer().pause();
  };

  this.stop = function() {
    this.pause();
  };

  this.remove = function() {
    viewerPaused = false;
    jwplayer().remove();
  };

}


var RiseVision = RiseVision || {};
RiseVision.VideoFolder = RiseVision.VideoFolder || {};

RiseVision.VideoFolder.Template = (function () {
  "use strict";

  var TEMPLATE = "" +
    "<html>" +
    "<head>" +
    "<meta http-equiv=\"content-type\" content=\"text/html; charset=UTF-8\">" +
    "<title></title>" +
    "<script type=\"text/javascript\" src=\"//s3.amazonaws.com/rise-common/scripts/jw-player/jwplayer.js\"></script>" +
    "<script>jwplayer.key=\"xBXyUtAJ+brFzwc2kNhDg/Sqk8W7rmktAYliYHzVgxo=\"</script>" +
    "<script type=\"text/javascript\" src=\"js/player.min.js\"></script>" +
    "<style>" +
    "	body { " +
    "		background-color: transparent; " +
    "		-moz-user-select: none; " +
    "		-webkit-user-select: none; " +
    "		-khtml-user-select: none; " +
    "		user-select: none; " +
    "	}" +
    " .notransition { " +
    "   -webkit-transition: none !important; " +
    "   transition: none !important; " +
    " }" +
    "</style>" +
    "</head>" +
    "<body style=\"margin:0px;\">" +
    "<div id=\"player\">Loading the player...</div>" +
    "<script language=\"javascript\">" +
    "	window.oncontextmenu = function() {" +
    "		return false;" +
    "	};" +
    "	try {" +
    "		player = new PlayerJW();" +
    "		loadVideo(\"%s1\", \"%s2\", %s3, %s4, %s5, %s6, \"%s7\");" +
    "	} catch (e) {" +
    "		console.log(e.message);" +
    "		parent.RiseVision.VideoFolder.playerError();" +
    "	}" +
    "</script>" +
    "</body>" +
    "</html>";

  /*
   *  Public Methods
   */
  function getHTML(params, files) {
    var htmlString = TEMPLATE;

    htmlString = htmlString.replace("%s1", params.width + "px");
    htmlString = htmlString.replace("%s2", params.height + "px");
    htmlString = htmlString.replace("%s3", params.video.volume);
    htmlString = htmlString.replace("%s4", params.video.autoplay);
    htmlString = htmlString.replace("%s5", params.video.scaleToFit);
    htmlString = htmlString.replace("%s6", params.pause);
    htmlString = htmlString.replace("%s7", files.join());

    return htmlString;
  }

  return {
    "getHTML": getHTML
  };

})();

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
