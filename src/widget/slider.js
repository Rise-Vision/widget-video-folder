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
