(function () {
  "use strict";

  var button = document.getElementById("generate-card");
  if (!button) return;

  button.addEventListener("click", function () {
    var data = window.ChopShopBuilder.getCardData();
    if (!data) return;
    openCardPreview(data);
  });

  function openCardPreview(data) {
    closeCardPreview();

    var overlay = document.createElement("div");
    overlay.id = "generated-card-overlay";
    overlay.innerHTML =
      '<div id="generated-card-toolbar">' +
        '<button type="button" id="card-back">Back</button>' +
        '<button type="button" id="card-print">Print</button>' +
      '</div>' +
      '<main class="card-wrap">' + buildCardMarkup(data) + '</main>';

    document.body.appendChild(overlay);
    document.body.classList.add("print-card-mode");
    document.body.style.overflow = "hidden";

    var style = document.getElementById("generated-card-style");
    if (!style) {
      style = document.createElement("style");
      style.id = "generated-card-style";
      document.head.appendChild(style);
    }
    style.textContent = cardCss();

    document.getElementById("card-back").addEventListener("click", closeCardPreview);
    document.getElementById("card-print").addEventListener("click", function () {
      window.print();
    });
  }

  function closeCardPreview() {
    var overlay = document.getElementById("generated-card-overlay");
    if (overlay) overlay.remove();
    document.body.classList.remove("print-card-mode");
    document.body.style.overflow = "";
  }

  function buildCardMarkup(data) {
    var stats = data.stats || {};
    var statItems = [
      ["Speed", formatStat("speed", stats.speed)],
      ["AP", formatStat("ap", stats.ap)],
      ["Handling", formatStat("handling", stats.handling)],
      ["DEF", formatStat("def", stats.def)],
      ["Hull Points", formatStat("hull", stats.hull)],
      ["Ram", formatStat("ram", stats.ram)],
      ["DR", formatStat("dr", stats.dr)],
      ["Transport", formatStat("transport", stats.transport)]
    ];

    var weapons = data.weapons.length
      ? '<section class="card-section weapons-section">' + buildWeapons(data) + '</section>'
      : "";

    var upgrades = buildUpgrades(data.upgrades);

    return '<article class="vehicle-card">' +
      '<header class="card-header"><div><div class="card-kicker">Road Rage Vehicle</div><h1>' + esc(data.name) + '</h1>' +
      '<div class="chassis-name">' + esc(data.chassis.name) + '</div></div>' +
      '<div class="points"><strong>' + esc(data.points) + '</strong><span>PTS</span></div></header>' +
      buildHpPips(data.stats.hull) +
      '<section class="stats-row">' + statItems.map(function (item) {
        return '<div class="stat"><span>' + esc(item[0]) + '</span><strong>' + esc(item[1]) + '</strong></div>';
      }).join("") + '</section>' +
      '<div class="card-body">' + weapons + upgrades + '</div>' +
    '</article>';
  }

  function buildWeapons(data) {
    var rows = [];
    data.weapons.forEach(function (weapon) {
      weapon.profiles.forEach(function (entry, index) {
        var parsed = parseProfile(entry.profile, data.stats.shoot);
        var displayName = weapon.name + (entry.label ? " — " + entry.label : "");
        var special = parsed.special.slice();
        if (index === 0) special.unshift(weapon.mount);
        rows.push('<div class="weapon-row">' +
          '<div class="weapon-name">' + esc(displayName) + '</div>' +
          '<div>' + esc(parsed.atk) + '</div>' +
          '<div>' + esc(parsed.hit) + '</div>' +
          '<div>' + esc(parsed.dmg) + '</div>' +
          '<div class="weapon-rules">' + esc(special.join(", ") || "—") + '</div>' +
        '</div>');
      });
    });

    return '<div class="weapon-table">' +
      '<div class="weapon-head"><div>Weapon</div><div>ATK</div><div>To Hit</div><div>DMG</div><div>Special Rules</div></div>' +
      rows.join("") + '</div>';
  }

  function parseProfile(profile, shoot) {
    var parts = String(profile || "").split(",").map(function (p) { return p.trim(); }).filter(Boolean);
    var atk = "—", hit = "—", dmg = "—", special = [];

    parts.forEach(function (part) {
      var m;
      if ((m = part.match(/^ATK\s+(.+)$/i))) { atk = m[1]; return; }
      if ((m = part.match(/^Hit\s+User(?:([+-])(\d+))?$/i))) {
        var value = Number(shoot);
        // Hit modifiers apply to the dice result, so they move the target number
        // in the opposite direction: Hit User+2 on Shoot 7+ becomes To Hit 5+.
        if (m[1] && m[2]) value += (m[1] === "+" ? -1 : 1) * Number(m[2]);
        hit = value + "+";
        return;
      }
      if ((m = part.match(/^DMG\s+(.+)$/i))) { dmg = m[1]; return; }
      special.push(part);
    });
    return { atk: atk, hit: hit, dmg: dmg, special: special };
  }

  function buildUpgrades(groups) {
    var sections = [
      ["Hull Upgrades", groups.hull || []],
      ["Engine Upgrades", groups.engine || []],
      ["Crew Upgrades", groups.crew || []]
    ].filter(function (entry) { return entry[1].length; });

    if (!sections.length) return "";

    return '<section class="card-section upgrades-section"><div class="upgrade-columns">' +
      sections.map(function (entry) {
        return '<div class="upgrade-group"><h3>' + esc(entry[0]) + '</h3>' +
          entry[1].map(function (upgrade) {
            return '<p><strong>' + esc(upgrade.name) + ':</strong> ' + esc(upgrade.description) + '</p>';
          }).join("") + '</div>';
      }).join("") + '</div></section>';
  }

  function buildHpPips(hull) {
    var hp = Math.max(0, Number(hull) || 0);
    if (!hp) return "";
    var pips = "";
    for (var i = 0; i < hp; i++) {
      pips += '<span class="hp-pip"></span>';
    }
    return '<section class="hp-track"><span class="hp-label">HP</span><div class="hp-pips">' + pips + '</div></section>';
  }

  function formatStat(key, value) {
    if (value === null || value === undefined || value === "") return "—";
    if (key === "speed") return value + '"';
    if (key === "handling" || key === "def") return value + "+";
    return String(value);
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function cardCss() {
    return `
      :root{--orange:#ff9f1c;--ink:#101214;--paper:#e9e5dc;--muted:#5b5f63}
      *{box-sizing:border-box}
      #generated-card-overlay{
        position:fixed;
        inset:0;
        z-index:9999;
        display:block;
        overflow:auto;
        padding:24px;
        box-sizing:border-box;
        background:rgba(255,255,255,.95);
        font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
        color:var(--ink);
      }
      #generated-card-toolbar{
        width:820px;
        max-width:100%;
        margin:0 auto 12px;
        display:flex;
        justify-content:flex-end;
        gap:10px;
      }
      #generated-card-toolbar button{
        padding:8px 14px;
        border:1px solid #222;
        border-radius:8px;
        background:rgba(255,255,255,.95);
        color:#111;
        font-weight:800;
        cursor:pointer;
      }
      .card-wrap{padding:0;display:flex;justify-content:center}

      /* Exact Fighter Forge card canvas: 820 x 660 px, landscape. */
      .vehicle-card{
        width:820px;
        height:660px;
        position:relative;
        overflow:hidden;
        background:#fff url("vehicle-card-bg.jpg") center center / 100% 100% no-repeat;
        border:2px solid #151719;
        box-shadow:0 18px 50px rgba(0,0,0,.45);
        padding:20px 22px 18px;
        display:flex;
        flex-direction:column;
      }
      .vehicle-card:before{
        content:none;
      }
      .card-header,.stats-row,.card-body{position:relative;z-index:1}

      .card-header{
        display:flex;
        align-items:flex-start;
        justify-content:space-between;
        gap:18px;
        padding-bottom:9px;
        border-bottom:4px solid var(--ink);
      }
      .card-kicker{
        font-family:"Slackey",system-ui,sans-serif;
        color:#fff;
        font-size:12px;
        letter-spacing:.03em;
        text-transform:uppercase;
      }
      .card-header h1{
        margin:1px 0 0;
        font-family:"Slackey",system-ui,sans-serif;
        color:#fff;
        font-size:27px;
        line-height:1.02;
        text-transform:uppercase;
      }
      .chassis-name{
        margin-top:3px;
        font-family:"Kdam Thmor Pro",system-ui,sans-serif;
        font-size:15px;
        text-transform:uppercase;
        color:#fff;
      }
      .points{
        min-width:76px;
        border:3px solid var(--ink);
        border-radius:8px;
        background:rgba(255,255,255,.95);
        padding:5px 8px 4px;
        text-align:center;
        line-height:1;
      }
      .points strong{
        display:block;
        font-family:"Kdam Thmor Pro",system-ui,sans-serif;
        font-size:23px;
      }
      .points span{
        display:block;
        margin-top:3px;
        font-size:9px;
        font-weight:900;
        letter-spacing:.12em;
      }

      .stats-row{
        display:grid;
        grid-template-columns:repeat(8,1fr);
        gap:5px;
        margin:9px 0 10px;
      }
      .stat{
        min-width:0;
        text-align:center;
        border:2px solid var(--ink);
        border-radius:8px;
        background:rgba(255,255,255,.95);
        overflow:hidden;
      }
      .stat span{
        display:block;
        padding:3px 2px 2px;
        background:var(--ink);
        color:#fff;
        font-size:10.6px;
        font-weight:900;
        text-transform:uppercase;
        letter-spacing:.03em;
        white-space:nowrap;
      }
      .stat strong{
        display:block;
        padding:7px 1px 8px;
        font-family:"Kdam Thmor Pro",system-ui,sans-serif;
        font-size:16px;
        line-height:1.08;
      }

      .hp-track{
        position:relative;
        z-index:1;
        display:flex;
        align-items:center;
        gap:7px;
        min-height:28px;
        margin:9px 0 8px;
      }
      .hp-label{
        flex:0 0 auto;
        font-family:"Slackey",system-ui,sans-serif;
        color:#fff;
        font-size:10px;
        line-height:1;
        text-transform:uppercase;
        text-shadow:2px 2px 3px rgba(0,0,0,.7);
      }
      .hp-pips{
        display:flex;
        flex-wrap:wrap;
        gap:3px;
        align-items:center;
      }
      .hp-pip{
        width:24px;
        height:24px;
        border:2px solid var(--ink);
        border-radius:50%;
        background:rgba(255,255,255,.95);
        display:block;
      }

      .card-body{
        display:flex;
        flex-direction:column;
        gap:9px;
        min-height:0;
        flex:1;
        align-items:stretch;
      }
      .card-section{min-width:0}
      .card-section h2{
        margin:0 0 5px;
        padding-bottom:2px;
        border-bottom:3px solid var(--orange);
        font-family:"Slackey",system-ui,sans-serif;
        font-size:14px;
        text-transform:uppercase;
      }

      .weapons-section,
      .upgrades-section{width:100%}
      .upgrades-section{
        display:flex;
        flex-direction:column;
        flex:1 1 auto;
        min-height:0;
      }

      .weapon-table{
        border:2px solid var(--ink);
        border-radius:8px;
        background:rgba(255,255,255,.95);
        overflow:hidden;
      }
      .weapon-head,.weapon-row{
        display:grid;
        grid-template-columns:20% 8% 10% 10% 52%;
        align-items:stretch;
      }
      .weapon-head{
        background:var(--ink);
        color:#fff;
        font-size:10.6px;
        font-weight:900;
        text-transform:uppercase;
        letter-spacing:.04em;
      }
      .weapon-head>div{padding:3px 4px}
      .weapon-row{
        border-top:1px solid #aaa;
        font-size:14px;
        line-height:1.18;
      }
      .weapon-row:first-of-type{border-top:0}
      .weapon-row>div{
        padding:4px;
        border-right:1px solid #bbb;
        overflow-wrap:anywhere;
      }
      .weapon-row>div:last-child{border-right:0}
      .weapon-head>div:nth-child(2),
      .weapon-head>div:nth-child(3),
      .weapon-head>div:nth-child(4),
      .weapon-row>div:nth-child(2),
      .weapon-row>div:nth-child(3),
      .weapon-row>div:nth-child(4){
        text-align:center;
      }
      .weapon-row .weapon-name,
      .weapon-row>div:nth-child(2),
      .weapon-row>div:nth-child(3),
      .weapon-row>div:nth-child(4){
        display:flex;
        align-items:center;
      }
      .weapon-row>div:nth-child(2),
      .weapon-row>div:nth-child(3),
      .weapon-row>div:nth-child(4){
        justify-content:center;
      }
      .weapon-head>div:first-child,
      .weapon-row>div:first-child{
        padding-left:.6em;
      }

      .weapon-name{
        font-family:"Kdam Thmor Pro",system-ui,sans-serif;
        font-size:12px;
      }
      .weapon-rules{font-size:13px;line-height:1.18}

      .upgrade-columns{
        flex:1 1 auto;
        min-height:0;
        column-count:2;
        column-gap:18px;
        column-fill:balance;
        background:rgba(255,255,255,.95);
        border:2px solid var(--ink);
        border-radius:8px;
        padding:10px;
      }
      .upgrade-group{
        break-inside:avoid;
        margin:0 0 8px;
      }
      .upgrade-group h3{
        margin:0 0 2px;
        font-family:"Kdam Thmor Pro",system-ui,sans-serif;
        font-size:14px;
        text-transform:uppercase;
        border-bottom:1px solid #888;
      }
      .upgrade-group p{
        margin:0;
        padding:5px 0;
        border-bottom:1px solid #a9a9a9;
        font-size:13.5px;
        line-height:1.22;
        break-inside:avoid;
      }
      .upgrade-group p + p{
        margin-top:8px;
      }
      .upgrade-group p:last-child{border-bottom:0}
      .upgrade-group p strong{
        font-family:"Kdam Thmor Pro",system-ui,sans-serif;
        font-weight:400;
      }


      
      .card-kicker,
      .card-header h1,
      .chassis-name{
        text-shadow:3px 3px 5px rgba(0,0,0,.7);
      }

      .hp-label{
        text-shadow:2px 2px 3px rgba(0,0,0,.7);
      }

@media print{
        html,
        body,
        body.print-card-mode{
          background:#fff!important;
          background-color:#fff!important;
          margin:0!important;
          padding:0!important;
        }
        body.print-card-mode > :not(#generated-card-overlay):not(style):not(script){
          display:none!important;
        }
        body.print-card-mode #generated-card-overlay{
          display:block!important;
          position:static!important;
          inset:auto!important;
          overflow:visible!important;
          padding:0!important;
          background:#fff!important;
          background-color:#fff!important;
        }
        body.print-card-mode #generated-card-toolbar{
          display:none!important;
        }
        body.print-card-mode .card-wrap{
          display:block!important;
          padding:0!important;
          margin:0!important;
          background:#fff!important;
        }
        body.print-card-mode .vehicle-card{
          width:820px!important;
          height:660px!important;
          margin:0 auto!important;
          box-shadow:none!important;
          background:#fff url("vehicle-card-bg.jpg") center center / 100% 100% no-repeat!important;
        }
        *{
          -webkit-print-color-adjust:exact!important;
          print-color-adjust:exact!important;
        }
      }

      @media(max-width:860px){
        .card-wrap{padding:10px;justify-content:flex-start;overflow:auto}
      }
    `;
  }
})();
