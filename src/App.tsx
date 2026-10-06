import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { AudioRecorder } from './components/AudioRecorder';
import { TranscriptViewer } from './components/TranscriptViewer';
import { MetricsDashboard } from './components/MetricsDashboard';
import { CoachingHub } from './components/CoachingHub';
import { SessionHistory } from './components/SessionHistory';
import { SampleModal } from './components/SampleModal';
import { ExportAuditModal } from './components/ExportAuditModal';
import { SAMPLE_SPEECH_SESSIONS } from './data/samplePresentations';
import { SpeechSession } from './types/speech';
import {
  Mic,
  BarChart2,
  Sparkles,
  Clock,
  Printer,
  ChevronRight,
  ShieldAlert,
  Award,
  Layers,
  CheckCircle,
} from 'lucide-react';

const STORAGE_KEY = 'cadence_speech_sessions_v1';
const OWNER_KEY = 'cadence_session_owner_v1';

function getOwnerId(): string {
  let ownerId = localStorage.getItem(OWNER_KEY);
  if (!ownerId) {
    ownerId = window.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = Math.random() * 16 | 0;
      return (char === 'x' ? random : (random & 0x3 | 0x8)).toString(16);
    });
    localStorage.setItem(OWNER_KEY, ownerId);
  }
  return ownerId;
}

export default function App() {
  const [sessions, setSessions] = useState<SpeechSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load sessions from storage:', e);
    }
    return SAMPLE_SPEECH_SESSIONS;
  });

  const [activeSession, setActiveSession] = useState<SpeechSession>(() => {
    return sessions[0] || SAMPLE_SPEECH_SESSIONS[0];
  });

  const [activeTab, setActiveTab] = useState<'studio' | 'metrics' | 'coach' | 'history'>('studio');
  const [recorderKey, setRecorderKey] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [recorderResetToken, setRecorderResetToken] = useState<number>(0);
  const [showLatestCompleted, setShowLatestCompleted] = useState<boolean>(true);
  const [showSampleModal, setShowSampleModal] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const ownerId = getOwnerId();
    fetch(`/api/sessions?ownerId=${encodeURIComponent(ownerId)}`)
      .then(async (response) => {
        if (!response.ok) throw new Error((await response.json()).error || 'Session sync is unavailable.');
        return response.json() as Promise<SpeechSession[]>;
      })
      .then(async (remoteSessions) => {
        if (!mounted) return;
        if (!Array.isArray(remoteSessions)) throw new Error('The session database returned an invalid response.');
        const remoteIds = new Set(remoteSessions.map((session) => session.id));
        const localSessions = sessions.filter((session) => !session.id.startsWith('sample-') && !remoteIds.has(session.id));
        await Promise.all(localSessions.map(async (session) => {
          const response = await fetch('/api/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ownerId, session }),
          });
          if (!response.ok) throw new Error((await response.json()).error || 'Could not migrate a saved session.');
        }));
        const allSessions = [...remoteSessions, ...localSessions].sort((a, b) => b.timestamp - a.timestamp);
        if (mounted && allSessions.length > 0) {
          setSessions(allSessions);
          setActiveSession(allSessions[0]);
        }
        setSyncError(null);
      })
      .catch((error) => {
        if (!mounted) return;
        console.warn('Session database sync failed:', error);
        setSyncError(error.message || 'Session database sync is unavailable.');
      });
    return () => { mounted = false; };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Storage sync failed:', e);
    }
  }, [sessions]);

  // Handle new analysis complete
  const handleAnalyzeComplete = (newSession: SpeechSession) => {
    setSessions((prev) => [newSession, ...prev]);
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerId: getOwnerId(), session: newSession }),
    }).then(async (response) => {
      if (!response.ok) throw new Error((await response.json()).error || 'Could not save the session.');
      setSyncError(null);
    }).catch((error) => {
      console.error('Session save failed:', error);
      setSyncError(error.message || 'Could not save the session to the database.');
    });
    setActiveSession(newSession);
    setShowLatestCompleted(true);
    setActiveTab('metrics');
  };

  const handleSelectSample = (sample: SpeechSession) => {
    setActiveSession(sample);
    setActiveTab('metrics');
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    if (!id.startsWith('sample-')) {
      fetch(`/api/sessions/${encodeURIComponent(id)}?ownerId=${encodeURIComponent(getOwnerId())}`, { method: 'DELETE' })
        .then(async (response) => {
          if (!response.ok) throw new Error((await response.json()).error || 'Could not delete the session.');
          setSyncError(null);
        })
        .catch((error) => {
          console.error('Session delete failed:', error);
          setSyncError(error.message || 'Could not delete the saved session.');
        });
    }
    if (activeSession.id === id && updated.length > 0) {
      setActiveSession(updated[0]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased">
      {/* 3-Zone Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewSession={() => {
          setShowLatestCompleted(false);
          setRecorderResetToken((prev) => prev + 1);
          setActiveTab('studio');
        }}
        onSelectSample={() => setShowSampleModal(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {syncError && (
          <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Session database: {syncError}
          </div>
        )}

        {/* Context Breadcrumb / Session Indicator */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs text-slate-600 truncate">
            <span className="font-semibold text-slate-900">Current Rehearsal:</span>
            <span className="truncate max-w-md font-medium text-slate-800">
              {activeSession.title}
            </span>
            <span aria-hidden="true">·</span>
            <span className="capitalize text-slate-500 font-medium">
              {activeSession.context.category.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {/* View Selector Tabs (Interactive Buttons) */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setActiveTab('studio')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'studio'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Studio
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'metrics'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Metrics
              </button>
              <button
                onClick={() => setActiveTab('coach')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'coach'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AI Coach
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                History ({sessions.length})
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(true)}
              className="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              title="Print Audit Report"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Rehearsal Studio */}
        {activeTab === 'studio' && (
          <div className="space-y-8 animate-fade-in">
            <AudioRecorder
              resetToken={recorderResetToken}
              onAnalyzeComplete={handleAnalyzeComplete}
              isAnalyzing={isAnalyzing}
              setIsAnalyzing={setIsAnalyzing}
            />

            {/* If current session exists, show preview transcript */}
            {activeSession && showLatestCompleted && (
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold font-serif text-slate-900">
                    Latest Completed Transcript &amp; Highlights
                  </h3>
                  <button
                    onClick={() => setActiveTab('metrics')}
                    className="text-xs font-semibold text-slate-800 hover:text-amber-700 flex items-center gap-1 transition-colors"
                  >
                    <span>View Full Metric Breakdown</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <TranscriptViewer
                  transcript={activeSession.transcript}
                  segments={activeSession.transcriptSegments}
                  audioUrl={activeSession.audioBlobUrl}
                  durationSeconds={activeSession.metrics.durationSeconds}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Delivery Metrics */}
        {activeTab === 'metrics' && (
          <div className="space-y-8 animate-fade-in">
            <MetricsDashboard metrics={activeSession.metrics} />

            <TranscriptViewer
              transcript={activeSession.transcript}
              segments={activeSession.transcriptSegments}
              audioUrl={activeSession.audioBlobUrl}
              durationSeconds={activeSession.metrics.durationSeconds}
            />

            <div className="flex justify-end">
              <button
                onClick={() => setActiveTab('coach')}
                className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
              >
                <span>Read Coach Elena&apos;s Candid Blindspots</span>
                <ChevronRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: AI Coach Tips */}
        {activeTab === 'coach' && (
          <div className="space-y-8 animate-fade-in">
            <CoachingHub
              coaching={activeSession.coaching}
              speechTopic={activeSession.context.topic}
            />
          </div>
        )}

        {/* Tab 4: Session History */}
        {activeTab === 'history' && (
          <div className="space-y-8 animate-fade-in">
            <SessionHistory
              sessions={sessions}
              activeSessionId={activeSession.id}
              onSelectSession={(session) => {
                setActiveSession(session);
                setActiveTab('metrics');
              }}
              onDeleteSession={handleDeleteSession}
              onSelectSample={() => setShowSampleModal(true)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-slate-900">Cadence</span>
            <span aria-hidden="true">·</span>
            <span>Speech &amp; Presentation Rehearsal Lab for Students &amp; Job Seekers</span>
          </div>
          <div>
            <span>Honest, instant feedback powered by Gemini multimodal AI</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SampleModal
        isOpen={showSampleModal}
        onClose={() => setShowSampleModal(false)}
        onSelectSample={handleSelectSample}
      />

      <ExportAuditModal
        session={activeSession}
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
}
