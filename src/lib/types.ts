export type Profile = {
  id: string
  email: string
  full_name: string | null
  school_name: string | null
  role: 'student' | 'admin'
  status: 'active' | 'banned'
  created_at: string
}

export type Chapter = {
  id: string
  title: string
  description: string | null
  order_index: number
  max_attempts: number | null
  is_published: boolean
  published_at: string | null
  created_at: string
}

export type QuestionOption = {
  id: string
  text: string
}

export type Question = {
  id: string
  chapter_id: string
  question_text: string
  options: QuestionOption[]
  correct_option_id: string
  explanation: string | null
  order_index: number
  created_at: string
}

export type PublicQuestion = {
  id: string
  question_text: string
  options: QuestionOption[]
  order_index: number
}

export type QuizAttempt = {
  id: string
  student_id: string
  chapter_id: string
  attempt_number: number
  total_questions: number
  score: number
  status: 'in_progress' | 'completed'
  started_at: string
  completed_at: string | null
  is_practice: boolean
}

export type ReviewItem = {
  question_text: string
  options: QuestionOption[]
  selected_option_id: string
  correct_option_id: string
  explanation: string | null
  is_correct: boolean
  order_index: number
}

export type AppSettings = {
  id: number
  default_max_attempts: number
  admin_emails: string[]
}
