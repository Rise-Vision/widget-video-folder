/* global config, _ */

var RiseVision = RiseVision || {};
RiseVision.VideoFolder = RiseVision.VideoFolder || {};

RiseVision.VideoFolder.Storage = function (data) {
  "use strict";

  var _initialLoad = true;

  var _files = [];

  function _getUrls() {
    return _.pluck(_files, "url");
  }

  function _getExistingFile(file) {
    return _.find(_files, function (f) {
      return file.name === f.name;
    });
  }

  function _deleteFile(file) {
    var existing = _getExistingFile(file);

    if (existing) {
      _files.splice(_files.indexOf(existing), 1);
    }
  }

  function _changeFile(file) {
    var existing = _getExistingFile(file);

    if (existing) {
      existing.url = file.url;
    }
  }

  function _addFile(file) {
    var existing = _getExistingFile(file);

    if (!existing) {
      // extract the actual file name and store in new property on file object
      file.fileName = file.name.slice(file.name.lastIndexOf("/") + 1, file.name.lastIndexOf(".")).toLowerCase();

      // insert file to _files list at specific index based on alphabetical order of file name
      _files.splice(_.sortedIndex(_files, file, "fileName"), 0, file);
    }
  }

  function _handleEmptyFolder() {
    RiseVision.VideoFolder.noFiles("empty");
  }

  function _handleNoFolder() {
    RiseVision.VideoFolder.noFiles("noexist");
  }

  /*
   *  Public Methods
   */
  function init() {
    var storage = document.getElementById("videoFolderStorage");

    if (!storage) {
      return;
    }

    storage.addEventListener("rise-storage-empty-folder", _handleEmptyFolder);
    storage.addEventListener("rise-storage-no-folder", _handleNoFolder);
    storage.addEventListener("rise-storage-response", function(e) {
      var file = e.detail;

      // Added
      if(file.added) {
        _addFile(file);

        if (_initialLoad) {
          _initialLoad = false;
          RiseVision.VideoFolder.onStorageInit(_getUrls());

          return;
        }
      }

      // Changed
      if(file.changed) {
        _changeFile(file);
      }

      // Deleted
      if(file.deleted) {
        _deleteFile(file);
      }

      RiseVision.VideoFolder.onStorageRefresh(_getUrls());

    });

    storage.setAttribute("companyId", data.storage.companyId);
    storage.setAttribute("folder", data.storage.folder);
    storage.setAttribute("env", config.STORAGE_ENV);

    storage.go();
  }

  return {
    "init": init
  };
};
