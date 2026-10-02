import React from 'react';
import { Mic, Sparkles, BookOpen, Clock, BarChart2 } from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'metrics' | 'coach' | 'history';
  setActiveTab: (tab: 'studio' | 'metrics' | 'coach' | 'history') => void;
  onOpenNewSession: () => void;
  onSelectSample: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewSession,
  onSelectSample,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('studio')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-serif text-lg font-bold group-hover:bg-amber-600 transition-colors">
              C
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 font-serif">
              Cadence
            </span>
          </button>
        </div>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('studio')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeTab === 'studio'
                ? 'text-slate-950 font-semibold'
                : 'hover:text-slate-950'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Studio</span>
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeTab === 'metrics'
                ? 'text-slate-950 font-semibold'
                : 'hover:text-slate-950'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Delivery Metrics</span>
          </button>
          <button
            onClick={() => setActiveTab('coach')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeTab === 'coach'
                ? 'text-slate-950 font-semibold'
                : 'hover:text-slate-950'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>AI Coach Tips</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'text-slate-950 font-semibold'
                : 'hover:text-slate-950'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Session History</span>
          </button>
        </nav>

        {/* Zone 3: 1-2 primary actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onSelectSample}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap hidden sm:inline-flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Sample Speeches</span>
          </button>
          <button
            onClick={onOpenNewSession}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors whitespace-nowrap shadow-sm flex items-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>New Rehearsal</span>
          </button>
        </div>
      </div>
    </header>
  );
};
