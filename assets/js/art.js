/* ==========================================================================
   Kids from the block — sticker illustration engine
   Every product visual is a small inline SVG built from a recipe in
   menu-data.js (art: { kind, ...colors }). Flat fills + thick ink outline.
   ========================================================================== */
(function () {
  const INK = '#0D0B12';
  const PAPER = '#FAF7EE';
  let uidCounter = 0;
  const uid = (p) => `${p}-${(++uidCounter).toString(36)}`;

  const isDark = (hex) => {
    if (!hex || hex[0] !== '#') return false;
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) < 110;
  };

  /* ------------------------------------------------------------ primitives */
  function face(x, y, s = 1, dark = false) {
    const c = dark ? PAPER : INK;
    return `<g class="face" transform="translate(${x} ${y}) scale(${s})">
      <g class="eyes">
        <ellipse cx="-11" cy="0" rx="3.8" ry="5.2" fill="${c}"/>
        <ellipse cx="11" cy="0" rx="3.8" ry="5.2" fill="${c}"/>
        <circle cx="-10" cy="-2" r="1.4" fill="${dark ? INK : '#fff'}"/>
        <circle cx="12" cy="-2" r="1.4" fill="${dark ? INK : '#fff'}"/>
      </g>
      <ellipse cx="-20" cy="8" rx="5" ry="3" fill="#FF7FA8" opacity=".75"/>
      <ellipse cx="20" cy="8" rx="5" ry="3" fill="#FF7FA8" opacity=".75"/>
      <path d="M-6 6 Q0 13 6 6" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/>
    </g>`;
  }

  const SPARKLE_D = 'M12 0 C13 7 17 11 24 12 C17 13 13 17 12 24 C11 17 7 13 0 12 C7 11 11 7 12 0Z';
  function sparkle(x, y, s = 1, fill = '#fff') {
    return `<path d="${SPARKLE_D}" transform="translate(${x} ${y}) scale(${s}) translate(-12 -12)" fill="${fill}" stroke="${INK}" stroke-width="${2.4 / s}" stroke-linejoin="round"/>`;
  }

  function straw(x1, y1, x2, y2, c) {
    const l = `x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke-linecap="round"`;
    return `<line ${l} stroke="${INK}" stroke-width="14"/>
      <line ${l} stroke="${c}" stroke-width="8"/>
      <line ${l} stroke="#fff" stroke-width="8" stroke-dasharray="4 8" opacity=".55"/>`;
  }

  // Band that sits on top of something and drips down. drips: [[x, len], ...] sorted high→low x
  function dripPath(xL, xR, y, drips, lift = 14) {
    let d = `M${xL} ${y} C${xL} ${y - lift} ${xR} ${y - lift} ${xR} ${y} L${xR} ${y + 6}`;
    drips.forEach(([x, len]) => {
      d += ` L${x + 5} ${y + 6} L${x + 5} ${y + 6 + len} a5 5 0 0 1 -10 0 L${x - 5} ${y + 6}`;
    });
    return d + ` L${xL} ${y + 6} Z`;
  }

  function strawberry(x, y, r = 1, rot = 0) {
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${r})">
      <path d="M0 18 C-16 8 -16 -8 -10 -12 C-4 -15 4 -15 10 -12 C16 -8 16 8 0 18Z" fill="#FF3B5C" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <g fill="#FFE8A3"><circle cx="-5" cy="-3" r="1.4"/><circle cx="4" cy="-5" r="1.4"/><circle cx="0" cy="4" r="1.4"/><circle cx="-6" cy="6" r="1.2"/><circle cx="6" cy="4" r="1.2"/></g>
      <path d="M-9 -12 L-4 -18 L0 -13 L4 -18 L9 -12 Z" fill="#3DDC97" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/>
    </g>`;
  }

  function wafer(x, y, rot = 0, w = 34, h = 14) {
    return `<g transform="translate(${x} ${y}) rotate(${rot})">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="3" fill="#E7B46A" stroke="${INK}" stroke-width="3"/>
      <path d="M${-w / 2 + 8} ${-h / 2} V${h / 2} M0 ${-h / 2} V${h / 2} M${w / 2 - 8} ${-h / 2} V${h / 2} M${-w / 2} 0 H${w / 2}" stroke="#B97A34" stroke-width="2"/>
    </g>`;
  }

  function cookie(x, y, r = 16) {
    return `<g transform="translate(${x} ${y})">
      <circle r="${r}" fill="#2B1E1E" stroke="${INK}" stroke-width="3"/>
      <rect x="${-r}" y="-3" width="${2 * r}" height="6" fill="#FAF7EE" opacity=".95"/>
      <circle r="${r}" fill="none" stroke="${INK}" stroke-width="3"/>
      <circle cx="-5" cy="-8" r="1.6" fill="#4A3838"/><circle cx="6" cy="8" r="1.6" fill="#4A3838"/>
    </g>`;
  }

  function leaf(x, y, rot, color) {
    return `<g transform="translate(${x} ${y}) rotate(${rot})">
      <path d="M0 0 C-15 -10 -13 -36 0 -44 C13 -36 15 -10 0 0Z" fill="${color}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M0 -4 V-34" stroke="${INK}" stroke-width="2" opacity=".35"/>
    </g>`;
  }

  const steam = (xs, y) => xs.map((x, i) =>
    `<path class="steam" style="--d:${i * 0.45}s" d="M${x} ${y} q-8 -9 0 -18 q8 -9 0 -18" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".9"/>`
  ).join('');

  /* ------------------------------------------------------------ recipes */
  const R = {};

  R.ice = (a, withFace) => {
    const id = uid('ice');
    const cup = 'M48 64 H152 L139 184 Q138 192 130 192 H70 Q62 192 61 184 Z';
    const foamH = a.foam ? (a.foamH || 16) : 0;
    const top = a.foam ? 70 : 76;
    const liqTop = top + foamH;
    let s = straw(124, 6, 108, 150, a.straw || '#FF5B37');
    s += `<defs><clipPath id="${id}"><path d="${cup}"/></clipPath></defs>`;
    s += `<path d="${cup}" fill="#fff" fill-opacity=".35"/>`;
    s += `<g clip-path="url(#${id})">`;
    if (foamH) s += `<rect x="40" y="${top}" width="120" height="${foamH + 8}" fill="${a.foam}"/>`;
    s += `<path d="M40 ${liqTop} q15 -6 30 0 t30 0 t30 0 t30 0 V200 H40Z" fill="${a.liquid}"/>`;
    if (!a.noIce) {
      const cube = (x, y, r) => `<rect x="${x}" y="${y}" width="26" height="24" rx="6" transform="rotate(${r} ${x + 13} ${y + 12})" fill="#fff" fill-opacity=".42" stroke="${INK}" stroke-width="3"/>`;
      s += cube(66, liqTop + 4, -14) + cube(104, liqTop + 14, 12);
    } else {
      s += `<g fill="#fff" opacity=".35"><circle cx="76" cy="${liqTop + 16}" r="4"/><circle cx="118" cy="${liqTop + 30}" r="3"/><circle cx="92" cy="${liqTop + 44}" r="2.5"/><circle cx="128" cy="${liqTop + 60}" r="3.5"/></g>`;
    }
    s += `<rect x="124" y="60" width="40" height="140" fill="${INK}" opacity=".12"/></g>`;
    s += `<path d="M64 82 L71 172" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/>`;
    s += `<path d="${cup}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<rect x="42" y="56" width="116" height="14" rx="7" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>`;
    if (a.fruit === 'orange') {
      s += `<g transform="translate(150 56)"><circle r="19" fill="#FFA41B" stroke="${INK}" stroke-width="4"/><circle r="13" fill="#FFD27A"/>
        <path d="M0 -13 V13 M-13 0 H13 M-9 -9 L9 9 M9 -9 L-9 9" stroke="#FFA41B" stroke-width="2.4"/><circle r="13" fill="none" stroke="${INK}" stroke-width="2" opacity=".4"/></g>`;
    } else if (a.fruit === 'strawberry') {
      s += strawberry(150, 52, 1.25, 24);
    }
    if (withFace) s += face(100, 156, 1, isDark(a.liquid));
    return s;
  };

  R.hot = (a, withFace) => {
    const body = 'M56 72 H144 L133 186 Q132 193 125 193 H75 Q68 193 67 186 Z';
    let s = steam([82, 100, 118], 38);
    s += `<path d="${body}" fill="${PAPER}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<path d="M126 76 L117 188" stroke="${INK}" stroke-width="10" opacity=".07"/>`;
    s += `<path d="M60 108 H140 L135 160 H65 Z" fill="${a.sleeve}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<path d="M62 60 Q64 44 80 42 H120 Q136 44 138 60 Z" fill="${a.lid}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<rect x="48" y="58" width="104" height="16" rx="8" fill="${a.lid}" stroke="${INK}" stroke-width="4"/>`;
    s += `<rect x="104" y="47" width="16" height="5" rx="2.5" fill="${isDark(a.lid) ? PAPER : INK}"/>`;
    if (a.choco) s += `<path d="${dripPath(64, 136, 60, [[122, 10], [92, 16], [74, 7]], 0)}" fill="#4A2512" stroke="${INK}" stroke-width="3" stroke-linejoin="round" opacity=".95"/>`;
    s += sparkle(124, 176, 0.5, a.sleeve);
    if (withFace) s += face(100, 132, 1, isDark(a.sleeve));
    return s;
  };

  R.demi = (a, withFace) => {
    const id = uid('demi');
    const cup = 'M48 100 H152 Q152 168 100 168 Q48 168 48 100 Z';
    let s = steam([88, 108], 74);
    s += `<ellipse cx="100" cy="172" rx="82" ry="17" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>`;
    s += `<ellipse cx="100" cy="169" rx="46" ry="8" fill="none" stroke="${INK}" stroke-width="2" opacity=".2"/>`;
    s += `<path d="M146 112 C178 108 180 148 140 150" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>`;
    s += `<path d="M146 112 C178 108 180 148 140 150" fill="none" stroke="${a.cup}" stroke-width="7" stroke-linecap="round"/>`;
    s += `<defs><clipPath id="${id}"><path d="${cup}"/></clipPath></defs>`;
    s += `<path d="${cup}" fill="${a.cup}"/>`;
    s += `<g clip-path="url(#${id})"><rect x="40" y="114" width="120" height="12" fill="${a.band}"/>
      <path d="M44 120 h10 v-4 h8 v8 h8 v-4 h10 v-4 h8 v8 h8 v-4 h10 v-4 h8 v8 h8 v-4 h10 v-4 h8 v8 h8 v-4 h10" fill="none" stroke="${isDark(a.band) ? PAPER : INK}" stroke-width="1.6" opacity=".55"/>
      <rect x="126" y="96" width="40" height="80" fill="${INK}" opacity=".12"/></g>`;
    s += `<path d="${cup}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<ellipse cx="100" cy="100" rx="52" ry="13" fill="${a.crema}" stroke="${INK}" stroke-width="4"/>`;
    s += `<ellipse cx="94" cy="98" rx="30" ry="5.5" fill="#fff" opacity=".25"/>`;
    s += `<g fill="#fff" opacity=".45"><circle cx="122" cy="101" r="2.2"/><circle cx="128" cy="97" r="1.5"/><circle cx="76" cy="103" r="1.8"/></g>`;
    if (withFace) s += face(100, 142, 0.95, isDark(a.cup));
    return s;
  };

  R.v60 = (a, withFace) => {
    const id = uid('v60');
    const server = 'M62 124 H138 L146 184 Q147 193 138 193 H62 Q53 193 54 184 Z';
    let s = `<path d="M143 138 C170 138 170 178 146 178" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
    s += `<defs><clipPath id="${id}"><path d="${server}"/></clipPath></defs>`;
    s += `<path d="${server}" fill="#fff" fill-opacity=".4"/>`;
    s += `<g clip-path="url(#${id})"><path d="M40 156 q15 -5 30 0 t30 0 t30 0 t30 0 V200 H40Z" fill="#4A2512"/><rect x="118" y="120" width="40" height="80" fill="${INK}" opacity=".12"/></g>`;
    s += `<path d="M66 134 L68 180" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".6"/>`;
    s += `<path d="${server}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<circle class="drip" cx="100" cy="132" r="4.5" fill="#4A2512" stroke="${INK}" stroke-width="2"/>`;
    s += `<ellipse cx="100" cy="122" rx="48" ry="9" fill="${a.color}" stroke="${INK}" stroke-width="4"/>`;
    s += `<path d="M50 50 L58 38 L66 50 L74 38 L82 50 L90 38 L98 50 L106 38 L114 50 L122 38 L130 50 L138 38 L146 50 L150 50" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M40 60 H160 L124 118 H76 Z" fill="${a.color}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<path d="M64 62 L86 116 M100 62 V116 M136 62 L114 116" stroke="${INK}" stroke-width="2" opacity=".22"/>`;
    s += `<rect x="34" y="50" width="132" height="13" rx="6.5" fill="${a.color}" stroke="${INK}" stroke-width="4"/>`;
    if (withFace) s += face(100, 84, 0.85, isDark(a.color));
    return s;
  };

  R.shake = (a, withFace) => {
    const id = uid('shk');
    const cup = 'M52 80 H148 L136 186 Q135 193 128 193 H72 Q65 193 64 186 Z';
    let s = straw(128, 2, 114, 80, a.straw || '#F2C542');
    s += `<defs><clipPath id="${id}"><path d="${cup}"/></clipPath></defs>`;
    s += `<g clip-path="url(#${id})"><rect x="40" y="76" width="120" height="130" fill="${a.liquid}"/>
      <path d="M60 84 q8 22 2 44 M84 84 q6 14 0 26 M120 84 q-6 18 0 36 M140 84 q-6 14 -2 30" fill="none" stroke="${a.drizzle}" stroke-width="5" stroke-linecap="round" opacity=".85"/>
      <rect x="122" y="76" width="40" height="130" fill="${INK}" opacity=".13"/></g>`;
    s += `<path d="M66 96 L73 176" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".5"/>`;
    s += `<path d="${cup}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<path d="M46 84 C40 66 60 58 70 64 C70 46 92 38 102 48 C110 34 138 40 134 60 C152 58 160 78 154 84 Z" fill="#FFF7EA" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<path d="M70 66 C78 72 92 72 100 66 M104 50 C110 56 122 56 128 50" fill="none" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" opacity=".35"/>`;
    const zig = 'M60 76 L74 62 L88 76 L102 58 L116 74 L130 62 L144 76';
    s += `<path d="${zig}" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>`;
    s += `<path d="${zig}" fill="none" stroke="${a.drizzle}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    switch (a.topper) {
      case 'sprinkles': {
        const cols = ['#F2C542', '#FF5B37', '#3DDC97', '#FF8FC7', '#FAF7EE'];
        [[70, 52, 20], [86, 44, -30], [100, 40, 50], [114, 46, 10], [126, 52, -40], [94, 54, 70], [110, 58, -10], [80, 62, 35]].forEach(([x, y, r], i) => {
          s += `<rect x="${x - 5}" y="${y - 2}" width="10" height="4.5" rx="2.2" transform="rotate(${r} ${x} ${y})" fill="${cols[i % cols.length]}" stroke="${INK}" stroke-width="1.6"/>`;
        });
        s += `<circle cx="100" cy="34" r="9" fill="#8653FF" stroke="${INK}" stroke-width="3"/><circle cx="97" cy="31" r="2.5" fill="#fff" opacity=".7"/>`;
        break;
      }
      case 'wafer':
        s += wafer(90, 34, -24, 38, 15) + wafer(114, 40, 18, 30, 13);
        s += `<g fill="#8A5530" stroke="${INK}" stroke-width="1.5"><circle cx="76" cy="58" r="3.5"/><circle cx="128" cy="60" r="3"/><circle cx="104" cy="56" r="3"/></g>`;
        break;
      case 'hearts': {
        const h = (x, y, sc, c) => `<path transform="translate(${x} ${y}) scale(${sc})" d="M0 8 C-14 -2 -8 -14 0 -6 C8 -14 14 -2 0 8Z" fill="${c}" stroke="${INK}" stroke-width="${2.5 / sc}" stroke-linejoin="round"/>`;
        s += h(92, 38, 1.5, '#FF3B7A') + h(116, 46, 1.1, '#FFB3CF') + h(76, 56, 0.9, '#D63C74');
        break;
      }
      case 'cookie':
        s += cookie(112, 36, 16);
        s += `<g transform="translate(82 50) rotate(-30)"><path d="M-13 0 A13 13 0 0 1 13 0 Z" fill="#2B1E1E" stroke="${INK}" stroke-width="3"/></g>`;
        s += `<g fill="#2B1E1E"><rect x="94" y="58" width="5" height="5" rx="1"/><rect x="128" y="62" width="4" height="4" rx="1"/><rect x="70" y="66" width="4" height="4" rx="1"/></g>`;
        break;
      case 'caramel':
        s += `<path d="M84 40 C84 26 116 26 116 40 C116 48 108 50 100 50 C92 50 84 48 84 40Z" fill="#C98A45" stroke="${INK}" stroke-width="3"/>`;
        s += `<g fill="#fff" stroke="${INK}" stroke-width="1.2"><rect x="92" y="34" width="4" height="4" transform="rotate(20 94 36)"/><rect x="104" y="36" width="3.5" height="3.5" transform="rotate(-15 105 37)"/><rect x="98" y="30" width="3" height="3"/></g>`;
        break;
    }
    if (withFace) s += face(100, 146, 1, isDark(a.liquid));
    return s;
  };

  R.granita = (a, withFace) => {
    const id = uid('gr');
    const cup = 'M50 72 H150 L138 184 Q137 192 129 192 H71 Q63 192 62 184 Z';
    let s = straw(132, 8, 112, 96, a.straw || '#3DDC97');
    s += `<path d="M46 74 C44 34 156 34 154 74 Z" fill="${a.color}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<g fill="#fff" opacity=".6"><circle cx="70" cy="62" r="3"/><circle cx="84" cy="50" r="2.4"/><circle cx="100" cy="58" r="3.2"/><circle cx="116" cy="48" r="2.4"/><circle cx="130" cy="62" r="3"/><circle cx="96" cy="44" r="2"/></g>`;
    s += `<defs><clipPath id="${id}"><path d="${cup}"/></clipPath></defs>`;
    s += `<g clip-path="url(#${id})"><rect x="40" y="70" width="120" height="130" fill="${a.color}"/>
      <g fill="#fff" opacity=".5"><circle cx="76" cy="98" r="3"/><circle cx="118" cy="112" r="2.5"/><circle cx="90" cy="130" r="2"/><circle cx="126" cy="150" r="3"/><circle cx="72" cy="166" r="2.4"/></g>
      <rect x="124" y="70" width="40" height="130" fill="${INK}" opacity=".12"/></g>`;
    s += `<path d="M65 86 L72 174" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/>`;
    s += `<path d="${cup}" fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<rect x="44" y="68" width="112" height="10" rx="5" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>`;
    if (withFace) s += face(100, 140, 1, false);
    return s;
  };

  R.pancakes = (a, withFace) => {
    const n = a.n || 3;
    const w = a.mini ? 112 : 146;
    const h = a.mini ? 15 : 19;
    const L = 100 - w / 2, Rx = 100 + w / 2;
    let s = `<ellipse cx="100" cy="176" rx="90" ry="18" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>`;
    s += `<ellipse cx="100" cy="173" rx="60" ry="9" fill="none" stroke="${INK}" stroke-width="2" opacity=".15"/>`;
    const ys = [];
    for (let i = 0; i < n; i++) {
      const y = 162 - i * (h - 1);
      ys.push(y);
      const wob = (i % 2 ? 3 : -3);
      s += `<rect x="${L + wob}" y="${y - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="#E7A04B" stroke="${INK}" stroke-width="4"/>`;
      s += `<path d="M${L + 10 + wob} ${y + 2} Q100 ${y + 7} ${Rx - 10 + wob} ${y + 2}" fill="none" stroke="#C47A2C" stroke-width="3" opacity=".7"/>`;
    }
    const topY = ys[n - 1] - h / 2 + 2;
    s += `<path d="${dripPath(L + 4, Rx - 4, topY, [[Rx - 22, 22], [112, 12], [L + 34, 30], [L + 14, 10]], 14)}" fill="${a.syrup}" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
    s += `<path d="M${L + 24} ${topY - 4} Q100 ${topY - 12} ${Rx - 36} ${topY - 6}" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".35"/>`;
    const t = topY - 10;
    switch (a.topping) {
      case 'strawberry':
        s += strawberry(76, t - 4, 1.05, -18) + strawberry(124, t - 2, 1.05, 16) + cookie(100, t - 14, 13) + strawberry(100, t - 34, 0.95, 4);
        s += `<g fill="#FFF7EA" stroke="${INK}" stroke-width="2.5"><circle cx="60" cy="${t + 6}" r="7"/><circle cx="140" cy="${t + 6}" r="6"/></g>`;
        break;
      case 'wafer':
        s += wafer(84, t - 6, -20) + wafer(118, t - 4, 14, 30, 13);
        s += `<g fill="#FAF7EE" stroke="${INK}" stroke-width="2"><circle cx="100" cy="${t + 2}" r="5"/><circle cx="66" cy="${t + 4}" r="4"/><circle cx="136" cy="${t + 4}" r="4"/></g>`;
        break;
      case 'butter':
        s += `<rect x="86" y="${t - 12}" width="28" height="18" rx="5" fill="#FFE27A" stroke="${INK}" stroke-width="3.5"/><path d="M90 ${t - 7} H106" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
        break;
      case 'nuts':
        [[74, t, 20], [92, t - 8, -10], [110, t - 4, 30], [126, t + 2, -25], [100, t + 4, 5]].forEach(([x, y, r]) => {
          s += `<ellipse cx="${x}" cy="${y}" rx="7" ry="5" transform="rotate(${r} ${x} ${y})" fill="#C98A45" stroke="${INK}" stroke-width="2.5"/>`;
        });
        s += `<g transform="translate(100 ${t - 16})"><circle r="11" fill="#FFE27A" stroke="${INK}" stroke-width="3"/><circle r="4" fill="#F4C84A"/></g>`;
        break;
      case 'bacon': {
        const strip = (y, r) => `<g transform="translate(100 ${y}) rotate(${r})"><path d="M-36 0 q9 -8 18 0 t18 0 t18 0 t18 0 v10 q-9 -8 -18 0 t-18 0 t-18 0 t-18 0 Z" fill="#D9534F" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-32 4 q9 -7 18 0 t18 0 t18 0" fill="none" stroke="#FFD0C2" stroke-width="2.5"/></g>`;
        s += strip(t - 10, -8) + strip(t - 2, 6);
        break;
      }
      case 'egg':
        s += `<path d="M68 ${t} C60 ${t - 18} 88 ${t - 26} 100 ${t - 20} C118 ${t - 28} 142 ${t - 14} 132 ${t} C140 ${t + 10} 110 ${t + 12} 100 ${t + 8} C84 ${t + 14} 58 ${t + 12} 68 ${t}Z" fill="#fff" stroke="${INK}" stroke-width="3.5"/>`;
        s += `<circle cx="100" cy="${t - 6}" r="11" fill="#FFB703" stroke="${INK}" stroke-width="3.5"/><circle cx="96" cy="${t - 10}" r="3" fill="#fff" opacity=".7"/>`;
        break;
    }
    if (withFace) {
      const mid = ys[Math.max(0, Math.floor((n - 1) / 2))];
      s += face(100, mid - 1, a.mini ? 0.62 : 0.72, false);
    }
    return s;
  };

  R.wrap = (a, withFace) => {
    const half = (x, y, rot, fc) => {
      const id = uid('wr');
      return `<g transform="translate(${x} ${y}) rotate(${rot})">
        <rect x="-64" y="-27" width="98" height="54" rx="27" fill="#F3D9A4" stroke="${INK}" stroke-width="4"/>
        <path d="M-44 -20 L-34 20 M-24 -22 L-14 22 M-4 -22 L6 20" stroke="#C98B4A" stroke-width="4" stroke-linecap="round" opacity=".75"/>
        <ellipse cx="34" cy="0" rx="17" ry="27" fill="#F3D9A4" stroke="${INK}" stroke-width="4"/>
        <defs><clipPath id="${id}"><ellipse cx="34" cy="0" rx="12" ry="21"/></clipPath></defs>
        <g clip-path="url(#${id})"><rect x="20" y="-24" width="30" height="48" fill="#7BC043"/>
          <circle cx="30" cy="-9" r="7" fill="#E63946"/><circle cx="38" cy="5" r="8" fill="#EAC79A"/><circle cx="29" cy="12" r="5" fill="#FF5B37"/><circle cx="40" cy="-14" r="4" fill="#FFF3C4"/></g>
        <ellipse cx="34" cy="0" rx="12" ry="21" fill="none" stroke="${INK}" stroke-width="2.5"/>
        ${fc || ''}
      </g>`;
    };
    let s = half(118, 86, -14);
    s += half(84, 134, -8, withFace ? face(-22, 0, 0.85) : '');
    s += `<path d="M22 150 L32 142 L42 150 L52 142 L62 150 L72 142 L82 150 L86 190 H26 Z" fill="#C9A26B" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
    s += sparkle(160, 150, 0.55, '#F2C542');
    return s;
  };

  R.sandwich = (a, withFace) => {
    const toast = a.bread === 'toast';
    const crust = toast ? '#D99A4E' : '#E4B26A';
    let s = `<line x1="100" y1="18" x2="100" y2="70" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
    s += `<path d="M100 20 L132 29 L100 38 Z" fill="#8653FF" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M28 146 Q28 132 44 132 H156 Q172 132 172 146 V152 Q172 168 156 168 H44 Q28 168 28 152 Z" fill="${crust}" stroke="${INK}" stroke-width="4"/>`;
    s += `<path d="M26 130 q10 14 20 0 q10 14 20 0 q10 14 20 0 q10 14 20 0 q10 14 20 0 q10 14 20 0 q10 14 20 0 q7 10 10 4 V122 H26 Z" fill="#7BC043" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<rect x="42" y="112" width="52" height="13" rx="6.5" fill="#FF5B37" stroke="${INK}" stroke-width="3"/><rect x="104" y="113" width="52" height="13" rx="6.5" fill="#FF5B37" stroke="${INK}" stroke-width="3"/>`;
    s += `<path d="M34 104 H166 V110 q-6 4 -10 0 l-6 14 l-6 -14 q-20 4 -40 0 l-7 16 l-7 -16 q-20 4 -34 0 l-6 12 l-6 -12 q-4 3 -8 0 Z" fill="#FFC93C" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M32 102 q8 -8 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 v8 H32 Z" fill="#F4A3A8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    if (toast) {
      s += `<path d="M30 98 Q26 64 52 62 Q60 46 100 46 Q140 46 148 62 Q174 64 170 98 Q170 104 162 104 H38 Q30 104 30 98 Z" fill="${crust}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
      s += `<path d="M42 94 Q40 72 60 72 Q66 58 100 58 Q134 58 140 72 Q160 72 158 94 Z" fill="#F6D39A"/>`;
    } else {
      s += `<path d="M26 98 Q26 56 100 54 Q174 56 174 98 Q174 106 164 106 H36 Q26 106 26 98Z" fill="#E9B872" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
      s += `<g fill="#fff" opacity=".75"><circle cx="60" cy="70" r="2.4"/><circle cx="84" cy="62" r="2"/><circle cx="130" cy="66" r="2.4"/><circle cx="148" cy="80" r="2"/><circle cx="116" cy="60" r="1.8"/><circle cx="52" cy="86" r="1.8"/></g>`;
      s += `<path d="M66 62 q8 -4 16 0 M112 60 q8 -4 16 0" stroke="#C8894A" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"/>`;
    }
    if (withFace) s += face(100, 84, 0.9);
    return s;
  };

  R.baguette = (a, withFace) => {
    let s = `<g transform="rotate(-16 100 110)">`;
    s += `<path d="M10 118 Q12 138 42 140 H158 Q188 138 190 118 Z" fill="#D99A4E" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<path d="M14 118 q8 10 16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t16 0 t8 0 V108 H14 Z" fill="#7BC043" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M16 106 H184 V112 l-8 10 l-8 -10 H130 l-8 12 l-8 -12 H70 l-8 10 l-8 -10 H16 Z" fill="#FFC93C" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M14 104 q9 -8 18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t18 0 t14 0 v6 H14 Z" fill="#F4A3A8" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M10 102 Q12 70 58 68 H142 Q188 70 190 102 Z" fill="#E4A85B" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<path d="M40 86 q10 -8 22 -2 M76 80 q10 -8 22 -2 M112 80 q10 -8 22 -2 M146 86 q10 -8 20 -2" stroke="#F6CF8E" stroke-width="5" stroke-linecap="round" fill="none"/>`;
    if (withFace) s += face(100, 92, 0.72);
    s += `</g>`;
    s += sparkle(40, 50, 0.6, '#F2C542') + sparkle(166, 162, 0.45, '#fff');
    return s;
  };

  R.omelette = (a, withFace) => {
    let s = `<rect x="140" y="138" width="66" height="16" rx="8" transform="rotate(36 140 146)" fill="#2A2438" stroke="${INK}" stroke-width="4"/>`;
    s += `<circle cx="92" cy="108" r="76" fill="#2A2438" stroke="${INK}" stroke-width="4"/>`;
    s += `<circle cx="92" cy="108" r="62" fill="#3A3350" stroke="${INK}" stroke-width="2.5" opacity=".9"/>`;
    s += `<path d="M40 70 A62 62 0 0 1 80 48" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".2"/>`;
    s += `<path d="M38 108 Q92 56 146 108 Q146 136 92 140 Q38 136 38 108Z" fill="#FFD34D" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<path d="M42 110 Q92 124 142 110" stroke="#E0A800" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    [[60, 94, 20, '#2E8B57'], [118, 92, -30, '#3DDC97'], [74, 124, 60, '#FF5B37'], [112, 126, 10, '#2E8B57'], [132, 104, 45, '#FF5B37'], [52, 116, -20, '#3DDC97']].forEach(([x, y, r, c]) => {
      s += `<rect x="${x - 4}" y="${y - 2}" width="8" height="4" rx="2" transform="rotate(${r} ${x} ${y})" fill="${c}"/>`;
    });
    if (withFace) s += face(92, 96, 0.82);
    return s;
  };

  R.croque = (a, withFace) => {
    let s = `<ellipse cx="100" cy="176" rx="88" ry="17" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>`;
    s += `<path d="M44 76 Q44 52 66 54 Q78 40 100 42 Q122 40 134 54 Q156 52 156 76 V160 Q156 170 146 170 H54 Q44 170 44 160 Z" fill="#D99A4E" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<path d="M54 80 Q54 64 70 66 Q80 54 100 55 Q120 54 130 66 Q146 64 146 80 V156 H54 Z" fill="#F6D39A"/>`;
    s += `<path d="${dripPath(50, 150, 74, [[140, 20], [118, 10], [84, 26], [62, 12]], 10)}" fill="#FFF1C9" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M66 82 C58 62 88 54 102 60 C124 52 144 68 134 86 C142 104 112 112 98 106 C80 114 56 100 66 82Z" fill="#fff" stroke="${INK}" stroke-width="3.5"/>`;
    s += `<circle cx="100" cy="82" r="14" fill="#FFB703" stroke="${INK}" stroke-width="3.5"/><circle cx="95" cy="77" r="3.5" fill="#fff" opacity=".75"/>`;
    s += `<g fill="#2E8B57"><rect x="120" y="96" width="6" height="3" rx="1.5" transform="rotate(30 123 97)"/><rect x="72" y="98" width="6" height="3" rx="1.5"/></g>`;
    if (withFace) s += face(100, 138, 0.9);
    return s;
  };

  R.salad = (a, withFace) => {
    let s = '';
    const greens = ['#7BC043', '#3DDC97', '#A7D129', '#58B947'];
    [[34, 112, -62], [52, 110, -40], [72, 108, -18], [92, 110, -4], [112, 108, 14], [134, 110, 34], [154, 112, 56], [166, 114, 72]].forEach(([x, y, r], i) => {
      s += leaf(x, y, r, greens[i % greens.length]);
    });
    const t = 92;
    switch (a.topping) {
      case 'caesar':
        [[62, t, 12], [98, t - 8, -8], [132, t, 20]].forEach(([x, y, r]) => { s += `<rect x="${x - 8}" y="${y - 8}" width="16" height="16" rx="4" transform="rotate(${r} ${x} ${y})" fill="#E3B062" stroke="${INK}" stroke-width="3"/>`; });
        [[80, t + 2, -20], [118, t - 2, 14]].forEach(([x, y, r]) => { s += `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-16" y="-6" width="32" height="12" rx="6" fill="#EAC79A" stroke="${INK}" stroke-width="3"/><path d="M-8 -5 L-4 5 M2 -5 L6 5" stroke="#B97A34" stroke-width="2.5"/></g>`; });
        s += `<path d="M104 ${t + 8} l10 -6 l2 10 Z M70 ${t + 10} l10 -4 l0 9 Z" fill="#FFF3C4" stroke="${INK}" stroke-width="2"/>`;
        break;
      case 'chef':
        [[70, t, -10], [126, t - 2, 12]].forEach(([x, y, r]) => { s += `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="14" ry="10" fill="#fff" stroke="${INK}" stroke-width="3"/><circle r="6" fill="#FFB703" stroke="${INK}" stroke-width="2"/></g>`; });
        s += `<g transform="translate(98 ${t - 8}) rotate(-18)"><rect x="-14" y="-7" width="28" height="14" rx="7" fill="#F4A3A8" stroke="${INK}" stroke-width="3"/></g>`;
        [[92, t + 10], [110, t + 8], [146, t + 8]].forEach(([x, y]) => { s += `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" rx="2" fill="#FFC93C" stroke="${INK}" stroke-width="2.5"/>`; });
        s += `<path d="M44 ${t + 10} a10 10 0 0 1 20 0 Z" fill="#FF5B37" stroke="${INK}" stroke-width="2.5"/>`;
        break;
      case 'pasta':
        [[50, t + 4, 10], [84, t - 6, -14], [118, t + 2, 18], [148, t + 6, -8]].forEach(([x, y, r]) => {
          const d = `M-14 0 q3.5 -7 7 0 t7 0 t7 0 t7 0`;
          s += `<g transform="translate(${x} ${y}) rotate(${r})"><path d="${d}" fill="none" stroke="${INK}" stroke-width="11" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#F7D35C" stroke-width="6" stroke-linecap="round"/></g>`;
        });
        [[70, t + 8], [132, t - 6], [100, t + 6]].forEach(([x, y]) => { s += `<g transform="translate(${x} ${y})"><path d="M-12 -2 C-12 -12 10 -12 12 -4 C14 6 2 10 -4 8 C-10 6 -12 4 -12 -2Z" fill="#D9963F" stroke="${INK}" stroke-width="3"/><g fill="#F6CF8E"><circle cx="-4" cy="-3" r="1.4"/><circle cx="4" cy="0" r="1.4"/><circle cx="0" cy="4" r="1.2"/></g></g>`; });
        s += `<g fill="#FFD34D" stroke="${INK}" stroke-width="1.5"><circle cx="112" cy="${t + 12}" r="3"/><circle cx="58" cy="${t - 4}" r="3"/><circle cx="92" cy="${t - 12}" r="3"/></g>`;
        break;
      case 'healthy':
        s += `<g transform="translate(78 ${t - 2}) rotate(-16)"><ellipse rx="20" ry="14" fill="#3E7B2E" stroke="${INK}" stroke-width="3"/><ellipse rx="15" ry="10" fill="#C8E68C"/><circle cx="3" r="6" fill="#8A5530" stroke="${INK}" stroke-width="2.5"/></g>`;
        s += `<g transform="translate(124 ${t}) rotate(12)"><rect x="-16" y="-6" width="32" height="12" rx="6" fill="#EAC79A" stroke="${INK}" stroke-width="3"/><path d="M-8 -5 L-4 5 M2 -5 L6 5" stroke="#B97A34" stroke-width="2.5"/></g>`;
        s += `<g fill="#FFF3D1" stroke="${INK}" stroke-width="1.2">${[[56, 8], [62, 12], [100, 10], [106, 6], [146, 8], [140, 12], [96, 14]].map(([x, y]) => `<circle cx="${x}" cy="${t + y}" r="2.4"/>`).join('')}</g>`;
        break;
    }
    s += `<path d="M20 112 H180 Q176 182 100 186 Q24 182 20 112Z" fill="${a.bowl}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    s += `<path d="M150 122 Q146 164 110 176" stroke="${INK}" stroke-width="10" fill="none" opacity=".1" stroke-linecap="round"/>`;
    s += `<g fill="#fff" opacity=".45"><circle cx="40" cy="132" r="3"/><circle cx="160" cy="132" r="3"/><circle cx="52" cy="156" r="2.5"/><circle cx="148" cy="156" r="2.5"/></g>`;
    s += `<rect x="14" y="104" width="172" height="14" rx="7" fill="${a.bowl}" stroke="${INK}" stroke-width="4"/>`;
    if (withFace) s += face(100, 146, 1, isDark(a.bowl));
    return s;
  };

  function render(art, opts = {}) {
    const withFace = opts.face !== false;
    const recipe = R[art && art.kind] || R.hot;
    return `<svg class="art ${opts.cls || ''}" viewBox="0 0 200 200" aria-hidden="true" focusable="false">${recipe(art || {}, withFace)}</svg>`;
  }

  /* ------------------------------------------------------------ scene pieces */
  function planet(color = '#FF5B37', ring = '#8653FF') {
    return `<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <g transform="rotate(-18 100 100)">
        <path d="M18 104 A82 24 0 0 1 182 104" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>
        <path d="M18 104 A82 24 0 0 1 182 104" fill="none" stroke="${ring}" stroke-width="8" stroke-linecap="round"/>
      </g>
      <circle cx="100" cy="100" r="56" fill="${color}" stroke="${INK}" stroke-width="4"/>
      <path d="M62 78 A48 48 0 0 1 96 52" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none" opacity=".45"/>
      <g fill="${INK}" opacity=".18"><circle cx="124" cy="80" r="9"/><circle cx="80" cy="126" r="7"/><circle cx="130" cy="126" r="5"/></g>
      ${face(100, 104, 1)}
      <g transform="rotate(-18 100 100)">
        <path d="M18 104 A82 24 0 0 0 182 104" fill="none" stroke="${INK}" stroke-width="16" stroke-linecap="round"/>
        <path d="M18 104 A82 24 0 0 0 182 104" fill="none" stroke="${ring}" stroke-width="8" stroke-linecap="round"/>
      </g>
    </svg>`;
  }

  function badgeRing(text, id) {
    return `<svg viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs><path id="${id}" d="M100 100 m-74 0 a74 74 0 1 1 148 0 a74 74 0 1 1 -148 0"/></defs>
      <circle cx="100" cy="100" r="96" fill="#F2C542" stroke="${INK}" stroke-width="4"/>
      <circle cx="100" cy="100" r="56" fill="${INK}"/>
      <text font-family="'JetBrains Mono', monospace" font-weight="700" font-size="15" letter-spacing="2.3" fill="${INK}">
        <textPath href="#${id}" startOffset="0">${text}</textPath>
      </text>
    </svg>`;
  }

  /* Tower layers for the "Anatomy of a Tower" scene (viewBox 320×110) */
  function towerLayer(kind) {
    const wrap = (inner, vb = '0 0 320 110') => `<svg viewBox="${vb}" aria-hidden="true" focusable="false">${inner}</svg>`;
    const pancake = (withFace) => {
      let s = `<path d="M22 50 Q22 26 160 26 Q298 26 298 50 V66 Q298 92 160 92 Q22 92 22 66 Z" fill="#E7A04B" stroke="${INK}" stroke-width="4.5" stroke-linejoin="round"/>`;
      s += `<path d="M30 70 Q160 96 290 70" fill="none" stroke="#C47A2C" stroke-width="3.5" opacity=".6"/>`;
      s += `<path d="M22 50 Q22 26 160 26 Q298 26 298 50 Q298 74 160 74 Q22 74 22 50 Z" fill="#F4BE68" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
      s += `<g fill="#E39A45" opacity=".8"><ellipse cx="96" cy="46" rx="14" ry="5"/><ellipse cx="190" cy="54" rx="18" ry="6"/><ellipse cx="236" cy="42" rx="10" ry="4"/><ellipse cx="140" cy="60" rx="9" ry="3.5"/></g>`;
      if (withFace) s += face(160, 78, 0.8);
      return wrap(s);
    };
    switch (kind) {
      case 'crown': {
        let s = `<ellipse cx="160" cy="112" rx="120" ry="16" fill="#FFF7EA" stroke="${INK}" stroke-width="4"/>`;
        s += strawberry(92, 96, 1.7, -24) + strawberry(228, 96, 1.7, 22) + cookie(160, 78, 26) + strawberry(160, 42, 1.6, 6);
        s += leaf(118, 108, -50, '#3DDC97') + leaf(204, 108, 48, '#58B947');
        s += sparkle(60, 50, 0.9, '#F2C542') + sparkle(268, 40, 0.7, '#fff') + sparkle(210, 22, 0.5, '#FF8FC7');
        return wrap(s, '0 0 320 132');
      }
      case 'cream': {
        let d = 'M20 64';
        for (let i = 0; i < 8; i++) d += ' q17 -30 35 0';
        d += ' L300 76';
        for (let i = 0; i < 8; i++) d += ' q-17 20 -35 0';
        d += ' Z';
        return wrap(`<path d="${d}" fill="#FFF7EA" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
          <path d="M44 60 q10 -12 20 -2 M114 58 q10 -12 20 -2 M188 58 q10 -12 20 -2 M254 60 q10 -12 20 -2" fill="none" stroke="${INK}" stroke-width="2.5" opacity=".3" stroke-linecap="round"/>`);
      }
      case 'praline':
        return wrap(`<path d="${dripPath(24, 296, 46, [[270, 30], [226, 18], [180, 40], [130, 22], [82, 34], [44, 14]], 24)}" fill="#4A2512" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
          <path d="M70 36 Q160 20 250 34" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".35"/>
          <path d="M100 44 Q140 38 170 42" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".25"/>`);
      case 'hazelnut': {
        let s = `<path d="${dripPath(26, 294, 48, [[258, 22], [206, 34], [150, 16], [96, 28], [52, 20]], 22)}" fill="#C98A45" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
        s += wafer(96, 36, -14, 44, 16) + wafer(214, 32, 12, 40, 15) + wafer(158, 26, -4, 34, 14);
        s += `<g fill="#8A5530" stroke="${INK}" stroke-width="2"><circle cx="60" cy="42" r="5"/><circle cx="262" cy="44" r="5"/><circle cx="130" cy="44" r="4"/><circle cx="186" cy="44" r="4"/></g>`;
        return wrap(s);
      }
      case 'plate':
        return wrap(`<ellipse cx="160" cy="62" rx="154" ry="34" fill="${INK}" opacity=".25"/>
          <ellipse cx="160" cy="54" rx="150" ry="32" fill="${PAPER}" stroke="${INK}" stroke-width="4.5"/>
          <ellipse cx="160" cy="50" rx="108" ry="19" fill="none" stroke="${INK}" stroke-width="2.5" opacity=".2"/>
          <path d="M40 46 Q60 30 100 26" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity=".8"/>`);
      case 'pancakeFace': return pancake(true);
      default: return pancake(false);
    }
  }

  window.Art = { render, face, sparkle, planet, badgeRing, towerLayer, SPARKLE_D, isDark };
})();
