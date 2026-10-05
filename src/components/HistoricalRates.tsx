import React, { useState, useMemo } from 'react';
import { SoraRateRecord } from '../types/sora';
import { MOCK_MAS_SORA_SERIES } from '../services/masSoraApi';
import { formatPercent } from '../utils/soraMath';
import { Search, TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export const HistoricalRates: React.FC = () => {
  const [searchDate, setSearchDate] = useState('');
  const [tenorFilter, setTenorFilter] = useState<'all' | '1M' | '3M' | '6M'>('all');

  const filteredData = useMemo(() => {
    return MOCK_MAS_SORA_SERIES.filter((item) => {
      return searchDate.trim() === '' || item.date.includes(searchDate.trim());
    });
  }, [searchDate]);

  const latest = MOCK_MAS_SORA_SERIES[0];
  const oldest = MOCK_MAS_SORA_SERIES[MOCK_MAS_SORA_SERIES.length - 1];
  const change3m = latest.compounded3M - oldest.compounded3M;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Overnight SORA (Latest)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatPercent(latest.overnightRate, 4)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Value Date: {latest.date}</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">1-Month Compounded SORA</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatPercent(latest.compounded1M, 4)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Short-tenor mortgage benchmark</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-teal-200 bg-teal-50/30 shadow-xs">
          <div className="text-xs font-medium text-teal-800">3-Month Compounded SORA</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-teal-950 mt-1">
            {formatPercent(latest.compounded3M, 4)}
          </div>
          <div className="text-xs text-teal-700 mt-1 flex items-center gap-1 font-medium">
            <span>Primary Singapore Home Loan Benchmark</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">6-Month Compounded SORA</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatPercent(latest.compounded6M, 4)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            {change3m >= 0 ? (
              <span className="text-amber-700 flex items-center">
                <ArrowUpRight className="w-3 h-3" /> +{change3m.toFixed(2)}% over period
              </span>
            ) : (
              <span className="text-emerald-700 flex items-center">
                <ArrowDownRight className="w-3 h-3" /> {change3m.toFixed(2)}% over period
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Visual Rate Trajectory Chart Simulation */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-700" />
              <span>MAS SORA Yield Curves & Historical Benchmark Spread</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historical movement of 1M, 3M, and 6M compounded rates published by MAS.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-3 h-1 bg-teal-600 rounded-full inline-block"></span> 3M SORA
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-3 h-1 bg-blue-500 rounded-full inline-block"></span> 1M SORA
            </span>
            <span className="text-slate-300">·</span>
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-3 h-1 bg-amber-500 rounded-full inline-block"></span> 6M SORA
            </span>
          </div>
        </div>

        {/* Lightweight SVG Visualizer for SORA curves */}
        <div className="h-44 w-full pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 150">
            {/* Grid lines */}
            <line x1="0" y1="20" x2="800" y2="20" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="60" x2="800" y2="60" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="100" x2="800" y2="100" stroke="#f1f5f9" strokeWidth="1" />
            <line x1="0" y1="140" x2="800" y2="140" stroke="#e2e8f0" strokeWidth="1" />

            {/* Y axis labels */}
            <text x="5" y="24" className="text-3xs fill-slate-400 font-mono">3.20%</text>
            <text x="5" y="64" className="text-3xs fill-slate-400 font-mono">3.15%</text>
            <text x="5" y="104" className="text-3xs fill-slate-400 font-mono">3.10%</text>
            <text x="5" y="144" className="text-3xs fill-slate-400 font-mono">3.05%</text>

            {/* 6M Path */}
            <path
              d={MOCK_MAS_SORA_SERIES.slice()
                .reverse()
                .map((d, i, arr) => {
                  const x = 50 + (i / (arr.length - 1)) * 720;
                  // Map 3.00% -> 140, 3.20% -> 20
                  const y = 140 - ((d.compounded6M - 3.05) / 0.15) * 120;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, Math.min(145, y))}`;
                })
                .join(' ')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              strokeDasharray="4 2"
            />

            {/* 1M Path */}
            <path
              d={MOCK_MAS_SORA_SERIES.slice()
                .reverse()
                .map((d, i, arr) => {
                  const x = 50 + (i / (arr.length - 1)) * 720;
                  const y = 140 - ((d.compounded1M - 3.05) / 0.15) * 120;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, Math.min(145, y))}`;
                })
                .join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />

            {/* 3M Path (Bold primary) */}
            <path
              d={MOCK_MAS_SORA_SERIES.slice()
                .reverse()
                .map((d, i, arr) => {
                  const x = 50 + (i / (arr.length - 1)) * 720;
                  const y = 140 - ((d.compounded3M - 3.05) / 0.15) * 120;
                  return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(10, Math.min(145, y))}`;
                })
                .join(' ')}
              fill="none"
              stroke="#0f766e"
              strokeWidth="2.5"
            />
          </svg>
        </div>
      </div>

      {/* Historical Published Records Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              MAS Published SORA Records & Daily Interbank Volumes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Volume-weighted average rate of unsecured overnight interbank SGD transactions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by date (YYYY-MM)..."
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg w-48 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Value Date</th>
                <th className="py-2.5 px-3 text-right">Overnight SORA</th>
                <th className="py-2.5 px-3 text-right">1M Compounded</th>
                <th className="py-2.5 px-3 text-right text-teal-800">3M Compounded (Loan Std)</th>
                <th className="py-2.5 px-3 text-right">6M Compounded</th>
                <th className="py-2.5 px-3 text-right">Volume (SGD M)</th>
                <th className="py-2.5 px-3 text-right">Publication</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((record) => (
                <tr key={record.date} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                    {record.date}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                    {formatPercent(record.overnightRate, 4)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                    {formatPercent(record.compounded1M, 4)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-teal-900 bg-teal-50/20">
                    {formatPercent(record.compounded3M, 4)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                    {formatPercent(record.compounded6M, 4)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                    S${record.volumeMillionSgd.toLocaleString()}M
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {record.publishedTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
