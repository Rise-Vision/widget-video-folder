angular.module("risevision.widget.video-folder.settings")
  .controller("videoFolderSettingsController", ["$scope", "$log", "commonSettings",
    function ($scope, $log, commonSettings) {

      $scope.$watch("settings.additionalParams.background.image.url", function (url) {
        if (typeof url !== "undefined" && url !== "") {
          if ($scope.settingsForm.background.$valid ) {
            $scope.settings.additionalParams.backgroundStorage = commonSettings.getStorageUrlData(url);
          } else {
            $scope.settings.additionalParams.backgroundStorage = {};
          }
        }
      });

    }])
  .value("defaultSettings", {
    params: {},
    additionalParams: {
      background: {},
      backgroundStorage: {}
    }
  });
