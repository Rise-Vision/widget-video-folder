var RiseVision = RiseVision || {};
RiseVision.VideoFolder = RiseVision.VideoFolder || {};

RiseVision.VideoFolder.Storage = function (data) {
  "use strict";

  var _initialLoad = true;

  /*
   *  Public Methods
   */
  function init() {
    var storage = document.getElementById("videoFolderStorage");

    if (!storage) {
      return;
    }

    storage.addEventListener("rise-storage-response", function(e) {
      var urls = [];

      if (e.detail && e.detail.files && e.detail.files.length > 0) {
        e.detail.files.forEach(function(file) {
          urls.push(file.url);
        });

        if (_initialLoad) {
          _initialLoad = false;

          RiseVision.VideoFolder.onStorageInit(urls);

        } else {
          RiseVision.VideoFolder.onStorageRefresh(urls);
        }
      }

    });

    storage.setAttribute("companyId", data.storage.companyId);
    storage.setAttribute("folder", data.storage.folder);

    storage.go();
  }

  return {
    "init": init
  };
};
