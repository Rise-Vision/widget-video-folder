var files;
var volume, autoPlay, scaleToFit, pauseDuration;
var width, height;

var isLoading = true,
  pauseHandlerOn = false;

var viewerPaused = false;
var pauseTimer = null;

var player = null;

function init(params, list) {
  window.oncontextmenu = function() {
    return false;
  };

  width = params.width;
  height = params.height;
  volume = params.video.volume;
  autoPlay = params.video.autoplay;
  scaleToFit = params.video.scaleToFit;
  pauseDuration = params.pause;
  files = list;

  player = new PlayerJW();
  player.loadVideo();
}

function doneEvent() {
  parent.RiseVision.VideoFolder.playerEnded();
}

function readyEvent() {
  parent.RiseVision.VideoFolder.playerReady();
}

function errorEvent(data) {
  parent.RiseVision.VideoFolder.playerError(data);
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
    if (isLoading) {
      isLoading = false;

      jwplayer().pause();
      jwplayer().setMute(false);
      jwplayer().setVolume(volume);

      readyEvent();

    } else {
      if (!pauseHandlerOn) {
        pauseHandlerOn = true;

        // now define pause handler
        jwplayer().onPause(function () {
          onPause();
        });
      }

      clearTimeout(pauseTimer);
    }

  }

  function onPause() {
    if (!viewerPaused && !isLoading) {
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

  this.loadVideo = function() {
    jwplayer("player").setup({
      playlist: getPlaylist(),
      width : width,
      height : height,
      controls: !autoPlay,
      stretching : scaleToFit ? "uniform" : "none",
      skin: "six"
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

      jwplayer().onPlaylistComplete(function () {
        onPlaylistComplete();
      });

      jwplayer().onPlay(function () {
        onPlay();
      });

      jwplayer().onError(function (error) {
        onPlayerError(error);
      });

      setTimeout(function () {
        // need to test if there is an error playing first video
        jwplayer().play();
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
    clearTimeout(pauseTimer);
    pauseTimer = null;
    jwplayer().remove();
  };

}

