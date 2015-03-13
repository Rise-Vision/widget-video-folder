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
      .value("STORAGE_MODAL", "http://storage.risevision.com/~rvi/storage-client-rva-test/storage-modal.html#/files/");
  }
}

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

  }

  function play() {

  }

  function setAdditionalParams(params) {
    _prefs = new gadgets.Prefs();
    _additionalParams = params;
    _additionalParams.width = _prefs.getInt("rsW");
    _additionalParams.height = _prefs.getInt("rsH");

    document.getElementById("container").style.height = _prefs.getInt("rsH") + "px";

    // create and initialize the Background instance
    _background = new RiseVision.Common.Background(_additionalParams);
    _background.init(_backgroundReady);
  }

  function sliderReady() {
    _ready();
  }

  function stop() {

  }

  return {
    "pause": pause,
    "play": play,
    "setAdditionalParams": setAdditionalParams,
    "sliderReady": sliderReady,
    "stop": stop
  };

})(document, gadgets);

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

  function _storageResponse(e) {
    _storage.removeEventListener("rise-storage-response", _storageResponse);

    if (Array.isArray(e.detail)) {
      _background.style.backgroundImage = "url(" + e.detail[0] + ")";
    } else {
      _background.style.backgroundImage = "url(" + e.detail + ")";
    }
    _backgroundReady();
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
            _storage.addEventListener("rise-storage-response", _storageResponse);

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

RiseVision.VideoFolder.Slider = function (params) {
  "use strict";

  var _storage = document.getElementById("videoFolderStorage"),
    _currentUrls = null,
    _initialBuild = true,
    _$revolution = null;

  /*
   *  Private Methods
   */
  function _getDataVideoAttr(url) {
    var attr = null,
      str = url.substr(url.lastIndexOf(".") + 1),
      arr = str.split("?");

    if (typeof arr[0] !== "undefined" && arr[0] !== "") {
      switch(arr[0]) {
        case "mp4":
          attr = "data-videomp4";
          break;
        case "webm":
          attr = "data-videowebm";
          break;
        case "ogg":
        case "ogv":
          attr = "data-videoogv";
          break;
        default:
          attr = null;
      }
    }

    return attr;
  }

  function _getStorageSort(order) {
    var value = {};

    value.sort = "";
    value.direction = "";

    switch (order) {
      case "alpha-asc":
        value.sort = "name";
        value.direction = "asc";
        break;
      case "alpha-desc":
        value.sort = "name";
        value.direction = "desc";
        break;
      case "date-asc":
        value.sort = "date";
        value.direction = "asc";
        break;
      case "date-desc":
        value.sort = "date";
        value.direction = "desc";
        break;
      case "random":
        value.sort = "random";
        break;
      default:
        value.sort = "name";
        value.direction = "asc";
    }

    return value;
  }

  function _addSlides() {
    var list = document.querySelector(".tp-banner ul"),
      fragment = document.createDocumentFragment(),
      slides = [],
      slide = null;

    _currentUrls.forEach(function(url) {
      var image = document.createElement("img"),
        video = document.createElement("div"),
        videoAttr = _getDataVideoAttr(url);

      slide = document.createElement("li");

      // Slide Transition
      slide.setAttribute("data-transition", "slidehorizontal");
      slide.setAttribute("data-masterspeed", 1000);
      slide.setAttribute("data-slotamount", 1);

      // Transition image, using 1 pixel transparent to prevent error
      image.src = "https://s3.amazonaws.com/Rise-Images/UI/FFFFFF-0.0.png";
      image.setAttribute("data-bgfit", "cover");
      image.setAttribute("data-bgrepeat", "no-repeat");
      image.setAttribute("data-bgposition", "center center");

      // Video
      video.setAttribute("class", "tp-caption tp-fade fadeout fullscreenvideo tp-videolayer");
      video.setAttribute("data-x", 0);
      video.setAttribute("data-y", 0);
      video.setAttribute("data-speed", 1000);
      video.setAttribute("data-start", 1100);
      video.setAttribute("data-easing", "Power4.easeOut");
      video.setAttribute("data-elementdelay", 0.01);
      video.setAttribute("data-endelementdelay", 0.1);
      video.setAttribute("data-endspeed", 1500);
      video.setAttribute("data-endeasing", "Power4.easeIn");
      video.setAttribute("data-autoplay", "false");
      video.setAttribute("data-autoplayonlyfirsttime", "false");
      video.setAttribute("data-nextslideatend", "true");
      video.setAttribute("data-videowidth", "100%");
      video.setAttribute("data-videoheight", "100%");
      video.setAttribute("data-ytid", "");
      video.setAttribute("data-vimeoid", "");
      video.setAttribute("data-videoattributes", "");
      video.setAttribute("data-videopreload", "meta");
      video.setAttribute("data-videoloop", "none");
      video.setAttribute("data-forcecover", 1);
      video.setAttribute("data-forcerewind", "on");
      video.setAttribute("data-aspectratio", "16:9");

      // Configure the correct data-video based on file type

      if (videoAttr === "data-videoogv") {
        // When ogv, Revolution seems to also require data-videowebm even though its an empty value
        video.setAttribute(_getDataVideoAttr(url), url);
        video.setAttribute("data-videowebm", "");
      } else if (videoAttr === "data-videowebm") {
        video.setAttribute(_getDataVideoAttr(url), url);
        // Bug with Revolution slider, seems to require data-videoogv with the url value to work
        video.setAttribute("data-videoogv", url);
      } else {
        video.setAttribute(_getDataVideoAttr(url), url);
      }

      /*
      To be consistent with Video Widget, basing use of controls on user selection of "Autoplay".
      However, Revolution plugin inherently provides additional play/pause ability via touch or click of the video.
       */
      if (params.video.autoplay) {
        video.setAttribute("data-videocontrols", "controls");
      } else {
        video.setAttribute("data-videocontrols", "none");
      }

      // TODO: Revolution only offers ability to set volume to mute, can't set specific volume
      //video.setAttribute("data-volume", "mute");

      // Scale to Fit
      // TODO: Figure out if this should be removed as a setting or not

      slide.appendChild(image);
      slide.appendChild(video);
      slides.push(slide);
    });

    slides.forEach(function(slide) {
      fragment.appendChild(slide);
    });

    list.appendChild(fragment);
  }

  function _configurePlugin(urls) {
    var tpBanner = document.querySelector(".tp-banner"),
      ul = document.createElement("ul");

    tpBanner.appendChild(ul);

    _currentUrls = urls;
    _addSlides();

    _$revolution = $(".tp-banner").revolution({
      delay:9000,
      startwidth:params.width,
      startheight:params.height,
      navigationType:"none",
      touchenabled:"on",
      onHoverStop:"on",

      swipe_velocity: 0.7,
      swipe_min_touches: 1,
      swipe_max_touches: 1,

      keyboardNavigation:"off",

      shadow:0,
      fullWidth:"off",
      fullScreen:"off",

      stopLoop:"off",
      stopAfterLoops:-1,
      stopAtSlide:-1,

      shuffle:"off",

      forceFullWidth:"off",
      fullScreenAlignForce:"off",

      hideTimerBar: "on",

      hideSliderAtLimit:0,
      hideCaptionAtLimit:0,
      hideAllCaptionAtLilmit:0
    });

    RiseVision.VideoFolder.sliderReady();
  }

  function _configureStorage() {
    var storageSort = _getStorageSort(params.order);

    _storage.addEventListener("rise-storage-response", function(e) {
      if (_initialBuild) {
        _configurePlugin(e.detail);
      } /*else {
        // TODO: handle a refresh
      }*/
    });

    _storage.setAttribute("companyId", params.storage.companyId);
    _storage.setAttribute("folder", params.storage.folder);
    _storage.setAttribute("sort", storageSort.sort);
    _storage.setAttribute("sortDirection", storageSort.direction);
    _storage.go();
  }

  /*
   *  Public Methods
   */
  function init() {
    if (_initialBuild) {
      _configureStorage();
    }
  }

  return {
    "init": init
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

  }

  function pause() {

  }

  function stop() {

  }

  function additionalParams(names, values) {
    if (Array.isArray(names) && names.length > 0 && names[0] === "additionalParams") {
      if (Array.isArray(values) && values.length > 0) {
        RiseVision.VideoFolder.setAdditionalParams(JSON.parse(values[0]));
      }
    }
  }

  if (id && id !== "") {
    gadgets.rpc.register("rscmd_play_" + id, play);
    gadgets.rpc.register("rscmd_pause_" + id, pause);
    gadgets.rpc.register("rscmd_stop_" + id, stop);

    gadgets.rpc.register("rsparam_set_" + id, additionalParams);
    gadgets.rpc.call("", "rsparam_get", null, id, ["additionalParams"]);
  }

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
