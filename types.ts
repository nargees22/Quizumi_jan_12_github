
export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  title: string;
  topic: string;
  difficulty: Difficulty;
  questions: Question[];
}

export interface QuizSettings {
  topic: string;
  difficulty: Difficulty;
  questionCount: number;
}

export interface UserAnswer {
  questionId: number;
  selectedOptionIndex: number;
  isCorrect: boolean;
}
