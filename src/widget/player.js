var files;
var controls, volume, autoPlay, stretching, pauseDuration;
var width, height, skin;

var player = null;

function init(params, list, skinVal) {
  window.oncontextmenu = function() {
    return false;
  };

  width = params.width;
  height = params.height;
  skin = skinVal;
  controls = params.video.controls;
  volume = params.video.volume;
  stretching = (params.video.scaleToFit) ? "uniform" : "none";

  // ensure autoPlay is true if controls value is false, otherwise use params value
  autoPlay = (!controls) ? true : params.video.autoplay;
  // convert pause value to number if type is "string"
  params.video.pause = (typeof params.video.pause === "string") ? parseInt(params.video.pause, 10) : params.video.pause;

  // if not of type "number", set its value to 0 so a pause does not get applied
  pauseDuration = (isNaN(params.video.pause)) ? 0 : params.video.pause;

  files = list;

  player = new PlayerJW();
}

function load() {
  player.loadVideo();
}

function doneEvent() {
  if (window.parent !== window.top) {
    parent.RiseVision.VideoFolder.playerEnded();
  }
}

function readyEvent() {
  if (window.parent !== window.top) {
    parent.RiseVision.VideoFolder.playerReady();
  }
}

function errorEvent(data) {
  if (window.parent !== window.top) {
    parent.RiseVision.VideoFolder.playerError(data);
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

function getPlaybackData() {
  return {
    total: files.length,
    index: player.getCurrentIndex(),
    duration: player.getDuration(),
    position: player.getPosition()
  }
}

function PlayerJW() {
  var viewerPaused = false;

  var pauseTimer = null;

  function onPlaylistComplete() {
    doneEvent();
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
        index: jwplayer().getPlaylistIndex(),
        message: error.message
      });
    }
  }

  function onSetupError(error) {
    if (error) {
      errorEvent({
        type: "setup",
        index: 0,
        message: error.message
      });
    }
  }

  this.getVideoFileType = function (url) {
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
  };

  this.getPlaylist = function (list) {
    var playlist = [];

    for (var i = 0; i < list.length; i += 1) {
      playlist.push({
        sources: [{
          file: list[i],
          type: this.getVideoFileType(list[i])
        }]
      });
    }

    return playlist;
  };

  this.loadVideo = function() {
    jwplayer("player").setup({
      playlist: this.getPlaylist(files),
      width : width,
      height : height,
      controls: false,
      stretching : stretching,
      skin: skin
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

      // Bugfix - issue #18 (JWPlayer context menu)
      document.getElementById("player_menu").className += " disable-context-menu";

      jwplayer().onPlaylistComplete(function () {
        onPlaylistComplete();
      });

      jwplayer().onError(function (error) {
        onPlayerError(error);
      });

      if (controls && pauseDuration > 1) {
        jwplayer().onPause(function () {
          onPause();
        });
      }

      jwplayer().setVolume(volume);

      if (controls && !autoPlay) {
        jwplayer().setControls(true);
      }

      readyEvent();

    });
  };

  this.play = function() {
    viewerPaused = false;

    if (autoPlay) {
      if (controls && !jwplayer().getControls()) {
        // Will be first time player is being told to play so doing this here and not in setup so that controls
        // aren't visible upon playing for the first time.
        jwplayer().setControls(true);
      }

      jwplayer().play();

      if (controls) {
        // workaround for controls remaining visible, turn them off and on again
        jwplayer().setControls(false);
        jwplayer().setControls(true);
      }
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
    clearTimeout(pauseTimer);
    pauseTimer = null;
    jwplayer().remove();
  };

  this.getCurrentIndex = function() {
    return jwplayer().getPlaylistIndex();
  };

  this.getDuration = function () {
    return jwplayer().getDuration();
  };

  this.getPosition = function () {
    return jwplayer().getPosition();
  }

}

