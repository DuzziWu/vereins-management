// Auth actions
export { login, logout, getCurrentUser, checkCaptchaRequired } from './auth'

// Password reset actions
export { requestPasswordReset, confirmPasswordReset } from './password-reset'

// Invitation actions
export {
  createInvitation,
  listInvitations,
  revokeInvitation,
  resendInvitation,
  validateInvitationToken,
} from './invitations'

// Registration actions
export { acceptInvitation } from './registration'

// Profile actions
export { getMyProfile, getAuthUserEmail } from './profile'

// Group actions
export { getAllGroups, getMyGroups, getGroup } from './groups'
export type { Group, GroupWithTrainer } from './groups'

// Trainer notes actions (PROJ-3 BUG-2, PROJ-32)
export {
  getMyTrainerNotes,
  getTrainerNotesForGroup,
  getTrainerNoteById,
  getTrainingSessionsForGroup,
  createTrainerNote,
  updateTrainerNote,
  saveTrainerNote,
  deleteTrainerNote,
} from './trainer-notes'
export type {
  TrainerNote,
  TrainerNoteWithGroup,
  TrainerNoteWithSession,
  TrainingSessionOption,
  CreateTrainerNoteInput,
  UpdateTrainerNoteInput,
} from './trainer-notes'

// Notification actions (PROJ-3 BUG-3)
export {
  getMyNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
  createBulkNotifications,
} from './notifications'
export type { Notification, NotificationType } from './notifications'

// Member dashboard actions (PROJ-16)
export {
  getMyMemberGroups,
  getMyUpcomingTrainings,
} from './member-dashboard'
export type { MemberGroup, MemberUpcomingTraining } from './member-dashboard'

// Trainer dashboard actions (PROJ-17)
export {
  getMyTrainerGroups,
  getMyUpcomingTrainerSessions,
} from './trainer-dashboard'
export type { TrainerGroup, TrainerUpcomingSession } from './trainer-dashboard'

// Club settings actions (PROJ-18)
export {
  getClubSettings,
  updateClubSettings,
  uploadLogo,
  deleteLogo,
  getLogoUrl,
} from './club-settings'

// Role management actions (PROJ-18)
export {
  getAllMembersWithRoles,
  updateMemberRole,
} from './role-management'
export type { MemberWithRole } from './role-management'
