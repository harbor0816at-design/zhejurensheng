const E=require(require("path").resolve(process.argv[2]||"js/engine/engine.js"));
const N=+process.argv[3]||1000; const seedBase=process.argv[4]||"MC";
let bk=0,crunch=0,anom=0,early=0; const main={}; const dec=[],decAll=[]; const t0=Date.now(); const nwr=[];
for(let i=0;i<N;i++){
  const L=E.LifeEngine.create(`${seedBase}-${i}`,{auto:"uniform"}); L.runToEnd();
  const s=L.s; const st=s.stats||{};
  if(s.flags.had_formal_bankruptcy) bk++;
  if(s.flags.had_liquidity_crunch) crunch++;
  anom+=s.anomalies.length;
  const m=s.endings.find(e=>e.role==="primary")||s.endings[0]; main[m?.name||m?.id]=(main[m?.name||m?.id]||0)+1;
  if(s.endings.some(e=>e.id==="E_EARLY_HEALTH")||s.flags.early_end) early++;
  const c=L.decisionCounts(); dec.push(c.optional); decAll.push(c.optional+c.crisis);
  nwr.push(s.result?.nw_real_final ?? 0);
}
const q=(a,p)=>{const b=[...a].sort((x,y)=>x-y);return b[Math.min(b.length-1,Math.floor(p*b.length))]};
console.log({N,ms:Date.now()-t0,bankrupt:(bk/N*100).toFixed(1)+"%",crunch:(crunch/N*100).toFixed(1)+"%",anomalies:anom,early});
console.log("optional P10/50/90/min",q(dec,.1),q(dec,.5),q(dec,.9),Math.min(...dec)," total P50/90/max",q(decAll,.5),q(decAll,.9),Math.max(...decAll));
console.log(Object.entries(main).sort((a,b)=>b[1]-a[1]).map(([k,v])=>k+" "+(v/N*100).toFixed(1)+"%").join(" | "));
