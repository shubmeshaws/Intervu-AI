export type InterviewLevel = 'Junior' | 'Mid-level' | 'Senior' | 'Lead' | 'Principal';

export interface HiringManagerIntent {
  role: string;
  level: InterviewLevel;
  requiredSkills: string[];
  focusAreas: string[]; // e.g., "System Design", "Cultural Fit", "Frontend Performance"
  additionalContext?: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  category: 'Technical' | 'Behavioral' | 'Communication' | 'Problem Solving';
  difficulty: 1 | 2 | 3 | 4 | 5;
  progressiveContext?: string; // How this builds on previous questions
  sampleResponse?: string;
  evaluationCriteria: string[];
}

export interface InterviewFlow {
  id: string;
  intent: HiringManagerIntent;
  questions: InterviewQuestion[];
  estimatedDurationMinutes: number;
}
