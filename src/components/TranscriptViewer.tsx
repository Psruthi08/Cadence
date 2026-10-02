import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Filter,
  Volume2,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { TranscriptSegment, TranscriptSegmentType } from '../types/speech';

interface TranscriptViewerProps {
  transcript: string;
  segments: TranscriptSegment[];
  audioUrl?: string;
  durationSeconds: number;
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
  segments,
  audioUrl,
  durationSeconds,
}) => {
  const [filterMode, setFilterMode] = useState<TranscriptSegmentType | 'all'>('all');
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedSegment, setSelectedSegment] = useState<TranscriptSegment | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Count instances
  const fillerCount = segments.filter((s) => s.type === 'filler').length;
  const hedgeCount = segments.filter((s) => s.type === 'weak_hedge').length;
  const strongCount = segments.filter((s) => s.type === 'strong_point').length;

  const getSegmentStyle = (segment: TranscriptSegment) => {
    const isFiltered = filterMode === 'all' || filterMode === segment.type;

    if (!isFiltered) {
      return 'text-slate-800';
    }

    switch (segment.type) {
      case 'filler':
        return 'bg-amber-100 text-amber-900 border-b-2 border-amber-400 font-medium px-1 rounded-xs cursor-pointer hover:bg-amber-200 transition-colors';
      case 'weak_hedge':
        return 'bg-rose-100 text-rose-900 border-b-2 border-rose-400 font-medium px-1 rounded-xs cursor-pointer hover:bg-rose-200 transition-colors';
      case 'strong_point':
        return 'bg-emerald-50 text-emerald-900 border-b-2 border-emerald-400 font-medium px-1 rounded-xs cursor-pointer hover:bg-emerald-100 transition-colors';
      case 'pause':
        return 'bg-slate-200 text-slate-700 italic text-xs px-1.5 py-0.5 rounded-sm mx-1';
      default:
        return 'text-slate-800';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-800" />
            <h3 className="text-base font-bold font-serif text-slate-900">
              Verbatim Speech Transcript
            </h3>
          </div>
          {/* Metadata unboxed text with typographic separators per Section 1.A */}
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span>{Math.round(transcript.split(/\s+/).filter(Boolean).length)} words</span>
            <span aria-hidden="true">·</span>
            <span>{fillerCount} filler crutches</span>
            <span aria-hidden="true">·</span>
            <span>{hedgeCount} defensive hedges</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition-colors flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Transcript</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filter Tabs (Functional interactive button tabs per Constitution §1.A) */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            filterMode === 'all'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Text
        </button>
        <button
          onClick={() => setFilterMode('filler')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
            filterMode === 'filler'
              ? 'bg-white text-amber-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          <span>Fillers ({fillerCount})</span>
        </button>
        <button
          onClick={() => setFilterMode('weak_hedge')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
            filterMode === 'weak_hedge'
              ? 'bg-white text-rose-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-400"></span>
          <span>Hedges ({hedgeCount})</span>
        </button>
        <button
          onClick={() => setFilterMode('strong_point')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
            filterMode === 'strong_point'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Power Points ({strongCount})</span>
        </button>
      </div>

      {/* Main Interactive Transcript Body */}
      <div className="p-4 sm:p-5 bg-slate-50/70 border border-slate-200 rounded-xl leading-relaxed text-slate-800 text-sm sm:text-base font-sans select-text">
        {segments && segments.length > 0 ? (
          <div>
            {segments.map((segment, idx) => (
              <span
                key={idx}
                className={getSegmentStyle(segment)}
                onClick={() => {
                  if (segment.feedbackNote) {
                    setSelectedSegment(segment);
                  }
                }}
              >
                {segment.text}
              </span>
            ))}
          </div>
        ) : (
          <p className="whitespace-pre-line text-slate-800">{transcript}</p>
        )}
      </div>

      {/* Selected Segment Inspection Callout */}
      {selectedSegment && (
        <div className="p-3.5 bg-slate-900 text-slate-100 rounded-lg text-xs flex items-start justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">
                Coaching Annotation: &quot;{selectedSegment.text}&quot;
              </p>
              <p className="text-slate-300 mt-0.5">{selectedSegment.feedbackNote}</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedSegment(null)}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Audio Playback Sync Bar if Audio Available */}
      {audioUrl && (
        <div className="p-3 bg-slate-100/80 rounded-lg border border-slate-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Volume2 className="w-4 h-4 text-slate-700" />
            <span className="font-medium">Speech Audio Playback</span>
          </div>
          <audio controls src={audioUrl} className="h-8 max-w-xs w-full" />
        </div>
      )}
    </div>
  );
};
