(function () {
  "use strict";

  var rules = window.ROAD_RAGE_RULES;
  var state = createBlankVehicle();

  var els = {
    chassisGrid: document.getElementById("chassis-grid"),
    vehicleName: document.getElementById("vehicle-name"),
    totalPoints: document.getElementById("total-points"),
    summary: document.getElementById("summary-content"),
    status: document.getElementById("status-message"),
    save: document.getElementById("save-vehicle"),
    load: document.getElementById("load-vehicle"),
    fresh: document.getElementById("new-vehicle"),
    generateCard: document.getElementById("generate-card")
  };

  init();

  function init() {
    renderChassis();
    render();
    bindTabs();
    bindActions();
  }

  function createBlankVehicle() {
    return {
      schemaVersion: 1,
      name: "",
      chassisId: null,
      portrait: null,
      weapons: [],
      upgrades: { hull: [], engine: [], crew: [] }
    };
  }

  function renderChassis() {
    els.chassisGrid.innerHTML = "";
    rules.chassis.forEach(function (chassis, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "chassis-card";
      button.dataset.chassisId = chassis.id;
      button.setAttribute("aria-pressed", "false");
      button.innerHTML =
        '<span class="chassis-number">0' + (index + 1) + '</span>' +
        '<div class="chassis-silhouette chassis-silhouette-' + escapeHtml(chassis.id) + '" aria-hidden="true">' +
          '<span class="vehicle-body"></span><span class="vehicle-wheel wheel-a"></span><span class="vehicle-wheel wheel-b"></span>' +
        '</div>' +
        '<div class="chassis-title-row"><h3>' + escapeHtml(chassis.name) + '</h3><strong class="chassis-cost">' + formatPoints(chassis.cost) + '</strong></div>' +
        '<p>' + escapeHtml(chassis.description) + '</p>' +
        renderChassisStats(chassis.stats) +
        '<span class="selected-marker">Selected</span>';
      button.addEventListener("click", function () {
        state.chassisId = chassis.id;
        setStatus(chassis.name + " selected.");
        render();
      });
      els.chassisGrid.appendChild(button);
    });
  }

  function bindTabs() {
    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(function (item) { item.classList.remove("active"); });
        document.querySelectorAll(".tab-panel").forEach(function (panel) { panel.classList.remove("active"); });
        tab.classList.add("active");
        document.getElementById(tab.dataset.panel).classList.add("active");
      });
    });
  }

  function bindActions() {
    els.vehicleName.addEventListener("input", function () {
      state.name = els.vehicleName.value;
      renderSummary();
    });

    els.fresh.addEventListener("click", function () {
      state = createBlankVehicle();
      setStatus("New vehicle started.");
      render();
    });

    els.save.addEventListener("click", function () {
      window.ChopShopStorage.exportVehicle(state);
      setStatus("Vehicle exported.");
    });

    els.load.addEventListener("change", function () {
      var file = els.load.files && els.load.files[0];
      window.ChopShopStorage.importVehicle(file)
        .then(function (vehicle) {
          state = normaliseVehicle(vehicle);
          setStatus("Vehicle loaded.");
          render();
        })
        .catch(function (error) {
          setStatus(error.message, true);
        })
        .finally(function () { els.load.value = ""; });
    });
  }

  function render() {
    els.vehicleName.value = state.name || "";
    document.querySelectorAll(".chassis-card").forEach(function (card) {
      var isSelected = card.dataset.chassisId === state.chassisId;
      card.classList.toggle("selected", isSelected);
      card.setAttribute("aria-pressed", String(isSelected));
    });
    els.totalPoints.textContent = calculatePoints() + " pts";
    els.generateCard.disabled = !state.chassisId;
    renderSummary();
  }

  function renderSummary() {
    var chassis = getSelectedChassis();
    if (!chassis) {
      els.summary.innerHTML = '<div class="summary-placeholder">Choose a chassis to begin the build.</div>';
      return;
    }

    var name = state.name.trim() || "Unnamed Vehicle";
    els.summary.innerHTML =
      '<div class="summary-card">' +
        '<div class="summary-block">' +
          '<h3>Vehicle</h3>' +
          summaryRow("Name", name) +
          summaryRow("Chassis", chassis.name) +
          summaryRow("Base cost", formatPoints(chassis.cost)) +
        '</div>' +
        '<div class="summary-block">' +
          '<h3>Chassis Profile</h3>' +
          renderSummaryStats(chassis.stats) +
        '</div>' +
        '<div class="summary-block">' +
          '<h3>Loadout</h3>' +
          summaryRow("Weapons", state.weapons.length ? state.weapons.length : "None") +
          summaryRow("Hull upgrades", state.upgrades.hull.length ? state.upgrades.hull.length : "None") +
          summaryRow("Engine upgrades", state.upgrades.engine.length ? state.upgrades.engine.length : "None") +
          summaryRow("Crew upgrades", state.upgrades.crew.length ? state.upgrades.crew.length : "None") +
        '</div>' +
        '<div class="summary-block">' +
          '<h3>Total</h3>' +
          summaryRow("Vehicle cost", calculatePoints() + " pts") +
        '</div>' +
      '</div>';
  }

  function renderChassisStats(stats) {
    var items = [
      ["Drive", formatStat("drive", stats.drive)],
      ["Shoot", formatStat("shoot", stats.shoot)],
      ["AP", formatStat("ap", stats.ap)],
      ["Handling", formatStat("handling", stats.handling)],
      ["DEF", formatStat("def", stats.def)],
      ["Hull", formatStat("hull", stats.hull)],
      ["Ram", formatStat("ram", stats.ram)],
      ["Transport", formatStat("transport", stats.transport)]
    ];

    return '<div class="chassis-stats">' + items.map(function (item) {
      return '<span class="chassis-stat"><small>' + escapeHtml(item[0]) + '</small><strong>' + escapeHtml(item[1]) + '</strong></span>';
    }).join("") + '</div>';
  }

  function renderSummaryStats(stats) {
    return [
      summaryRow("Drive", formatStat("drive", stats.drive)),
      summaryRow("Shoot", formatStat("shoot", stats.shoot)),
      summaryRow("AP", formatStat("ap", stats.ap)),
      summaryRow("Handling", formatStat("handling", stats.handling)),
      summaryRow("DEF", formatStat("def", stats.def)),
      summaryRow("Hull", formatStat("hull", stats.hull)),
      summaryRow("Ram", formatStat("ram", stats.ram)),
      summaryRow("Transport", formatStat("transport", stats.transport))
    ].join("");
  }

  function formatStat(key, value) {
    if (value === null || value === undefined || value === "") return "—";
    if (key === "drive") return value + '"';
    if (key === "shoot" || key === "handling" || key === "def") return value + "+";
    return String(value);
  }

  function formatPoints(value) {
    if (value === null || value === undefined || value === "") return "—";
    return value + " pts";
  }

  function calculatePoints() {
    var chassis = getSelectedChassis();
    return chassis ? Number(chassis.cost || 0) : 0;
  }

  function getSelectedChassis() {
    return rules.chassis.find(function (item) { return item.id === state.chassisId; }) || null;
  }

  function normaliseVehicle(vehicle) {
    var blank = createBlankVehicle();
    return {
      schemaVersion: Number(vehicle.schemaVersion || blank.schemaVersion),
      name: typeof vehicle.name === "string" ? vehicle.name : "",
      chassisId: rules.chassis.some(function (item) { return item.id === vehicle.chassisId; }) ? vehicle.chassisId : null,
      portrait: vehicle.portrait || null,
      weapons: Array.isArray(vehicle.weapons) ? vehicle.weapons : [],
      upgrades: {
        hull: vehicle.upgrades && Array.isArray(vehicle.upgrades.hull) ? vehicle.upgrades.hull : [],
        engine: vehicle.upgrades && Array.isArray(vehicle.upgrades.engine) ? vehicle.upgrades.engine : [],
        crew: vehicle.upgrades && Array.isArray(vehicle.upgrades.crew) ? vehicle.upgrades.crew : []
      }
    };
  }

  function summaryRow(label, value) {
    return '<div class="summary-row"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(String(value)) + '</strong></div>';
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setStatus(message, isError) {
    els.status.textContent = message;
    els.status.style.color = isError ? "#fecaca" : "";
  }

  window.ChopShopBuilder = {
    getVehicle: function () { return JSON.parse(JSON.stringify(state)); },
    getRules: function () { return rules; }
  };
})();
