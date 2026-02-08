"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Lock, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { passwordChangeSchema, PasswordChangeData } from "@/lib/validations/profile"
import { changePassword } from "@/lib/actions/profile"

interface PasswordChangeFormProps {
  hasPassword: boolean
}

export function PasswordChangeForm({ hasPassword }: PasswordChangeFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false)
  const [pendingData, setPendingData] = React.useState<PasswordChangeData | null>(null)

  const form = useForm<PasswordChangeData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  })

  // Called when form is submitted - shows confirmation dialog
  function handleFormSubmit(data: PasswordChangeData) {
    setPendingData(data)
    setShowConfirmDialog(true)
  }

  // Called when user confirms password change in dialog
  async function handleConfirmPasswordChange() {
    if (!pendingData) return

    setShowConfirmDialog(false)
    setIsSubmitting(true)
    try {
      const result = await changePassword(pendingData.current_password, pendingData.new_password)
      if (result.success) {
        toast.success("Passwort erfolgreich geändert")
        form.reset()
      } else {
        toast.error(result.error || "Fehler beim Ändern des Passworts")
      }
    } catch {
      toast.error("Ein unerwarteter Fehler ist aufgetreten")
    } finally {
      setIsSubmitting(false)
      setPendingData(null)
    }
  }

  // Called when user cancels the dialog
  function handleCancelDialog() {
    setShowConfirmDialog(false)
    setPendingData(null)
  }

  // If user doesn't have a password (social login), show different UI
  if (!hasPassword) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Passwort setzen
          </CardTitle>
          <CardDescription>
            Du hast dich mit einem Social Login angemeldet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Da du dich mit einem Social Login (Google, etc.) angemeldet hast,
            hast du noch kein Passwort gesetzt. Um ein Passwort zu setzen,
            nutze bitte die &quot;Passwort vergessen&quot; Funktion auf der Login-Seite.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Passwort ändern
        </CardTitle>
        <CardDescription>
          Ändere dein Passwort für mehr Sicherheit
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="current_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aktuelles Passwort</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Aktuelles Passwort eingeben"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showCurrentPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Neues Passwort</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Neues Passwort eingeben"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showNewPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Mindestens 8 Zeichen, mit Buchstaben und Ziffern
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Neues Passwort bestätigen</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Neues Passwort wiederholen"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="sr-only">
                          {showConfirmPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Passwort ändern
            </Button>
          </form>
        </Form>

        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Passwort ändern</AlertDialogTitle>
              <AlertDialogDescription>
                Bist du sicher, dass du dein Passwort ändern möchtest?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDialog}>
                Abbrechen
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmPasswordChange}>
                Passwort ändern
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
