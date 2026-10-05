import React, { useState, useMemo } from 'react';
import { AmortizationRow } from '../types/sora';
import { formatSgd, formatPercent } from '../utils/soraMath';
import { Search, ChevronLeft, ChevronRight, FileSpreadsheet } from 'lucide-react';

interface AmortizationTableProps {
  schedule: AmortizationRow[];
  totalInterest: number;
  totalPrincipal: number;
  onExportCsv: () => void;
}

export const AmortizationTable: React.FC<AmortizationTableProps> = ({
  schedule,
  totalInterest,
  totalPrincipal,
  onExportCsv,
}) => {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 12; // 1 year per page

  // Calculate unique years
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    schedule.forEach((row) => years.add(row.year));
    return Array.from(years).sort((a, b) => a - b);
  }, [schedule]);

  // Filter schedule
  const filteredSchedule = useMemo(() => {
    return schedule.filter((row) => {
      const matchesYear = selectedYear === 'all' || row.year === selectedYear;
      const matchesQuery =
        searchQuery.trim() === '' ||
        row.dateStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `month ${row.monthIndex}`.includes(searchQuery.toLowerCase()) ||
        `year ${row.year}`.includes(searchQuery.toLowerCase());
      return matchesYear && matchesQuery;
    });
  }, [schedule, selectedYear, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredSchedule.length / rowsPerPage));
  const currentPageSafe = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    const startIndex = (currentPageSafe - 1) * rowsPerPage;
    return filteredSchedule.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredSchedule, currentPageSafe, rowsPerPage]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-teal-700" />
            <span>Monthly Repayment & Amortization Schedule</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Exact breakdown of principal reduction, interest servicing, and remaining balance over{' '}
            {schedule.length} months.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => {
                setSelectedYear('all');
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                selectedYear === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Years
            </button>
            {availableYears.slice(0, 5).map((yr) => (
              <button
                key={yr}
                onClick={() => {
                  setSelectedYear(yr);
                  setCurrentPage(1);
                }}
                className={`px-2 py-1 rounded font-medium transition-colors ${
                  selectedYear === yr
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Yr {yr}
              </button>
            ))}
            {availableYears.length > 5 && (
              <select
                aria-label="Select loan year"
                value={typeof selectedYear === 'number' && selectedYear > 5 ? selectedYear : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedYear(Number(e.target.value));
                    setCurrentPage(1);
                  }
                }}
                className="bg-transparent text-slate-700 text-xs font-medium px-1.5 py-1 focus:outline-hidden"
              >
                <option value="">More...</option>
                {availableYears.slice(5).map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search month or date..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg w-44 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-700 focus:border-teal-700 transition-all"
            />
          </div>

          <button
            onClick={onExportCsv}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Amortization Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
            <tr>
              <th className="py-2.5 px-3 whitespace-nowrap">Month</th>
              <th className="py-2.5 px-3 whitespace-nowrap">Period</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Rate (p.a.)</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Beginning Balance</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Installment</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap text-teal-800">Principal</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap text-amber-800">Interest</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Ending Balance</th>
              <th className="py-2.5 px-3 text-right whitespace-nowrap">Cumul. Interest</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-slate-400">
                  No payment periods found matching criteria.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.monthIndex}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-700">
                    #{row.monthIndex}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800 whitespace-nowrap">
                    {row.dateStr}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                    {formatPercent(row.applicableRate, 3)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                    {formatSgd(row.beginningBalance)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                    {formatSgd(row.monthlyPayment, true)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-teal-800">
                    {formatSgd(row.principalPaid, true)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums font-medium text-amber-800">
                    {formatSgd(row.interestPaid, true)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-700">
                    {formatSgd(row.endingBalance)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-500">
                    {formatSgd(row.cumulativeInterest)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 sm:px-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span>
            Showing{' '}
            <strong className="font-semibold text-slate-800">
              {filteredSchedule.length === 0 ? 0 : (currentPageSafe - 1) * rowsPerPage + 1}
            </strong>{' '}
            to{' '}
            <strong className="font-semibold text-slate-800">
              {Math.min(currentPageSafe * rowsPerPage, filteredSchedule.length)}
            </strong>{' '}
            of <strong className="font-semibold text-slate-800">{filteredSchedule.length}</strong>{' '}
            installments
          </span>
          <span className="hidden md:inline text-slate-300">|</span>
          <span className="hidden md:inline font-mono tabular-nums">
            Total Principal: {formatSgd(totalPrincipal)} · Total Interest: {formatSgd(totalInterest)}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPageSafe <= 1}
            className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="px-2 py-0.5 font-mono text-slate-700 font-medium">
            Page {currentPageSafe} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPageSafe >= totalPages}
            className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
