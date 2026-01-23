import { AuthCard } from "@/components/auth/auth-card"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

// Note: Supabase password reset uses URL parameters that are automatically
// processed by the Supabase client. The [token] route is kept for compatibility
// but the actual token validation happens client-side.

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Neues Passwort setzen"
      description="Geben Sie Ihr neues Passwort ein."
    >
      <ResetPasswordForm />
    </AuthCard>
  )
}
