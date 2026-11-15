// 矢量小图标（只用矩形、圆、折线，保证各平台一致）
function icon(push, kind, x, y, s, color) {
  const c = color || '#ffffff';
  const u = s / 24;
  const R = (ax, ay, w, h, r, fill) => push({ t: 'rect', x: x + ax * u, y: y + ay * u, w: w * u, h: h * u, r: (r || 0) * u, fill: fill || c });
  const P = (pts, o) => push(Object.assign({ t: 'poly', pts: pts.map(([a, b]) => [x + a * u, y + b * u]) }, o));
  const C = (ax, ay, r, o) => push(Object.assign({ t: 'circle', x: x + ax * u, y: y + ay * u, r: r * u }, o));
  switch (kind) {
    case 'export': // 货箱 + 箭头
      R(2, 9, 11, 10, 1.5);
      P([[14, 14], [22, 14]], { color: c, lw: 2.4 * u });
      P([[18, 10], [22, 14], [18, 18]], { color: c, lw: 2.4 * u });
      break;
    case 'online': // 地球
      C(12, 12, 9, { stroke: c, lw: 2 * u });
      P([[3, 12], [21, 12]], { color: c, lw: 1.6 * u });
      P([[12, 3], [9, 8], [9, 16], [12, 21]], { color: c, lw: 1.6 * u });
      P([[12, 3], [15, 8], [15, 16], [12, 21]], { color: c, lw: 1.6 * u });
      break;
    case 'branch': // 办公楼
      R(5, 3, 14, 19, 1.5);
      for (let r = 0; r < 4; r++) for (let k = 0; k < 2; k++) R(8 + k * 5, 6 + r * 4, 3, 2, 0.5, 'rgba(15,23,42,0.55)');
      break;
    case 'factory': // 锯齿屋顶 + 烟囱
      P([[2, 22], [2, 12], [8, 8], [8, 12], [14, 8], [14, 12], [20, 8], [20, 22]], { fill: c });
      R(16, 3, 3, 7, 0.5);
      R(5, 15, 3, 3, 0.5, 'rgba(15,23,42,0.55)'); R(11, 15, 3, 3, 0.5, 'rgba(15,23,42,0.55)');
      break;
    case 'datacenter': // 服务器
      for (let r = 0; r < 3; r++) { R(4, 3 + r * 7, 16, 5.5, 1.2); C(7, 5.75 + r * 7, 1, { fill: 'rgba(15,23,42,0.6)' }); }
      break;
    case 'campaign': // 喇叭
      P([[3, 9], [9, 9], [18, 4], [18, 20], [9, 15], [3, 15]], { fill: c });
      R(6, 15, 3, 6, 1);
      break;
    case 'exit': // 返回箭头
      P([[20, 18], [20, 12], [6, 12]], { color: c, lw: 2.6 * u });
      P([[10, 7], [5, 12], [10, 17]], { color: c, lw: 2.6 * u });
      break;
    case 'hq': // 星
      P([[12, 2], [14.6, 9], [22, 9], [16, 13.6], [18.2, 21], [12, 16.6], [5.8, 21], [8, 13.6], [2, 9], [9.4, 9]], { fill: c });
      break;
    case 'news':
      R(3, 4, 18, 16, 2);
      R(6, 7, 12, 2.5, 0.5, 'rgba(15,23,42,0.6)'); R(6, 11, 7, 1.5, 0.5, 'rgba(15,23,42,0.45)'); R(6, 14, 9, 1.5, 0.5, 'rgba(15,23,42,0.45)');
      break;
    case 'book':
      P([[2, 5], [11, 7], [11, 21], [2, 19]], { fill: c });
      P([[22, 5], [13, 7], [13, 21], [22, 19]], { fill: c });
      break;
    case 'bulb':
      C(12, 10, 7, { fill: c });
      R(9, 16, 6, 5, 1.5);
      break;
    default:
      C(12, 12, 8, { fill: c });
  }
}

module.exports = { icon };
