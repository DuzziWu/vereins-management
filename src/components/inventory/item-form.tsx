"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Upload, X, ImagePlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Category,
  InventoryItem,
  InventoryLocation,
  ItemFormData,
  itemSchema,
  ITEM_CONDITION,
  CONDITION_CONFIG,
  ItemImage,
} from "@/lib/validations/inventory"
import { LocationSelect } from "./location-select"

interface ItemFormProps {
  item?: InventoryItem | null
  categories: Category[]
  locations?: InventoryLocation[]
  onSubmit: (data: ItemFormData, images: File[]) => Promise<void>
  onCancel: () => void
}

export function ItemForm({ item, categories, locations = [], onSubmit, onCancel }: ItemFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [newImages, setNewImages] = React.useState<File[]>([])
  const [existingImages, setExistingImages] = React.useState<ItemImage[]>(item?.images || [])
  const [imagesToDelete, setImagesToDelete] = React.useState<string[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: item?.name || "",
      description: item?.description || "",
      category_id: item?.category_id || "",
      inventory_number: item?.inventory_number || "",
      status: item?.status || "available",
      condition: item?.condition || "good",
      size_info: item?.size_info || "",
      purchase_date: item?.purchase_date || "",
      purchase_price: item?.purchase_price?.toString() || "",
      notes: item?.notes || "",
      location_id: item?.location_id || null,
    },
  })

  async function handleSubmit(data: ItemFormData) {
    setIsSubmitting(true)
    try {
      await onSubmit(data, newImages)
    } catch {
      // Error is handled by parent
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const totalImages = existingImages.length - imagesToDelete.length + newImages.length + files.length

    if (totalImages > 5) {
      toast.error("Maximal 5 Bilder pro Item erlaubt")
      return
    }

    const validFiles = files.filter((file) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error(`${file.name}: Nur JPG, PNG oder WebP erlaubt`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: Maximal 5 MB pro Bild`)
        return false
      }
      return true
    })

    setNewImages((prev) => [...prev, ...validFiles])
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  function removeNewImage(index: number) {
    setNewImages((prev) => prev.filter((_, i) => i !== index))
  }

  function removeExistingImage(imageId: string) {
    setImagesToDelete((prev) => [...prev, imageId])
  }

  const displayedExistingImages = existingImages.filter((img) => !imagesToDelete.includes(img.id))
  const totalImages = displayedExistingImages.length + newImages.length

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column - Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Grunddaten</CardTitle>
              <CardDescription>Name, Kategorie und Identifikation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Garde-Jacke, Megafon, Trainingsmatte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategorie *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Kategorie auswählen" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
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
                  name="inventory_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inventarnummer</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-generiert" {...field} />
                      </FormControl>
                      <FormDescription>Leer lassen für automatische Vergabe</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size_info"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Größe/Maße</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. M, 42, 150x80cm" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {locations.length > 0 && (
                <FormField
                  control={form.control}
                  name="location_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lagerort</FormLabel>
                      <FormControl>
                        <LocationSelect
                          locations={locations}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Kein Lagerort"
                          allowClear
                        />
                      </FormControl>
                      <FormDescription>Optional</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Right Column - Condition & Purchase */}
          <Card>
            <CardHeader>
              <CardTitle>Zustand & Anschaffung</CardTitle>
              <CardDescription>Zustand und Kaufinformationen</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zustand</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-wrap gap-4"
                      >
                        {ITEM_CONDITION.map((condition) => (
                          <div key={condition} className="flex items-center space-x-2">
                            <RadioGroupItem value={condition} id={condition} />
                            <label
                              htmlFor={condition}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {CONDITION_CONFIG[condition].label}
                            </label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="purchase_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anschaffungsdatum</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purchase_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Anschaffungspreis (EUR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Beschreibung</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Detaillierte Beschreibung des Items..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Bilder</CardTitle>
            <CardDescription>
              Bis zu 5 Bilder (JPG, PNG, WebP, max. 5 MB pro Bild)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Existing + New Images Grid */}
              {(displayedExistingImages.length > 0 || newImages.length > 0) && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
                  {displayedExistingImages.map((image, index) => (
                    <div key={image.id} className="relative group aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.public_url}
                        alt={`Bild ${index + 1}`}
                        className="h-full w-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(image.id)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-1 left-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                          Thumbnail
                        </span>
                      )}
                    </div>
                  ))}
                  {newImages.map((file, index) => (
                    <div key={`new-${index}`} className="relative group aspect-square">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Neues Bild ${index + 1}`}
                        className="h-full w-full object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <span className="absolute bottom-1 left-1 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">
                        Neu
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Area */}
              {totalImages < 5 && (
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Klicken zum Hochladen oder Dateien hierher ziehen
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalImages}/5 Bilder
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Internal Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Interne Notizen</CardTitle>
            <CardDescription>Nur für Vorstand sichtbar</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Interne Notizen zum Item..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Abbrechen
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {item ? "Speichern" : "Item erstellen"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
