import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  ArrowRight,
  ShieldAlert,
  Award,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Target,
  Lightbulb,
} from 'lucide-react';
import { CoachingFeedback } from '../types/speech';

interface CoachingHubProps {
  coaching: CoachingFeedback;
  speechTopic: string;
}

export const CoachingHub: React.FC<CoachingHubProps> = ({ coaching, speechTopic }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [activeDrillIndex, setActiveDrillIndex] = useState<number | null>(null);
  const [drillTimerSeconds, setDrillTimerSeconds] = useState<number>(0);
  const [isDrillRunning, setIsDrillRunning] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const drillIntervalRef = useRef<number | null>(null);

  // Play Coach Elena's voice using Gemini TTS
  const handlePlayCoachVoice = async () => {
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.play();
      setIsPlayingAudio(true);
      return;
    }

    setIsLoadingAudio(true);
    try {
      const promptToSpeak = `Here is my honest coaching advice: ${coaching.executiveSummary}`;

      const res = await fetch('/api/coach-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: promptToSpeak,
          coachVoice: 'Kore',
        }),
      });

      if (!res.ok) {
        throw new Error('TTS failed');
      }

      const data = await res.json();
      if (data.audioBase64) {
        const audioUrl = `data:audio/wav;base64,${data.audioBase64}`;
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => setIsPlayingAudio(false);
        audio.play();
        setIsPlayingAudio(true);
      } else {
        throw new Error('No audio returned');
      }
    } catch (err) {
      console.warn('Gemini TTS failed, falling back to browser speech synthesis:', err);
      // Fallback to browser SpeechSynthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(coaching.executiveSummary);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        utterance.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    } finally {
      setIsLoadingAudio(false);
    }
  };

  // Interactive Practice Drill Timer
  const startDrillTimer = (index: number, minutes: number) => {
    if (activeDrillIndex === index && isDrillRunning) {
      if (drillIntervalRef.current) clearInterval(drillIntervalRef.current);
      setIsDrillRunning(false);
      return;
    }

    setActiveDrillIndex(index);
    setDrillTimerSeconds(minutes * 60);
    setIsDrillRunning(true);

    if (drillIntervalRef.current) clearInterval(drillIntervalRef.current);

    drillIntervalRef.current = window.setInterval(() => {
      setDrillTimerSeconds((prev) => {
        if (prev <= 1) {
          if (drillIntervalRef.current) clearInterval(drillIntervalRef.current);
          setIsDrillRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetDrillTimer = () => {
    if (drillIntervalRef.current) clearInterval(drillIntervalRef.current);
    setIsDrillRunning(false);
    setActiveDrillIndex(null);
    setDrillTimerSeconds(0);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Coach Introduction Card & Executive Verdict */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <img
              src="/src/assets/images/coach_avatar_1790954669516.jpg"
              alt="Elena Vance, Speech Coach"
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold font-serif text-slate-900">
                  Elena Vance
                </h3>
                <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-medium border border-amber-200/60">
                  Speech & Pitch Coach
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Candid executive feedback for students & job seekers
              </p>
            </div>
          </div>

          {/* Voice Feedback Playback Button */}
          <button
            onClick={handlePlayCoachVoice}
            disabled={isLoadingAudio}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs whitespace-nowrap self-stretch sm:self-auto justify-center"
          >
            {isLoadingAudio ? (
              <span className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
            ) : isPlayingAudio ? (
              <VolumeX className="w-4 h-4 text-amber-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-amber-400" />
            )}
            <span>
              {isLoadingAudio
                ? 'Synthesizing Audio...'
                : isPlayingAudio
                ? 'Pause Coach Voice'
                : 'Hear Coach Elena'}
            </span>
          </button>
        </div>

        {/* Executive Summary */}
        <div className="mt-5 space-y-3">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Honest Executive Assessment
          </h4>
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-sans">
            {coaching.executiveSummary}
          </p>

          {/* Recruiter / Jury Verdict */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200/80 mt-4 flex items-start gap-3">
            <Target className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-900">Audience Reality Check</p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {coaching.recruiterVerdict}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Grid: Honest Blindspots vs Superpowers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Honest Blindspots - What Friends Never Tell You (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h3 className="text-base font-bold font-serif text-slate-900">
              Critical Blindspots
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Unconscious communication habits that undermine interviewers&apos; and professors&apos; confidence:
          </p>

          <div className="space-y-4 mt-2">
            {coaching.honestBlindspots.map((blindspot, idx) => (
              <div
                key={idx}
                className="p-4 bg-rose-50/50 rounded-lg border border-rose-200/80 space-y-2"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                  <span className="w-5 h-5 rounded-full bg-rose-200 text-rose-800 flex items-center justify-center font-mono text-[11px]">
                    {idx + 1}
                  </span>
                  <span>{blindspot.title}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {blindspot.criticalFeedback}
                </p>
                <div className="pt-2 border-t border-rose-200/60 text-xs">
                  <span className="font-semibold text-rose-950">Actionable Fix: </span>
                  <span className="text-slate-800">{blindspot.actionableFix}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Superpowers - What Genuinely Resonated (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Award className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-bold font-serif text-slate-900">
              Core Superpowers
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Standout strengths observed in your delivery. Double down on these in your real presentation:
          </p>

          <div className="space-y-4 mt-2">
            {coaching.superpowers.map((power, idx) => (
              <div
                key={idx}
                className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200/80 space-y-2"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{power.title}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {power.observation}
                </p>
                {power.quote && (
                  <div className="p-2 bg-white/80 rounded border border-emerald-200/60 text-xs text-emerald-950 italic">
                    &quot;{power.quote}&quot;
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sentence Rewrites: Before & After */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            <h3 className="text-base font-bold font-serif text-slate-900">
              Executive Phrasing: Before &amp; After
            </h3>
          </div>
          <span className="text-xs text-slate-500">Transform weak hedges into leadership presence</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coaching.rewrites.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
            >
              <div>
                <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                  Original Phrasing
                </span>
                <p className="text-xs text-slate-600 mt-1 line-through decoration-rose-400">
                  &quot;{item.originalSnippet}&quot;
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                  <span>Polished Executive Phrasing</span>
                  <ArrowRight className="w-3 h-3 text-emerald-600" />
                </span>
                <p className="text-xs font-semibold text-slate-900 mt-1">
                  &quot;{item.polishedVersion}&quot;
                </p>
              </div>

              <p className="text-[11px] text-slate-500 italic pt-1">
                Why: {item.rationale}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Practice Drills with Interactive Timers */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-slate-800" />
            <h3 className="text-base font-bold font-serif text-slate-900">
              Immediate Practice Drills
            </h3>
          </div>
          <span className="text-xs text-slate-500">Run before your next rehearsal</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {coaching.practiceDrills.map((drill, idx) => {
            const isThisDrillActive = activeDrillIndex === idx;

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isThisDrillActive
                    ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-bold ${
                      isThisDrillActive ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {drill.drillName}
                  </h4>
                  <span
                    className={`text-xs font-mono tabular-nums px-2 py-0.5 rounded ${
                      isThisDrillActive
                        ? 'bg-slate-800 text-amber-400 font-bold'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isThisDrillActive
                      ? formatTimer(drillTimerSeconds)
                      : `${drill.estimatedMinutes} min drill`}
                  </span>
                </div>

                <p
                  className={`text-xs mt-2 leading-relaxed ${
                    isThisDrillActive ? 'text-slate-300' : 'text-slate-600'
                  }`}
                >
                  {drill.instructions}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-200/40 flex items-center gap-2">
                  <button
                    onClick={() => startDrillTimer(idx, drill.estimatedMinutes)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      isThisDrillActive && isDrillRunning
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                        : isThisDrillActive
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isThisDrillActive && isDrillRunning ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause Timer</span>
                      </>
                    ) : isThisDrillActive ? (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Resume</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Start Drill</span>
                      </>
                    )}
                  </button>

                  {isThisDrillActive && (
                    <button
                      onClick={resetDrillTimer}
                      className="px-2.5 py-1.5 rounded text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
