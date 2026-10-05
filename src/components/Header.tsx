import React from 'react';
import { Sliders, Database, ShieldAlert, Layers, Calculator, Download } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBackendConfig: () => void;
  onExportCsv: () => void;
  latestSoraDate: string;
  latest3mSora: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenBackendConfig,
  onExportCsv,
  latestSoraDate,
  latest3mSora,
}) => {
  const navItems = [
    { id: 'calculator', label: 'Loan Calculator', icon: Calculator },
    { id: 'inspector', label: 'Compounding Inspector', icon: Sliders },
    { id: 'rates', label: 'MAS Rate History', icon: Database },
    { id: 'stress', label: 'MAS 4.0% Stress Test', icon: ShieldAlert },
    { id: 'compare', label: 'Package Compare', icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab('calculator');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2 hover:text-teal-900 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-teal-800 text-white flex items-center justify-center font-mono text-sm font-semibold shadow-xs">
                S$
              </span>
              <span>SORA Calc SG</span>
            </a>
          </div>

          {/* Zone 2: 4-5 clean text navigation links / segmented controls */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1-2 primary actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenBackendConfig}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs"
              title="Configure MAS API or custom backend integration"
            >
              <Database className="w-3.5 h-3.5 text-teal-700" />
              <span>MAS API Config</span>
            </button>

            <button
              onClick={onExportCsv}
              className="px-3.5 py-1.5 text-xs font-medium text-white bg-teal-800 rounded-lg hover:bg-teal-900 transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs"
              title="Download full amortization schedule in CSV format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation strip */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-teal-800 text-white'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtle Market Benchmark Ticker Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between border-t border-slate-800">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
          <span className="font-semibold text-white">MAS Published Benchmark:</span>
          <span>MAS SORA 3M Compounded:</span>
          <span className="font-mono tabular-nums font-semibold text-emerald-400">
            {latest3mSora.toFixed(4)}%
          </span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400">Value Date: {latestSoraDate}</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-slate-400">
          <span>Formula: ACT/365 Fixed</span>
          <span>·</span>
          <span>Source: Monetary Authority of Singapore</span>
        </div>
      </div>
    </header>
  );
};
