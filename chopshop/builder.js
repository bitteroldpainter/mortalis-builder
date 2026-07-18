(function () {
  "use strict";

  var rules = window.ROAD_RAGE_RULES;
  var state = createBlankVehicle();
  var currentWeaponCategory = "light";

  var els = {
    chassisGrid: document.getElementById("chassis-grid"),
    vehicleName: document.getElementById("vehicle-name"),
    totalPoints: document.getElementById("total-points"),
    summary: document.getElementById("summary-content"),
    status: document.getElementById("status-message"),
    save: document.getElementById("save-vehicle"),
    load: document.getElementById("load-vehicle"),
    fresh: document.getElementById("new-vehicle"),
    generateCard: document.getElementById("generate-card"),
    weaponTabs: document.getElementById("weapon-category-tabs"),
    weaponCatalogue: document.getElementById("weapon-catalogue"),
    selectedWeapons: document.getElementById("selected-weapons")
  };

  init();

  function init() {
    renderChassis();
    renderWeaponTabs();
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
    rules.chassis.forEach(function (chassis) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "chassis-card";
      button.dataset.chassisId = chassis.id;
      button.setAttribute("aria-pressed", "false");
      button.innerHTML =
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
    renderWeapons();
    renderSummary();
  }

  function renderWeaponTabs() {
    if (!els.weaponTabs) return;
    els.weaponTabs.innerHTML = rules.weaponCategories.map(function (category) {
      return '<button type="button" class="weapon-category-tab' + (category.key === currentWeaponCategory ? ' active' : '') + '" data-category="' + category.key + '">' + escapeHtml(category.label) + '</button>';
    }).join("");
    els.weaponTabs.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () {
        currentWeaponCategory = button.dataset.category;
        renderWeaponTabs();
        renderWeapons();
      });
    });
  }

  function renderWeapons() {
    if (!els.weaponCatalogue || !els.selectedWeapons) return;
    var category = rules.weaponCategories.find(function (item) { return item.key === currentWeaponCategory; }) || rules.weaponCategories[0];
    var allowed = {};
    category.ids.forEach(function (id) { allowed[id] = true; });
    var available = rules.weapons.filter(function (weapon) { return allowed[weapon.id]; });
    els.weaponCatalogue.innerHTML = available.map(function (weapon) {
      return '<article class="weapon-card"><div class="weapon-card-head"><h3>' + escapeHtml(weapon.name) + '</h3><strong>' + formatPoints(weapon.points) + '</strong></div><p>' + escapeHtml(weapon.profile) + '</p><button type="button" class="button button-accent add-weapon" data-weapon-id="' + weapon.id + '">Add Weapon</button></article>';
    }).join("");
    els.weaponCatalogue.querySelectorAll(".add-weapon").forEach(function (button) {
      button.addEventListener("click", function () {
        state.weapons.push({ instanceId: makeId(), weaponId: button.dataset.weaponId, mountId: "hull", upgrades: blankWeaponUpgrades() });
        setStatus("Weapon added.");
        render();
      });
    });

    if (!state.weapons.length) {
      els.selectedWeapons.innerHTML = '<div class="summary-placeholder">No weapons mounted.</div>';
      return;
    }
    els.selectedWeapons.innerHTML = state.weapons.map(function (selection) {
      var weapon = getWeapon(selection.weaponId);
      if (!weapon) return "";
      var total = weapon.points + getMount(selection.mountId).points + getWeaponUpgradeCost(selection);
      return '<article class="selected-weapon-card" data-instance-id="' + selection.instanceId + '">' +
        '<div class="weapon-card-head"><div><h4>' + escapeHtml(weapon.name) + '</h4><p class="selected-weapon-profile">' + escapeHtml(buildWeaponProfile(weapon, selection)) + '</p></div><strong>' + formatPoints(total) + '</strong></div>' +
        '<div class="mount-options">' + rules.weaponMounts.map(function (mount) {
          return '<label><input type="radio" name="mount-' + selection.instanceId + '" value="' + mount.id + '"' + (selection.mountId === mount.id ? ' checked' : '') + '><span>' + escapeHtml(mount.shortName) + ' <small>+' + mount.points + '</small></span></label>';
        }).join("") + '</div>' +
        '<div class="weapon-upgrades">' + renderWeaponUpgradeOptions(selection) + '</div>' +
        '<button type="button" class="remove-weapon" data-instance-id="' + selection.instanceId + '">Remove</button></article>';
    }).join("");
    els.selectedWeapons.querySelectorAll('.upgrade-toggle').forEach(function (input) {
      input.addEventListener("change", function () {
        var card = input.closest(".selected-weapon-card");
        var selection = state.weapons.find(function (item) { return item.instanceId === card.dataset.instanceId; });
        if (!selection) return;
        if (!selection.upgrades) selection.upgrades = blankWeaponUpgrades();
        selection.upgrades[input.dataset.upgrade] = input.checked;
        render();
      });
    });

    els.selectedWeapons.querySelectorAll('input[type="radio"]').forEach(function (input) {
      input.addEventListener("change", function () {
        var card = input.closest(".selected-weapon-card");
        var selection = state.weapons.find(function (item) { return item.instanceId === card.dataset.instanceId; });
        if (selection) selection.mountId = input.value;
        render();
      });
    });
    els.selectedWeapons.querySelectorAll(".remove-weapon").forEach(function (button) {
      button.addEventListener("click", function () {
        state.weapons = state.weapons.filter(function (item) { return item.instanceId !== button.dataset.instanceId; });
        render();
      });
    });
  }

  function blankWeaponUpgrades() {
    return { poison: false, enchanted: false, cursed: false, truestrike: false, masterCrafted: false };
  }

  function getWeaponUpgradeCost(selection) {
    var upgrades = selection && selection.upgrades ? selection.upgrades : {};
    var count = ["poison", "enchanted", "cursed", "truestrike", "masterCrafted"].filter(function (key) { return !!upgrades[key]; }).length;
    return count ? 2 + ((count - 1) * 4) : 0;
  }

  function buildWeaponProfile(weapon, selection) {
    var extras = [];
    var upgrades = selection && selection.upgrades ? selection.upgrades : {};
    if (upgrades.poison) extras.push("Poison/Fire");
    if (upgrades.enchanted) extras.push("Crits on 9+");
    if (upgrades.cursed) extras.push("MW (2)");
    if (upgrades.truestrike) extras.push("Reroll (SR)");
    if (upgrades.masterCrafted) extras.push("Piercing (-2)");
    return weapon.profile + (extras.length ? ", " + extras.join(", ") : "");
  }

  function renderWeaponUpgradeOptions(selection) {
    var upgrades = selection.upgrades || blankWeaponUpgrades();
    var options = [
      ["poison", "Poison/Fire"],
      ["enchanted", "Crits on 9+"],
      ["cursed", "MW (2)"],
      ["truestrike", "Reroll (SR)"],
      ["masterCrafted", "Piercing (-2)"]
    ];
    return options.map(function (option) {
      return '<label><input type="checkbox" class="upgrade-toggle" data-upgrade="' + option[0] + '"' + (upgrades[option[0]] ? ' checked' : '') + '><span>' + escapeHtml(option[1]) + '</span></label>';
    }).join("");
  }

  function getWeapon(id) { return rules.weapons.find(function (item) { return item.id === id; }) || null; }
  function getMount(id) { return rules.weaponMounts.find(function (item) { return item.id === id; }) || rules.weaponMounts[0]; }
  function makeId() { return "w-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }

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
          (state.weapons.length ? state.weapons.map(function (selection) {
            var weapon = getWeapon(selection.weaponId);
            var mount = getMount(selection.mountId);
            return weapon ? summaryRow(weapon.name, mount.name + " · " + buildWeaponProfile(weapon, selection) + " · " + formatPoints(weapon.points + mount.points + getWeaponUpgradeCost(selection))) : "";
          }).join("") : summaryRow("Weapons", "None")) +
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
    var total = chassis ? Number(chassis.cost || 0) : 0;
    state.weapons.forEach(function (selection) {
      var weapon = getWeapon(selection.weaponId);
      var mount = getMount(selection.mountId);
      if (weapon) total += Number(weapon.points || 0) + Number(mount.points || 0) + getWeaponUpgradeCost(selection);
    });
    return total;
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
      weapons: Array.isArray(vehicle.weapons) ? vehicle.weapons.map(function (item) {
        return {
          instanceId: typeof item.instanceId === "string" ? item.instanceId : makeId(),
          weaponId: rules.weapons.some(function (weapon) { return weapon.id === item.weaponId; }) ? item.weaponId : null,
          mountId: rules.weaponMounts.some(function (mount) { return mount.id === item.mountId; }) ? item.mountId : "hull",
          upgrades: Object.assign(blankWeaponUpgrades(), item.upgrades || {})
        };
      }).filter(function (item) { return item.weaponId; }) : [],
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
