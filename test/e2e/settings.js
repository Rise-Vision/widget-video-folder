/* jshint expr: true */

(function () {
  "use strict";

  /* https://github.com/angular/protractor/blob/master/docs/getting-started.md */

  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");

  chai.use(chaiAsPromised);
  var expect = chai.expect;

  browser.driver.manage().window().setSize(1024, 768);

  describe("Video Folder Settings - e2e Testing", function() {

    var validUrl = "http://www.valid-url.com",
      invalidUrl = "http://w",
      validStorageFolderUrl = "https://www.googleapis.com/storage/v1/b/risemedialibrary-abc123/o?prefix=videos%2F",
      invalidStorageFolderUrl = "https://storage.googleapis.com/risemedialibrary-abc123/video.webm";

    beforeEach(function () {
      browser.get("/src/settings-e2e.html");
    });

    it("Should load all components", function () {
      // Widget Button Toolbar
      expect(element(by.css("button#save")).isPresent()).to.eventually.be.true;
      expect(element(by.css("button#cancel")).isPresent()).to.eventually.be.true;

      // URL Field
      expect(element(by.model("url")).isPresent()).to.eventually.be.true;
    });

    it("Should correctly load default settings", function () {
      // save button should be disabled
      expect(element(by.css("button#save[disabled=disabled")).isPresent()).to.eventually.be.true;

      // form should be invalid due to URL Field empty entry
      expect(element(by.css("form[name='settingsForm'].ng-invalid")).isPresent()).to.eventually.be.true;

      // Video Folder URL input value should be empty
      expect(element(by.model("url")).getAttribute("value")).to.eventually.equal("");

      // Scale To Fit should be true
      expect(element(by.model("settings.additionalParams.video.scaleToFit")).isSelected()).to.eventually.be.true;

      // Show Video Controls should be true
      expect(element(by.model("settings.additionalParams.video.controls")).isSelected()).to.eventually.be.true;

      // Autoplay should be true
      expect(element(by.model("settings.additionalParams.video.autoplay")).isSelected()).to.eventually.be.true;

      // Pause should be 10
      expect(element(by.model("settings.additionalParams.video.pause")).getAttribute("value")).to.eventually.equal("10");

    });

    it("Should be invalid form and Save button disabled due to invalid URL", function () {
      element(by.model("url")).sendKeys(invalidUrl);

      // save button should be disabled
      expect(element(by.css("button#save[disabled=disabled")).isPresent()).to.eventually.be.true;

      // form should be invalid due to invalid URL
      expect(element(by.css("form[name='settingsForm'].ng-invalid")).isPresent()).to.eventually.be.true;
    });

    it("Should be invalid form and Save button disabled due to a storage file and not folder selected", function () {
      element(by.model("url")).sendKeys(invalidStorageFolderUrl);

      // save button should be disabled
      expect(element(by.css("button#save[disabled=disabled")).isPresent()).to.eventually.be.true;

      // form should be invalid due to incorrect file format
      expect(element(by.css("form[name='settingsForm'].ng-invalid")).isPresent()).to.eventually.be.true;
    });

    it("Should be valid form and Save button enabled due to a storage folder selected", function () {
      element(by.model("url")).sendKeys(validStorageFolderUrl);

      // save button should be enabled
      expect(element(by.css("button#save[disabled=disabled")).isPresent()).to.eventually.be.false;

      // form should be valid due to valid URL and valid format
      expect(element(by.css("form[name='settingsForm'].ng-invalid")).isPresent()).to.eventually.be.false;
    });

    it("Should hide Autoplay and Resume if Show Video Controls unchecked", function () {
      element(by.model("settings.additionalParams.video.controls")).click();

      expect(element(by.model("settings.additionalParams.video.autoplay")).isDisplayed()).to.eventually.be.false;
    });

    it("Should correctly save settings", function () {
      var settings = {
        params: {},
        additionalParams: {
          "url": validStorageFolderUrl,
          "storage": {
            "companyId": "abc123",
            "folder": "videos/",
            "fileName": ""
          },
          "video": {
            "scaleToFit": true,
            "volume":50,
            "controls": true,
            "autoplay":true,
            "pause": 10
          }
        }
      };

      element(by.model("url")).sendKeys(validStorageFolderUrl);

      element(by.id("save")).click();

      expect(browser.executeScript("return window.result")).to.eventually.deep.equal(
        {
          'additionalParams': JSON.stringify(settings.additionalParams),
          'params': ''
        });
    });

  });

})();
