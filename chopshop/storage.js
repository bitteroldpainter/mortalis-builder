(function () {
  "use strict";

  var SAVE_VERSION = 1;

  function exportVehicle(vehicle) {
    var payload = {
      app: "Road Rage Chop Shop",
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      vehicle: vehicle
    };
    var safeName = slugify(vehicle.name || "road-rage-vehicle");
    downloadJson(safeName + ".json", payload);
  }

  function importVehicle(file) {
    return new Promise(function (resolve, reject) {
      if (!file) return reject(new Error("No file selected."));
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var payload = JSON.parse(String(reader.result || ""));
          var vehicle = payload && payload.vehicle ? payload.vehicle : payload;
          validateVehicle(vehicle);
          resolve(vehicle);
        } catch (error) {
          reject(new Error("That file is not a valid Chop Shop vehicle."));
        }
      };
      reader.onerror = function () { reject(new Error("The file could not be read.")); };
      reader.readAsText(file);
    });
  }

  function validateVehicle(vehicle) {
    if (!vehicle || typeof vehicle !== "object") throw new Error("Missing vehicle data.");
    if (vehicle.chassisId != null && typeof vehicle.chassisId !== "string") throw new Error("Invalid chassis.");
  }

  function downloadJson(filename, data) {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function slugify(value) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "road-rage-vehicle";
  }

  window.ChopShopStorage = {
    exportVehicle: exportVehicle,
    importVehicle: importVehicle
  };
})();
