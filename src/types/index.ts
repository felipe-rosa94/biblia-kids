import { Timestamp } from 'firebase/firestore'

export type UserRole = 'student' | 'admin'

export interface AppUser {
  uid: string
  displayName: string
  email: string
  photoURL: string
  role: UserRole
  xp: number
  streak: number
  lastLoginAt?: Timestamp
  createdAt: Timestamp
}

export interface StudyPlan {
  id: string
  year: number
  title: string
  description: string
  createdBy: string
  createdAt: Timestamp
}

export interface Lesson {
  id: string
  planId: string
  weekNumber: number
  availableFrom: Timestamp
  title: string
  theme: string
  baseVerse: string
  verseText: string
  description: string
  xpReward: number
  order: number
  published?: boolean
  createdBy?: string
}

export type QuestionType = 'multiple_choice' | 'fill_in_the_blank'

export interface Question {
  id: string
  lessonId: string
  type: QuestionType
  order: number
  prompt: string
  // multiple choice
  options?: string[]
  correctOption?: number
  // fill in the blank
  sentence?: string
  correctAnswer?: string
  hint?: string
  wordOptions?: string[]
}

// Resultado de uma lição completada (usado no progresso do aluno)
export interface LessonCompletion {
  score: number
  xpEarned: number
  completedAt: string // ISO string
}
