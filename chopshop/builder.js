(function () {
  "use strict";

  var rules = window.ROAD_RAGE_RULES;
  var AUTOSAVE_KEY = "road_rage_chop_shop_autosave_v1";
  var GARAGE_KEY = "road_rage_chop_shop_garage_v1";
  var state = createBlankVehicle();
  var garage = loadGarage();
  var editingVehicleId = null;
  var expandedVehicleId = null;
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
    garageView: document.getElementById("garage-view"),
    builderView: document.getElementById("builder-view"),
    garageList: document.getElementById("garage-list"),
    garageName: document.getElementById("garage-name"),
    garageCount: document.getElementById("garage-count"),
    garageTotal: document.getElementById("garage-total"),
    garageStatus: document.getElementById("garage-status"),
    addVehicle: document.getElementById("add-vehicle"),
    saveToGarage: document.getElementById("save-to-garage"),
    backToGarage: document.getElementById("back-to-garage"),
    exportGarage: document.getElementById("export-garage"),
    loadGarage: document.getElementById("load-garage"),
    clearGarage: document.getElementById("clear-garage"),
    viewModal: document.getElementById("vehicle-view-modal"),
    viewTitle: document.getElementById("vehicle-view-title"),
    viewContent: document.getElementById("vehicle-view-content"),
    weaponTabs: document.getElementById("weapon-category-tabs"),
    weaponCatalogue: document.getElementById("weapon-catalogue"),
    selectedWeapons: document.getElementById("selected-weapons"),
    hullUpgrades: document.getElementById("hull-upgrades"),
    engineUpgrades: document.getElementById("engine-upgrades"),
    crewUpgrades: document.getElementById("crew-upgrades")
  };

  init();

  function init() {
    renderChassis();
    renderWeaponTabs();
    renderUpgradePanels();
    render();
    bindTabs();
    bindActions();
    bindGarageActions();
    renderGarage();
    showGarage();
  }

  function createBlankVehicle() {
    return {
      schemaVersion: 1,
      name: "",
      chassisId: null,
      portrait: null,
      weapons: [],
      upgrades: { hull: [], engine: [], crew: [] },
      upgradeNameOverrides: { hull: {}, engine: {}, crew: {} }
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
      autosaveVehicle();
    });

    if (els.fresh) els.fresh.addEventListener("click", function () {
      startNewVehicle();
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


  function bindGarageActions() {
    if (els.addVehicle) els.addVehicle.addEventListener("click", startNewVehicle);
    if (els.saveToGarage) els.saveToGarage.addEventListener("click", saveCurrentVehicleToGarage);
    if (els.backToGarage) els.backToGarage.addEventListener("click", function () { showGarage(); });
    if (els.garageName) els.garageName.addEventListener("input", function () {
      garage.name = els.garageName.value;
      saveGarage();
    });
    if (els.exportGarage) els.exportGarage.addEventListener("click", function () {
      window.ChopShopStorage.exportGarage(garage);
      setGarageStatus("Garage exported.");
    });
    if (els.loadGarage) els.loadGarage.addEventListener("change", function () {
      var file = els.loadGarage.files && els.loadGarage.files[0];
      window.ChopShopStorage.importGarage(file).then(function (loaded) {
        garage = normaliseGarage(loaded);
        saveGarage();
        renderGarage();
        setGarageStatus("Garage loaded.");
      }).catch(function (error) { setGarageStatus(error.message, true); })
        .finally(function () { els.loadGarage.value = ""; });
    });
    if (els.clearGarage) els.clearGarage.addEventListener("click", function () {
      if (garage.vehicles.length && !window.confirm("Clear every vehicle from this Garage?")) return;
      garage.vehicles = [];
      saveGarage();
      renderGarage();
      setGarageStatus("Garage cleared.");
    });
    if (els.garageList) els.garageList.addEventListener("click", function (event) {
      var button = event.target.closest("button[data-garage-action]");
      if (!button) return;
      var id = button.dataset.vehicleId;
      var action = button.dataset.garageAction;
      if (action === "view") viewGarageVehicle(id);
      if (action === "edit") editGarageVehicle(id);
      if (action === "duplicate") duplicateGarageVehicle(id);
      if (action === "remove") removeGarageVehicle(id);
    });
  }

  function showGarage() {
    if (els.garageView) els.garageView.classList.add("active");
    if (els.builderView) els.builderView.classList.remove("active");
    renderGarage();
    window.scrollTo(0, 0);
  }

  function showBuilder() {
    if (els.garageView) els.garageView.classList.remove("active");
    if (els.builderView) els.builderView.classList.add("active");
    render();
    window.scrollTo(0, 0);
  }

  function startNewVehicle() {
    editingVehicleId = null;
    clearAutosave();
    state = createBlankVehicle();
    setStatus("New vehicle started.");
    showBuilder();
  }

  function editGarageVehicle(id) {
    var entry = garage.vehicles.find(function (item) { return item.id === id; });
    if (!entry) return;
    editingVehicleId = id;
    state = normaliseVehicle(JSON.parse(JSON.stringify(entry.vehicle)));
    setStatus("Editing " + (state.name || "Unnamed Vehicle") + ".");
    showBuilder();
  }

  function saveCurrentVehicleToGarage() {
    if (!state.chassisId) return setStatus("Choose a chassis before saving to the Garage.", true);
    var vehicle = normaliseVehicle(JSON.parse(JSON.stringify(state)));
    if (editingVehicleId) {
      var existing = garage.vehicles.find(function (item) { return item.id === editingVehicleId; });
      if (existing) existing.vehicle = vehicle;
    } else {
      editingVehicleId = makeGarageId();
      garage.vehicles.push({ id: editingVehicleId, vehicle: vehicle });
    }
    saveGarage();
    clearAutosave();
    setGarageStatus((vehicle.name.trim() || "Unnamed Vehicle") + " saved.");
    showGarage();
  }

  function duplicateGarageVehicle(id) {
    var entry = garage.vehicles.find(function (item) { return item.id === id; });
    if (!entry) return;
    var copy = normaliseVehicle(JSON.parse(JSON.stringify(entry.vehicle)));
    copy.name = (copy.name.trim() || "Unnamed Vehicle") + " (Copy)";
    garage.vehicles.push({ id: makeGarageId(), vehicle: copy });
    saveGarage(); renderGarage(); setGarageStatus("Vehicle duplicated.");
  }

  function removeGarageVehicle(id) {
    if (expandedVehicleId === id) expandedVehicleId = null;
    var entry = garage.vehicles.find(function (item) { return item.id === id; });
    if (!entry) return;
    if (!window.confirm("Remove " + (entry.vehicle.name || "this vehicle") + " from the Garage?")) return;
    garage.vehicles = garage.vehicles.filter(function (item) { return item.id !== id; });
    saveGarage(); renderGarage(); setGarageStatus("Vehicle removed.");
  }

  function renderGarage() {
    if (!els.garageList) return;
    els.garageName.value = garage.name || "";
    var total = garage.vehicles.reduce(function (sum, entry) { return sum + calculateVehiclePoints(entry.vehicle); }, 0);
    els.garageCount.textContent = String(garage.vehicles.length);
    els.garageTotal.textContent = total + " pts";

    if (!garage.vehicles.length) {
      expandedVehicleId = null;
      els.garageList.innerHTML = '<div class="empty-state garage-empty"><div><span>0</span><h2>Your Garage is empty</h2><p>Add a vehicle to begin building your Road Rage roster.</p><button class="button button-accent" type="button" id="empty-add-vehicle">Add Vehicle</button></div></div>';
      var emptyAdd = document.getElementById("empty-add-vehicle");
      if (emptyAdd) emptyAdd.addEventListener("click", startNewVehicle);
      return;
    }

    els.garageList.innerHTML = garage.vehicles.map(function (entry) {
      var vehicle = normaliseVehicle(entry.vehicle);
      var chassis = getChassisFor(vehicle);
      var points = calculateVehiclePoints(vehicle);
      var stats = getEffectiveStatsFor(vehicle);
      var isExpanded = expandedVehicleId === entry.id;

      var inlineSummary = isExpanded
        ? '<div class="garage-inline-summary" id="garage-summary-' + escapeHtml(entry.id) + '">' +
            '<div class="summary-card garage-summary">' +
              '<div class="summary-block"><h3>Vehicle</h3>' +
                summaryRow("Chassis", chassis ? chassis.name : "None") +
                summaryRow("Total Cost", points + " pts") +
              '</div>' +
              '<div class="summary-block"><h3>Weapons</h3>' +
                renderVehicleWeaponsSummary(vehicle) +
              '</div>' +
              '<div class="summary-block"><h3>Upgrades</h3>' +
                renderVehicleUpgradesSummary(vehicle) +
              '</div>' +
            '</div>' +
          '</div>'
        : "";

      return '<article class="garage-vehicle-card' + (isExpanded ? ' expanded' : '') + '" data-garage-vehicle-id="' + escapeHtml(entry.id) + '">' +
        '<div class="garage-vehicle-main"><div><p class="eyebrow">' + escapeHtml(chassis ? chassis.name : "No Chassis") + '</p><h3>' + escapeHtml(vehicle.name.trim() || "Unnamed Vehicle") + '</h3></div><strong class="garage-vehicle-cost">' + points + ' pts</strong></div>' +
        '<div class="garage-quick-stats">' +
          garageStat("Speed", stats ? formatStat("speed", stats.speed) : "—") +
          garageStat("AP", stats ? formatStat("ap", stats.ap) : "—") +
          garageStat("Handling", stats ? formatStat("handling", stats.handling) : "—") +
          garageStat("DEF", stats ? formatStat("def", stats.def) : "—") +
          garageStat("Hull Points", stats ? formatStat("hull", stats.hull) : "—") +
          garageStat("Ram", stats ? formatStat("ram", stats.ram) : "—") +
          garageStat("DR", stats ? formatStat("dr", stats.dr) : "—") +
          garageStat("Transport", stats ? formatStat("transport", stats.transport) : "—") +
        '</div>' +
        '<div class="garage-actions">' +
          garageButton("view", entry.id, isExpanded ? "Hide" : "View", "button-secondary") +
          garageButton("edit", entry.id, "Edit", "button-accent") +
          garageButton("duplicate", entry.id, "Duplicate", "button-secondary") +
          garageButton("remove", entry.id, "Remove", "button-secondary danger-button") +
        '</div>' +
        inlineSummary +
      '</article>';
    }).join("");
  }

  function viewGarageVehicle(id) {
    expandedVehicleId = expandedVehicleId === id ? null : id;
    renderGarage();

    if (expandedVehicleId) {
      var expanded = document.querySelector('[data-garage-vehicle-id="' + cssEscape(expandedVehicleId) + '"]');
      if (expanded && typeof expanded.scrollIntoView === "function") {
        expanded.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }

  function closeVehicleView() {
    if (expandedVehicleId !== null) {
      expandedVehicleId = null;
      renderGarage();
    }
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(String(value));
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function renderVehicleWeaponsSummary(vehicle) {
    if (!vehicle.weapons.length) return summaryRow("Weapons", "None");
    return vehicle.weapons.map(function (selection) {
      var weapon = getWeapon(selection.weaponId), mount = getMount(selection.mountId);
      return weapon ? summaryRow(getWeaponDisplayName(selection, weapon), mount.name + " · " + buildWeaponProfile(weapon, selection) + " · " + formatPoints(Number(weapon.points||0)+Number(mount.points||0)+getWeaponUpgradeCost(selection))) : "";
    }).join("");
  }

  function renderVehicleUpgradesSummary(vehicle) {
    var rows = [];
    ["hull", "engine", "crew"].forEach(function (group) {
      (vehicle.upgrades[group] || []).forEach(function (id) {
        var upgrade = getUpgrade(group, id);
        if (upgrade) rows.push(summaryRow(getUpgradeDisplayName(group, upgrade), upgrade.description + " · " + formatPoints(upgrade.points)));
      });
    });
    return rows.length ? rows.join("") : summaryRow("Upgrades", "None");
  }

  function garageStat(label, value) { return '<span><small>' + escapeHtml(label) + '</small><strong>' + escapeHtml(value) + '</strong></span>'; }
  function garageButton(action, id, label, cls) { return '<button type="button" class="button ' + cls + '" data-garage-action="' + action + '" data-vehicle-id="' + id + '">' + label + '</button>'; }
  function makeGarageId() { return "v-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8); }

  function createBlankGarage() { return { version: 1, name: "", vehicles: [] }; }
  function normaliseGarage(value) {
    var result = createBlankGarage();
    if (!value || typeof value !== "object") return result;
    result.name = typeof value.name === "string" ? value.name : "";
    result.vehicles = Array.isArray(value.vehicles) ? value.vehicles.map(function (entry) {
      var vehicle = entry && entry.vehicle ? entry.vehicle : entry;
      return { id: entry && typeof entry.id === "string" ? entry.id : makeGarageId(), vehicle: normaliseVehicle(vehicle || {}) };
    }) : [];
    return result;
  }
  function loadGarage() {
    try { var raw = localStorage.getItem(GARAGE_KEY); return raw ? normaliseGarage(JSON.parse(raw)) : createBlankGarage(); }
    catch (error) { return createBlankGarage(); }
  }
  function saveGarage() { try { localStorage.setItem(GARAGE_KEY, JSON.stringify(garage)); } catch (error) {} }
  function setGarageStatus(message, isError) { if (!els.garageStatus) return; els.garageStatus.textContent = message; els.garageStatus.style.color = isError ? "#fecaca" : ""; }

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
    renderUpgradePanels();
    renderSummary();
    autosaveVehicle();
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

  function getWeaponDisplayName(selection, weapon) {
    var custom = selection && typeof selection.displayNameOverride === "string" ? selection.displayNameOverride.trim() : "";
    return custom || (weapon ? weapon.name : "");
  }

  function getUpgradeDisplayName(groupKey, upgrade) {
    var maps = state.upgradeNameOverrides || {};
    var group = maps[groupKey] || {};
    var custom = upgrade && typeof group[upgrade.id] === "string" ? group[upgrade.id].trim() : "";
    return custom || (upgrade ? upgrade.name : "");
  }

  function promptCosmeticRename(currentName, baseName, kindLabel) {
    var value = window.prompt("Rename " + kindLabel + " (cosmetic only). Leave blank to reset.", currentName || baseName || "");
    if (value === null) return null;
    return String(value).trim();
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
        state.weapons.push({ instanceId: makeId(), weaponId: button.dataset.weaponId, mountId: "hull", upgrades: blankWeaponUpgrades(), displayNameOverride: "" });
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
        '<div class="weapon-card-head"><div><h4>' + escapeHtml(getWeaponDisplayName(selection, weapon)) + '</h4><p class="selected-weapon-profile">' + escapeHtml(buildWeaponProfile(weapon, selection)) + '</p></div><strong>' + formatPoints(total) + '</strong></div>' +
        '<div class="mount-options">' + rules.weaponMounts.map(function (mount) {
          return '<label><input type="radio" name="mount-' + selection.instanceId + '" value="' + mount.id + '"' + (selection.mountId === mount.id ? ' checked' : '') + '><span>' + escapeHtml(mount.shortName) + ' <small>+' + mount.points + '</small></span></label>';
        }).join("") + '</div>' +
        '<div class="weapon-upgrades">' + renderWeaponUpgradeOptions(selection) + '</div>' +
        '<div class="selected-item-actions"><button type="button" class="rename-weapon" data-instance-id="' + selection.instanceId + '">Rename</button><button type="button" class="remove-weapon" data-instance-id="' + selection.instanceId + '">Remove</button></div></article>';
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
    els.selectedWeapons.querySelectorAll(".rename-weapon").forEach(function (button) {
      button.addEventListener("click", function () {
        var selection = state.weapons.find(function (item) { return item.instanceId === button.dataset.instanceId; });
        var weapon = selection ? getWeapon(selection.weaponId) : null;
        if (!selection || !weapon) return;
        var renamed = promptCosmeticRename(selection.displayNameOverride || "", weapon.name, "weapon");
        if (renamed === null) return;
        selection.displayNameOverride = renamed;
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


  function renderUpgradePanels() {
    renderUpgradeGroup("hull", els.hullUpgrades);
    renderUpgradeGroup("engine", els.engineUpgrades);
    renderUpgradeGroup("crew", els.crewUpgrades);
  }

  function renderUpgradeGroup(groupKey, container) {
    if (!container) return;
    var list = rules.upgrades[groupKey] || [];
    container.innerHTML = list.map(function (upgrade) {
      var selected = state.upgrades[groupKey].indexOf(upgrade.id) !== -1;
      return '<label class="upgrade-card' + (selected ? ' selected' : '') + '">' +
        '<input type="checkbox" class="vehicle-upgrade-toggle" data-group="' + groupKey + '" data-upgrade-id="' + upgrade.id + '"' + (selected ? ' checked' : '') + '>' +
        '<span class="upgrade-card-body">' +
          '<span class="upgrade-card-head"><strong>' + escapeHtml(getUpgradeDisplayName(groupKey, upgrade)) + '</strong><b>' + formatPoints(upgrade.points) + '</b></span>' +
          '<span class="upgrade-description">' + escapeHtml(upgrade.description) + '</span>' +
          '<button type="button" class="rename-upgrade" data-group="' + groupKey + '" data-upgrade-id="' + upgrade.id + '">Rename</button>' +
        '</span>' +
      '</label>';
    }).join("");

    container.querySelectorAll(".rename-upgrade").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        var group = button.dataset.group;
        var upgrade = getUpgrade(group, button.dataset.upgradeId);
        if (!upgrade) return;
        if (!state.upgradeNameOverrides) state.upgradeNameOverrides = { hull: {}, engine: {}, crew: {} };
        if (!state.upgradeNameOverrides[group]) state.upgradeNameOverrides[group] = {};
        var current = state.upgradeNameOverrides[group][upgrade.id] || "";
        var renamed = promptCosmeticRename(current, upgrade.name, "upgrade");
        if (renamed === null) return;
        if (renamed) state.upgradeNameOverrides[group][upgrade.id] = renamed;
        else delete state.upgradeNameOverrides[group][upgrade.id];
        render();
      });
    });

    container.querySelectorAll(".vehicle-upgrade-toggle").forEach(function (input) {
      input.addEventListener("change", function () {
        var group = input.dataset.group;
        var id = input.dataset.upgradeId;
        var selected = state.upgrades[group];
        if (input.checked) {
          if (selected.indexOf(id) === -1) selected.push(id);
        } else {
          state.upgrades[group] = selected.filter(function (item) { return item !== id; });
        }
        render();
      });
    });
  }

  function getUpgrade(groupKey, id) {
    return (rules.upgrades[groupKey] || []).find(function (item) { return item.id === id; }) || null;
  }

  function getSelectedUpgrades(groupKey) {
    return state.upgrades[groupKey].map(function (id) { return getUpgrade(groupKey, id); }).filter(Boolean);
  }


  function getChassisFor(vehicle) {
    return rules.chassis.find(function (item) { return item.id === vehicle.chassisId; }) || null;
  }

  function getEffectiveStatsFor(vehicle) {
    var chassis = getChassisFor(vehicle);
    if (!chassis) return null;
    var stats = Object.assign({}, chassis.stats);
    ["hull", "engine", "crew"].forEach(function (groupKey) {
      ((vehicle.upgrades && vehicle.upgrades[groupKey]) || []).forEach(function (id) {
        var upgrade = getUpgrade(groupKey, id);
        if (!upgrade || !upgrade.statMods) return;
        Object.keys(upgrade.statMods).forEach(function (key) {
          if (stats[key] === null || stats[key] === undefined || stats[key] === "") return;
          stats[key] = Number(stats[key]) + Number(upgrade.statMods[key] || 0);
        });
      });
    });
    return stats;
  }

  function calculateVehiclePoints(vehicle) {
    var chassis = getChassisFor(vehicle);
    var total = chassis ? Number(chassis.cost || 0) : 0;
    (vehicle.weapons || []).forEach(function (selection) {
      var weapon = getWeapon(selection.weaponId), mount = getMount(selection.mountId);
      if (weapon) total += Number(weapon.points || 0) + Number(mount.points || 0) + getWeaponUpgradeCost(selection);
    });
    ["hull", "engine", "crew"].forEach(function (groupKey) {
      (((vehicle.upgrades || {})[groupKey]) || []).forEach(function (id) {
        var upgrade = getUpgrade(groupKey, id);
        if (upgrade) total += Number(upgrade.points || 0);
      });
    });
    return total;
  }

  function getEffectiveStats() { return getEffectiveStatsFor(state); }

  function renderUpgradeSummary(groupKey, label) {
    var selected = getSelectedUpgrades(groupKey);
    if (!selected.length) return summaryRow(label, "None");
    return selected.map(function (upgrade) {
      return summaryRow(getUpgradeDisplayName(groupKey, upgrade), upgrade.description + " · " + formatPoints(upgrade.points));
    }).join("");
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
          renderSummaryStats(getEffectiveStats()) +
        '</div>' +
        '<div class="summary-block">' +
          '<h3>Loadout</h3>' +
          (state.weapons.length ? state.weapons.map(function (selection) {
            var weapon = getWeapon(selection.weaponId);
            var mount = getMount(selection.mountId);
            return weapon ? summaryRow(getWeaponDisplayName(selection, weapon), mount.name + " · " + buildWeaponProfile(weapon, selection) + " · " + formatPoints(weapon.points + mount.points + getWeaponUpgradeCost(selection))) : "";
          }).join("") : summaryRow("Weapons", "None")) +
          renderUpgradeSummary("hull", "Hull upgrades") +
          renderUpgradeSummary("engine", "Engine upgrades") +
          renderUpgradeSummary("crew", "Crew upgrades") +
        '</div>' +
        '<div class="summary-block">' +
          '<h3>Total</h3>' +
          summaryRow("Vehicle cost", calculatePoints() + " pts") +
        '</div>' +
      '</div>';
  }

  function renderChassisStats(stats) {
    var items = [
      ["Speed", formatStat("speed", stats.speed)],
      ["Shoot", formatStat("shoot", stats.shoot)],
      ["AP", formatStat("ap", stats.ap)],
      ["Handling", formatStat("handling", stats.handling)],
      ["DEF", formatStat("def", stats.def)],
      ["Hull Points", formatStat("hull", stats.hull)],
      ["Ram", formatStat("ram", stats.ram)],
      ["DR", formatStat("dr", stats.dr)],
      ["Transport", formatStat("transport", stats.transport)]
    ];

    return '<div class="chassis-stats">' + items.map(function (item) {
      return '<span class="chassis-stat"><small>' + escapeHtml(item[0]) + '</small><strong>' + escapeHtml(item[1]) + '</strong></span>';
    }).join("") + '</div>';
  }

  function renderSummaryStats(stats) {
    return [
      summaryRow("Speed", formatStat("speed", stats.speed)),
      summaryRow("Shoot", formatStat("shoot", stats.shoot)),
      summaryRow("AP", formatStat("ap", stats.ap)),
      summaryRow("Handling", formatStat("handling", stats.handling)),
      summaryRow("DEF", formatStat("def", stats.def)),
      summaryRow("Hull Points", formatStat("hull", stats.hull)),
      summaryRow("Ram", formatStat("ram", stats.ram)),
      summaryRow("DR", formatStat("dr", stats.dr)),
      summaryRow("Transport", formatStat("transport", stats.transport))
    ].join("");
  }

  function formatStat(key, value) {
    if (value === null || value === undefined || value === "") return "—";
    if (key === "speed") return value + '"';
    if (key === "shoot" || key === "handling" || key === "def") return value + "+";
    return String(value);
  }

  function formatPoints(value) {
    if (value === null || value === undefined || value === "") return "—";
    return value + " pts";
  }

  function calculatePoints() { return calculateVehiclePoints(state); }

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
          upgrades: Object.assign(blankWeaponUpgrades(), item.upgrades || {}),
          displayNameOverride: typeof item.displayNameOverride === "string" ? item.displayNameOverride : ""
        };
      }).filter(function (item) { return item.weaponId; }) : [],
      upgrades: {
        hull: vehicle.upgrades && Array.isArray(vehicle.upgrades.hull) ? vehicle.upgrades.hull.filter(function (id) { return !!getUpgrade("hull", id); }) : [],
        engine: vehicle.upgrades && Array.isArray(vehicle.upgrades.engine) ? vehicle.upgrades.engine.filter(function (id) { return !!getUpgrade("engine", id); }) : [],
        crew: vehicle.upgrades && Array.isArray(vehicle.upgrades.crew) ? vehicle.upgrades.crew.filter(function (id) { return !!getUpgrade("crew", id); }) : []
      },
      upgradeNameOverrides: {
        hull: Object.assign({}, vehicle.upgradeNameOverrides && vehicle.upgradeNameOverrides.hull || {}),
        engine: Object.assign({}, vehicle.upgradeNameOverrides && vehicle.upgradeNameOverrides.engine || {}),
        crew: Object.assign({}, vehicle.upgradeNameOverrides && vehicle.upgradeNameOverrides.crew || {})
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

  function autosaveVehicle() {
    if (els.builderView && !els.builderView.classList.contains("active")) return;
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(state));
    } catch (error) {
      // Ignore storage failures (private browsing, quota limits, etc.).
    }
  }

  function loadAutosavedVehicle() {
    try {
      var raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return null;
      return normaliseVehicle(JSON.parse(raw));
    } catch (error) {
      try { localStorage.removeItem(AUTOSAVE_KEY); } catch (_) {}
      return null;
    }
  }

  function clearAutosave() {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
    } catch (error) {
      // Ignore storage failures.
    }
  }

  function setStatus(message, isError) {
    els.status.textContent = message;
    els.status.style.color = isError ? "#fecaca" : "";
  }

  window.ChopShopBuilder = {
    getVehicle: function () {
      var vehicle = JSON.parse(JSON.stringify(state));
      vehicle.effectiveStats = getEffectiveStats();
      vehicle.points = calculatePoints();
      return vehicle;
    },
    getEffectiveStats: function () { return getEffectiveStats(); },
    getRules: function () { return rules; },
    getCardData: function () {
      var chassis = getSelectedChassis();
      if (!chassis) return null;
      return {
        name: state.name.trim() || "Unnamed Vehicle",
        chassis: JSON.parse(JSON.stringify(chassis)),
        stats: getEffectiveStats(),
        points: calculatePoints(),
        weapons: state.weapons.map(function (selection) {
          var weapon = getWeapon(selection.weaponId);
          var mount = getMount(selection.mountId);
          if (!weapon) return null;
          var profileSource = Array.isArray(weapon.cardProfiles) && weapon.cardProfiles.length
            ? weapon.cardProfiles.map(function (entry) {
                var profileWeapon = { profile: entry.profile };
                return { label: entry.label, profile: buildWeaponProfile(profileWeapon, selection) };
              })
            : [{ label: "", profile: buildWeaponProfile(weapon, selection) }];
          return {
            name: getWeaponDisplayName(selection, weapon),
            mount: mount.name,
            profiles: profileSource,
            points: Number(weapon.points || 0) + Number(mount.points || 0) + getWeaponUpgradeCost(selection)
          };
        }).filter(Boolean),
        upgrades: {
          hull: getSelectedUpgrades("hull").map(function (u) { return { name:getUpgradeDisplayName("hull", u), description:u.description, points:u.points }; }),
          engine: getSelectedUpgrades("engine").map(function (u) { return { name:getUpgradeDisplayName("engine", u), description:u.description, points:u.points }; }),
          crew: getSelectedUpgrades("crew").map(function (u) { return { name:getUpgradeDisplayName("crew", u), description:u.description, points:u.points }; })
        }
      };
    }
  };
})();
