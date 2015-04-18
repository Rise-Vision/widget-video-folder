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
