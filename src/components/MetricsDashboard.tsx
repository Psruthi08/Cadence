import React from 'react';
import {
  Gauge,
  Sparkles,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  Volume2,
  CheckCircle,
} from 'lucide-react';
import { SpeechMetrics } from '../types/speech';

interface MetricsDashboardProps {
  metrics: SpeechMetrics;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics }) => {
  // Format pacing rating
  const getPacingBadge = (rating: string) => {
    switch (rating) {
      case 'ideal':
        return { label: 'Optimal Pace (130–155 WPM)', color: 'text-emerald-700 bg-emerald-50' };
      case 'brisk':
        return { label: 'Brisk Pace', color: 'text-amber-700 bg-amber-50' };
      case 'rushed':
        return { label: 'Too Fast (>165 WPM)', color: 'text-rose-700 bg-rose-50' };
      case 'measured':
        return { label: 'Measured / Deliberate', color: 'text-blue-700 bg-blue-50' };
      case 'too_slow':
        return { label: 'Too Slow (<110 WPM)', color: 'text-amber-700 bg-amber-50' };
      default:
        return { label: rating, color: 'text-slate-700 bg-slate-50' };
    }
  };

  const pacingInfo = getPacingBadge(metrics.pacingRating);

  // Maximum count for filler breakdown scaling
  const maxFillerCount = Math.max(
    ...metrics.fillersBreakdown.map((f) => f.count),
    1
  );

  return (
    <div className="space-y-6">
      {/* 4 Headline Score Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Score */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Speech Impact
            </span>
            <span className="text-xs font-medium text-slate-500">Benchmark /100</span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-bold text-slate-900 tabular-nums">
              {metrics.overallScore}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 line-clamp-1">{metrics.toneImpression}</p>
        </div>

        {/* Pacing Speed */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Speaking Cadence
            </span>
            <Gauge className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-bold text-slate-900 tabular-nums">
              {metrics.wordsPerMinute}
            </span>
            <span className="text-xs text-slate-500 font-medium">WPM</span>
          </div>
          <div className="mt-2">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${pacingInfo.color}`}>
              {pacingInfo.label}
            </span>
          </div>
        </div>

        {/* Filler Word Density */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Crutch Words
            </span>
            <AlertTriangle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-bold text-slate-900 tabular-nums">
              {metrics.fillerWordsCount}
            </span>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              ({metrics.fillerDensityPct}% of words)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Target: &lt; 2% for competitive job interviews
          </p>
        </div>

        {/* Confidence Index */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Perceived Confidence
            </span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-mono text-3xl sm:text-4xl font-bold text-slate-900 tabular-nums">
              {metrics.confidenceScore}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-600 h-full rounded-full transition-all"
              style={{ width: `${metrics.confidenceScore}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Deep Metric Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Detailed Pacing & Core Competencies (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-800" />
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                Delivery Competency Rubric
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              {metrics.wordCount} words / {Math.round(metrics.durationSeconds)}s
            </span>
          </div>

          {/* Competency Bars */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Articulation & Clarity</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {metrics.clarityScore}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-900 h-full rounded-full"
                  style={{ width: `${metrics.clarityScore}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Structural Flow & Transitions</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {metrics.structureScore}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-900 h-full rounded-full"
                  style={{ width: `${metrics.structureScore}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-700 mb-1.5">
                <span>Vocabulary Diversity</span>
                <span className="font-mono tabular-nums font-bold text-slate-900">
                  {metrics.vocabularyRichnessPct}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-slate-900 h-full rounded-full"
                  style={{ width: `${metrics.vocabularyRichnessPct}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Pacing Assessment Box */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-700" />
              <h4 className="text-xs font-bold text-slate-900">Pacing Diagnostic</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {metrics.pacingFeedback}
            </p>
          </div>

          {/* Pause Analysis */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-slate-700" />
                <h4 className="text-xs font-bold text-slate-900">Pause Utilization</h4>
              </div>
              <span className="text-xs font-mono text-slate-600 tabular-nums">
                {metrics.pauseCount} significant pauses
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {metrics.pauseFeedback}
            </p>
          </div>
        </div>

        {/* Right: Crutch Word Forensic Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                Filler Word Anatomy
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              Total Count: {metrics.fillerWordsCount}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Unconscious vocal crutches weaken authoritative answers. Below is your speech&apos;s frequency distribution:
          </p>

          {metrics.fillersBreakdown.length > 0 ? (
            <div className="space-y-3.5">
              {metrics.fillersBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded-sm border border-amber-200">
                      &quot;{item.word}&quot;
                    </span>
                    <span className="text-slate-600 font-mono tabular-nums">
                      {item.count} {item.count === 1 ? 'time' : 'times'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(10, (item.count / maxFillerCount) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    {item.frequencyFeedback}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200">
              <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
              <p className="font-bold">Zero Filler Words Detected</p>
              <p className="text-slate-600 mt-1">
                Outstanding verbal discipline! Your speech was clean and direct.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
