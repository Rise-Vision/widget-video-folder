/* jshint expr: true */

(function () {
  "use strict";

  /* https://github.com/angular/protractor/blob/master/docs/getting-started.md */

  var chai = require("chai");
  var chaiAsPromised = require("chai-as-promised");

  chai.use(chaiAsPromised);
  var expect = chai.expect;

  browser.driver.manage().window().setSize(1024, 768);

  describe("Video Folder Widget e2e Testing", function() {

    beforeEach(function () {
      // point directly to the widget e2e file
      browser.driver.get("http://localhost:8099/src/widget-e2e.html");

      // need to ignore Angular synchronization, this is a non-angular page
      return browser.ignoreSynchronization = true;
    });

    it("Should apply correct background color", function () {
      // body background color
      expect(element(by.css("body")).getAttribute("style")).
        to.eventually.equal("background: rgba(255, 255, 255, 0);");
    });

  });

})();
