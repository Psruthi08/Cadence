import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  Square,
  Type,
  RotateCcw,
  Send,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
} from 'lucide-react';

interface PracticeDrillProps {
  drillName: string;
  instructions: string;
  estimatedMinutes: number;
  onClose: () => void;
}

type RecordingState = 'idle' | 'recording' | 'stopped';

export const PracticeDrill: React.FC<PracticeDrillProps> = ({
  drillName,
  instructions,
  estimatedMinutes,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(estimatedMinutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const [answerMode, setAnswerMode] = useState<'type' | 'record'>('type');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [transcript, setTranscript] = useState('');

  const [recordingState, setRecordingState] =
    useState<RecordingState>('idle');

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<{
    overallFeedback: string;
    strengths: string[];
    improvements: string[];
    fillerWords: string[];
    clarity: number;
    confidence: number;
    delivery: number;
  } | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // -----------------------------
  // DRILL TIMER
  // -----------------------------
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return;

    const interval = window.setInterval(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          setIsTimerRunning(false);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // -----------------------------
  // CLEANUP
  // -----------------------------
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Recognition may already be stopped.
        }
      }
    };
  }, []);

  // -----------------------------
  // TIMER FORMAT
  // -----------------------------
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  };

  // -----------------------------
  // START RECORDING
  // -----------------------------
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('Your browser does not support microphone recording.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;

      // Browser speech recognition
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let finalText = '';

          for (
            let i = event.resultIndex;
            i < event.results.length;
            i++
          ) {
            finalText += event.results[i][0].transcript + ' ';
          }

          setTranscript((previous) => {
            const combined = `${previous} ${finalText}`.trim();
            return combined;
          });
        };

        recognition.onerror = (event: any) => {
          console.warn(
            'Speech recognition error:',
            event.error
          );
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      recorder.start();

      setRecordingState('recording');
    } catch (error) {
      console.error('Microphone permission failed:', error);

      alert(
        'Microphone access was not available. Please allow microphone permission and try again.'
      );
    }
  };

  // -----------------------------
  // STOP RECORDING
  // -----------------------------
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());

    streamRef.current = null;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Already stopped.
      }
    }

    setRecordingState('stopped');
  };

  // -----------------------------
  // RESET DRILL
  // -----------------------------
  const resetDrill = () => {
    stopRecording();

    setTimeLeft(estimatedMinutes * 60);
    setIsTimerRunning(true);

    setTypedAnswer('');
    setTranscript('');

    setRecordingState('idle');
    setIsSubmitted(false);
  };

  // -----------------------------
  // SUBMIT
  // -----------------------------
  const submitAnswer = async () => {
  const answer =
    answerMode === 'type'
      ? typedAnswer.trim()
      : transcript.trim();

  if (!answer) {
    alert(
      'Please type an answer or record your answer before submitting.'
    );
    return;
  }

  if (recordingState === 'recording') {
    stopRecording();
  }

  setIsTimerRunning(false);
  setIsAnalyzing(true);
  setAiFeedback(null);

  try {
    const response = await fetch('/api/analyze-drill', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        drillName,
        instructions,
        answer,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to analyze drill.');
    }

    console.log('Drill AI feedback:', data);

    setAiFeedback(data);
    setIsSubmitted(true);

  } catch (error) {
    console.error('Drill analysis failed:', error);

    alert(
      error instanceof Error
        ? error.message
        : 'Failed to analyze your practice. Please try again.'
    );
  } finally {
    setIsAnalyzing(false);
  }
};

  const answerText =
    answerMode === 'type'
      ? typedAnswer.trim()
      : transcript.trim();

  const wordCount = answerText
    ? answerText.split(/\s+/).filter(Boolean).length
    : 0;

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
            Active Practice Drill
          </p>

          <h4 className="text-lg font-bold font-serif text-slate-900 mt-1">
            {drillName}
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold bg-slate-900 text-amber-400 px-3 py-1.5 rounded-lg">
            {formatTime(timeLeft)}
          </span>

          <button
            onClick={() =>
              setIsTimerRunning((previous) => !previous)
            }
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-100"
          >
            {isTimerRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                Resume
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Your task
        </p>

        <p className="text-sm text-slate-700 leading-relaxed mt-2">
          {instructions}
        </p>
      </div>

      {/* Answer Mode */}
      <div className="mt-5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Choose how you want to practice
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => setAnswerMode('type')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              answerMode === 'type'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-300 text-slate-700'
            }`}
          >
            <Type className="w-4 h-4" />
            Type Answer
          </button>

          <button
            onClick={() => setAnswerMode('record')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
              answerMode === 'record'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-300 text-slate-700'
            }`}
          >
            <Mic className="w-4 h-4" />
            Speak Answer
          </button>
        </div>
      </div>

      {/* Typing Mode */}
      {answerMode === 'type' && (
        <div className="mt-4">
          <textarea
            value={typedAnswer}
            onChange={(event) =>
              setTypedAnswer(event.target.value)
            }
            placeholder="Write your answer here..."
            rows={7}
            className="w-full rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-300 resize-none"
          />

          <p className="text-xs text-slate-500 mt-2">
            {wordCount} words
          </p>
        </div>
      )}

      {/* Recording Mode */}
      {answerMode === 'record' && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col items-center text-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                recordingState === 'recording'
                  ? 'bg-rose-100 text-rose-600 animate-pulse'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <Mic className="w-7 h-7" />
            </div>

            <p className="font-semibold text-slate-900 mt-3">
              {recordingState === 'recording'
                ? 'Recording your answer...'
                : recordingState === 'stopped'
                ? 'Recording complete'
                : 'Ready to record'}
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Speak naturally. Cadence will capture your spoken response.
            </p>

            <div className="mt-4 flex gap-2">
              {recordingState !== 'recording' ? (
                <button
                  onClick={startRecording}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-sm flex items-center gap-2 hover:bg-amber-400"
                >
                  <Mic className="w-4 h-4" />
                  Start Recording
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white font-bold text-sm flex items-center gap-2 hover:bg-rose-500"
                >
                  <Square className="w-4 h-4" />
                  Stop Recording
                </button>
              )}
            </div>
          </div>

          {transcript && (
            <div className="mt-5 border-t border-slate-200 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Transcript
              </p>

              <p className="text-sm text-slate-700 leading-relaxed mt-2">
                {transcript}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Submit */}
      {!isSubmitted ? (
        <button
          onClick={submitAnswer}
          className="mt-5 px-5 py-2.5 rounded-lg bg-slate-900 text-white font-semibold text-sm flex items-center gap-2 hover:bg-slate-800"
        >
          <Send className="w-4 h-4" />
          Submit Practice
        </button>
      ) : (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />

            <div>
              <p className="font-bold text-emerald-900">
                Practice submitted
              </p>

              <p className="text-sm text-emerald-800 mt-1">
                You completed this drill with {wordCount} words.
              </p>
            </div>
          </div>

          {wordCount < 20 && (
            <div className="mt-3 flex items-start gap-2 text-xs text-emerald-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                Try expanding your answer with a specific example,
                action, and measurable result.
              </span>
            </div>
          )}

          {wordCount >= 20 && (
            <p className="mt-3 text-xs text-emerald-900">
              Good start. In the next attempt, focus on clarity,
              structure, and confident delivery.
            </p>
          )}
        </div>
      )}

      {aiFeedback && (
  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
    <h4 className="text-lg font-bold text-slate-900">
      AI Feedback
    </h4>

    <p className="text-sm text-slate-700 mt-2 leading-relaxed">
      {aiFeedback.overallFeedback}
    </p>

    <div className="mt-4">
      <p className="font-semibold text-slate-900">
        Strengths
      </p>

      <ul className="list-disc pl-5 mt-2 text-sm text-slate-700 space-y-1">
        {aiFeedback.strengths.map((strength, index) => (
          <li key={index}>{strength}</li>
        ))}
      </ul>
    </div>

    <div className="mt-4">
      <p className="font-semibold text-slate-900">
        Improvements
      </p>

      <ul className="list-disc pl-5 mt-2 text-sm text-slate-700 space-y-1">
        {aiFeedback.improvements.map((improvement, index) => (
          <li key={index}>{improvement}</li>
        ))}
      </ul>
    </div>

    <div className="mt-4">
      <p className="font-semibold text-slate-900">
        Speaking Scores
      </p>

      <div className="grid grid-cols-3 gap-3 mt-2">
        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Clarity</p>
          <p className="text-lg font-bold text-slate-900">
            {aiFeedback.clarity}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Confidence</p>
          <p className="text-lg font-bold text-slate-900">
            {aiFeedback.confidence}
          </p>
        </div>

        <div className="rounded-lg bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">Delivery</p>
          <p className="text-lg font-bold text-slate-900">
            {aiFeedback.delivery}
          </p>
        </div>
      </div>
    </div>

    {aiFeedback.fillerWords.length > 0 && (
      <div className="mt-4">
        <p className="font-semibold text-slate-900">
          Filler Words
        </p>

        <p className="text-sm text-slate-700 mt-1">
          {aiFeedback.fillerWords.join(', ')}
        </p>
      </div>
    )}
  </div>
)}

      {/* Bottom Controls */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={resetDrill}
          className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Drill
        </button>

        <button
          onClick={onClose}
          className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900"
        >
          Close Drill
        </button>
      </div>
    </div>
  );
};