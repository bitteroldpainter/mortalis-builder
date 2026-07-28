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
    var win = window.open("", "_blank");
    if (!win) {
      alert("The card preview was blocked by the browser. Please allow pop-ups for Chop Shop and try again.");
      return;
    }

    var html = buildPreviewDocument(data);
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  function buildPreviewDocument(data) {
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
      ? '<section class="card-section weapons-section"><h2>Weapons</h2>' + buildWeapons(data) + '</section>'
      : "";

    var upgrades = buildUpgrades(data.upgrades);

    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + esc(data.name) + ' — Vehicle Card</title>' +
      '<link rel="preconnect" href="https://fonts.googleapis.com">' +
      '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
      '<link href="https://fonts.googleapis.com/css2?family=Kdam+Thmor+Pro&family=Slackey&display=swap" rel="stylesheet">' +
      '<style>' + cardCss() + '</style></head><body>' +
      '<div class="preview-toolbar"><button onclick="window.print()">Print Card</button><button onclick="window.close()">Close</button></div>' +
      '<main class="card-wrap"><article class="vehicle-card">' +
        '<header class="card-header"><div><div class="card-kicker">Road Rage Vehicle</div><h1>' + esc(data.name) + '</h1>' +
        '<div class="chassis-name">' + esc(data.chassis.name) + '</div></div>' +
        '<div class="points"><strong>' + esc(data.points) + '</strong><span>PTS</span></div></header>' +
        buildHpPips(data.stats.hull) +
        '<section class="stats-row">' + statItems.map(function (item) {
          return '<div class="stat"><span>' + esc(item[0]) + '</span><strong>' + esc(item[1]) + '</strong></div>';
        }).join("") + '</section>' +
        '<div class="card-body">' + weapons + upgrades + '</div>' +
      '</article></main></body></html>';
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

    return '<section class="card-section upgrades-section"><h2>Upgrades</h2><div class="upgrade-columns">' +
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
      html,body{margin:0;background:#202326;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink)}
      .preview-toolbar{position:sticky;top:0;z-index:5;display:flex;justify-content:center;gap:10px;padding:12px;background:#151719;border-bottom:1px solid #444}
      .preview-toolbar button{padding:8px 16px;border:1px solid #777;border-radius:6px;background:#26292c;color:#fff;font-weight:700;cursor:pointer}
      .card-wrap{padding:24px;display:flex;justify-content:center}

      /* Exact Fighter Forge card canvas: 820 x 660 px, landscape. */
      .vehicle-card{
        width:820px;
        height:660px;
        position:relative;
        overflow:hidden;
        background:var(--paper);
        border:2px solid #151719;
        box-shadow:0 18px 50px rgba(0,0,0,.45);
        padding:20px 22px 18px;
        display:flex;
        flex-direction:column;
      }
      .vehicle-card:before{
        content:"";
        position:absolute;
        inset:0;
        pointer-events:none;
        background:
          linear-gradient(145deg,rgba(255,255,255,.45),transparent 35%),
          linear-gradient(0deg,rgba(0,0,0,.035),transparent 35%);
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
        color:var(--orange);
        font-size:12px;
        letter-spacing:.03em;
        text-transform:uppercase;
      }
      .card-header h1{
        margin:1px 0 0;
        font-family:"Slackey",system-ui,sans-serif;
        font-size:27px;
        line-height:1.02;
        text-transform:uppercase;
      }
      .chassis-name{
        margin-top:3px;
        font-family:"Kdam Thmor Pro",system-ui,sans-serif;
        font-size:15px;
        text-transform:uppercase;
        color:#4b4e51;
      }
      .points{
        min-width:76px;
        border:3px solid var(--ink);
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
        background:#f8f5ef;
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
        font-family:"Kdam Thmor Pro",system-ui,sans-serif;
        font-size:10px;
        line-height:1;
        text-transform:uppercase;
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
        background:#fff;
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
        background:#f8f5ef;
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
        column-fill:auto;
        background:#fff;
        border:2px solid var(--ink);
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
      .upgrade-group p:last-child{border-bottom:0}
      .upgrade-group p strong{
        font-family:"Kdam Thmor Pro",system-ui,sans-serif;
        font-weight:400;
      }


      @media print{
        @page{size:820px 660px;margin:0}
        html,body{width:820px;height:660px;background:#fff}
        .preview-toolbar{display:none!important}
        .card-wrap{padding:0}
        .vehicle-card{
          box-shadow:none;
          border:0;
          width:820px;
          height:660px;
        }
        *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
      }

      @media(max-width:860px){
        .card-wrap{padding:10px;justify-content:flex-start;overflow:auto}
      }
    `;
  }
})();
