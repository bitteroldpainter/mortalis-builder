(function () {
  "use strict";

  window.ROAD_RAGE_RULES = {
    version: 2,
    chassis: [
      {
        id: "bike",
        name: "Bike",
        description: "Blisteringly fast and lightly built, with barely enough room for a rider and passenger.",
        cost: 30,
        stats: { drive: 18, shoot: 7, ap: 3, handling: 7, def: 5, hull: 10, ram: 1, transport: 1 },
        limits: { crew: 1, weaponSlots: 1, transport: 1, turret: false }
      },
      {
        id: "trakk",
        name: "Trakk",
        description: "A compact tracked machine that combines speed, control and enough weight to hit back.",
        cost: 50,
        stats: { drive: 14, shoot: 7, ap: 3, handling: 5, def: 4, hull: 14, ram: 2, transport: 2 },
        limits: { crew: null, weaponSlots: null, transport: 2, turret: true }
      },
      {
        id: "buggy",
        name: "Buggy",
        description: "A versatile fighting vehicle with solid armour, useful carrying capacity and a dangerous ram.",
        cost: 75,
        stats: { drive: 12, shoot: 7, ap: 3, handling: 5, def: 4, hull: 18, ram: 3, transport: 4 },
        limits: { crew: null, weaponSlots: null, transport: 4, turret: true }
      },
      {
        id: "trukk",
        name: "Trukk",
        description: "A lumbering armoured brute built to carry a mob, absorb punishment and smash through obstacles.",
        cost: 100,
        stats: { drive: 10, shoot: 7, ap: 3, handling: 9, def: 2, hull: 24, ram: 4, transport: 8 },
        limits: { crew: null, weaponSlots: null, transport: 8, turret: true }
      }
    ],
    weapons: [],
    upgrades: {
      hull: [],
      engine: [],
      crew: []
    }
  };
})();
