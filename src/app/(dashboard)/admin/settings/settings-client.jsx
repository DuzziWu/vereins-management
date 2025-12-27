'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Upload, Palette, Save, User, Shield, Bell, Database, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { updateClubSettings } from '@/actions/settings'
import { uploadClubLogo, uploadAvatar, updateProfile } from '@/actions/upload'

export function SettingsClient({ initialClub, initialProfile }) {
  const router = useRouter()
  const logoInputRef = useRef(null)
  const avatarInputRef = useRef(null)

  const [activeSection, setActiveSection] = useState('branding')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Club state
  const [clubName, setClubName] = useState(initialClub.name)
  const [clubDescription, setClubDescription] = useState(initialClub.description)
  const [primaryColor, setPrimaryColor] = useState(initialClub.primaryColor)
  const [logoUrl, setLogoUrl] = useState(initialClub.logoUrl)

  // Profile state
  const [fullName, setFullName] = useState(initialProfile.fullName)
  const [avatarUrl, setAvatarUrl] = useState(initialProfile.avatarUrl)

  // Notification settings (stored locally for now)
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    gameReminders: true,
    trainingReminders: true,
  })

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadClubLogo(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      setLogoUrl(result.url)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch (err) {
      console.error('Error uploading logo:', err)
      setError('Fehler beim Hochladen des Logos')
    } finally {
      setUploading(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadAvatar(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      setAvatarUrl(result.url)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch (err) {
      console.error('Error uploading avatar:', err)
      setError('Fehler beim Hochladen des Avatars')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      // Save club settings if on branding tab
      if (activeSection === 'branding') {
        const result = await updateClubSettings({
          clubId: initialClub.id,
          name: clubName,
          description: clubDescription,
          primaryColor: primaryColor,
        })

        if (result.error) {
          setError(result.error)
          return
        }
      }

      // Save profile if on profile tab
      if (activeSection === 'profile') {
        const result = await updateProfile({
          fullName: fullName,
        })

        if (result.error) {
          setError(result.error)
          return
        }
      }

      setSuccess(true)
      router.refresh()

      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError('Ein Fehler ist aufgetreten')
    } finally {
      setSaving(false)
    }
  }

  const navItems = [
    { id: 'branding', icon: Palette, label: 'Branding' },
    { id: 'profile', icon: User, label: 'Profil' },
    { id: 'notifications', icon: Bell, label: 'Benachrichtigungen' },
    { id: 'security', icon: Shield, label: 'Sicherheit' },
    { id: 'data', icon: Database, label: 'Daten & Export' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Settings Navigation */}
      <div className="lg:col-span-1">
        <div className="bg-card border-2 border-border rounded-xl p-6 energy-card">
          <h3 className="text-lg font-bold text-foreground mb-4">Kategorien</h3>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === item.id
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Settings Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Error/Success Messages */}
        {error && (
          <div className="p-4 bg-destructive/10 border-2 border-destructive rounded-lg">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-500/10 border-2 border-green-500 rounded-lg">
            <p className="text-green-500 text-sm">Einstellungen erfolgreich gespeichert!</p>
          </div>
        )}

        {/* Branding Section */}
        {activeSection === 'branding' && (
          <div className="bg-card border-2 border-border rounded-xl p-6 energy-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Palette className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Branding</h2>
                <p className="text-sm text-muted-foreground">Passe das Erscheinungsbild deines Vereins an</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <Label className="text-foreground font-semibold mb-3 block">Vereins-Logo</Label>
                <div className="flex items-center gap-4">
                  <div
                    className="relative w-24 h-24 rounded-xl border-2 border-dashed border-border bg-secondary/50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
                    onClick={() => logoInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                    ) : logoUrl ? (
                      <Image
                        src={logoUrl}
                        alt="Logo Preview"
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/svg+xml,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading}
                      className="mb-2 bg-transparent border-2 border-border hover:border-primary"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Hochladen...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Logo hochladen
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG, SVG oder WebP (max. 2MB). Empfohlen: 512x512px
                    </p>
                  </div>
                </div>
              </div>

              {/* Club Name */}
              <div>
                <Label htmlFor="clubName" className="text-foreground font-semibold mb-3 block">
                  Vereinsname
                </Label>
                <Input
                  id="clubName"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="bg-input border-2 border-border h-11"
                  placeholder="z.B. FC Musterstadt"
                />
              </div>

              {/* Club Description */}
              <div>
                <Label htmlFor="clubDescription" className="text-foreground font-semibold mb-3 block">
                  Vereinsbeschreibung
                </Label>
                <Textarea
                  id="clubDescription"
                  value={clubDescription}
                  onChange={(e) => setClubDescription(e.target.value)}
                  className="bg-input border-2 border-border min-h-[100px]"
                  placeholder="Kurze Beschreibung deines Vereins..."
                />
              </div>

              {/* Primary Color */}
              <div>
                <Label htmlFor="primaryColor" className="text-foreground font-semibold mb-3 block">
                  Primärfarbe
                </Label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-xl border-2 border-border"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <div className="flex-1">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-12 cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Diese Farbe wird für Buttons, Akzente und Highlights verwendet
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="bg-card border-2 border-border rounded-xl p-6 energy-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Profil</h2>
                <p className="text-sm text-muted-foreground">Deine persönlichen Einstellungen</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Avatar Upload */}
              <div>
                <Label className="text-foreground font-semibold mb-3 block">Profilbild</Label>
                <div className="flex items-center gap-4">
                  <div
                    className="cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    <Avatar className="h-24 w-24 border-2 border-primary hover:border-primary/70 transition-colors">
                      {uploading ? (
                        <AvatarFallback className="bg-secondary">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </AvatarFallback>
                      ) : (
                        <>
                          <AvatarImage src={avatarUrl} />
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
                            {fullName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase() || 'U'}
                          </AvatarFallback>
                        </>
                      )}
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploading}
                      className="mb-2 bg-transparent border-2 border-border hover:border-primary"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Hochladen...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Bild hochladen
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG oder WebP (max. 2MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <Label htmlFor="fullName" className="text-foreground font-semibold mb-3 block">
                  Vollständiger Name
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-input border-2 border-border h-11"
                  placeholder="Max Mustermann"
                />
              </div>

              {/* Email (readonly) */}
              <div>
                <Label htmlFor="email" className="text-foreground font-semibold mb-3 block">
                  E-Mail-Adresse
                </Label>
                <Input
                  id="email"
                  value={initialProfile.email}
                  disabled
                  className="bg-input border-2 border-border h-11 opacity-60"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Die E-Mail-Adresse kann nicht geändert werden
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Section */}
        {activeSection === 'notifications' && (
          <div className="bg-card border-2 border-border rounded-xl p-6 energy-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Benachrichtigungen</h2>
                <p className="text-sm text-muted-foreground">Verwalte deine Benachrichtigungseinstellungen</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: 'email', label: 'E-Mail Benachrichtigungen', description: 'Erhalte Updates per E-Mail' },
                { key: 'push', label: 'Push Benachrichtigungen', description: 'Browser-Benachrichtigungen aktivieren' },
                { key: 'gameReminders', label: 'Spiel-Erinnerungen', description: 'Erinnere mich an kommende Spiele' },
                { key: 'trainingReminders', label: 'Training-Erinnerungen', description: 'Erinnere mich an Trainingseinheiten' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div>
                    <p className="font-semibold text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, [item.key]: checked })
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Section */}
        {activeSection === 'security' && (
          <div className="bg-card border-2 border-border rounded-xl p-6 energy-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Sicherheit</h2>
                <p className="text-sm text-muted-foreground">Passwort und Sicherheitseinstellungen</p>
              </div>
            </div>
            <p className="text-muted-foreground">Sicherheitseinstellungen kommen bald...</p>
          </div>
        )}

        {/* Data & Export Section */}
        {activeSection === 'data' && (
          <div className="bg-card border-2 border-border rounded-xl p-6 energy-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Daten & Export</h2>
                <p className="text-sm text-muted-foreground">Exportiere deine Vereinsdaten</p>
              </div>
            </div>
            <p className="text-muted-foreground">Datenexport kommt bald...</p>
          </div>
        )}

        {/* Save Button - only show for branding and profile */}
        {(activeSection === 'branding' || activeSection === 'profile') && (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              size="lg"
              className="action-glow font-bold px-8"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Speichern...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-5 w-5" />
                  Änderungen Speichern
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
