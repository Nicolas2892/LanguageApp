export const ROUTES = {
  // Auth
  login: '/auth/login',
  signup: '/auth/signup',
  authCallback: '/auth/callback',

  // Main
  dashboard: '/dashboard',
  study: '/study',
  studyConfigure: '/study/configure',
  curriculum: '/curriculum',
  verbs: '/verbs',
  verbsConfigure: '/verbs/configure',
  verbsSession: '/verbs/session',
  vocabConfigure: '/vocab/configure',
  vocabSession: '/vocab/session',
  progress: '/progress',
  tutor: '/tutor',
  write: '/write',
  account: '/account',
  onboarding: '/onboarding',

  // Admin
  admin: '/admin',
  adminCurriculum: '/admin/curriculum',
  adminExercises: '/admin/exercises',
  adminPool: '/admin/pool',

  // Offline
  offlineReports: '/offline/reports',

  // Dev
  brandPreview: '/brand-preview',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
