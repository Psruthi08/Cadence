import { SpeechSession } from '../types/speech';

export const SAMPLE_SPEECH_SESSIONS: SpeechSession[] = [
  {
    id: 'sample-tech-interview',
    timestamp: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
    title: 'Tech Interview: Resolving a High-Severity Outage',
    context: {
      category: 'job_interview',
      topic: 'Tell me about a time you handled a severe production system breakdown',
      audience: 'Senior Engineering Hiring Manager & Tech Lead',
      targetDurationSeconds: 90,
      notesPrompt: 'Focus on root cause analysis, cross-team communication, and blameless post-mortem.',
    },
    transcript:
      'Um, so in my previous internship, we had like a really massive outage right before Black Friday. Basically, our Redis cache cluster went completely down, and, um, queries started cascading directly to the primary PostgreSQL database. At first, you know, everyone was kind of panicking in Slack. I guess my initial reaction was to just restart the instances, but then I noticed the memory allocation limits had been misconfigured in our Helm charts. So like, I took initiative to patch the configuration, throttled non-critical telemetry traffic, and we managed to recover the service within 14 minutes. Um, after that, I led the blameless post-mortem and wrote automated canary health checks so it wouldn’t happen again.',
    transcriptSegments: [
      { text: 'Um, so', type: 'filler', feedbackNote: 'Weak filler opening; start directly with the event.' },
      { text: ' in my previous internship, we had ', type: 'normal' },
      { text: 'like', type: 'filler', feedbackNote: 'Crutch word detracts from seniority.' },
      { text: ' a really massive outage right before Black Friday. ', type: 'normal' },
      { text: 'Basically', type: 'filler', feedbackNote: 'Minimize conversational filler.' },
      { text: ', our Redis cache cluster went completely down, and, ', type: 'normal' },
      { text: 'um', type: 'filler' },
      { text: ', queries started cascading directly to the primary PostgreSQL database. ', type: 'strong_point', feedbackNote: 'Strong technical precision.' },
      { text: 'At first, ', type: 'normal' },
      { text: 'you know', type: 'filler' },
      { text: ', everyone was ', type: 'normal' },
      { text: 'kind of', type: 'weak_hedge', feedbackNote: 'Hedge undermines your calm under pressure.' },
      { text: ' panicking in Slack. ', type: 'normal' },
      { text: 'I guess', type: 'weak_hedge', feedbackNote: 'Defensive hedge; say "My immediate assessment was".' },
      { text: ' my initial reaction was to just restart the instances, but then I noticed the memory allocation limits had been misconfigured in our Helm charts. So ', type: 'normal' },
      { text: 'like', type: 'filler' },
      { text: ', I took initiative to patch the configuration, throttled non-critical telemetry traffic, and we managed to recover the service within 14 minutes. ', type: 'strong_point', feedbackNote: 'Excellent quantified metric (14 minutes) and decisive action.' },
      { text: 'Um', type: 'filler' },
      { text: ', after that, I led the blameless post-mortem and wrote automated canary health checks so it wouldn’t happen again.', type: 'strong_point', feedbackNote: 'Great closing showing long-term ownership.' },
    ],
    metrics: {
      durationSeconds: 68,
      wordCount: 153,
      wordsPerMinute: 135,
      pacingRating: 'ideal',
      pacingFeedback: 'Your cadence of 135 WPM is in the executive sweet spot (130-155 WPM). You gave listeners enough time to process technical architecture terms without dragging.',
      fillerWordsCount: 8,
      fillerDensityPct: 5.2,
      fillersBreakdown: [
        { word: 'um', count: 3, frequencyFeedback: 'Clustered around topic shifts and introductions.' },
        { word: 'like', count: 2, frequencyFeedback: 'Appeared when describing high-pressure moments.' },
        { word: 'basically', count: 1, frequencyFeedback: 'Dilutes technical gravity.' },
        { word: 'you know', count: 1, frequencyFeedback: 'Casual filler in professional interview.' },
        { word: 'kind of', count: 1, frequencyFeedback: 'Weakens perceived team leadership.' },
      ],
      pauseCount: 4,
      pauseFeedback: 'You utilized 2 effective strategic pauses before naming the solution, but hesitated during the initial problem framing.',
      vocabularyRichnessPct: 76,
      clarityScore: 82,
      confidenceScore: 71,
      structureScore: 86,
      overallScore: 78,
      toneImpression: 'Knowledgeable and technically capable, but slightly nervous at the opening before settling into strong technical conviction.',
    },
    coaching: {
      executiveSummary:
        'You have a strong story with excellent technical fundamentals (Helm charts, Redis failover, 14-minute MTTR), but your opening 15 seconds sounded timid due to "Um so", "like", and "I guess". In a senior interview, how you start dictates whether interviewers perceive you as a junior follower or an autonomous engineer.',
      superpowers: [
        {
          title: 'Concrete Quantifiable Impact',
          observation: 'You explicitly stated "within 14 minutes" and "automated canary health checks." Hiring managers love engineers who measure resolution time and build preventative safeguards.',
          quote: 'recovered the service within 14 minutes... wrote automated canary health checks',
        },
        {
          title: 'Deep Architectural Precision',
          observation: 'Instead of saying "the server broke", you cleanly articulated the exact failure cascade: Redis memory saturation causing queries to flood PostgreSQL.',
          quote: 'queries started cascading directly to the primary PostgreSQL database',
        },
        {
          title: 'Blameless Engineering Mindset',
          observation: 'Highlighting a blameless post-mortem demonstrates cultural maturity and leadership aptitude that separates good candidates from great ones.',
          quote: 'I led the blameless post-mortem and wrote automated canary health checks',
        },
      ],
      honestBlindspots: [
        {
          title: 'Eliminate Defensive Hedging Phrases',
          criticalFeedback:
            'You said "I guess my initial reaction..." and "everyone was kind of panicking." Hedging phrases make you sound hesitant about your own decision-making process.',
          impactOnAudience: 'Interviewers might wonder if you were lucky rather than intentional in your debugging.',
          actionableFix: 'Replace "I guess my initial reaction was" with "My initial triage step was to evaluate..."',
        },
        {
          title: 'The "Um, So" Opening Trap',
          criticalFeedback:
            'You began with "Um, so in my previous internship..." This is the single most common student speech habit. It signals uncertainty before you even utter your first noun.',
          impactOnAudience: 'Diminishes executive presence right in the first 3 critical seconds.',
          actionableFix: 'Take a silent one-second breath and launch directly with your strong anchor: "During peak Black Friday traffic at Acme Corp..."',
        },
        {
          title: 'Filter Out Conversational Crutches Under Stress',
          criticalFeedback:
            'You used "like" and "basically" 3 times in 60 seconds when transitioning between sentences.',
          impactOnAudience: 'Gives an informal campus chat vibe rather than senior engineer professionalism.',
          actionableFix: 'Use a clean full stop and silence instead of chaining clauses with "so like".',
        },
      ],
      rewrites: [
        {
          originalSnippet: 'Um, so in my previous internship, we had like a really massive outage right before Black Friday.',
          polishedVersion:
            'During peak traffic ahead of Black Friday at my previous company, our production infrastructure suffered a critical tier-one outage.',
          rationale: 'Establishes high stakes, authority, and professionalism without crutch words.',
        },
        {
          originalSnippet: 'At first, you know, everyone was kind of panicking in Slack. I guess my initial reaction was to just restart...',
          polishedVersion:
            'With customer traffic surging, I stabilized team communication and initiated systematic triage rather than blindly restarting instances.',
          rationale: 'Positions you as a calm stabilizer and disciplined problem solver under fire.',
        },
      ],
      practiceDrills: [
        {
          drillName: 'The Zero-Filler Breath Anchor',
          estimatedMinutes: 2,
          instructions:
            'Before answering the prompt again, inhale through your nose for 2 seconds. State your first sentence without using "Um", "So", or "Well". Repeat 3 times until the silence feels comfortable.',
        },
        {
          drillName: 'The STAR Metric Punch',
          estimatedMinutes: 3,
          instructions:
            'Speak only your Action and Result in under 20 seconds. Force yourself to include two numbers (e.g. 14 minutes, 99.9% uptime).',
        },
      ],
      recruiterVerdict:
        'Strong hire candidate on technical competence, but needs a sharper, more confident opening to command full senior engineer compensation.',
    },
  },
  {
    id: 'sample-thesis-defense',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
    title: 'Master’s Thesis Defense: Graph Neural Networks for Oncology',
    context: {
      category: 'academic_defense',
      topic: 'Introduction and research significance of GNNs in drug repurposing',
      audience: 'Academic Committee & Department Faculty',
      targetDurationSeconds: 120,
      notesPrompt: 'Emphasize the combinatorial drug screening bottleneck and our novel message passing mechanism.',
    },
    transcript:
      'Good morning committee members. Today I am presenting our work on deep geometric graph representations. Basically, traditional in-vitro screening takes like four to six years and costs millions. We hypothesized that by modeling molecular conformations as heterogeneous spatial graphs, we could predict binding affinities 40 times faster. Now, our model, uh, specifically addresses the over-smoothing problem that prior researchers encountered. In our benchmark on three FDA-approved cohorts, our architecture achieved an AUROC of 0.94, outperforming baseline random walks by 18 percent. So, yeah, this suggests computational screening can reliably prioritize clinical candidates.',
    transcriptSegments: [
      { text: 'Good morning committee members. Today I am presenting our work on deep geometric graph representations. ', type: 'strong_point', feedbackNote: 'Polished, respectful academic opening.' },
      { text: 'Basically', type: 'filler', feedbackNote: 'Academic defense committees prefer rigorous terminology over "basically".' },
      { text: ', traditional in-vitro screening takes ', type: 'normal' },
      { text: 'like', type: 'filler' },
      { text: ' four to six years and costs millions. We hypothesized that by modeling molecular conformations as heterogeneous spatial graphs, we could predict binding affinities 40 times faster. ', type: 'strong_point', feedbackNote: 'Excellent formulation of hypothesis and speedup factor.' },
      { text: 'Now, our model, ', type: 'normal' },
      { text: 'uh', type: 'filler' },
      { text: ', specifically addresses the over-smoothing problem that prior researchers encountered. In our benchmark on three FDA-approved cohorts, our architecture achieved an AUROC of 0.94, outperforming baseline random walks by 18 percent. ', type: 'strong_point', feedbackNote: 'Rock-solid statistical evidence.' },
      { text: 'So, yeah', type: 'weak_hedge', feedbackNote: 'Trivializes an impressive empirical finding.' },
      { text: ', this suggests computational screening can reliably prioritize clinical candidates.', type: 'normal' },
    ],
    metrics: {
      durationSeconds: 52,
      wordCount: 142,
      wordsPerMinute: 164,
      pacingRating: 'brisk',
      pacingFeedback: 'At 164 WPM, you are speaking slightly too fast for dense academic defense material. When presenting mathematical models and AUROC metrics, slowing to 140 WPM allows professors to digest your claims.',
      fillerWordsCount: 4,
      fillerDensityPct: 2.8,
      fillersBreakdown: [
        { word: 'basically', count: 1, frequencyFeedback: 'Occurred at the transition to problem framing.' },
        { word: 'like', count: 1, frequencyFeedback: 'Approximated the timeline casually.' },
        { word: 'uh', count: 1, frequencyFeedback: 'Hesitation before methodological contribution.' },
        { word: 'so, yeah', count: 1, frequencyFeedback: 'Weak concluding transition.' },
      ],
      pauseCount: 2,
      pauseFeedback: 'Insufficient pauses after your headline metric (AUROC 0.94). A 1.5s deliberate pause here commands intellectual authority.',
      vocabularyRichnessPct: 88,
      clarityScore: 89,
      confidenceScore: 80,
      structureScore: 84,
      overallScore: 83,
      toneImpression: 'Highly articulate and academically rigorous, with slightly hurried delivery and a deflated casual finish.',
    },
    coaching: {
      executiveSummary:
        'Your academic terminology and statistical evidence are top-tier. However, your pacing was 164 WPM (too fast for dense science), and your ending evaporated with "So, yeah...". Give your landmark 0.94 AUROC the theatrical weight it earned with a deliberate pause.',
      superpowers: [
        {
          title: 'Flawless Scientific Precision',
          observation: 'Directly addressing "the over-smoothing problem" showed your committee that you understand the exact mathematical limitation of graph convolutional networks.',
          quote: 'specifically addresses the over-smoothing problem that prior researchers encountered',
        },
        {
          title: 'Compelling Benchmark Evidence',
          observation: 'Citing three FDA-approved cohorts and an AUROC of 0.94 grounded your theoretical math in real-world clinical applicability.',
          quote: 'achieved an AUROC of 0.94, outperforming baseline random walks by 18 percent',
        },
      ],
      honestBlindspots: [
        {
          title: 'The Anti-Climactic "So, Yeah" Conclusion',
          criticalFeedback:
            'You concluded a groundbreaking 18% improvement with "So, yeah, this suggests...". You effectively downgraded your own master’s thesis to a casual remark.',
          impactOnAudience: 'Leaves the defense committee feeling you are relieved it is over rather than proud of the discovery.',
          actionableFix: 'Close definitively: "In conclusion, these results validate that heterogeneous spatial graphs provide a dependable roadmap for targeted drug discovery."',
        },
        {
          title: 'Rushing Past Your Core Innovation',
          criticalFeedback:
            'You covered four years of research in 52 seconds. Slow down when introducing your mathematical novelty so the committee can formulate questions.',
          impactOnAudience: 'Faculty may feel you are racing through slides out of anxiety.',
          actionableFix: 'Plant your feet and take a full 2-second pause after stating your hypothesis.',
        },
      ],
      rewrites: [
        {
          originalSnippet: 'So, yeah, this suggests computational screening can reliably prioritize clinical candidates.',
          polishedVersion:
            'These findings substantiate that our geometric architecture can accelerate early-stage drug candidate prioritization with unprecedented statistical fidelity.',
          rationale: 'Commands scholarly gravity and leaves an indelible final impression on the jury.',
        },
      ],
      practiceDrills: [
        {
          drillName: 'The 3-Second Metric Anchor',
          estimatedMinutes: 2,
          instructions:
            'Speak the sentence containing your AUROC 0.94 metric. Immediately stop talking for 3 full seconds while maintaining eye contact. Notice how powerful silence sounds.',
        },
      ],
      recruiterVerdict:
        'Distinguished academic presentation; polish the concluding statement to guarantee High Honors defense designation.',
    },
  },
];
