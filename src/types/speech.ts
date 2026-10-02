export type PresentationCategory =
  | 'job_interview'
  | 'academic_defense'
  | 'class_presentation'
  | 'startup_pitch'
  | 'conference_talk';

export interface SpeechContext {
  category: PresentationCategory;
  topic: string;
  audience: string;
  targetDurationSeconds: number;
  notesPrompt: string;
}

export type TranscriptSegmentType = 'normal' | 'filler' | 'pause' | 'strong_point' | 'weak_hedge';

export interface TranscriptSegment {
  text: string;
  type: TranscriptSegmentType;
  feedbackNote?: string;
}

export interface FillerBreakdownItem {
  word: string;
  count: number;
  frequencyFeedback: string;
}

export interface SpeechMetrics {
  durationSeconds: number;
  wordCount: number;
  wordsPerMinute: number;
  pacingRating: 'too_slow' | 'measured' | 'ideal' | 'brisk' | 'rushed';
  pacingFeedback: string;
  fillerWordsCount: number;
  fillerDensityPct: number;
  fillersBreakdown: FillerBreakdownItem[];
  pauseCount: number;
  pauseFeedback: string;
  vocabularyRichnessPct: number;
  clarityScore: number;
  confidenceScore: number;
  structureScore: number;
  overallScore: number;
  toneImpression: string;
}

export interface Superpower {
  title: string;
  observation: string;
  quote: string;
}

export interface HonestBlindspot {
  title: string;
  criticalFeedback: string;
  impactOnAudience: string;
  actionableFix: string;
}

export interface SentenceRewrite {
  originalSnippet: string;
  polishedVersion: string;
  rationale: string;
}

export interface PracticeDrill {
  drillName: string;
  estimatedMinutes: number;
  instructions: string;
}

export interface CoachingFeedback {
  executiveSummary: string;
  superpowers: Superpower[];
  honestBlindspots: HonestBlindspot[];
  rewrites: SentenceRewrite[];
  practiceDrills: PracticeDrill[];
  recruiterVerdict: string;
}

export interface SpeechSession {
  id: string;
  timestamp: number;
  title: string;
  context: SpeechContext;
  audioBlobUrl?: string;
  transcript: string;
  transcriptSegments: TranscriptSegment[];
  metrics: SpeechMetrics;
  coaching: CoachingFeedback;
}
