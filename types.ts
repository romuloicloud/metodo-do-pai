
export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  level: number;
  xp: number;
  rank: number;
  targetSchool: 'Pedro II' | 'FAETEC';
}

export interface Question {
  id: string;
  topic: string;
  subject: 'Matemática' | 'Português' | 'História';
  text: string;
  baseText?: string;
  imageUrl?: string;
  imageUrl2?: string;
  options: string[];
  correctOptionIndex: number;
}

export interface AnsweredQuestion {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
}

export interface TopicProgress {
  topic: string;
  subject: 'Matemática' | 'Português';
  mastery: number; // Percentage 0-100
  questionsAttempted: number;
  status: 'critical' | 'warning' | 'info';
}

export interface Achievement {
  id: string;
  name: string;
  icon: string; // Material Icon name
  achieved: boolean;
}

export interface RankEntry {
  rank: number;
  name: string;
  avatarUrl: string;
  xp: number;
  trend?: 'up' | 'down' | 'same';
}

export interface AiExplanation {
  attentionDetail: string;
  keyInsight: string;
  analogy: {
    text: string;
    imageUrl: string;
  };
  quickChallenge: {
    question: string;
    correctAnswer: string;
  };
}

export interface TheoryLesson {
  topic: string;
  explanation: string;
  exercises: {
    question: string;
    options: string[];
    correctOptionIndex: number;
    explanation?: string; // Static DB explanation
  }[];
}

export interface Exam {
  id: string;
  name: string;
  year: number;
  questions: Question[];
}

export interface GeneralStats {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  avgTime: number; // in seconds
  criticalTopics: TopicProgress[];
}

// --- Diagnóstico ---
export interface DiagnosticAnswer {
  questionId: string;
  questionText: string;
  subject: string;
  topic: string;
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  options: string[];
  aiExplanation?: AiExplanation | null;
}

export interface DiagnosticResult {
  scoreTotal: number;
  scorePortugues: number;
  scoreMatematica: number;
  weakTopics: string[];
  strongTopics: string[];
  answers: DiagnosticAnswer[];
}

// --- Jornada Gamificada ---
export interface JourneyPhase {
  phaseNumber: number;
  topic: string;
  subject: string;
  status: 'locked' | 'current' | 'completed';
  stars: number; // 0-3
  theoryDone: boolean;
  trainingDone: boolean;
  bossDone: boolean;
  bestScore: number;
}

export type View = 'DASHBOARD' | 'PRACTICE' | 'RANKING' | 'STUDY_CENTER' | 'PAST_EXAM_PRACTICE' | 'DIAGNOSTIC_WELCOME' | 'DIAGNOSTIC_ARENA' | 'DIAGNOSTIC_RESULT' | 'JOURNEY_MAP' | 'JOURNEY_PHASE';