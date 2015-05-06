/*jshint expr:true */
"use strict";

describe("Unit Tests - Settings Controller", function () {

  var defaultSettings, scope, ctrl;

  beforeEach(module("risevision.widget.video-folder.settings"));

  beforeEach(inject(function($injector, $rootScope, $controller, _commonSettings_) {
    defaultSettings = $injector.get("defaultSettings");
    scope = $rootScope.$new();
    ctrl = $controller('videoFolderSettingsController', {
      $scope: scope,
      commonSettings: _commonSettings_
    });

    scope.settingsForm = {
      $setValidity: function () {
        return;
      },
      videoFolderUrl: {
        $valid: true
      }
    };

    scope.settings = {
      additionalParams: defaultSettings.additionalParams
    };

  }));

  it("should define defaultSettings", function (){
    expect(defaultSettings).to.be.truely;
    expect(defaultSettings).to.be.an("object");
  });

  it("should return true when calling $scope.isFolderSelected with valid storage folder url", function (){
    var url = "https://www.googleapis.com/storage/v1/b/risemedialibrary-abc123/o?prefix=Widgets%2Fvideos%2F";

    expect(scope.isFolderSelected(url)).to.be.true;
  });

  it("should return false when calling $scope.isFolderSelected with invalid storage folder url", function (){
    var url = "https://storage.googleapis.com/risemedialibrary-abc123/Widgets%test.webm";

    expect(scope.isFolderSelected(url)).to.be.false;
  });

  it('should define additionalParams.storage and set scope.isFolder true with valid storage folder url', function() {
    var url = "https://www.googleapis.com/storage/v1/b/risemedialibrary-abc123/o?prefix=Widgets%2Fvideos%2F";

    // make a valid storage folder url entry
    scope.settings.additionalParams.url = url;
    scope.$digest();

    expect(scope.settings.additionalParams.storage).to.deep.equal({
      "companyId": "abc123",
      "folder": "Widgets/videos/",
      "fileName": ""
    });

    expect(scope.isFolder).to.be.true;
  });

  it('should reset additionalParams.storage and set scope.isFolder false with invalid storage folder url', function() {
    var url = "https://storage.googleapis.com/risemedialibrary-abc123/Widgets%test.webm";

    // make an invalid storage folder url entry
    scope.settings.additionalParams.url = url;
    scope.$digest();

    expect(scope.settings.additionalParams.storage).to.deep.equal({});

    expect(scope.isFolder).to.be.false;
  });

  it('should reset additionalParams.storage and set scope.isFolder true with invalid url', function() {
    var url = "https://www.googleapis.com/storage/v1/b/risemedialibrary-abc123/o?prefix=Widgets%2Fvideos%2F";

    // make an initial correct entry
    scope.settings.additionalParams.url = url;
    scope.$digest();

    // make an invalid url entry
    scope.settings.additionalParams.url = "http:/ww";
    scope.settingsForm.videoFolderUrl.$valid = false;
    scope.$digest();

    expect(scope.settings.additionalParams.storage).to.deep.equal({});

    expect(scope.isFolder).to.be.true;
  });


});
