"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Search, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { groupBaseSchema, GroupFormData, TRAINING_DAYS } from "@/lib/validations/group"
import { GroupListItem } from "./groups-table"

interface GroupFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: GroupListItem | null
  trainers: { id: string; first_name: string; last_name: string }[]
  allMembers: {
    id: string
    first_name: string
    last_name: string
    date_of_birth: string
    functional_tags: string[] | null
  }[]
  existingCoTrainers?: string[]
  existingMembers?: string[]
  onSubmit: (
    data: GroupFormData & { co_trainer_ids: string[]; member_ids: string[] }
  ) => Promise<void>
  isVorstand: boolean
}

function calculateAge(dateOfBirth: string): number {
  const today = new Date()
  const birth = new Date(dateOfBirth)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

export function GroupForm({
  open,
  onOpenChange,
  group,
  trainers,
  allMembers,
  existingCoTrainers = [],
  existingMembers = [],
  onSubmit,
  isVorstand,
}: GroupFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = React.useState(false)
  const [selectedCoTrainers, setSelectedCoTrainers] = React.useState<string[]>([])
  const [selectedMembers, setSelectedMembers] = React.useState<string[]>([])
  const [memberSearch, setMemberSearch] = React.useState("")
  const isEditing = !!group

  const form = useForm<GroupFormData>({
    resolver: zodResolver(groupBaseSchema),
    defaultValues: {
      name: "",
      description: "",
      training_day: "",
      training_start_time: "",
      training_end_time: "",
      training_location: "",
      max_members: null,
      chat_enabled: false,
      trainer_id: "",
      co_trainer_ids: [],
      member_ids: [],
    },
  })

  const watchedTrainerId = form.watch("trainer_id")
  const watchedMaxMembers = form.watch("max_members")

  // Reset form when group changes
  React.useEffect(() => {
    if (open) {
      if (group) {
        form.reset({
          name: group.name,
          description: group.description || "",
          training_day: group.training_day || "",
          training_start_time: group.training_start_time || "",
          training_end_time: group.training_end_time || "",
          training_location: group.training_location || "",
          max_members: group.max_members ?? null,
          chat_enabled: group.chat_enabled,
          trainer_id: group.trainer_id || "",
          co_trainer_ids: existingCoTrainers,
          member_ids: existingMembers,
        })
        setSelectedCoTrainers(existingCoTrainers)
        setSelectedMembers(existingMembers)
      } else {
        form.reset({
          name: "",
          description: "",
          training_day: "",
          training_start_time: "",
          training_end_time: "",
          training_location: "",
          max_members: null,
          chat_enabled: false,
          trainer_id: "",
          co_trainer_ids: [],
          member_ids: [],
        })
        setSelectedCoTrainers([])
        setSelectedMembers([])
      }
      setMemberSearch("")
    }
  }, [open, group, form, existingCoTrainers, existingMembers])

  async function handleSubmit(data: GroupFormData) {
    // Client-side time validation (refinement from groupSchema)
    if (data.training_start_time && data.training_end_time) {
      if (data.training_end_time <= data.training_start_time) {
        form.setError("training_end_time", {
          message: "Endzeit muss nach der Startzeit liegen",
        })
        return
      }
    }

    setIsSubmitting(true)
    try {
      // When editing, exclude chat_enabled as it can only be set at creation
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { chat_enabled, ...dataWithoutChat } = data
      const submitData = isEditing ? dataWithoutChat : data

      await onSubmit({
        ...submitData,
        co_trainer_ids: selectedCoTrainers,
        member_ids: selectedMembers,
      } as GroupFormData & { co_trainer_ids: string[]; member_ids: string[] })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen && form.formState.isDirty) {
      setShowDiscardDialog(true)
    } else {
      onOpenChange(newOpen)
    }
  }

  function handleDiscardConfirm() {
    setShowDiscardDialog(false)
    form.reset()
    onOpenChange(false)
  }

  function handleCoTrainerToggle(profileId: string, checked: boolean) {
    setSelectedCoTrainers((prev) =>
      checked ? [...prev, profileId] : prev.filter((id) => id !== profileId)
    )
  }

  function handleMemberToggle(profileId: string, checked: boolean) {
    setSelectedMembers((prev) =>
      checked ? [...prev, profileId] : prev.filter((id) => id !== profileId)
    )
  }

  // Filter trainers available for co-trainer (exclude selected main trainer)
  const availableCoTrainers = trainers.filter(
    (t) => t.id !== watchedTrainerId
  )

  // Filter members by search
  const filteredMembers = allMembers.filter((m) => {
    if (!memberSearch) return true
    const searchLower = memberSearch.toLowerCase()
    const fullName = `${m.first_name} ${m.last_name}`.toLowerCase()
    return fullName.includes(searchLower)
  })

  // Check member limit warning
  const memberLimitExceeded =
    watchedMaxMembers && selectedMembers.length > watchedMaxMembers

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Gruppe bearbeiten" : "Neue Gruppe erstellen"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Bearbeiten Sie die Gruppeninformationen."
                : "Erstellen Sie eine neue Vereinsgruppe."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <Tabs defaultValue="stammdaten" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="stammdaten">Stammdaten</TabsTrigger>
                  <TabsTrigger
                    value="trainer"
                    disabled={!isVorstand}
                  >
                    Trainer
                  </TabsTrigger>
                  <TabsTrigger value="mitglieder">Mitglieder</TabsTrigger>
                </TabsList>

                {/* Tab 1: Stammdaten */}
                <TabsContent value="stammdaten" className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gruppenname *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="z.B. Showtanz, Garde, Bambini"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beschreibung</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Optionale Beschreibung der Gruppe..."
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="training_day"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trainingstag</FormLabel>
                        <Select
                          onValueChange={(value) =>
                            field.onChange(value === "none" ? "" : value)
                          }
                          value={field.value || "none"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Kein fester Tag" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">
                              Kein fester Tag
                            </SelectItem>
                            {TRAINING_DAYS.map((day) => (
                              <SelectItem key={day} value={day}>
                                {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="training_start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trainingszeit Start</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="training_end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trainingszeit Ende</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="training_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trainingsort</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="z.B. Turnhalle Musterstraße"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_members"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max. Teilnehmer</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="Unbegrenzt"
                            value={field.value ?? ""}
                            onChange={(e) => {
                              const val = e.target.value
                              field.onChange(val ? parseInt(val, 10) : null)
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Leer lassen für unbegrenzte Teilnehmerzahl.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Chat toggle only visible when creating new group */}
                  {!isEditing && (
                    <FormField
                      control={form.control}
                      name="chat_enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Gruppen-Chat aktivieren
                            </FormLabel>
                            <FormDescription>
                              Aktiviert die Chat-Funktion für diese Gruppe. Kann
                              nachträglich nicht deaktiviert werden.
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </TabsContent>

                {/* Tab 2: Trainer */}
                <TabsContent value="trainer" className="space-y-4 mt-4">
                  {isVorstand ? (
                    <>
                      <FormField
                        control={form.control}
                        name="trainer_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trainer *</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                // Remove from co-trainers if selected as main trainer
                                setSelectedCoTrainers((prev) =>
                                  prev.filter((id) => id !== value)
                                )
                              }}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Trainer auswählen" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {trainers.map((trainer) => (
                                  <SelectItem
                                    key={trainer.id}
                                    value={trainer.id}
                                  >
                                    {trainer.first_name} {trainer.last_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-3">
                        <Label>Co-Trainer</Label>
                        <p className="text-sm text-muted-foreground">
                          Wählen Sie optionale Co-Trainer für diese Gruppe.
                        </p>
                        {availableCoTrainers.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            {!watchedTrainerId
                              ? "Bitte zuerst einen Trainer auswählen."
                              : "Keine weiteren Trainer verfügbar."}
                          </p>
                        ) : (
                          <ScrollArea className="h-[150px] rounded-md border p-4 sm:h-[200px]">
                            <div className="space-y-3">
                              {availableCoTrainers.map((trainer) => (
                                <div
                                  key={trainer.id}
                                  className="flex items-center space-x-2"
                                >
                                  <Checkbox
                                    id={`co-trainer-${trainer.id}`}
                                    checked={selectedCoTrainers.includes(
                                      trainer.id
                                    )}
                                    onCheckedChange={(checked) =>
                                      handleCoTrainerToggle(
                                        trainer.id,
                                        !!checked
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`co-trainer-${trainer.id}`}
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    {trainer.first_name} {trainer.last_name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        )}
                        {selectedCoTrainers.length > 0 && (
                          <p className="text-sm text-muted-foreground">
                            {selectedCoTrainers.length} Co-Trainer ausgewählt
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      Trainer-Zuordnungen können nur vom Vorstand geändert
                      werden.
                    </p>
                  )}
                </TabsContent>

                {/* Tab 3: Mitglieder */}
                <TabsContent value="mitglieder" className="space-y-4 mt-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Mitglied suchen..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {selectedMembers.length} Mitglieder ausgewählt
                    </p>
                    {memberLimitExceeded && (
                      <div className="flex items-center gap-1.5 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span>
                          Limit überschritten ({selectedMembers.length}/
                          {watchedMaxMembers})
                        </span>
                      </div>
                    )}
                  </div>

                  <ScrollArea className="h-[200px] rounded-md border sm:h-[300px]">
                    <div className="p-4 space-y-2">
                      {filteredMembers.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                          {memberSearch
                            ? "Keine Mitglieder gefunden."
                            : "Keine Mitglieder verfügbar."}
                        </p>
                      ) : (
                        filteredMembers.map((member) => {
                          const age = member.date_of_birth
                            ? calculateAge(member.date_of_birth)
                            : null
                          const isSelected = selectedMembers.includes(member.id)
                          return (
                            <div
                              key={member.id}
                              className="flex items-center space-x-3 rounded-md p-2 hover:bg-accent"
                            >
                              <Checkbox
                                id={`member-${member.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) =>
                                  handleMemberToggle(member.id, !!checked)
                                }
                              />
                              <label
                                htmlFor={`member-${member.id}`}
                                className="flex-1 cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {member.first_name} {member.last_name}
                                  </span>
                                  {age !== null && (
                                    <span className="text-xs text-muted-foreground">
                                      ({age} Jahre)
                                    </span>
                                  )}
                                </div>
                                {member.functional_tags &&
                                  member.functional_tags.length > 0 && (
                                    <div className="flex gap-1 mt-1">
                                      {member.functional_tags.map((tag) => (
                                        <Badge
                                          key={tag}
                                          variant="outline"
                                          className="text-xs px-1.5 py-0"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                              </label>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Abbrechen
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditing ? "Speichern" : "Gruppe erstellen"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Confirmation Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Änderungen verwerfen?</AlertDialogTitle>
            <AlertDialogDescription>
              Sie haben ungespeicherte Änderungen. Möchten Sie diese wirklich
              verwerfen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zurück zum Formular</AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardConfirm}>
              Änderungen verwerfen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
