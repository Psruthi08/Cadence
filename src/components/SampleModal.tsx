import React from 'react';
import { X, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { SAMPLE_SPEECH_SESSIONS } from '../data/samplePresentations';
import { SpeechSession } from '../types/speech';

interface SampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SpeechSession) => void;
}

export const SampleModal: React.FC<SampleModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 shadow-xl space-y-5 animate-fade-in">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-800" />
            <h3 className="text-lg font-bold font-serif text-slate-900">
              Benchmarked Rehearsal Samples
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Explore instant honest AI feedback without recording your own audio. Select a realistic student scenario below:
        </p>

        <div className="space-y-3">
          {SAMPLE_SPEECH_SESSIONS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => {
                onSelectSample(sample);
                onClose();
              }}
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50/80 transition-all cursor-pointer space-y-2 group"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-800 transition-colors">
                    {sample.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                    {sample.context.topic}
                  </p>
                </div>
                <span className="p-1.5 rounded-full bg-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>

              {/* Unboxed metadata */}
              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span className="tabular-nums">{sample.metrics.wordsPerMinute} WPM</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{sample.metrics.fillerWordsCount} crutches</span>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-semibold tabular-nums">
                  Score: {sample.metrics.overallScore}/100
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
