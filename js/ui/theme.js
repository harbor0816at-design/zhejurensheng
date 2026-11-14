// 视觉规范：沿用本地版配色（深蓝底 + 白卡片），竖屏卡片。
const FAMILY = '-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';

module.exports = {
  FAMILY,
  font(size, weight) { return `${weight || 400} ${size}px ${FAMILY}`; },
  c: {
    bgTop: '#0f172a',
    bgBottom: '#1e293b',
    card: '#ffffff',
    ink: '#0f172a',
    body: '#334155',
    muted: '#64748b',
    faint: '#94a3b8',
    line: '#e2e8f0',
    soft: '#f1f5f9',
    accent: '#2563eb',
    accentDark: '#1d4ed8',
    accentSoft: '#dbeafe',
    pos: '#059669',
    neg: '#dc2626',
    warn: '#d97706',
    warnSoft: '#fef3c7',
    negSoft: '#fee2e2',
    posSoft: '#d1fae5',
    violet: '#6d28d9',
    violetSoft: '#f5f3ff',
    onDark: '#e2e8f0',
    onDarkMuted: '#94a3b8',
    cycle: { boom: '#f59e0b', slowdown: '#94a3b8', recession: '#475569', recovery: '#10b981' },
    risk: { low: '#059669', medium: '#d97706', high: '#dc2626' },
    acc: { I: '#059669', E: '#dc2626', T: '#9333ea', D: '#d97706', F: '#2563eb' }
  },
  r: { card: 16, btn: 12, tile: 10, chip: 8 },
  pad: 16,      // 卡片内边距
  gap: 12,      // 卡片间距
  side: 14      // 屏幕左右留白
};
