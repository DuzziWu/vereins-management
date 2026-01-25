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

// Trainer notes actions (PROJ-3 BUG-2)
export {
  getMyTrainerNotes,
  getTrainerNoteForGroup,
  saveTrainerNote,
  deleteTrainerNote,
} from './trainer-notes'
export type { TrainerNote, TrainerNoteWithGroup } from './trainer-notes'

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
