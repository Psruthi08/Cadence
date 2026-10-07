import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Upload,
  Sliders,
  Eye,
  FileText,
  Volume2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { SpeechContext, PresentationCategory } from '../types/speech';

interface AudioRecorderProps {
  onAnalyzeComplete: (sessionData: any) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  resetToken: number;
}

const CATEGORY_OPTIONS: Array<{
  id: PresentationCategory;
  label: string;
  defaultAudience: string;
  defaultPrompt: string;
  defaultNotes: string;
}> = [
  {
    id: 'job_interview',
    label: 'Job Interview Q&A',
    defaultAudience: 'Hiring Manager & Technical Panel',
    defaultPrompt: 'Tell me about a challenging project and how you handled unexpected roadblocks.',
    defaultNotes: '• Situation: Set context quickly\n• Task: Core objective\n• Action: Personal technical contribution\n• Result: Quantified impact and learnings',
  },
  {
    id: 'academic_defense',
    label: 'Thesis / Research Defense',
    defaultAudience: 'Academic Committee & Faculty Jury',
    defaultPrompt: 'Research significance, core methodology, and benchmark results of your thesis.',
    defaultNotes: '• State the primary scientific bottleneck\n• Explicitly state hypothesis\n• Highlight key quantitative benchmark\n• Concrete future research implications',
  },
  {
    id: 'class_presentation',
    label: 'Class Talk / Seminar',
    defaultAudience: 'Professors & University Peers',
    defaultPrompt: '10-minute briefing on your case study findings and strategic recommendations.',
    defaultNotes: '• Hook: Why this matters today\n• 3 main pillars of analysis\n• Key tradeoff discussed\n• Clear takeaway message',
  },
  {
    id: 'startup_pitch',
    label: '60-Second Startup Pitch',
    defaultAudience: 'Angel Investors & Venture Judges',
    defaultPrompt: 'The urgent problem, your unfair advantage, business traction, and ask.',
    defaultNotes: '• Pain point: Who suffers and how much\n• Solution: Why now and secret sauce\n• Traction: Users, revenue, or pilots\n• The Ask: Capital & key milestones',
  },
];

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onAnalyzeComplete,
  isAnalyzing,
  setIsAnalyzing,
  resetToken,
}) => {
  // Setup state
  const [selectedCategory, setSelectedCategory] = useState<PresentationCategory>('job_interview');
  const [topicPrompt, setTopicPrompt] = useState(CATEGORY_OPTIONS[0].defaultPrompt);
  const [audience, setAudience] = useState(CATEGORY_OPTIONS[0].defaultAudience);
  const [notesPrompt, setNotesPrompt] = useState(CATEGORY_OPTIONS[0].defaultNotes);
  const [targetDuration, setTargetDuration] = useState<number>(90);

  // Stage simulation environment
  const [stageEnv, setStageEnv] = useState<'minimal' | 'auditorium' | 'boardroom'>('minimal');
  const [showTeleprompter, setShowTeleprompter] = useState<boolean>(true);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(1);
  const [teleprompterScrolling, setTeleprompterScrolling] = useState<boolean>(false);

  // Recording states
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'recorded'>('idle');
  const [duration, setDuration] = useState<number>(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');
  const [isPreparingAudio, setIsPreparingAudio] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [liveVolume, setLiveVolume] = useState<number>(0);

  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const teleprompterRef = useRef<HTMLDivElement | null>(null);
  const audioPreparationIdRef = useRef(0);
  const recordingGenerationRef = useRef(0);

  const prepareAudio = (blob: Blob) => {
    const preparationId = ++audioPreparationIdRef.current;
    setIsPreparingAudio(true);
    setAudioBase64(null);
    setAnalysisError(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (preparationId !== audioPreparationIdRef.current) return;
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const base64 = dataUrl.includes(',') ? dataUrl.slice(dataUrl.indexOf(',') + 1) : '';
      if (!base64) {
        setAnalysisError('The audio could not be prepared. Please record again or upload another file.');
        setIsPreparingAudio(false);
        return;
      }
      setAudioBase64(base64);
      setIsPreparingAudio(false);
    };
    reader.onerror = () => {
      if (preparationId !== audioPreparationIdRef.current) return;
      setAnalysisError('The audio could not be read. Please record again or upload another file.');
      setIsPreparingAudio(false);
    };
    reader.readAsDataURL(blob);
  };

  // Switch category defaults
  const handleCategoryChange = (cat: PresentationCategory) => {
    setSelectedCategory(cat);
    const preset = CATEGORY_OPTIONS.find((c) => c.id === cat);
    if (preset) {
      setTopicPrompt(preset.defaultPrompt);
      setAudience(preset.defaultAudience);
      setNotesPrompt(preset.defaultNotes);
    }
  };

  // Start real browser recording
  const startRecording = async () => {
    const recordingGeneration = ++recordingGenerationRef.current;
    setAnalysisError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      if (recordingGeneration !== recordingGenerationRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      // Setup Web Audio API analyser for live waveform
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start canvas waveform render loop
      drawWaveform();

      // Check supported mime types
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }

      setAudioMimeType(mimeType);

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (recordingGeneration !== recordingGenerationRef.current) {
          stream.getTracks().forEach((track) => track.stop());
          if (audioCtx.state !== 'closed') await audioCtx.close();
          return;
        }
        const fullBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(fullBlob);
        const url = URL.createObjectURL(fullBlob);
        setAudioUrl(url);

        // Stop all mic tracks
        stream.getTracks().forEach((track) => track.stop());
        if (audioCtx.state !== 'closed') {
          await audioCtx.close();
        }
        if (!fullBlob.size) {
          setAnalysisError('No audio was captured. Check your microphone and record again.');
          setRecordingState('idle');
          setIsPreparingAudio(false);
          return;
        }
        prepareAudio(fullBlob);
        setRecordingState('recorded');
      };

      recorder.start(250); // slice every 250ms
      setRecordingState('recording');
      setDuration(0);

      // Start elapsed timer
      timerIntervalRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      if (showTeleprompter) {
        setTeleprompterScrolling(true);
      }
    } catch (err: any) {
      if (recordingGeneration !== recordingGenerationRef.current) return;
      console.error('Microphone access failed:', err);
      setAnalysisError(
        'Could not access microphone. Please allow microphone permissions or upload an audio file.'
      );
    }
  };

  // Pause / Resume recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setTeleprompterScrolling(false);
    } else if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerIntervalRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
      if (showTeleprompter) setTeleprompterScrolling(true);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setTeleprompterScrolling(false);
  };

  // Reset recording
  const resetRecording = () => {
  recordingGenerationRef.current += 1;
  audioPreparationIdRef.current += 1;
  setIsPreparingAudio(false);
  // Stop an active recorder
  if (
    mediaRecorderRef.current &&
    mediaRecorderRef.current.state !== 'inactive'
  ) {
    mediaRecorderRef.current.stop();
  }

  // Stop microphone tracks
  if (mediaRecorderRef.current?.stream) {
    mediaRecorderRef.current.stream
      .getTracks()
      .forEach((track) => track.stop());
  }

  // Stop timer
  if (timerIntervalRef.current) {
    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = null;
  }

  // Stop waveform animation
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = null;
  }

  // Close audio context
  if (audioContextRef.current) {
    if (audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }
    audioContextRef.current = null;
  }

  // Stop preview audio
  if (audioElementRef.current) {
    audioElementRef.current.pause();
    audioElementRef.current.currentTime = 0;
    audioElementRef.current = null;
  }

  // Release the previous object URL
  if (audioUrl) {
    URL.revokeObjectURL(audioUrl);
  }

  // Clear all recording state
  mediaRecorderRef.current = null;
  audioChunksRef.current = [];

  setRecordingState('idle');
  setDuration(0);
  setAudioUrl(null);
  setAudioBlob(null);
  setAudioBase64(null);
  setIsPlayingPreview(false);
  setAnalysisError(null);
  setLiveVolume(0);
  setTeleprompterScrolling(false);
};

useEffect(() => {
  if (resetToken > 0) {
    resetRecording();
  }
}, [resetToken]);
  // Teleprompter autoscroll loop
  useEffect(() => {
    let interval: number;
    if (teleprompterScrolling && teleprompterRef.current) {
      interval = window.setInterval(() => {
        if (teleprompterRef.current) {
          teleprompterRef.current.scrollTop += teleprompterSpeed;
        }
      }, 50);
    }
    return () => clearInterval(interval);
  }, [teleprompterScrolling, teleprompterSpeed]);

  // Canvas visualizer loop
  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationFrameRef.current = requestAnimationFrame(render);
      analyser.getByteFrequencyData(dataArray);

      // Compute average volume for meter
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      setLiveVolume(Math.min(100, Math.round((avg / 128) * 100)));

      // Draw bars
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * (canvas.height * 0.85);

        // Professional dark slate gradient with subtle amber accent
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.6, '#334155');
        gradient.addColorStop(1, '#d97706');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth + 1;
      }
    };
    render();
  };

  // Handle local audio file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

  recordingGenerationRef.current += 1;
    setAnalysisError(null);
  if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setAudioBlob(file);
    setAudioMimeType(file.type || 'audio/mp3');
    setRecordingState('recorded');

    if (!file.size) {
      setAnalysisError('The selected audio file is empty. Choose another file.');
      return;
    }
    prepareAudio(file);

    // Calculate approximate duration
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      setDuration(Math.round(tempAudio.duration) || 60);
    };
  };

  // Submit recorded audio to server for Gemini analysis
  const handleSubmitAnalysis = async () => {
    if (!audioBase64) {
      setAnalysisError(isPreparingAudio
        ? 'Your audio is still being prepared. Please wait a moment and try again.'
        : 'Please record or upload an audio speech first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    const speechContext: SpeechContext = {
      category: selectedCategory,
      topic: topicPrompt,
      audience,
      targetDurationSeconds: targetDuration,
      notesPrompt,
    };

    try {
      const response = await fetch('/api/analyze-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: audioMimeType,
          speechContext,
          durationSeconds: Math.max(5, duration),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Server analysis failed');
      }

      const result = await response.json();

      // Create session
      const newSession = {
        id: `session-${Date.now()}`,
        timestamp: Date.now(),
        title: topicPrompt.slice(0, 48),
        context: speechContext,
        audioBlobUrl: audioUrl || undefined,
        transcript: result.transcript,
        transcriptSegments: result.transcriptSegments || [],
        metrics: result.metrics,
        coaching: result.coaching,
      };

      onAnalyzeComplete(newSession);
    } catch (err: any) {
      console.error('Analysis submission failed:', err);
      setAnalysisError(err.message || 'Speech analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle audio preview playback
  const togglePlayPreview = () => {
    if (!audioElementRef.current && audioUrl) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlayingPreview(false);
    }
    if (audioElementRef.current) {
      if (isPlayingPreview) {
        audioElementRef.current.pause();
        setIsPlayingPreview(false);
      } else {
        audioElementRef.current.play();
        setIsPlayingPreview(true);
      }
    }
  };

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Estimate pacing feedback live
  const getPacingTag = () => {
    if (duration < 5) return null;
    const progress = duration / targetDuration;
    if (progress > 1.2) {
      return { label: 'Over target time', color: 'text-amber-700 bg-amber-50' };
    }
    return { label: 'In target window', color: 'text-emerald-700 bg-emerald-50' };
  };

  const pacingStatus = getPacingTag();

  return (
    <div className="space-y-6">
      {/* Top Rehearsal Brief & Context Setup */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl font-bold font-serif text-slate-900 tracking-tight">
              Rehearsal Studio
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Practice presentations and interviews. Receive honest speech analytics and AI coaching.
            </p>
            <p className="text-xs text-slate-500 mt-2 max-w-2xl">
              Audio is sent to Gemini for analysis. Transcript, metrics, and coaching are saved to Supabase under this browser profile when cloud sync is configured; recordings are not stored there.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Topic or Interview Question
            </label>
            <input
              type="text"
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              placeholder="e.g. Tell me about a time you resolved a major bug under deadline..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Audience
            </label>
            <input
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
              placeholder="e.g. Faculty Committee / Engineering Manager"
            />
          </div>
        </div>
      </div>

      {/* Main Recording & Simulation Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Recording Canvas / Simulation (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div
            className={`relative rounded-xl border border-slate-200 overflow-hidden bg-slate-950 transition-all ${
              stageEnv === 'auditorium'
                ? 'min-h-[380px] bg-cover bg-center'
                : stageEnv === 'boardroom'
                ? 'min-h-[380px] bg-cover bg-center'
                : 'min-h-[340px]'
            }`}
            style={{
              backgroundImage:
                stageEnv === 'auditorium'
                  ? `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.9)), url('/src/assets/images/stage_auditorium_1790954682178.jpg')`
                  : stageEnv === 'boardroom'
                  ? `linear-gradient(rgba(15, 23, 42, 0.75), rgba(15, 23, 42, 0.9)), url('/src/assets/images/interview_boardroom_1790954696479.jpg')`
                  : undefined,
            }}
          >
            {/* Top Stage Controls */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-md backdrop-blur-xs border border-slate-700/50">
                  {stageEnv === 'auditorium'
                    ? 'Auditorium Mode'
                    : stageEnv === 'boardroom'
                    ? 'Executive Boardroom'
                    : 'Studio Focus'}
                </span>
                {recordingState === 'recording' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950 text-rose-300 border border-rose-800/60 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    REC
                  </span>
                )}
              </div>

              {/* Stage Switcher */}
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-700/50 backdrop-blur-xs">
                <button
                  onClick={() => setStageEnv('minimal')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    stageEnv === 'minimal'
                      ? 'bg-slate-800 text-white font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Minimal
                </button>
                <button
                  onClick={() => setStageEnv('auditorium')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    stageEnv === 'auditorium'
                      ? 'bg-slate-800 text-white font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Auditorium
                </button>
                <button
                  onClick={() => setStageEnv('boardroom')}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    stageEnv === 'boardroom'
                      ? 'bg-slate-800 text-white font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Boardroom
                </button>
              </div>
            </div>

            {/* Central Stage Area: Live Audio Waveform or Teleprompter */}
            <div className="flex flex-col items-center justify-center p-8 pt-18 min-h-[340px] text-center z-10 relative">
              {recordingState === 'idle' ? (
                <div className="max-w-md mx-auto space-y-4 text-slate-300">
                  <div className="w-16 h-16 rounded-full bg-slate-900/90 border border-slate-700 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
                    <Mic className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white font-serif">
                      Ready to Speak
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Click the button below to start your practice. Speak naturally at your normal pace.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-4 pt-2">
                    <label className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/60 rounded-md border border-slate-700/60">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Or upload audio file</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center space-y-4">
                  {/* Digital Elapsed Timer */}
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-4xl sm:text-5xl font-bold tracking-tight text-white tabular-nums">
                      {formatTime(duration)}
                    </span>
                    <span className="text-xs font-mono text-slate-400 uppercase tracking-wider self-end mb-1.5">
                      / {formatTime(targetDuration)} target
                    </span>
                  </div>

                  {/* Pacing Badge */}
                  {pacingStatus && (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${pacingStatus.color}`}>
                      {pacingStatus.label}
                    </span>
                  )}

                  {/* Live Canvas Waveform */}
                  <div className="w-full max-w-lg h-24 relative rounded-lg overflow-hidden bg-slate-900/60 border border-slate-800/80 p-2">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={96}
                      className="w-full h-full block"
                    />
                    {/* Live VU Decibel Meter */}
                    <div className="absolute bottom-1.5 left-2 right-2 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>MIC LEVEL</span>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-75"
                          style={{ width: `${liveVolume}%` }}
                        ></div>
                      </div>
                      <span className="tabular-nums">{liveVolume}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3 z-20 relative">
              <div className="flex items-center gap-2">
                {recordingState === 'idle' ? (
                  <button
                    onClick={startRecording}
                    className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Start Recording</span>
                  </button>
                ) : recordingState === 'recording' || recordingState === 'paused' ? (
                  <>
                    <button
                      onClick={pauseRecording}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      {recordingState === 'recording' ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={stopRecording}
                      className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Finish Speech</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={togglePlayPreview}
                      className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      {isPlayingPreview ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause Audio</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Listen Back ({formatTime(duration)})</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={resetRecording}
                      className="px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake</span>
                    </button>
                  </>
                )}
              </div>

              {/* Right Action: Analyze with Gemini */}
              {recordingState === 'recorded' && (
                <button
                  onClick={handleSubmitAnalysis}
                  disabled={isAnalyzing || isPreparingAudio || !audioBase64}
                  className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md ml-auto"
                >
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>{isAnalyzing ? 'Analyzing Speech...' : isPreparingAudio ? 'Preparing Audio...' : 'Get Instant AI Feedback'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Analysis Error Notification */}
          {analysisError && (
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Analysis Notice</p>
                <p className="mt-0.5">{analysisError}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Teleprompter & Speaker Cue Cards (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col h-full min-h-[380px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Cue Cards & Speaking Notes
              </h3>
            </div>
            <button
              onClick={() => setShowTeleprompter(!showTeleprompter)}
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              {showTeleprompter ? 'Hide' : 'Show'}
            </button>
          </div>

          {showTeleprompter ? (
            <div className="flex-1 flex flex-col space-y-3">
              <p className="text-xs text-slate-500">
                Refer to your key points while speaking. Avoid reading word-for-word to maintain natural conversational cadence.
              </p>

              <div
                ref={teleprompterRef}
                className="flex-1 max-h-[220px] overflow-y-auto bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs leading-relaxed text-slate-800 font-sans"
              >
                <textarea
                  value={notesPrompt}
                  onChange={(e) => setNotesPrompt(e.target.value)}
                  className="w-full h-full min-h-[140px] bg-transparent border-0 resize-none focus:outline-hidden text-xs text-slate-800"
                  placeholder="Paste your presentation slides outline or key bullet points here..."
                />
              </div>

              {/* Autoscroll Controls */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium">Autoscroll Speed</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setTeleprompterSpeed(spd)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                        teleprompterSpeed === spd
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Cue card notes collapsed. Click Show above to reveal during practice.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
