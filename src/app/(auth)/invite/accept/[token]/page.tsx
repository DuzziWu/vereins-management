import Link from "next/link"
import { AuthCard } from "@/components/auth/auth-card"
import { RegistrationForm } from "@/components/auth/registration-form"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { validateInvitationToken } from "@/lib/actions"

interface InviteAcceptPageProps {
  params: Promise<{
    token: string
  }>
}

export default async function InviteAcceptPage({ params }: InviteAcceptPageProps) {
  const { token } = await params
  const result = await validateInvitationToken(token)

  if (!result.valid || !result.invitation) {
    return (
      <AuthCard title="Einladung">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button variant="outline" asChild className="w-full">
            <Link href="/login">Zum Login</Link>
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Willkommen!"
      description="Vervollständigen Sie Ihre Registrierung, um dem Verein beizutreten."
    >
      <RegistrationForm invitation={result.invitation} token={token} />
    </AuthCard>
  )
}
