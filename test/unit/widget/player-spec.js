"use strict";

describe("Unit Testing - Player init() method", function() {

  var params, list, skin;

  beforeEach(function () {
    params = {width: 1024, height: 768, video: {scaleToFit: true, volume: 50, controls: true, autoplay: true, pause: 10}};

    list = [
      "https://www.googleapis.com/storage/v1/b/risemedialibrary-abc123/o/Widgets%2Fvideos%2Ftest1.webm",
      "https://www.googleapis.com/storage/v1/b/risemedialibrary-abc123/o/Widgets%2Fvideos%2Ftest2.mp4"
    ];

    skin = "";
  });

  it("should create an instance of PlayerJW and assign it to player variable", function () {
    expect(player).to.be.null;

    init(params, list, skin);

    expect(player).to.exist;
    expect(player).to.be.an("object");
  });

  it("should correctly apply autoPlay value with consideration to params.video.controls", function () {
    init(params, list, skin);
    expect(autoPlay).to.be.true;

    params.video.controls = false;
    params.video.autoplay = false;
    init(params, list, skin);
    expect(autoPlay).to.be.true;
  });

  it("should correctly apply pauseDuration value based on params.video.pause", function () {
    init(params, list, skin);
    expect(pauseDuration).to.equal(10);

    params.video.pause = "te5t";
    init(params, list, skin);
    expect(pauseDuration).to.equal(0);

    params.video.pause = "30";
    init(params, list, skin);
    expect(pauseDuration).to.equal(30);
  });

  it("should correctly apply stretching value based on params.video.scaleToFit", function () {
    init(params, list, skin);
    expect(stretching).to.equal("uniform");

    params.video.scaleToFit = false;
    init(params, list, skin);
    expect(stretching).to.equal("none");
  });


});

describe("Unit Testing - PlayerJW object", function() {

  var player;

  beforeEach(function() {
    player = new PlayerJW();
  });

  it("should return correct HTML5 video file type calling getVideoFileType()", function () {
    var baseUrl = "https://www.googleapis.com/storage/v1/b/risemedialibrary-abc123/o/Widgets%2Fvideos%2Fbig_buck_bunny";

    expect(player.getVideoFileType(baseUrl + ".webm")).to.equal("webm");
    expect(player.getVideoFileType(baseUrl + ".mp4")).to.equal("mp4");
    expect(player.getVideoFileType(baseUrl + ".ogv")).to.equal("ogg");
    expect(player.getVideoFileType(baseUrl + ".ogg")).to.equal("ogg");
  });

  it("should return null as the HTML5 video file type calling getVideoFileType()", function () {
    var baseUrl = "https://www.googleapis.com/storage/v1/b/risemedialibrary-abc123/o/Widgets%2Fvideos%2Fbig_buck_bunny";

    expect(player.getVideoFileType(baseUrl + ".flv")).to.be.null;
    expect(player.getVideoFileType(baseUrl + ".mov")).to.be.null;
    expect(player.getVideoFileType(baseUrl + ".avi")).to.be.null;
    expect(player.getVideoFileType(baseUrl + ".mpg")).to.be.null;
    expect(player.getVideoFileType(baseUrl + ".wmv")).to.be.null;
  });

  it("should return array of correctly formatted objects from list of files calling getPlaylist()", function () {
    var list = [
        "https://www.googleapis.com/storage/v1/b/risemedialibrary-abc123/o/Widgets%2Fvideos%2Ftest1.webm",
        "https://www.googleapis.com/storage/v1/b/risemedialibrary-abc123/o/Widgets%2Fvideos%2Ftest2.mp4"
      ],
      correctFormat = [{
        sources: [{
          file: list[0],
          type: "webm"
        }]
      }, {
        sources: [{
          file: list[1],
          type: "mp4"
        }]
      }];

    expect(player.getPlaylist(list)).to.eql(correctFormat);
  });

});
