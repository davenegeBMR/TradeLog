import React, { useState } from 'react';
import { EquityPoint } from '../utils/analytics';

interface EquityChartProps {
  data: EquityPoint[];
  startingBalance: number;
}

export const EquityChart: React.FC<EquityChartProps> = ({ data, startingBalance }) => {
  const [hoveredPoint, setHoveredPoint] = useState<EquityPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-400">
        No trades recorded yet. Record trades to generate your equity curve.
      </div>
    );
  }

  const equities = data.map(d => d.equity);
  const minEquity = Math.min(...equities, startingBalance * 0.98);
  const maxEquity = Math.max(...equities, startingBalance * 1.02);
  const range = maxEquity - minEquity || 1;

  const width = 600;
  const height = 180;
  const paddingX = 20;
  const paddingY = 24;

  const getX = (index: number) => {
    if (data.length <= 1) return width / 2;
    return paddingX + (index / (data.length - 1)) * (width - 2 * paddingX);
  };

  const getY = (val: number) => {
    return height - paddingY - ((val - minEquity) / range) * (height - 2 * paddingY);
  };

  const points = data.map((d, i) => `${getX(i)},${getY(d.equity)}`).join(' ');
  const areaPoints = `${getX(0)},${height - paddingY} ${points} ${getX(data.length - 1)},${height - paddingY}`;

  const currentEquity = data[data.length - 1]?.equity ?? startingBalance;
  const totalReturn = currentEquity - startingBalance;
  const totalReturnPct = startingBalance > 0 ? (totalReturn / startingBalance) * 100 : 0;
  const isProfitable = totalReturn >= 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <span className="text-xs text-slate-500 dark:text-slate-400">Account Equity</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              ${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span
              className={`text-xs font-semibold font-mono tabular-nums ${
                isProfitable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isProfitable ? '+' : ''}
              ${totalReturn.toFixed(2)} ({totalReturnPct >= 0 ? '+' : ''}
              {totalReturnPct.toFixed(2)}%)
            </span>
          </div>
        </div>

        {hoveredPoint && (
          <div className="text-right text-xs">
            <span className="text-slate-400 block">{hoveredPoint.date}</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              ${hoveredPoint.equity.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full aspect-21/9 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800/80 p-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isProfitable ? '#10b981' : '#f43f5e'}
                stopOpacity="0.28"
              />
              <stop
                offset="100%"
                stopColor={isProfitable ? '#10b981' : '#f43f5e'}
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>

          {/* Reference starting balance line */}
          <line
            x1={paddingX}
            y1={getY(startingBalance)}
            x2={width - paddingX}
            y2={getY(startingBalance)}
            stroke="#94a3b8"
            strokeDasharray="3 3"
            strokeWidth="1"
            opacity="0.5"
          />

          {/* Area fill */}
          <polygon points={areaPoints} fill="url(#equityGradient)" />

          {/* Line stroke */}
          <polyline
            points={points}
            fill="none"
            stroke={isProfitable ? '#059669' : '#e11d48'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive touch/hover points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={getX(i)}
              cy={getY(d.equity)}
              r={hoveredPoint?.index === d.index ? 5 : 2.5}
              className="cursor-pointer transition-all fill-white stroke-slate-900 dark:fill-slate-900 dark:stroke-white"
              strokeWidth="1.5"
              onMouseEnter={() => setHoveredPoint(d)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={() => setHoveredPoint(d)}
            />
          ))}
        </svg>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
        <span>Start: ${startingBalance.toLocaleString()}</span>
        <span>Peak: ${maxEquity.toLocaleString('en-US', { maximumFractionDigits: 1 })}</span>
        <span>Low: ${minEquity.toLocaleString('en-US', { maximumFractionDigits: 1 })}</span>
      </div>
    </div>
  );
};
