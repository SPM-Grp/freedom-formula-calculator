// Print / PDF generator — the "Save My Numbers" handler from the v1 calculator.
// Renders a clean, white-background HTML file optimized for printing. No green
// ink bleed — professional, CPA-ready layout. Preserved verbatim from v1.
import { LIFESTYLE_CATEGORIES } from "./constants";
import { verdict, fmt, fmtPct, parseMoney } from "./lib/math";

export function generatePrintHTML({
  pv, n, vals, inflation, yieldRate, effectiveTax,
  annualToday, annualFuture, fv, r1, breakEven,
}) {
  const pvVal = parseFloat(String(pv).replace(/[$,\s]/g, "")) || 0;
  const nVal = parseFloat(n) || 10;
  const yVal = parseFloat(yieldRate) || 0.07;
  const infVal = parseFloat(inflation) || 3;
  const etr = parseFloat(effectiveTax) || 35;
  const v = verdict(r1);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const verdictColor =
    r1 !== null && r1 !== undefined && isFinite(r1)
      ? (r1 * 100 < 7 ? "#16a34a" : r1 * 100 <= 12 ? "#92740a" : "#dc2626")
      : "#888";
  const verdictBand = r1 !== null ? v.band : "—";

  const lifestyleRows = LIFESTYLE_CATEGORIES.map((cat) => {
    const monthly = parseMoney(vals[cat.key]);
    const annual = monthly * 12;
    return `<tr>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;font-size:13px;color:#333;">${cat.icon} ${cat.label}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-family:Georgia,serif;font-size:13px;color:#111;font-weight:600;">${monthly > 0 ? "$" + monthly.toLocaleString() : "—"}</td>
      <td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-family:Georgia,serif;font-size:13px;color:#111;font-weight:600;">${annual > 0 ? "$" + annual.toLocaleString() : "—"}</td>
    </tr>`;
  }).join("");

  const subtotal = LIFESTYLE_CATEGORIES.reduce(
    (s, c) => s + parseMoney(vals[c.key]) * 12,
    0
  );
  const buffer = subtotal * 0.125;

  return `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>Freedom Formula — My Numbers</title>
<style>
  @page { margin: 0.6in 0.7in; size: letter; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111; background: #fff; padding: 0; line-height: 1.5; }
  .page { max-width: 750px; margin: 0 auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #1A3C2E; padding-bottom: 12px; margin-bottom: 20px; }
  .brand { font-size: 10px; letter-spacing: 0.2em; color: #1A3C2E; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
  .title { font-family: Georgia, serif; font-size: 22px; color: #1A3C2E; font-weight: 700; }
  .date { font-size: 11px; color: #888; text-align: right; }
  .section-label { font-size: 10px; letter-spacing: 0.15em; color: #1A3C2E; font-weight: 700; text-transform: uppercase; margin: 20px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .verdict-box { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border: 2px solid ${verdictColor}; border-radius: 8px; margin: 12px 0 20px; }
  .verdict-label { font-size: 10px; letter-spacing: 0.1em; color: ${verdictColor}; font-weight: 700; text-transform: uppercase; margin-bottom: 2px; }
  .verdict-band { font-size: 15px; font-weight: 700; color: ${verdictColor}; }
  .verdict-number { font-family: Georgia, serif; font-size: 38px; font-weight: 800; color: ${verdictColor}; line-height: 1; }
  .verdict-sub { font-size: 11px; color: #888; margin-top: 4px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 12px 0 4px; }
  .kpi { text-align: center; padding: 10px 6px; background: #f8f8f8; border-radius: 6px; }
  .kpi-val { font-family: Georgia, serif; font-size: 17px; font-weight: 700; color: #111; }
  .kpi-lbl { font-size: 10px; color: #888; letter-spacing: 0.04em; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; padding: 6px 12px; font-size: 10px; letter-spacing: 0.08em; color: #888; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #ddd; }
  th:nth-child(2), th:nth-child(3) { text-align: right; }
  .total-row td { font-weight: 700; border-top: 2px solid #1A3C2E; border-bottom: none; padding-top: 8px; color: #1A3C2E; }
  .assumptions { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 8px 0; }
  .assumption { padding: 8px 12px; background: #f8f8f8; border-radius: 6px; font-size: 12px; }
  .assumption span { font-family: Georgia, serif; font-weight: 700; }
  .breakeven-box { display: flex; align-items: center; gap: 16px; padding: 12px 16px; background: #fff5f5; border: 1px solid #fecaca; border-radius: 6px; margin: 8px 0; }
  .breakeven-num { font-family: Georgia, serif; font-size: 26px; font-weight: 800; color: #dc2626; }
  .breakeven-text { font-size: 12px; color: #666; line-height: 1.5; }
  .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 10px; color: #999; text-align: center; line-height: 1.6; }
  .notes-area { margin-top: 20px; border: 1px solid #ddd; border-radius: 6px; padding: 14px 16px; min-height: 80px; }
  .notes-label { font-size: 10px; letter-spacing: 0.12em; color: #999; font-weight: 700; text-transform: uppercase; margin-bottom: 8px; }
  .notes-lines { border-bottom: 1px solid #eee; height: 22px; }
</style>
</head><body>
<div class="page">

  <div class="header">
    <div>
      <div class="brand">CLEAR™ Program · The EXODUS Method</div>
      <div class="title">Freedom Formula — My Numbers</div>
    </div>
    <div class="date">Generated ${today}<br><span style="color:#1A3C2E;font-weight:600;">CONFIDENTIAL</span></div>
  </div>

  <div class="verdict-box">
    <div>
      <div class="verdict-label">Your Verdict</div>
      <div class="verdict-band">${verdictBand}</div>
    </div>
    <div style="text-align:right;">
      <div class="verdict-number">${fmtPct(r1)}</div>
      <div class="verdict-sub">required annual return</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi"><div class="kpi-val">${fmt(pvVal)}</div><div class="kpi-lbl">Present Value</div></div>
    <div class="kpi"><div class="kpi-val">${fmt(fv)}</div><div class="kpi-lbl">Future Value</div></div>
    <div class="kpi"><div class="kpi-val">${fmt(fv - pvVal)}</div><div class="kpi-lbl">Gap</div></div>
    <div class="kpi"><div class="kpi-val">${nVal} yrs</div><div class="kpi-lbl">Timeline</div></div>
    <div class="kpi"><div class="kpi-val" style="color:${verdictColor}">${fmtPct(r1)}</div><div class="kpi-lbl">Required r</div></div>
  </div>

  <div class="section-label">Assumptions</div>
  <div class="assumptions">
    <div class="assumption">Inflation: <span>${infVal}%</span></div>
    <div class="assumption">Yield Rate: <span>${(yVal * 100).toFixed(0)}%</span></div>
    <div class="assumption">Eff. Tax Rate: <span>${etr}%</span></div>
  </div>

  ${breakEven !== null && breakEven !== undefined && isFinite(breakEven) ? `
  <div class="breakeven-box">
    <div class="breakeven-num">${fmtPct(breakEven)}</div>
    <div class="breakeven-text">
      <strong>Break-even return</strong> — the minimum to maintain purchasing power after inflation and taxes.<br>
      ${infVal}% ÷ (1 − ${etr}%) = ${fmtPct(breakEven)}. ${r1 !== null && r1 > breakEven ? "Your r clears this." : "Your r does NOT clear this — a lever needs to move."}
    </div>
  </div>` : ""}

  <div class="section-label">Dream Lifestyle Breakdown</div>
  <table>
    <thead>
      <tr><th>Category</th><th>Monthly</th><th>Annual</th></tr>
    </thead>
    <tbody>
      ${lifestyleRows}
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;font-size:12px;color:#888;">Subtotal</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-family:Georgia,serif;font-size:13px;color:#888;">${fmt(subtotal / 12)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-family:Georgia,serif;font-size:13px;color:#888;">${fmt(subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;font-size:12px;color:#888;">+ 12.5% Buffer</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-family:Georgia,serif;font-size:13px;color:#888;">${fmt(buffer / 12)}</td>
        <td style="padding:6px 12px;border-bottom:1px solid #e5e5e5;text-align:right;font-family:Georgia,serif;font-size:13px;color:#888;">${fmt(buffer)}</td>
      </tr>
      <tr class="total-row">
        <td style="padding:6px 12px;font-size:13px;">Annual Cost (Today)</td>
        <td style="padding:6px 12px;text-align:right;font-family:Georgia,serif;font-size:14px;">${fmt(annualToday / 12)}</td>
        <td style="padding:6px 12px;text-align:right;font-family:Georgia,serif;font-size:14px;">${fmt(annualToday)}</td>
      </tr>
    </tbody>
  </table>
  <div style="display:flex;justify-content:space-between;padding:8px 12px;background:#f0f7f4;border-radius:6px;margin-top:8px;">
    <span style="font-size:12px;color:#666;">Inflation-adjusted annual cost in ${nVal} years:</span>
    <span style="font-family:Georgia,serif;font-weight:700;font-size:14px;color:#1A3C2E;">${fmt(annualFuture)}</span>
  </div>

  <div class="notes-area">
    <div class="notes-label">Notes / CPA Discussion Points</div>
    <div class="notes-lines"></div>
    <div class="notes-lines"></div>
    <div class="notes-lines"></div>
  </div>

  <div class="footer">
    <span style="color:#1A3C2E;font-weight:700;letter-spacing:0.15em;">CLEAR™</span> · The EXODUS Method · Freedom Formula Calculator<br>
    © ${new Date().getFullYear()} SP Media Inc. All rights reserved. Educational framework only — not financial advice.
  </div>

</div>
<script>window.onload = function() { window.print(); }</script>
</body></html>`;
}
