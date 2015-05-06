angular.module("risevision.widget.video-folder.settings")
  .controller("videoFolderSettingsController", ["$scope", "$log", "commonSettings",
    function ($scope, $log, commonSettings) {

      $scope.isFolder = true;

      $scope.isFolderSelected = function (url) {
        var params = url.split("?"),
          pair;

        $scope.isFolder = false;

        for (var i = 0; i < params.length; i++) {
          pair = params[i].split("=");

          if (pair[0] === "prefix" && pair[1] !== undefined && pair[1] !== "") {
            $scope.isFolder = true;
            break;
          }
        }

        $scope.settingsForm.$setValidity("videoFolderUrl", $scope.isFolder);

        return $scope.isFolder;
      };

      $scope.$watch("settings.additionalParams.url", function (url) {
        if (url !== undefined && url !== "") {
          if ($scope.settingsForm.videoFolderUrl.$valid) {
            if ($scope.isFolderSelected(url)) {
              $scope.settings.additionalParams.storage = commonSettings.getStorageUrlData(url);
            } else {
              $scope.settings.additionalParams.storage = {};
            }
          } else {
            $scope.isFolder = true;
            $scope.settings.additionalParams.storage = {};
          }
        }
      });

    }])
  .value("defaultSettings", {
    params: {},
    additionalParams: {
      url: "",
      storage: {},
      video: {
        scaleToFit: true,
        volume: 50,
        controls: true,
        autoplay: true,
        pause: 10
      }
    }
  });
