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
    _companyId = null,
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

  function setCompanyId(value) {
    _companyId = value;
  }

  function setAdditionalParams(params) {
    _prefs = new gadgets.Prefs();
    _additionalParams = params;

    // create and initialize the Background instance
    _background = new RiseVision.Common.Background(_additionalParams, _companyId);
    _background.init(_backgroundReady);
  }

  function stop() {

  }

  return {
    "pause": pause,
    "play": play,
    "setCompanyId": setCompanyId,
    "setAdditionalParams": setAdditionalParams,
    "stop": stop
  };

})(document, gadgets);

var RiseVision = RiseVision || {};
RiseVision.Common = RiseVision.Common || {};

RiseVision.Common.Background = function (data, companyId) {
  "use strict";

  var _callback = null,
    _ready = false,
    _background = null,
    _storage = null;

  /*
   * Private Methods
   */
  function _backgroundReady() {
    _ready = true;

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
    _background = document.getElementById("background");
    _storage = document.getElementById("backgroundStorage");

    // set the document background
    document.body.style.background = data.background.color;

    if (_background) {
      if (data.background.useImage) {
        _background.className = data.background.image.position;
        _background.className = data.background.image.scale ? _background.className + " scale-to-fit"
          : _background.className;

        if (Object.keys(data.backgroundStorage).length === 0) {
          _background.style.backgroundImage = "url(" + data.background.image.url + ")";
          _backgroundReady();
        } else {
          if (_storage) {
            // Rise Storage
            _storage.addEventListener("rise-storage-response", _storageResponse);

            _storage.setAttribute("folder", data.backgroundStorage.folder);
            _storage.setAttribute("fileName", data.backgroundStorage.fileName);
            _storage.setAttribute("companyId", companyId);
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

  function companyId(name, value) {
    if (name && name === "companyId") {
      RiseVision.VideoFolder.setCompanyId(value);
    }

    gadgets.rpc.register("rsparam_set_" + id, additionalParams);
    gadgets.rpc.call("", "rsparam_get", null, id, ["additionalParams"]);
  }

  if (id && id !== "") {
    gadgets.rpc.register("rscmd_play_" + id, play);
    gadgets.rpc.register("rscmd_pause_" + id, pause);
    gadgets.rpc.register("rscmd_stop_" + id, stop);
    gadgets.rpc.register("rsparam_set_" + id, companyId);

    gadgets.rpc.call("", "rsparam_get", null, id, "companyId");

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
