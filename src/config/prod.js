/* global config: true */
/* exported config */
if (typeof config === "undefined") {
  var config = {
    SKIN: "skin/six.xml"
  };

  if (typeof angular !== "undefined") {
    angular.module("risevision.common.i18n.config", [])
      .constant("LOCALES_PREFIX", "locales/translation_")
      .constant("LOCALES_SUFIX", ".json");
  }
}
