import { useMemo, Fragment } from 'react';
import { motion } from 'framer-motion';

const usePrefersReducedMotion = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

const animProps = (reduced) => reduced ? {} : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } };

export function HorizontalBarChart({ data, accent, maxValue, labelKey, valueKey = 'high' }) {
  const reduced = usePrefersReducedMotion();
  if (!data?.length) return <div className="text-text3/40 text-[11px] p-3 text-center">No data available</div>;
  const detectedKey = labelKey || (data[0]?.label !== undefined ? 'label' : data[0]?.institute !== undefined ? 'institute' : 'name');
  const max = maxValue || Math.max(...data.map(d => d[valueKey] || 0));
  if (!max) return <div className="text-text3/40 text-[11px] p-3 text-center">No data available</div>;
  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const val = d[valueKey] || 0;
        return (
          <div key={d[detectedKey] || i}>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-text2 truncate">{d[detectedKey]}</span>
              <span className="text-text3/60 ml-2 shrink-0">{val}</span>
            </div>
            <div className="h-4 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: accent }}
                initial={reduced ? false : { width: 0 }}
                animate={{ width: `${(val / max) * 100}%` }}
                transition={{ duration: 0.4, delay: reduced ? 0 : i * 0.04, ease: 'easeOut' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function VerticalBarChart({ data, accent, labelKey = 'institute', valueKey = 'avg_package', height = 200 }) {
  const reduced = usePrefersReducedMotion();
  if (!data?.length) return <div className="text-text3/40 text-[11px] p-3 text-center" style={{ height }}>No data available</div>;
  const max = Math.max(...data.map(d => d[valueKey] || 0));
  if (!max) return <div className="text-text3/40 text-[11px] p-3 text-center" style={{ height }}>No data available</div>;
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const val = d[valueKey] || 0;
        return (
          <div key={d[labelKey] || i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <motion.div
              className="w-full rounded-t-md"
              style={{ background: accent }}
              initial={reduced ? false : { height: 0 }}
              animate={{ height: `${(val / max) * 100}%` }}
              transition={{ duration: 0.4, delay: reduced ? 0 : i * 0.04, ease: 'easeOut' }}
            />
            <span className="text-[8px] text-text3/50 truncate w-full text-center leading-tight">{d[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

export function StackedBarChart({ data, accent, colors, labelKey = 'institute' }) {
  const reduced = usePrefersReducedMotion();
  const stackKeys = Object.keys(data[0]).filter(k => k !== labelKey);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={d[labelKey] || i}>
          <div className="text-[11px] text-text2 mb-1">{d[labelKey]}</div>
          <div className="h-5 rounded-full bg-white/[0.06] overflow-hidden flex">
            {stackKeys.map((key, si) => {
              const total = stackKeys.reduce((s, k) => s + d[k], 0);
              const pct = total ? (d[key] / total) * 100 : 0;
              return (
                <motion.div
                  key={key}
                  style={{ width: `${pct}%`, background: colors?.[si] || accent }}
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.3, delay: reduced ? 0 : i * 0.03 }}
                  className="first:rounded-l-full last:rounded-r-full"
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TrendLine({ data, accent, xKey = 'year', lines = [] }) {
  const reduced = usePrefersReducedMotion();
  const w = 600, h = 200, px = 50, py = 20;
  const allVals = data.flatMap(d => lines.map(l => d[l.key]));
  const maxVal = Math.max(...allVals);
  const minVal = Math.min(...allVals);
  const range = maxVal - minVal || 1;
  const xStep = (w - px * 2) / (data.length - 1 || 1);

  const paths = lines.map(l => {
    const pts = data.map((d, i) => ({
      x: px + i * xStep,
      y: h - py - ((d[l.key] - minVal) / range) * (h - py * 2)
    }));
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    return { key: l.key, color: l.color || accent, path: d, pts };
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: h }}>
      {data.map((d, i) => (
        <text key={i} x={px + i * xStep} y={h - 4} textAnchor="middle" className="fill-text3/40 text-[9px]">{d[xKey]}</text>
      ))}
      {paths.map(p => (
        <motion.path
          key={p.key}
          d={p.path}
          fill="none"
          stroke={p.color}
          strokeWidth="2"
          strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      ))}
      {paths.map(p =>
        p.pts.map((pt, i) => (
          <motion.circle
            key={`${p.key}-${i}`}
            cx={pt.x} cy={pt.y} r="3" fill={p.color}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduced ? 0 : 0.5 + i * 0.02 }}
          />
        ))
      )}
    </svg>
  );
}

export function Heatmap({ data, accent, instituteKey = 'institutes', categoryKey = 'categories', cellKey = 'cells' }) {
  const reduced = usePrefersReducedMotion();
  const institutes = data[instituteKey];
  const categories = data[categoryKey];
  const cells = data[cellKey];
  const allVals = cells.flat();
  const max = Math.max(...allVals);
  const min = Math.min(...allVals);

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-px" style={{ gridTemplateColumns: `auto repeat(${categories.length}, 1fr)`, minWidth: 500 }}>
        <div className="text-[9px] text-text3/50 p-1" />
        {categories.map(c => <div key={c} className="text-[9px] text-text3/50 p-1 text-center">{c}</div>)}
        {cells.map((row, ri) => (
          <Fragment key={institutes[ri] || ri}>
            <div className="text-[10px] text-text2 p-1 truncate">{institutes[ri]}</div>
            {row.map((val, ci) => {
              const intensity = (val - min) / (max - min || 1);
              return (
                <motion.div
                  key={`${ri}-${ci}`}
                  className="p-1 text-center rounded text-[10px] font-medium"
                  style={{
                    background: `rgba(139,92,246,${0.1 + intensity * 0.5})`,
                    color: intensity > 0.6 ? '#fff' : '#a0a0a0'
                  }}
                  initial={reduced ? false : { opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: reduced ? 0 : (ri * cells[0].length + ci) * 0.01 }}
                  title={`${institutes[ri]} ${categories[ci]}: ${val}`}
                >
                  {val}
                </motion.div>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export function RadarChart({ data, accent, labelKey = 'specialization', dimensions: dims }) {
  const reduced = usePrefersReducedMotion();
  if (!data?.length) return <div className="text-text3/40 text-[11px] p-3 text-center">No data available</div>;
  const dimensions = dims || Object.keys(data[0]).filter(k => k !== labelKey && typeof data[0][k] === 'number');
  if (!dimensions.length) return <div className="text-text3/40 text-[11px] p-3 text-center">No dimensions available</div>;
  const cx = 250, cy = 250, r = 180, labelOffset = 24;
  const angleStep = (Math.PI * 2) / dimensions.length;

  const getAngle = (i) => angleStep * i - Math.PI / 2;

  const getAnchor = (angle) => {
    const a = ((angle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    if (a > Math.PI * 0.1 && a < Math.PI * 0.9) return 'end';
    if (a > Math.PI * 1.1 && a < Math.PI * 1.9) return 'start';
    return 'middle';
  };

  const getLabelY = (angle) => {
    const a = ((angle + Math.PI / 2) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    if (a < 0.1 || a > Math.PI * 2 - 0.1) return 4;
    if (a > Math.PI - 0.1 && a < Math.PI + 0.1) return -4;
    return 0;
  };

  const maxDimVal = Math.max(...data.flatMap(d => dimensions.map(dim => d[dim] || 0))) || 1;

  return (
    <svg viewBox="0 0 500 500" className="w-full max-w-[500px] mx-auto">
      {[0.25, 0.5, 0.75, 1].map((l, li) => {
        const pts = dimensions.map((_, i) => ({
          x: cx + r * l * Math.cos(getAngle(i)),
          y: cy + r * l * Math.sin(getAngle(i))
        }));
        return <polygon key={li} points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(255,255,255,0.06)" />;
      })}
      {dimensions.map((dim, i) => {
        const a = getAngle(i);
        const tx = cx + r * Math.cos(a);
        const ty = cy + r * Math.sin(a);
        const lx = cx + (r + labelOffset) * Math.cos(a);
        const ly = cy + (r + labelOffset) * Math.sin(a) + getLabelY(a);
        return (
          <g key={dim}>
            <line x1={cx} y1={cy} x2={tx} y2={ty} stroke="rgba(255,255,255,0.06)" />
            <text x={lx} y={ly} textAnchor={getAnchor(a)} dominantBaseline="middle" className="fill-text3/60 text-[9px]">
              {dim.replace(/_/g, ' ')}
            </text>
          </g>
        );
      })}
      {data.map((d, di) => {
        const polys = dimensions.map((dim, i) => ({
          x: cx + r * ((d[dim] || 0) / maxDimVal) * Math.cos(getAngle(i)),
          y: cy + r * ((d[dim] || 0) / maxDimVal) * Math.sin(getAngle(i))
        }));
        return (
          <g key={d[labelKey] || di}>
            <motion.polygon
              points={polys.map(p => `${p.x},${p.y}`).join(' ')}
              fill={`${accent}20`}
              stroke={accent}
              strokeWidth="1.5"
              initial={reduced ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduced ? 0 : di * 0.1 }}
            />
            <text x={polys[0].x} y={polys[0].y - 10} textAnchor="middle" className="fill-text2 text-[9px] font-medium">{d[labelKey]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function GaugeMeter({ data, accent, labelKey = 'institute', valueKey = 'safety_pct' }) {
  const reduced = usePrefersReducedMotion();
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d[labelKey] || i} className="flex items-center gap-3">
          <span className="text-[11px] text-text2 w-32 truncate shrink-0">{d[labelKey]}</span>
          <div className="flex-1 h-3 rounded-full bg-white/[0.06] overflow-hidden relative">
            <motion.div
              className="h-full rounded-full"
              style={{ background: d[valueKey] > 85 ? '#10B981' : d[valueKey] > 70 ? '#F59E0B' : '#EF4444' }}
              initial={reduced ? false : { width: 0 }}
              animate={{ width: `${d[valueKey]}%` }}
              transition={{ duration: 0.4, delay: reduced ? 0 : i * 0.05 }}
            />
          </div>
          <span className="text-[10px] font-bold text-text3/60 w-8 text-right">{d[valueKey]}%</span>
        </div>
      ))}
    </div>
  );
}

export function CompetitionMeter({ data, accent, labelKey = 'specialization', valueKey = 'level' }) {
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d[labelKey] || i}>
          <div className="flex justify-between text-[11px] mb-1">
            <span className="text-text2">{d[labelKey]}</span>
            <span className="text-text3/60">{d.label || d[valueKey]}</span>
          </div>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(star => (
              <div
                key={star}
                className="flex-1 h-1.5 rounded-full"
                style={{
                  background: star <= Math.ceil(d[valueKey] / 20) ? accent : 'rgba(255,255,255,0.06)'
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProgressBarList({ data, accent, labelKey = 'institute', valueKey = 'pct' }) {
  const reduced = usePrefersReducedMotion();
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={d[labelKey] || i}>
          <div className="flex justify-between text-[11px] mb-0.5">
            <span className="text-text2 truncate">{d[labelKey]}</span>
            <span className="text-text3/60">{d[valueKey]}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: d[valueKey] > 80 ? '#10B981' : d[valueKey] > 60 ? '#F59E0B' : accent }}
              initial={reduced ? false : { width: 0 }}
              animate={{ width: `${d[valueKey]}%` }}
              transition={{ duration: 0.3, delay: reduced ? 0 : i * 0.03 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ScatterPlot({ data, accent, xKey = 'fees', yKey = 'avg_package', sizeKey = 'placement_pct', labelKey = 'institute' }) {
  const reduced = usePrefersReducedMotion();
  if (!data?.length) return <div className="text-text3/40 text-[11px] p-3 text-center">No data available</div>;
  const w = 500, h = 300, px = 60, py = 30;
  const xVals = data.map(d => d[xKey]);
  const yVals = data.map(d => d[yKey]);
  const xMin = Math.min(...xVals);
  const xMax = Math.max(...xVals);
  const yMin = Math.min(...yVals);
  const yMax = Math.max(...yVals);
  const xRange = (xMax - xMin) * 1.3 || 1;
  const yRange = (yMax - yMin) * 1.3 || 1;
  const maxSize = Math.max(...data.map(d => d[sizeKey] || 0));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxHeight: h }}>
      <line x1={px} y1={0} x2={px} y2={h - py} stroke="rgba(255,255,255,0.08)" />
      <line x1={px} y1={h - py} x2={w - 10} y2={h - py} stroke="rgba(255,255,255,0.08)" />
      {data.map((d, i) => {
        const bx = px + ((d[xKey] - xMin) / xRange) * (w - px * 2);
        const by = h - py - ((d[yKey] - yMin) / yRange) * (h - py * 2);
        const sz = 6 + (d[sizeKey] / maxSize) * 16;
        return (
          <g key={d[labelKey] || i}>
            <motion.circle
              cx={bx} cy={by} r={sz}
              fill={`${accent}50`}
              stroke={accent}
              strokeWidth="1.5"
              initial={reduced ? false : { opacity: 0, r: 0 }}
              animate={{ opacity: 1, r: sz }}
              transition={{ delay: reduced ? 0 : i * 0.08, type: 'spring', stiffness: 100 }}
            />
            <text x={bx} y={by - sz - 4} textAnchor="middle" className="fill-text2 text-[9px] font-medium">{d[labelKey]}</text>
          </g>
        );
      })}
      <text x={w / 2} y={h - 4} textAnchor="middle" className="fill-text3/40 text-[8px]">{xKey} (₹L)</text>
      <text x={8} y={h / 2} textAnchor="middle" className="fill-text3/40 text-[8px]" transform={`rotate(-90, 8, ${h / 2})`}>{yKey} (₹L)</text>
    </svg>
  );
}

export function BubbleChart({ data, accent, xKey = 'fees', yKey = 'avg_package', sizeKey = 'roi_score', labelKey = 'institute' }) {
  return ScatterPlot({ data, accent, xKey, yKey, sizeKey, labelKey });
}

export function Timeline({ data, accent, labelKey = 'round', dateKey = 'start', actionKey = 'action' }) {
  return (
    <div className="relative pl-6 space-y-0">
      {data.map((d, i) => (
        <div key={d[labelKey] || i} className="relative pb-4 last:pb-0">
          <motion.div
            className="absolute left-[-22px] top-1 w-2.5 h-2.5 rounded-full border-2 z-10"
            style={{ borderColor: accent, background: i === 0 ? accent : 'transparent' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.03 }}
          />
          {i < data.length - 1 && (
            <div className="absolute left-[-18.5px] top-3 w-px h-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
          )}
          <div className="flex items-start gap-3">
            <span className="text-[10px] font-bold shrink-0 w-20" style={{ color: accent }}>{d[dateKey]}</span>
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-white">{d[labelKey]}</div>
              {d[actionKey] && <div className="text-[10px] text-text3/70">{d[actionKey]}</div>}
              {d.note && <div className="text-[9px] text-text3/50 mt-0.5">{d.note}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HorizontalGroupedBar({ data, accent, groups = [], labelKey = 'category' }) {
  const reduced = usePrefersReducedMotion();
  const maxVal = Math.max(...data.flatMap(d => groups.map(g => d[g])));
  const colors = ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#14B8A6'];
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={d[labelKey] || i}>
          <div className="text-[11px] font-medium text-text2 mb-1">{d[labelKey]}</div>
          {groups.map((g, gi) => (
            <div key={g} className="flex items-center gap-2 mb-0.5 last:mb-0">
              <span className="text-[9px] text-text3/50 w-20 shrink-0 text-right">{g}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: colors[gi % colors.length], width: `${(d[g] / maxVal) * 100}%` }}
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: `${(d[g] / maxVal) * 100}%` }}
                  transition={{ delay: reduced ? 0 : (i * groups.length + gi) * 0.02 }}
                />
              </div>
              <span className="text-[9px] text-text3/60 w-8 text-right">{d[g]}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function PieChart({ data, accent, labelKey = 'category', valueKey = 'pct', colors = ['#8B5CF6', '#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#14B8A6'] }) {
  const total = data.reduce((s, d) => s + d[valueKey], 0);
  let cum = 0;
  const cx = 150, cy = 150, r = 120;

  const slices = data.map((d, i) => {
    const pct = d[valueKey] / total;
    const a1 = (cum / total) * Math.PI * 2 - Math.PI / 2;
    const a2 = ((cum + d[valueKey]) / total) * Math.PI * 2 - Math.PI / 2;
    cum += d[valueKey];
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    const large = pct > 0.5 ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    const midA = (a1 + a2) / 2;
    const lx = cx + (r * 0.65) * Math.cos(midA);
    const ly = cy + (r * 0.65) * Math.sin(midA);
    return { path, color: colors[i % colors.length], label: d[labelKey], pct: d[valueKey], labelX: lx, labelY: ly };
  });

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-[300px] mx-auto">
      {slices.map((s, i) => (
        <motion.path
          key={i}
          d={s.path}
          fill={s.color}
          stroke="#0B0B0B"
          strokeWidth="1"
          initial={{ opacity: 0, transformOrigin: `${cx}px ${cy}px`, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
        />
      ))}
      {slices.filter(s => s.pct > 5).map((s, i) => (
        <text key={i} x={s.labelX} y={s.labelY} textAnchor="middle" dominantBaseline="middle"
          className="fill-white text-[8px] font-bold">{s.pct}%</text>
      ))}
      <foreignObject x="0" y="240" width="300" height="60">
        <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} />
              <span className="text-[9px] text-text3/60">{d[labelKey]} {d[valueKey]}%</span>
            </div>
          ))}
        </div>
      </foreignObject>
    </svg>
  );
}

export function GroupedBar({ data, accent, groups = [], labelKey = 'category' }) {
  return <HorizontalGroupedBar data={data} accent={accent} groups={groups} labelKey={labelKey} />;
}

export function NetworkDiagram({ data, accent }) {
  return (
    <div className="p-4 text-center">
      <div className="inline-flex flex-col items-center gap-3">
        <div className="flex gap-4 items-center">
          <div className="px-3 py-2 rounded-lg text-[10px] font-bold" style={{ background: '#8B5CF620', color: '#8B5CF6', border: '1px solid #8B5CF640' }}>GATE Result</div>
          <div className="w-8 h-px bg-white/[0.15]" />
          <div className="px-3 py-2 rounded-lg text-[10px] font-bold" style={{ background: '#F59E0B20', color: '#F59E0B', border: '1px solid #F59E0B40' }}>COAP Registration</div>
        </div>
        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#8B5CF6] flex items-center justify-center text-[7px]">1</div>
            <div className="px-3 py-2 rounded-lg text-[10px] font-bold" style={{ background: `${accent}20`, color: accent, border: `1px solid ${accent}40` }}>COAP<br/>10 Rounds</div>
            <div className="text-[8px] text-text3/50">IITs + IISc</div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#F59E0B] flex items-center justify-center text-[7px]">2</div>
            <div className="px-3 py-2 rounded-lg text-[10px] font-bold" style={{ background: '#10B98120', color: '#10B981', border: '1px solid #10B98140' }}>CCMT<br/>6 Rounds</div>
            <div className="text-[8px] text-text3/50">NITs + IIITs + GFTIs</div>
          </div>
        </div>
        <div className="px-3 py-2 rounded-lg text-[10px] font-bold" style={{ background: '#EF444420', color: '#EF4444', border: '1px solid #EF444440' }}>Final Seat Freeze</div>
      </div>
    </div>
  );
}

export function renderChart(chart, data, accent) {
  const props = { data: data[chart.data_ref] || [], accent };

  switch (chart.type) {
    case 'horizontal_bar':
      return <HorizontalBarChart {...props}
        labelKey={chart.data_ref === 'roi_ranked' ? 'institute' : 'label'}
        valueKey={chart.data_ref === 'roi_ranked' ? 'roi_score' : 'high'} />;
    case 'vertical_bar':
      return <VerticalBarChart {...props} labelKey="institute" valueKey={chart.data_ref === 'package_data' ? 'avg_package' : 'cse'} />;
    case 'stacked_bar':
      return <StackedBarChart {...props} labelKey="institute" />;
    case 'trend_line': {
      const lines = [];
      if (data.closing_by_year) lines.push({ key: 'top', color: '#FF6B6B' }, { key: 'older', color: '#F59E0B' }, { key: 'newer', color: '#10B981' });
      if (data.package_by_year) lines.push({ key: 'warangal', color: '#F59E0B' }, { key: 'trichy', color: '#14B8A6' }, { key: 'surathkal', color: '#8B5CF6' });
      if (data.da_reg_data) lines.push({ key: 'registrations', color: '#3B82F6' });
      return <TrendLine {...props} lines={lines} xKey="year" />;
    }
    case 'heatmap':
      return <Heatmap {...props} />;
    case 'radar':
      return <RadarChart {...props} />;
    case 'gauge':
      return <GaugeMeter {...props} valueKey="safety_pct" />;
    case 'competition_meter':
      return <CompetitionMeter {...props} />;
    case 'progress_bar_list':
      return <ProgressBarList {...props} />;
    case 'scatter':
      return <ScatterPlot {...props} />;
    case 'bubble':
      return <BubbleChart {...props} />;
    case 'timeline':
      return <Timeline {...props} />;
    case 'grouped_bar': {
      const groups = Object.keys(data[chart.data_ref]?.[0] || {}).filter(k => k !== 'category');
      return <GroupedBar {...props} groups={groups} />;
    }
    case 'network':
      return <NetworkDiagram {...props} />;
    default:
      return <div className="text-text3/50 text-[11px] p-4 text-center">Chart type "{chart.type}" not available</div>;
  }
}
