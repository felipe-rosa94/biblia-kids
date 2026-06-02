import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy, // usado apenas em getStudyPlans (sem where, não precisa de índice composto)
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import type { User as FirebaseUser } from 'firebase/auth'
import { db } from './firebase'
import type { AppUser, StudyPlan, Lesson, Question, LessonCompletion } from '../types'

// ── Users ─────────────────────────────────────────────────────────────────────

export async function getUserDoc(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return { uid: snap.id, ...snap.data() } as AppUser
}

// Cria o documento do usuário no primeiro login com Google
export async function createUserDoc(firebaseUser: FirebaseUser): Promise<AppUser> {
  const newUser = {
    displayName: firebaseUser.displayName ?? '',
    email: firebaseUser.email ?? '',
    photoURL: firebaseUser.photoURL ?? '',
    role: 'student' as const,
    xp: 0,
    streak: 0,
    lastLoginAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  }
  await setDoc(doc(db, 'users', firebaseUser.uid), newUser)
  return {
    uid: firebaseUser.uid,
    ...newUser,
    lastLoginAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  }
}

export async function updateLastLogin(uid: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { lastLoginAt: serverTimestamp() })
}

// Atualiza o documento do usuário após ganhar XP
export async function addXpToUser(uid: string, xpEarned: number): Promise<AppUser | null> {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const current = snap.data() as AppUser
  const newXp = current.xp + xpEarned

  const today = new Date()
  const lastLogin = current.lastLoginAt?.toDate()
  const daysSinceLast = lastLogin
    ? Math.floor((today.getTime() - lastLogin.getTime()) / 86_400_000)
    : null
  const newStreak = daysSinceLast === 1 ? current.streak + 1 : daysSinceLast === 0 ? current.streak : 1

  await updateDoc(ref, { xp: newXp, streak: newStreak })
  return { ...current, uid, xp: newXp, streak: newStreak }
}

// ── Study Plans ───────────────────────────────────────────────────────────────

export async function getStudyPlans(): Promise<StudyPlan[]> {
  const q = query(collection(db, 'studyPlans'), orderBy('year', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as StudyPlan))
}

export async function createStudyPlan(
  data: { title: string; year: number; description: string },
  createdBy: string,
): Promise<StudyPlan> {
  const ref = await addDoc(collection(db, 'studyPlans'), {
    ...data,
    createdBy,
    createdAt: serverTimestamp(),
  })
  return {
    id: ref.id,
    ...data,
    createdBy,
    createdAt: Timestamp.now(),
  }
}

export async function updateStudyPlan(
  planId: string,
  data: { title: string; year: number; description: string },
): Promise<void> {
  await updateDoc(doc(db, 'studyPlans', planId), data)
}

export async function deleteStudyPlan(planId: string): Promise<void> {
  const lessons = await getLessonsForPlan(planId)
  await Promise.all(lessons.map(l => deleteLesson(l.id)))
  await deleteDoc(doc(db, 'studyPlans', planId))
}

// ── Lessons ───────────────────────────────────────────────────────────────────

// Busca todas as lições de um plano (admin — inclui não publicadas)
export async function getLessonsForPlan(planId: string): Promise<Lesson[]> {
  const q = query(collection(db, 'lessons'), where('planId', '==', planId))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Lesson))
    .sort((a, b) => a.weekNumber - b.weekNumber)
}

// Busca lições publicadas de um plano para o aluno (inclui futuras para mostrar bloqueadas)
export async function getPublishedLessons(): Promise<Lesson[]> {
  const q = query(collection(db, 'lessons'), where('published', '==', true))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Lesson))
    .sort((a, b) => a.weekNumber - b.weekNumber)
}

// Busca uma lição e suas questões para o aluno jogar
export async function getLessonWithQuestions(
  lessonId: string,
): Promise<{ lesson: Lesson; questions: Question[] } | null> {
  const lessonSnap = await getDoc(doc(db, 'lessons', lessonId))
  if (!lessonSnap.exists()) return null

  const lesson = { id: lessonSnap.id, ...lessonSnap.data() } as Lesson
  const questions = await getQuestionsForLesson(lessonId)
  return { lesson, questions }
}

export async function createLesson(
  data: {
    planId: string
    title: string
    baseVerse: string
    verseText: string
    weekNumber: number
    availableFromDateStr: string
    order: number
  },
  createdBy: string,
): Promise<Lesson> {
  const availableFrom = Timestamp.fromDate(new Date(data.availableFromDateStr))
  const lessonData = {
    planId: data.planId,
    title: data.title,
    baseVerse: data.baseVerse,
    verseText: data.verseText,
    weekNumber: data.weekNumber,
    availableFrom,
    order: data.order,
    theme: '',
    description: '',
    xpReward: 50,
    published: false,
    createdBy,
    createdAt: serverTimestamp(),
  }
  const ref = await addDoc(collection(db, 'lessons'), lessonData)
  return { id: ref.id, ...lessonData }
}

export async function publishLesson(lessonId: string): Promise<void> {
  await updateDoc(doc(db, 'lessons', lessonId), { published: true })
}

export async function updateLesson(
  lessonId: string,
  data: {
    title: string
    weekNumber: number
    baseVerse: string
    verseText: string
    availableFromDateStr: string
  },
): Promise<void> {
  await updateDoc(doc(db, 'lessons', lessonId), {
    title: data.title,
    weekNumber: data.weekNumber,
    baseVerse: data.baseVerse,
    verseText: data.verseText,
    availableFrom: Timestamp.fromDate(new Date(data.availableFromDateStr)),
  })
}

export async function deleteLesson(lessonId: string): Promise<void> {
  const questions = await getQuestionsForLesson(lessonId)
  await Promise.all(questions.map(q => deleteDoc(doc(db, 'questions', q.id))))
  await deleteDoc(doc(db, 'lessons', lessonId))
}

// ── Questions ─────────────────────────────────────────────────────────────────

export async function getQuestionsForLesson(lessonId: string): Promise<Question[]> {
  const q = query(collection(db, 'questions'), where('lessonId', '==', lessonId))
  const snap = await getDocs(q)
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() } as Question))
    .sort((a, b) => a.order - b.order)
}

export async function createQuestion(data: Omit<Question, 'id'>): Promise<Question> {
  const ref = await addDoc(collection(db, 'questions'), data)
  return { id: ref.id, ...data }
}

export async function updateQuestion(
  questionId: string,
  data: Omit<Question, 'id'>,
): Promise<void> {
  await updateDoc(doc(db, 'questions', questionId), { ...data })
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await deleteDoc(doc(db, 'questions', questionId))
}

// ── Progress ──────────────────────────────────────────────────────────────────

// Retorna mapa lessonId → LessonCompletion para o aluno
export async function getUserProgress(
  userId: string,
): Promise<Record<string, LessonCompletion>> {
  const q = query(collection(db, 'progress'), where('userId', '==', userId))
  const snap = await getDocs(q)
  const result: Record<string, LessonCompletion> = {}
  snap.docs.forEach(d => {
    const data = d.data()
    result[data.lessonId as string] = {
      score: data.score as number,
      xpEarned: data.xpEarned as number,
      completedAt: (data.completedAt as Timestamp)?.toDate().toISOString() ?? new Date().toISOString(),
    }
  })
  return result
}

// Salva resultado e atualiza o XP do usuário; retorna o XP atualizado
export async function saveLessonProgress(
  userId: string,
  lessonId: string,
  score: number,
  xpEarned: number,
  answers: { questionId: string; correct: boolean }[],
): Promise<AppUser | null> {
  // Usa compound key para evitar duplicatas de progresso
  const progressId = `${userId}_${lessonId}`
  const alreadyDone = await getDoc(doc(db, 'progress', progressId))

  await setDoc(doc(db, 'progress', progressId), {
    userId,
    lessonId,
    score,
    xpEarned,
    answers,
    completedAt: serverTimestamp(),
  })

  // Não acumula XP se a lição já foi completada antes
  if (alreadyDone.exists()) return null
  return addXpToUser(userId, xpEarned)
}
