var RiseVision = RiseVision || {};
RiseVision.VideoFolder = RiseVision.VideoFolder || {};

RiseVision.VideoFolder.Slider = function (data) {
  "use strict";

  var _storage = document.getElementById("videoFolderStorage"),
    _currentUrls = null,
    _initialBuild = true,
    _$api = null;

  /*
   *  Private Methods
   */
  function _getVideoFileType(url) {
    var type = null,
      str = url.substr(url.lastIndexOf(".") + 1),
      arr = str.split("?");

    if (typeof arr[0] !== "undefined" && arr[0] !== "") {
      type = arr[0];

      if (type === "ogv") {
        type = "ogg";
      }
    }

    return type;
  }

  function _addVideos() {
    var list = document.querySelector("#container ul"),
      fragment = document.createDocumentFragment(),
      items = [],
      item = null;

    _currentUrls.forEach(function(url, index) {
      var videoContainer = document.createElement("div"),
        video = document.createElement("video"),
        source = document.createElement("source");

      item = document.createElement("li");
      item.setAttribute("class", "panel" + (index + 1));

      videoContainer.setAttribute("class", "video-container");

      // To be consistent with Video Widget, basing use of controls on user selection of "Autoplay"
      if (data.video.autoplay) {
        video.setAttribute("controls", "");
      }

      // set initial volume on <video>
      video.volume = data.video.volume / 100;

      // set the "type" attribute on <source>
      source.setAttribute("type", "video/" + _getVideoFileType(url));
      source.setAttribute("src", url);

      video.appendChild(source);
      videoContainer.appendChild(video);
      item.appendChild(videoContainer);

      items.push(item);
    });

    items.forEach(function(item) {
      fragment.appendChild(item);
    });

    list.appendChild(fragment);
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

  function _configurePlugin(urls) {
    var container = document.getElementById("container"),
      fragment = document.createDocumentFragment(),
      ul = document.createElement("ul");

    ul.setAttribute("id", "slider");
    fragment.appendChild(ul);
    container.appendChild(fragment);

    _currentUrls = urls;
    _addVideos();

    $("#slider")
      .anythingSlider({
        expand       : true,
        autoPlay     : false,
        buildArrows  : true,
        buildStartStop : false,
        buildNavigation : false,
        appendForwardTo     : null,
        appendBackTo        : null
      });

    _$api = $("#slider").data("AnythingSlider");
  }

  function _configureStorage() {
    var storageSort = _getStorageSort(data.order);

    _storage.addEventListener("rise-storage-response", function(e) {
      if (_initialBuild) {
        _configurePlugin(e.detail);
      } /*else {
        // TODO: handle a refresh
      }*/
    });

    _storage.setAttribute("companyId", data.storage.companyId);
    _storage.setAttribute("folder", data.storage.folder);
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

  function pause() {

  }

  function play() {

  }

  return {
    "init": init,
    "pause": pause,
    "play": play
  };
};
