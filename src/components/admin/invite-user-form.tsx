"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, CheckCircle2, Copy, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createInvitation } from "@/lib/actions"
import type { UserRole } from "@/components/auth"

const inviteSchema = z.object({
  email: z.string().email("Bitte geben Sie eine gültige Email-Adresse ein"),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  role: z.enum(["vorstand", "trainer", "mitglied"], {
    message: "Bitte wählen Sie eine Rolle",
  }),
})

type InviteFormValues = z.infer<typeof inviteSchema>

const roleOptions = [
  { value: "mitglied", label: "Mitglied", description: "Basis-Zugriff auf das System" },
  { value: "trainer", label: "Trainer", description: "Kann Trainings verwalten" },
  { value: "vorstand", label: "Vorstand", description: "Volle Administrationsrechte" },
] as const

export function InviteUserForm() {
  const [isLoading, setIsLoading] = React.useState(false)
  const [isSuccess, setIsSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const copyToClipboard = async () => {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      role: undefined,
    },
  })

  async function handleSubmit(values: InviteFormValues) {
    setIsLoading(true)
    setError(null)
    setInviteUrl(null)
    setIsSuccess(false)
    setCopied(false)

    const result = await createInvitation({
      email: values.email,
      firstName: values.firstName,
      lastName: values.lastName,
      role: values.role as UserRole,
    })

    if (result.error) {
      setError(result.error)
    } else {
      setIsSuccess(true)
      setInviteUrl(result.inviteUrl || null)
      form.reset()
      // Don't auto-reset - user needs time to copy the link
    }

    setIsLoading(false)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSuccess && (
          <Alert className="border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p>Einladung wurde erfolgreich erstellt!</p>
              {inviteUrl && (
                <div className="mt-2">
                  <p className="text-xs font-medium">Einladungslink (bitte kopieren und an die Person senden):</p>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="text-xs break-all bg-green-100 p-2 rounded flex-1">
                      {inviteUrl}
                    </code>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={copyToClipboard}
                      className="shrink-0"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email-Adresse</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="name@beispiel.de"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Der Einladungslink wird für diese Email-Adresse erstellt.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vorname</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Max"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nachname</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Mustermann"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rolle</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Rolle auswählen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Bestimmt die Berechtigungen des neuen Mitglieds.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Einladung senden
        </Button>
      </form>
    </Form>
  )
}
