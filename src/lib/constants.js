// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  COACH: 'coach',
  PLAYER: 'player',
}

// Role labels (German)
export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Admin',
  [USER_ROLES.COACH]: 'Trainer',
  [USER_ROLES.PLAYER]: 'Spieler',
}

// Alias for role labels
export const USER_ROLE_LABELS = ROLE_LABELS

// Event types
export const EVENT_TYPES = {
  TRAINING: 'training',
  MATCHDAY: 'matchday',
  MEETING: 'meeting',
  SOCIAL: 'social',
}

// Event type labels (German)
export const EVENT_TYPE_LABELS = {
  [EVENT_TYPES.TRAINING]: 'Training',
  [EVENT_TYPES.MATCHDAY]: 'Spieltag',
  [EVENT_TYPES.MEETING]: 'Besprechung',
  [EVENT_TYPES.SOCIAL]: 'Veranstaltung',
}

// Attendance status
export const ATTENDANCE_STATUS = {
  CONFIRMED: 'confirmed',
  DECLINED: 'declined',
  PENDING: 'pending',
  LATE: 'late',
}

// Attendance status labels (German)
export const ATTENDANCE_STATUS_LABELS = {
  [ATTENDANCE_STATUS.CONFIRMED]: 'Zugesagt',
  [ATTENDANCE_STATUS.DECLINED]: 'Abgesagt',
  [ATTENDANCE_STATUS.PENDING]: 'Ausstehend',
  [ATTENDANCE_STATUS.LATE]: 'Verspätet',
}

// Finance types
export const FINANCE_TYPES = {
  CONTRIBUTION: 'contribution',
  EXPENSE: 'expense',
  SPONSORSHIP: 'sponsorship',
}

// Finance type labels (German)
export const FINANCE_TYPE_LABELS = {
  [FINANCE_TYPES.CONTRIBUTION]: 'Beitrag',
  [FINANCE_TYPES.EXPENSE]: 'Ausgabe',
  [FINANCE_TYPES.SPONSORSHIP]: 'Sponsoring',
}

// Finance status
export const FINANCE_STATUS = {
  OPEN: 'open',
  APPROVED: 'approved',
  PAID: 'paid',
  REJECTED: 'rejected',
}

// Finance status labels (German)
export const FINANCE_STATUS_LABELS = {
  [FINANCE_STATUS.OPEN]: 'Offen',
  [FINANCE_STATUS.APPROVED]: 'Genehmigt',
  [FINANCE_STATUS.PAID]: 'Bezahlt',
  [FINANCE_STATUS.REJECTED]: 'Abgelehnt',
}

// Task status
export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
}

// Task status labels (German)
export const TASK_STATUS_LABELS = {
  [TASK_STATUS.TODO]: 'Zu erledigen',
  [TASK_STATUS.IN_PROGRESS]: 'In Bearbeitung',
  [TASK_STATUS.DONE]: 'Erledigt',
}

// Available modules
export const MODULES = {
  SKILL_ARENA: 'skill_arena',
  AI_TRAINING: 'ai_training',
  INVENTORY: 'inventory',
}

// Module info (German)
export const MODULE_INFO = {
  [MODULES.SKILL_ARENA]: {
    name: 'Skill Arena',
    description: 'Gamification mit XP-System und Achievements',
    isPremium: false,
  },
  [MODULES.AI_TRAINING]: {
    name: 'KI-Trainings-Assistent',
    description: 'Automatische Trainingsplan-Generierung mit KI',
    isPremium: true,
  },
  [MODULES.INVENTORY]: {
    name: 'Inventar-Manager',
    description: 'Equipment-Verwaltung mit QR-Code System',
    isPremium: false,
  },
}

// Dashboard routes by role
export const DASHBOARD_ROUTES = {
  [USER_ROLES.ADMIN]: '/admin',
  [USER_ROLES.COACH]: '/coach',
  [USER_ROLES.PLAYER]: '/player',
}
