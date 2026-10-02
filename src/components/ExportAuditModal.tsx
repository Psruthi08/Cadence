import React from 'react';
import { X, Printer, Download, Check } from 'lucide-react';
import { SpeechSession } from '../types/speech';

interface ExportAuditModalProps {
  session: SpeechSession | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportAuditModal: React.FC<ExportAuditModalProps> = ({
  session,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !session) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col p-6 shadow-2xl space-y-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-lg font-bold font-serif text-slate-900">
              Executive Speech Audit Report
            </h3>
            <p className="text-xs text-slate-500">
              Formatted for student advisors, thesis committees, or interview practice logs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Audit Document */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-6 text-slate-800 text-xs sm:text-sm font-sans">
          {/* Header */}
          <div className="border-b border-slate-200 pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold font-serif text-slate-900">
                  {session.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Topic: {session.context.topic}
                </p>
                <p className="text-xs text-slate-500">
                  Target Audience: {session.context.audience}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                  {session.metrics.overallScore} / 100
                </span>
                <span className="block text-[11px] text-slate-500">Overall Rating</span>
              </div>
            </div>
          </div>

          {/* Metrics Summary Grid */}
          <div className="grid grid-cols-4 gap-3 bg-white p-4 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Cadence</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {session.metrics.wordsPerMinute} WPM
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Duration</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {Math.round(session.metrics.durationSeconds)}s
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Crutch Words</span>
              <span className="text-sm font-bold font-mono tabular-nums text-amber-700">
                {session.metrics.fillerWordsCount} ({session.metrics.fillerDensityPct}%)
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Confidence</span>
              <span className="text-sm font-bold font-mono tabular-nums text-slate-900">
                {session.metrics.confidenceScore}%
              </span>
            </div>
          </div>

          {/* Executive Summary */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Coach&apos;s Candid Verdict
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200">
              {session.coaching.executiveSummary}
            </p>
          </div>

          {/* Honest Blindspots */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 mb-2">
              Critical Blindspots to Address
            </h4>
            <div className="space-y-2">
              {session.coaching.honestBlindspots.map((item, idx) => (
                <div key={idx} className="p-3 bg-rose-50/60 rounded border border-rose-200 text-xs">
                  <p className="font-bold text-rose-950">{item.title}</p>
                  <p className="text-slate-700 mt-1">{item.criticalFeedback}</p>
                  <p className="text-slate-900 font-semibold mt-1">Fix: {item.actionableFix}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Transcript Snippet */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Full Verbatim Transcript
            </h4>
            <div className="p-3.5 bg-white rounded-lg border border-slate-200 text-xs leading-relaxed text-slate-800 max-h-48 overflow-y-auto">
              {session.transcript}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
