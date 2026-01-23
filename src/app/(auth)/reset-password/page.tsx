import { AuthCard } from "@/components/auth/auth-card"
import { RequestPasswordResetForm } from "@/components/auth/request-password-reset-form"

export default function RequestPasswordResetPage() {
  return (
    <AuthCard
      title="Passwort vergessen?"
      description="Geben Sie Ihre Email-Adresse ein, um einen Link zum Zurücksetzen Ihres Passworts zu erhalten."
    >
      <RequestPasswordResetForm />
    </AuthCard>
  )
}
