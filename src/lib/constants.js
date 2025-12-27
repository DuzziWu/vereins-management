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
  FINANCE: 'finance',
  TEAM_CHAT: 'team_chat',
  DOCUMENTS: 'documents',
  MATCH_ANALYSIS: 'match_analysis',
  MEDICAL: 'medical',
  PARENT_PORTAL: 'parent_portal',
  SPONSORING: 'sponsoring',
}

// Module categories
export const MODULE_CATEGORIES = {
  TRAINING: 'Training',
  COMMUNICATION: 'Kommunikation',
  ANALYSIS: 'Analyse',
  FINANCE: 'Finanzen',
  ADMINISTRATION: 'Verwaltung',
  HEALTH: 'Gesundheit',
  MARKETING: 'Marketing',
  GAMIFICATION: 'Gamification',
}

// Module info (German)
export const MODULE_INFO = {
  [MODULES.SKILL_ARENA]: {
    name: 'Skill Arena',
    description: 'Gamification mit XP-System, Levels und Achievements für Spieler',
    category: MODULE_CATEGORIES.GAMIFICATION,
    isPremium: false,
    icon: 'Trophy',
    features: ['XP-System', 'Achievements', 'Ranglisten', 'Herausforderungen'],
    price: 'Kostenlos',
  },
  [MODULES.AI_TRAINING]: {
    name: 'KI-Trainings-Assistent',
    description: 'Automatische Trainingsplan-Generierung mit künstlicher Intelligenz',
    category: MODULE_CATEGORIES.TRAINING,
    isPremium: true,
    icon: 'Brain',
    features: ['KI-Trainingsplanung', 'Übungsbibliothek', 'Periodisierung', 'Belastungssteuerung'],
    price: '29.99€/Monat',
  },
  [MODULES.INVENTORY]: {
    name: 'Inventar-Manager',
    description: 'Equipment-Verwaltung mit QR-Code System für Ausleihe und Tracking',
    category: MODULE_CATEGORIES.ADMINISTRATION,
    isPremium: false,
    icon: 'Package',
    features: ['QR-Code Tracking', 'Ausleihsystem', 'Bestandsverwaltung', 'Wartungsplanung'],
    price: 'Kostenlos',
  },
  [MODULES.FINANCE]: {
    name: 'Finanzverwaltung',
    description: 'Komplette Vereinsfinanzen mit Budgetplanung, Mitgliedsbeiträgen und automatischer Rechnungsstellung',
    category: MODULE_CATEGORIES.FINANCE,
    isPremium: false,
    icon: 'TrendingUp',
    features: ['Budget-Planung', 'Beitragsverwaltung', 'Rechnungen', 'Ausgabentracking'],
    price: 'Kostenlos',
  },
  [MODULES.TEAM_CHAT]: {
    name: 'Team Chat',
    description: 'Integrierte Kommunikationsplattform mit Gruppen-Chats, Direktnachrichten und Dateifreigabe',
    category: MODULE_CATEGORIES.COMMUNICATION,
    isPremium: false,
    icon: 'MessageSquare',
    features: ['Gruppen-Chats', 'Direktnachrichten', 'Dateifreigabe', 'Push-Benachrichtigungen'],
    price: 'Kostenlos',
  },
  [MODULES.DOCUMENTS]: {
    name: 'Dokumenten-Manager',
    description: 'Zentrale Dokumentenverwaltung für Verträge, Formulare und Vereinsunterlagen',
    category: MODULE_CATEGORIES.ADMINISTRATION,
    isPremium: false,
    icon: 'FileText',
    features: ['Vertragsvorlagen', 'Digitale Unterschriften', 'Versionierung', 'Zugriffsrechte'],
    price: 'Kostenlos',
  },
  [MODULES.MATCH_ANALYSIS]: {
    name: 'Spielanalyse',
    description: 'Professionelle Spielanalyse mit Videotagging, Statistiken und taktischen Auswertungen',
    category: MODULE_CATEGORIES.ANALYSIS,
    isPremium: true,
    icon: 'BarChart3',
    features: ['Video-Analyse', 'Spielerstatistiken', 'Taktik-Board', 'Gegneranalyse'],
    price: '39.99€/Monat',
  },
  [MODULES.MEDICAL]: {
    name: 'Medizin & Fitness',
    description: 'Umfassende Verletzungsdokumentation, Rehabilitationspläne und Fitness-Tracking',
    category: MODULE_CATEGORIES.HEALTH,
    isPremium: true,
    icon: 'Heart',
    features: ['Verletzungs-Tracking', 'Reha-Pläne', 'Fitness-Tests', 'Belastungsmonitoring'],
    price: '24.99€/Monat',
  },
  [MODULES.PARENT_PORTAL]: {
    name: 'Eltern-Portal',
    description: 'Dediziertes Portal für Eltern mit Kalender, Nachrichten und Zahlungsübersicht',
    category: MODULE_CATEGORIES.COMMUNICATION,
    isPremium: false,
    icon: 'Users',
    features: ['Eltern-Accounts', 'Termin-Einsicht', 'Zahlungsübersicht', 'Fahrgemeinschaften'],
    price: 'Kostenlos',
  },
  [MODULES.SPONSORING]: {
    name: 'Sponsoring Manager',
    description: 'Professionelles Sponsoren-Management mit Vertragsübersicht und Leistungsnachweis',
    category: MODULE_CATEGORIES.MARKETING,
    isPremium: true,
    icon: 'Handshake',
    features: ['Sponsoren-Datenbank', 'Vertragsmanagement', 'Leistungsnachweise', 'Reporting'],
    price: '34.99€/Monat',
  },
}

// Dashboard routes by role
export const DASHBOARD_ROUTES = {
  [USER_ROLES.ADMIN]: '/admin',
  [USER_ROLES.COACH]: '/coach',
  [USER_ROLES.PLAYER]: '/player',
}
