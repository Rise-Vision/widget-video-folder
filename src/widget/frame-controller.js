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
        frameObj.load();
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
