import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoanCalculator } from './components/LoanCalculator';
import { CompoundingInspector } from './components/CompoundingInspector';
import { HistoricalRates } from './components/HistoricalRates';
import { StressTestCalculator } from './components/StressTestCalculator';
import { PackageComparison } from './components/PackageComparison';
import { BackendConnectorModal } from './components/BackendConnectorModal';
import { getLatestSoraRate } from './services/masSoraApi';
import { SoraRateRecord } from './types/sora';
import { exportAmortizationCsv, generateAmortizationSchedule } from './utils/soraMath';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('calculator');
  const [latestSora, setLatestSora] = useState<SoraRateRecord | null>(null);
  const [isBackendModalOpen, setIsBackendModalOpen] = useState(false);

  // Fetch initial latest SORA rate from service
  useEffect(() => {
    getLatestSoraRate().then((rate) => {
      setLatestSora(rate);
    });
  }, []);

  const handleExportSchedule = () => {
    if (!latestSora) return;
    const summary = generateAmortizationSchedule(
      {
        loanAmount: 800000,
        tenorYears: 25,
        tenorMonths: 0,
        propertyType: 'private_residential',
        soraTenor: '3M',
        compoundingMethod: 'in_advance',
        isTieredSpread: false,
        flatSpread: 0.65,
        tieredSpread: { year1: 0.6, year2: 0.6, year3: 0.75, thereafter: 0.85 },
        customSoraRate: null,
      },
      latestSora.compounded3M
    );

    const csvContent = exportAmortizationCsv(summary.amortizationSchedule);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'SORA_MAS_Amortization_Schedule.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!latestSora) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-teal-800 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-mono text-slate-600">Loading MAS SORA Benchmark Rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* 3-Zone Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenBackendConfig={() => setIsBackendModalOpen(true)}
        onExportCsv={handleExportSchedule}
        latestSoraDate={latestSora.date}
        latest3mSora={latestSora.compounded3M}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Dynamic Tab Views */}
        {activeTab === 'calculator' && (
          <LoanCalculator
            latestSoraRecord={latestSora}
            onNavigateToStress={() => setActiveTab('stress')}
            onNavigateToInspector={() => setActiveTab('inspector')}
          />
        )}

        {activeTab === 'inspector' && <CompoundingInspector />}

        {activeTab === 'rates' && <HistoricalRates />}

        {activeTab === 'stress' && (
          <StressTestCalculator
            currentMonthlyPayment={4242}
            loanPrincipal={800000}
            tenorYears={25}
            tenorMonths={0}
            propertyType="private_residential"
          />
        )}

        {activeTab === 'compare' && (
          <PackageComparison
            loanPrincipal={800000}
            tenorYears={25}
            tenorMonths={0}
            current3mSora={latestSora.compounded3M}
            current1mSora={latestSora.compounded1M}
          />
        )}
      </main>

      {/* Backend Integration Modal */}
      <BackendConnectorModal
        isOpen={isBackendModalOpen}
        onClose={() => setIsBackendModalOpen(false)}
      />

      {/* Footer conforming to design rules */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-800">SORA Calc SG</span>
            <span className="mx-2 text-slate-300">·</span>
            <span>Singapore Overnight Rate Average Mortgage & Interest Engine</span>
            <span className="mx-2 text-slate-300">·</span>
            <span>Convention: ACT/365 Fixed</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>Data Grounded in MAS Standards</span>
            <span>·</span>
            <button
              onClick={() => setIsBackendModalOpen(true)}
              className="text-teal-800 hover:text-teal-950 font-medium"
            >
              Backend API Status
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
