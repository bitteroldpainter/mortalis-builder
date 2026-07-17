(function () {
  "use strict";

  var button = document.getElementById("generate-card");
  if (!button) return;

  button.addEventListener("click", function () {
    var vehicle = window.ChopShopBuilder.getVehicle();
    if (!vehicle.chassisId) return;
    alert("Vehicle card generation is reserved for the card milestone. The current build data is ready for it.");
  });
})();
