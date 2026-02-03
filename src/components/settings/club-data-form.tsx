"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Upload, X, Building2, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

import {
  clubSettingsSchema,
  type ClubSettingsFormData,
  ALLOWED_LOGO_TYPES,
  MAX_LOGO_SIZE,
  MAX_LOGO_DIMENSION,
} from "@/lib/validations/club-settings"
import {
  getClubSettings,
  updateClubSettings,
  uploadLogo,
  deleteLogo,
} from "@/lib/actions/club-settings"
import { createClient } from "@/lib/supabase/client"
import type { ClubSettings } from "@/lib/database.types"

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width <= MAX_LOGO_DIMENSION && height <= MAX_LOGO_DIMENSION) {
        resolve(file)
        return
      }

      const ratio = Math.min(MAX_LOGO_DIMENSION / width, MAX_LOGO_DIMENSION / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas nicht verfügbar"))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Bildkompression fehlgeschlagen"))
            return
          }
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        },
        file.type,
        0.85
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Bild konnte nicht geladen werden"))
    }

    img.src = url
  })
}

export function ClubDataForm() {
  const [settings, setSettings] = React.useState<ClubSettings | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const form = useForm<ClubSettingsFormData>({
    resolver: zodResolver(clubSettingsSchema),
    defaultValues: {
      club_name: "",
      email: "",
      phone: "",
      address_street: "",
      address_zip: "",
      address_city: "",
      website_url: "",
    },
  })

  // Load settings
  React.useEffect(() => {
    async function load() {
      try {
        const data = await getClubSettings()
        if (data) {
          setSettings(data)
          form.reset({
            club_name: data.club_name || "",
            email: data.email || "",
            phone: data.phone || "",
            address_street: data.address_street || "",
            address_zip: data.address_zip || "",
            address_city: data.address_city || "",
            website_url: data.website_url || "",
          })

          if (data.logo_path) {
            const { data: urlData } = supabase.storage
              .from("club-assets")
              .getPublicUrl(data.logo_path)
            if (urlData?.publicUrl) {
              setLogoPreview(urlData.publicUrl)
            }
          }
        }
      } catch {
        toast.error("Fehler beim Laden der Vereinsdaten")
      } finally {
        setIsLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(data: ClubSettingsFormData) {
    setIsSaving(true)
    try {
      const result = await updateClubSettings(data)

      if (!result.success) {
        toast.error(result.error || "Fehler beim Speichern")
        return
      }

      toast.success("Vereinsdaten gespeichert")
    } catch {
      toast.error("Fehler beim Speichern")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      toast.error("Nur JPG und PNG Dateien sind erlaubt")
      return
    }

    if (file.size > MAX_LOGO_SIZE) {
      toast.error("Maximale Dateigröße: 2MB")
      return
    }

    setIsUploadingLogo(true)
    try {
      const compressed = await compressImage(file)

      const formData = new FormData()
      formData.append("logo", compressed)

      const result = await uploadLogo(formData)

      if (!result.success) {
        toast.error(result.error || "Fehler beim Hochladen")
        return
      }

      if (result.logoUrl) {
        setLogoPreview(result.logoUrl + "?t=" + Date.now())
      }

      window.dispatchEvent(new Event("logo-updated"))
      toast.success("Logo hochgeladen")
    } catch {
      toast.error("Fehler beim Hochladen des Logos")
    } finally {
      setIsUploadingLogo(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  async function handleLogoRemove() {
    setIsUploadingLogo(true)
    try {
      const result = await deleteLogo()

      if (!result.success) {
        toast.error(result.error || "Fehler beim Entfernen")
        return
      }

      setLogoPreview(null)
      setSettings((prev) => (prev ? { ...prev, logo_path: null } : prev))
      window.dispatchEvent(new Event("logo-updated"))
      toast.success("Logo entfernt")
    } catch {
      toast.error("Fehler beim Entfernen des Logos")
    } finally {
      setIsUploadingLogo(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vereinslogo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="Vereinslogo"
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="h-10 w-10 text-muted-foreground" />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Logo hochladen
                </Button>
                {logoPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogoRemove}
                    disabled={isUploadingLogo}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Entfernen
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                JPG oder PNG. Max. 2MB. Wird auf {MAX_LOGO_DIMENSION}×{MAX_LOGO_DIMENSION}px verkleinert.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Club Data Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stammdaten</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="club_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vereinsname *</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. TSV Musterstadt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-Mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="info@verein.de"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon</FormLabel>
                      <FormControl>
                        <Input placeholder="+49 123 456789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="address_street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Straße</FormLabel>
                    <FormControl>
                      <Input placeholder="Musterstraße 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address_zip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PLZ</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" maxLength={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address_city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ort</FormLabel>
                      <FormControl>
                        <Input placeholder="Musterstadt" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.verein.de" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Speichern
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
