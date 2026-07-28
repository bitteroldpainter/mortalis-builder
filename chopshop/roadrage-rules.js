(function () {
  "use strict";

  function prepareWeapons(source) {
    var excluded = { arcPistol:1, autoLaspistol:1, boltPistol:1, handFlamer:1, meltaPistol:1, phosphorBlastPistol:1, plasmaPistol:1, rokkitPistol:1, slugga:1, warpflamePistol:1, fragGrenade:1, krakGrenade:1, meltaBomb:1 };
    return source.filter(function (weapon) { return !excluded[weapon.id]; }).map(function (weapon) {
      var copy = Object.assign({}, weapon);
      copy.profile = stripHeavy(copy.profile);
      if (Array.isArray(copy.cardProfiles)) {
        copy.cardProfiles = copy.cardProfiles.map(function (entry) {
          return { label: entry.label, profile: stripHeavy(entry.profile) };
        });
      }
      return copy;
    });
  }

  function stripHeavy(profile) {
    return String(profile || "")
      .replace(/,?\s*Heavy\s*\([^)]*\)/gi, "")
      .replace(/\s*,\s*,/g, ",")
      .replace(/,\s*;/g, ";")
      .replace(/\s{2,}/g, " ")
      .replace(/,\s*$/g, "")
      .trim();
  }

  window.ROAD_RAGE_RULES = {
    version: 4,
    chassis: [
      {
        id: "bike",
        name: "Bike",
        description: "Blisteringly fast and lightly built, with barely enough room for a rider and passenger.",
        cost: 30,
        stats: { speed: 14, shoot: 7, ap: 3, handling: 7, def: 9, hull: 10, ram: 1, dr: 1, transport: 1 },
        limits: { crew: 1, weaponSlots: 1, transport: 1, turret: false }
      },
      {
        id: "trakk",
        name: "Trakk",
        description: "A compact tracked machine that combines speed, control and enough weight to hit back.",
        cost: 50,
        stats: { speed: 12, shoot: 7, ap: 3, handling: 6, def: 8, hull: 14, ram: 2, dr: 2, transport: 2 },
        limits: { crew: null, weaponSlots: null, transport: 2, turret: true }
      },
      {
        id: "buggy",
        name: "Buggy",
        description: "A versatile fighting vehicle with solid armour, useful carrying capacity and a dangerous ram.",
        cost: 75,
        stats: { speed: 10, shoot: 7, ap: 3, handling: 5, def: 7, hull: 18, ram: 3, dr: 2, transport: 4 },
        limits: { crew: null, weaponSlots: null, transport: 4, turret: true }
      },
      {
        id: "trukk",
        name: "Trukk",
        description: "A lumbering armoured brute built to carry a mob, absorb punishment and smash through obstacles.",
        cost: 100,
        stats: { speed: 8, shoot: 7, ap: 3, handling: 9, def: 7, hull: 24, ram: 4, dr: 2, transport: 8 },
        limits: { crew: null, weaponSlots: null, transport: 8, turret: true }
      }
    ],
    weapons: prepareWeapons([
  // --- Pistols / Grenades ---
  { id: "arcPistol", name: "Arc Pistol", profile: 'ATK 4, Hit User, DMG 4/5, Rng 8", Piercing (-3)', points: 6 },
  { id: "autoLaspistol", name: "Auto/Laspistol", profile: 'ATK 4, Hit User, DMG 2/3, Rng 8", Quick', points: 1 },
  { id: "boltPistol", name: "Bolt Pistol", profile: 'ATK 4, Hit User, DMG 3/4, Rng 8", Piercing Crits (-2), Quick', points: 3 },
  { id: "handFlamer", name: "Hand Flamer", profile: 'ATK 4, Hit User+2, DMG 3/4, Rng 6", Ignores Cover, Torrent (1"), Fire', points: 4 },
  { id: "meltaPistol", name: "Melta Pistol", profile: 'ATK 4, Hit User, DMG 6/3, Rng 3", Piercing (-5), MW (4)', points: 7 },
  { id: "phosphorBlastPistol", name: "Phosphor Blast Pistol", profile: 'ATK 4, Hit User, DMG 3/4, Rng 8", Blast (1"), Quick', points: 4 },
  { id: "plasmaPistol", name: "Plasma Pistol", profile: 'ATK 4, Hit User, DMG (Std) 4/5, Rng 8", Piercing (-3), Crits on 9+; (Supercharged): DMG 5/6, Rng 8", Piercing (-4), Crits on 9+, Risky', points: 7, cardProfiles: [
    { label: "Standard", profile: 'ATK 4, Hit User, DMG 4/5, Rng 8", Piercing (-3), Crits on 9+' },
    { label: "Supercharged", profile: 'ATK 4, Hit User, DMG 5/6, Rng 8", Piercing (-4), Crits on 9+, Risky' }
  ] },
  { id: "rokkitPistol", name: "Rokkit Pistol", profile: 'ATK 6, Hit User, DMG 4/5, Rng 8", Blast (1")', points: 7 },
  { id: "slugga", name: "Slugga", profile: 'ATK 6, Hit User, DMG 1/2, Rng 8, Quick"', points: 2 },
  { id: "warpflamePistol", name: "Warpflame Pistol", profile: 'ATK 4, Hit User+2, DMG 3/4, Rng 6", Ignores Cover, Piercing (-2), Torrent (1"), Fire', points: 6 },
  { id: "fragGrenade", name: "Frag Grenades", profile: 'ATK 4, Hit User-2, DMG 2/4, Rng 6", Blast (2"), Ignores Cover, Quick', points: 5 },
  { id: "krakGrenade", name: "Krak Grenades", profile: 'ATK 4, Hit User-2, DMG 4/5, Rng 6", Piercing (-2), Ignores Cover, Quick', points: 6 },
  { id: "meltaBomb", name: "Melta Grenades", profile: 'ATK 4, Hit User-2, DMG 5/6, Rng 6", Blast (2"), Piercing (-2), Ignores Cover', points: 8 },

  // --- Light / Medium Ranged ---
  { id: "autoLasgun", name: "Auto/Lasgun", profile: "ATK 4, Hit User, DMG 2/3", points: 3 },
  { id: "boltGun", name: "Bolt Gun", profile: "ATK 4, Hit User, DMG 3/4, Piercing Crits (-2)", points: 5 },
  { id: "gaussBlaster", name: "Gauss Blaster", profile: "ATK 4, Hit User, DMG 4/5, Piercing (-2)", points: 7 },
  { id: "hvyShotgun", name: "Hvy. Shotgun", profile: 'ATK 4, Hit User+2, DMG 4/4, Rng 8"', points: 4 },
  { id: "infernoBoltGun", name: "Inferno Bolt Gun", profile: "ATK 4, Hit User, DMG 3/4, Piercing (-2)", points: 6 },
  { id: "ionRifle", name: "Ion Rifle", profile: "ATK 4, Hit User, DMG 4/5, Piercing Crits (-2)", points: 6 },
  { id: "neutronBlaster", name: "Neutron Blaster", profile: "ATK 4, Hit User, DMG 3/3, MW (2)", points: 5 },
  { id: "pulseCarbine", name: "Pulse Carbine", profile: "ATK 4, Hit User, DMG 4/5, Reroll (1)", points: 5 },
  { id: "shotgun", name: "Shotgun", profile: 'ATK 4, Hit User+2, DMG 3/3, Rng 8"', points: 3 },
  { id: "shoota", name: "Shoota", profile: "ATK 6, Hit User, DMG 1/2", points: 4 },
  { id: "shurikenRifle", name: "Shuriken Rifle", profile: "ATK 4, Hit User, DMG 3/4, Piercing (-2)", points: 6 },
  { id: "teslaCarbine", name: "Tesla Carbine", profile: 'ATK 5, Hit User, DMG 3/3, Deals MW (2) to Fighters within 2" of target', points: 6 },

  // --- Special ---
  { id: "flamer", name: "Flamer", profile: 'ATK 4, Hit User+2, DMG 4/4, Rng 10", Ignores Cover, Torrent (2"), Fire', points: 8 },
  { id: "grenadeLauncher", name: "Grenade Launcher", profile: 'ATK 4, Hit User, DMG (Frag) 2/4, Blast (2"); (Krak): DMG 4/5, Piercing (-2)', points: 8 , cardProfiles: [
    { label: "Frag", profile: 'ATK 4, Hit User, DMG 2/4, Blast (2")' },
    { label: "Krak", profile: 'ATK 4, Hit User, DMG 4/5, Piercing (-2)' }
  ] },
  { id: "meltaGun", name: "Melta Gun", profile: 'ATK 4, Hit User, DMG 6/3, Rng 6", Piercing (-5), MW (4)', points: 10 },
  { id: "neutronRailRifle", name: "Neutron Rail Rifle", profile: "ATK 4, Hit User, DMG 4/4, MW (2)", points: 6 },
  { id: "plasmaGun", name: "Plasma Gun", profile: 'ATK 4, Hit User, DMG (Std) 4/6, Piercing (-3), Crits on 9+; (Supercharged): DMG 5/6, Piercing (-4), Crits on 9+, Risky', points: 10, cardProfiles: [
    { label: "Standard", profile: 'ATK 4, Hit User, DMG 4/6, Piercing (-3), Crits on 9+' },
    { label: "Supercharged", profile: 'ATK 4, Hit User, DMG 5/6, Piercing (-4), Crits on 9+, Risky' }
  ] },
  { id: "scopedBigShoota", name: "Scoped Big Shoota", profile: 'ATK 5, Hit User+1, DMG 3/3, MW (2), Heavy (Dash)', points: 8 },
  { id: "shredder", name: "Shredder", profile: "ATK 4, Hit User, DMG 4/5, Piercing (-3)", points: 8 },
  { id: "sniperRifle", name: "Sniper Rifle", profile: 'ATK 4, Hit User+1, DMG 3/3, Piercing (-2), Ignores Cover, MW (3), Crits on 9+', points: 12 },
  { id: "synapticDisintegrator", name: "Synaptic Disintegrator", profile: 'ATK 4, Hit User+1, DMG 4/3, Piercing (-4), Ignores Cover, MW (1), Crits on 9+', points: 11 },
  { id: "warpflamer", name: "Warpflamer", profile: 'ATK 4, Hit User+2, DMG 4/4, Rng 8", Ignores Cover, Torrent (2"), Piercing (-2), Fire', points: 10 },

  // --- Heavy ---
  { id: "eavyRokkitLauncha", name: "‘Eavy Rokkit Launcha", profile: 'ATK 6, Hit User+2, DMG 4/5, Blast (1"), Heavy (Dash)', points: 12 },
  { id: "bigShoota", name: "Big Shoota", profile: "ATK 6, Hit User, DMG 3/4", points: 8 },
  { id: "chaincannon", name: "Chaincannon", profile: 'ATK 6, Hit User, DMG 4/4, Reroll (1), Heavy (Dash)', points: 10 },
  { id: "fragCannon", name: "Frag Cannon", profile: 'ATK 4, Hit User, DMG (Shell) 5/7, Piercing (-3); (Shrapnel): DMG 4/5, Blast (2")', points: 10, cardProfiles: [
    { label: "Shrapnel", profile: 'ATK 4, Hit User, DMG 4/5, Blast (2")' },
    { label: "Shell", profile: 'ATK 4, Hit User, DMG 5/7, Piercing (-3)' }
  ] },
  { id: "heavyBolter", name: "Heavy Bolter", profile: 'ATK 5, Hit User, DMG 5/6, Reroll (1), Heavy (Dash)', points: 10 },
  { id: "heavyFlamer", name: "Heavy Flamer", profile: 'ATK 4, Hit User+2, DMG 5/5, Rng 10", Ignores Cover, Piercing (-2), Torrent (2"), Fire', points: 11 },
  { id: "heavyStubber", name: "Heavy Stubber", profile: 'ATK 5, Hit User, DMG 4/5, Heavy (Dash)', points: 6 },
  { id: "lascannon", name: "Lascannon", profile: 'ATK 4, Hit User, DMG 6/7, Piercing (-4), MW (2), Heavy (Dash)', points: 12 },
  { id: "missileLauncher", name: "Missile Launcher", profile: 'Mode (Krak): ATK 4, Hit User, DMG 6/7, Piercing (-3), Heavy (Dash); (Frag): DMG 4/5, Blast (2"), Piercing Crits (-2), Heavy (Dash)', points: 10, cardProfiles: [
    { label: "Krak", profile: 'ATK 4, Hit User, DMG 6/7, Piercing (-3), Heavy (Dash)' },
    { label: "Frag", profile: 'ATK 4, Hit User, DMG 4/5, Piercing Crits (-2), Blast 2", Heavy (Dash)' }
  ] },
  { id: "multiMelta", name: "Multi Melta", profile: 'ATK 4, Hit User, DMG 6/3, MW (4), Heavy (Dash), Piercing (-5)', points: 11 },
  { id: "plasmaCannon", name: "Plasma Cannon", profile: 'Mode (Std): ATK 4, Hit User, DMG 5/6, Blast (2"), Piercing (-3), Heavy (Dash), Crits on 9+; (Supercharged): DMG 6/6, Blast (2"), Piercing (-4), Heavy (Dash), Crits on 9+, Risky', points: 12, cardProfiles: [
    { label: "Standard", profile: 'ATK 4, Hit User, DMG 5/6, Piercing (-3), Blast (2"),Heavy (Dash), Crits on 9+' },
    { label: "Supercharge", profile: 'ATK 4, Hit User, DMG 6/6, Piercing (-4), Blast 2", Heavy (Dash), Crits on 9+, Risky' }
  ] },
  { id: "rokkitLauncha", name: "Rokkit Launcha", profile: 'ATK 6, Hit User, DMG 4/5, Blast (1")', points: 9 },
  { id: "shurikenCannon", name: "Shuriken Cannon", profile: "ATK 5, Hit User, DMG 4/5", points: 7 },
  { id: "soulreaperCannon", name: "Soulreaper Cannon", profile: "ATK 6, Hit User, DMG 4/5, Piercing Crits (-2)", points: 12 },
  { id: "wraithCannon", name: "Wraith Cannon", profile: 'ATK 4, Hit User, DMG 6/3, MW (3), Heavy (Dash), Piercing (-4), Crits on 9+', points: 11 }
]),
    weaponCategories: [
      { key: "light", label: "Light / Medium", ids: ["autoLasgun","boltGun","gaussBlaster","hvyShotgun","infernoBoltGun","ionRifle","neutronBlaster","pulseCarbine","shotgun","shoota","shurikenRifle","teslaCarbine"] },
      { key: "special", label: "Special", ids: ["flamer","grenadeLauncher","meltaGun","neutronRailRifle","plasmaGun","scopedBigShoota","shredder","sniperRifle","synapticDisintegrator","warpflamer"] },
      { key: "heavy", label: "Heavy", ids: ["eavyRokkitLauncha","bigShoota","chaincannon","fragCannon","heavyBolter","heavyFlamer","heavyStubber","lascannon","missileLauncher","multiMelta","plasmaCannon","rokkitLauncha","shurikenCannon","soulreaperCannon","wraithCannon"] }
    ],
    weaponMounts: [
      { id: "hull", name: "Hull Mounted", shortName: "Hull", points: 0 },
      { id: "side", name: "Side Mounted", shortName: "Side", points: 5 },
      { id: "turret", name: "Turret Mounted", shortName: "Turret", points: 10 }
    ],
    upgrades: {
      hull: [
        { id: "spikedHull", name: "Spiked Hull", points: 4, description: "Enemy Fighters suffer D3 MW when they successfully board this Vehicle." },
        { id: "reinforcedRam", name: "Reinforced Ram", points: 4, description: "+1 Ram stat and -1 Speed.", statMods: { ram: 1, speed: -1 } },
        { id: "weldedArmourPlates", name: "Welded Armour Plates", points: 9, description: "The Vehicle gets +1 DR and -2 Speed.", statMods: { dr: 1, speed: -2 } },
        { id: "rollCage", name: "Roll Cage", points: 6, description: "Can modify the Out of Control result by up to +/-2." },
        { id: "bulldozerBlade", name: "Bulldozer Blade", points: 5, description: "+1 Ram Stat, automatically destroys Light Terrain if rammed.", statMods: { ram: 1 } },
        { id: "improvedSuspension", name: "Improved Suspension", points: 4, description: "Ignores Difficult Terrain." },
        { id: "redPaintJob", name: "Red Paint Job", points: 0, description: "+2\" Speed Stat. Vehicle MUST be painted Red.", statMods: { speed: 2 } },
        { id: "wobblySuspension", name: "Wobbly Suspension", points: 5, description: "+1 Handling, though it has an additional -1 to hit when shooting after using Thrusters of either kind.", statMods: { handling: -1 } },
        { id: "loudHorn", name: "Loud Horn", points: 4, description: "Can be used at any point during the Drive action - the Closest Enemy Fighter (not Vehicle) within 6\" gets -1 AP this turn." },
        { id: "bluePaintJob", name: "Blue Paint Job", points: 0, description: "Once per game, ignore one Out of Control result. You know why. Vehicle MUST be painted blue." },
        { id: "experimentalSteering", name: "Experimental Steering", points: 3, description: "An additional Free 90 degree turn each activation, however if you fail a Handling Check, roll TWICE on the Out of Control table." }
      ],
      engine: [
        { id: "nitroBoost", name: "Nitro Boost", points: 6, description: "One Normal Thruster Action per Activation gives a 6 +D3\" move instead of 4+D3\"." },
        { id: "superchargedEngine", name: "Supercharged Engine", points: 6, description: "+2\" Speed Stat.", statMods: { speed: 2 } },
        { id: "twinTurbos", name: "Twin Turbos", points: 9, description: "One Normal Thrust Action per turn is 0 AP." },
        { id: "highTorqueEngine", name: "High Torque Engine", points: 4, description: "+1 Ram if the Vehicle has performed any (Normal or Reckless) Thrust Actions." },
        { id: "fuelInjection", name: "Fuel Injection", points: 4, description: "First Normal Thruster Action each activation gives no Shooting Modifiers." },
        { id: "reverseTurbo", name: "Reverse Turbo", points: 3, description: "Thrust Actions can be used backwards, but always count as Reckless." },
        { id: "experimentalNitro", name: "Experimental Nitro", points: 6, description: "Reckless Thrusters move 8+D3\". After using these, roll a D12; on 1-2, Engine on Fire (Cannot be rerolled)." },
        { id: "shokkIgnition", name: "Shokk Ignition", points: 4, description: "When this Vehicle Activates, roll a D12: 1: Doesn't start, Activation is lost. 12: May make another Activation immediately after this." }
      ],
      crew: [
        { id: "veteranDriver", name: "Veteran Driver", points: 6, description: "+1 Handling Stat.", statMods: { handling: -1 } },
        { id: "madDriver", name: "Mad Driver", points: 6, description: "First Reckless Action each turn automatically succeeds. Additional Reckless Actions still use the cumulative D12's e.g. Second Reckless Action rolls 2D12, Third 3D12, etc." },
        { id: "veteranGunner", name: "Veteran Gunner", points: 5, description: "Ignore the first Shooting Modifier (caused by driving) each turn." },
        { id: "spotter", name: "Spotter", points: 5, description: "Once per turn, ignore Cover in a Shooting Action." },
        { id: "angryGits", name: "Angry Gits/Squigs/Goons", points: 3, description: "Any Boarders get -1 to Hit in Close Combat." },
        { id: "crazyGunner", name: "Crazy Gunner", points: 7, description: "After Destroying a Vehicle with a shooting action, immediately make another Free Shooting Action. Once per Turn only." },
        { id: "triggerHappy", name: "Trigger Happy", points: 5, description: "Vehicle gets Reroll (SR) on Shooting Attacks." },
        { id: "mekboyPassenger", name: "Mekboy Passenger", points: 7, description: "Repair D3 HP on a 5+ each Activation. Counts as a Passenger towards the Transport Limit." },
        { id: "backseatDrive", name: "Backseat Drive", points: 4, description: "Any Passengers aboard the Vehicle may spend AP to reroll Failed Handling Checks. (Imagine Orks shouting directions!)" },
        { id: "luckyGrot", name: "Lucky Grot", points: 5, description: "Once per Battle, ignore a single Out of Control table result. Nobody knows how." }
      ]
    }
  };
})();
