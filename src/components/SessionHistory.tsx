import React from 'react';
import {
  Clock,
  Trash2,
  ExternalLink,
  TrendingUp,
  AlertTriangle,
  Award,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { SpeechSession } from '../types/speech';

interface SessionHistoryProps {
  sessions: SpeechSession[];
  activeSessionId: string;
  onSelectSession: (session: SpeechSession) => void;
  onDeleteSession: (id: string) => void;
  onSelectSample: () => void;
}

export const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onSelectSample,
}) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-800" />
            <h3 className="text-base font-bold font-serif text-slate-900">
              Rehearsal History &amp; Progress
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare your speech cadence and filler reduction across iterations.
          </p>
        </div>

        <button
          onClick={onSelectSample}
          className="text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <BookOpen className="w-3.5 h-3.5 text-slate-600" />
          <span>Load Benchmarked Samples</span>
        </button>
      </div>

      {sessions.length === 0 ? (
        <div className="py-12 text-center text-slate-400 space-y-3">
          <Clock className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-sm font-medium text-slate-600">No rehearsals saved yet</p>
          <p className="text-xs max-w-sm mx-auto text-slate-400">
            Record a practice talk in the Studio or load a benchmarked sample to see your delivery metrics and coaching tips.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;

            return (
              <div
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isActive
                    ? 'border-slate-900 bg-slate-50 shadow-xs ring-1 ring-slate-900'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {session.title || 'Untitled Speech'}
                    </h4>
                    {isActive && (
                      <span className="text-[10px] font-semibold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Clean unboxed text metadata with typographic separators per Section 1.A */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-sans">
                    <span>{formatDate(session.timestamp)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">
                      {session.context.category.replace('_', ' ')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {Math.round(session.metrics.durationSeconds)}s
                    </span>
                  </div>
                </div>

                {/* Metrics Badges */}
                <div className="flex items-center gap-4 sm:gap-6 self-start md:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Score
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                      {session.metrics.overallScore}/100
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Pace
                    </span>
                    <span className="font-mono font-bold text-slate-900 text-sm tabular-nums">
                      {session.metrics.wordsPerMinute} WPM
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Crutches
                    </span>
                    <span className="font-mono font-bold text-amber-700 text-sm tabular-nums">
                      {session.metrics.fillerWordsCount}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Delete Rehearsal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
