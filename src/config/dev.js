/* global config: true */
/* exported config */
if (typeof config === "undefined") {
  var config = {
    // variables go here
  };

  if (typeof angular !== "undefined") {
    angular.module("risevision.common.i18n.config", [])
      .constant("LOCALES_PREFIX", "components/rv-common-i18n/dist/locales/translation_")
      .constant("LOCALES_SUFIX", ".json");

    angular.module("risevision.widget.common.storage-selector.config")
      .value("STORAGE_MODAL", "https://storage-stage.risevision.com/rva-test/dist/storage-modal.html#/files/");
  }
}
