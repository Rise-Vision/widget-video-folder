var RiseVision = RiseVision || {};
RiseVision.VideoFolder = RiseVision.VideoFolder || {};

RiseVision.VideoFolder.Storage = function (data) {
  "use strict";

  var _initialLoad = true;

  /*
   *  Public Methods
   */
  function init() {
    var storage = document.getElementById("videoFolderStorage"),
      sort = "",
      sortDirection = "";

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

    // Sorting
    switch (data.order) {
      case "alpha-asc":
        sort = "name";
        sortDirection = "asc";
        break;
      case "alpha-desc":
        sort = "name";
        sortDirection = "desc";
        break;
      case "date-asc":
        sort = "date";
        sortDirection = "asc";
        break;
      case "date-desc":
        sort = "date";
        sortDirection = "desc";
        break;
      case "random":
        sort = "random";
        break;
      default:
        sort = "name";
        sortDirection = "asc";
    }

    storage.setAttribute("sort", sort);
    storage.setAttribute("sortDirection", sortDirection);
    storage.go();
  }

  return {
    "init": init
  };
};
