// 引擎用到、部分机型（如 iOS 15.4 以下）缺少的 API
/* eslint-disable no-extend-native */
if (!Array.prototype.at) {
  Object.defineProperty(Array.prototype, 'at', {
    configurable: true, writable: true,
    value: function (n) {
      n = Math.trunc(n) || 0;
      if (n < 0) n += this.length;
      return n < 0 || n >= this.length ? undefined : this[n];
    }
  });
}
if (!Array.prototype.flatMap) {
  Object.defineProperty(Array.prototype, 'flatMap', {
    configurable: true, writable: true,
    value: function (fn, thisArg) {
      const out = [];
      for (let i = 0; i < this.length; i++) {
        const v = fn.call(thisArg, this[i], i, this);
        if (Array.isArray(v)) out.push.apply(out, v); else out.push(v);
      }
      return out;
    }
  });
}
if (!Object.fromEntries) {
  Object.fromEntries = function (it) {
    const o = {};
    for (const [k, v] of it) o[k] = v;
    return o;
  };
}
if (!Math.trunc) Math.trunc = (x) => (x < 0 ? Math.ceil(x) : Math.floor(x));
