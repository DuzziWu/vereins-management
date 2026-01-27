"use client"

import * as React from "react"
import { Plus, Info, Lock, UserPlus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  FeeStatsCards,
  FeesToolbar,
  FeesTable,
  GenerateFeesDialog,
  FeeAdjustmentModal,
  AddSingleFeeDialog,
  type FeeStats,
  type FeesFilters,
  type FeeEntry,
  type GenerateFeesPreview,
  type PaymentStatus,
  type MemberWithoutFee,
} from "@/components/finances"
import { createClient } from "@/lib/supabase/client"

function getPaymentStatus(amountDue: number, amountPaid: number): PaymentStatus {
  if (amountPaid >= amountDue && amountDue > 0) return "paid"
  if (amountPaid > 0) return "partial"
  return "open"
}

export default function FeesPage() {
  const currentYear = new Date().getFullYear()

  const [entries, setEntries] = React.useState<FeeEntry[]>([])
  const [stats, setStats] = React.useState<FeeStats | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [availableYears, setAvailableYears] = React.useState<number[]>([currentYear])
  const [hasFeesForYear, setHasFeesForYear] = React.useState(false)

  // Filters
  const [filters, setFilters] = React.useState<FeesFilters>({
    search: "",
    status: "all",
    year: currentYear,
    onlyOpen: false,
    viewMode: "all",
  })

  // Generate Dialog
  const [showGenerateDialog, setShowGenerateDialog] = React.useState(false)
  const [generatePreview, setGeneratePreview] = React.useState<GenerateFeesPreview | null>(null)
  const [isGenerating, setIsGenerating] = React.useState(false)

  // Adjustment Modal
  const [adjustingEntry, setAdjustingEntry] = React.useState<FeeEntry | null>(null)

  // BUG-4: Add Single Fee Dialog
  const [showAddSingleFeeDialog, setShowAddSingleFeeDialog] = React.useState(false)
  const [membersWithoutFee, setMembersWithoutFee] = React.useState<MemberWithoutFee[]>([])
  const [isLoadingMembersWithoutFee, setIsLoadingMembersWithoutFee] = React.useState(false)

  const supabase = createClient()

  // Fetch available years
  const fetchAvailableYears = React.useCallback(async () => {
    const { data } = await supabase
      .from("membership_fees")
      .select("year")
      .order("year", { ascending: false })

    const years = [...new Set(data?.map((f) => f.year) ?? [])]
    if (!years.includes(currentYear)) {
      years.unshift(currentYear)
    }
    years.sort((a, b) => b - a)
    setAvailableYears(years)
  }, [supabase, currentYear])

  // Fetch fees and stats
  const fetchData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      // Check if fees exist for selected year
      const { count: feeCount } = await supabase
        .from("membership_fees")
        .select("*", { count: "exact", head: true })
        .eq("year", filters.year)

      setHasFeesForYear((feeCount ?? 0) > 0)

      // Fetch individual fees (profiles without family or with their own fee entry)
      const { data: individualFees, error: individualError } = await supabase
        .from("membership_fees")
        .select(`
          id,
          year,
          amount_due,
          amount_paid,
          profile_id,
          profiles (
            id,
            first_name,
            last_name,
            membership_types (
              id,
              name
            )
          )
        `)
        .eq("year", filters.year)
        .not("profile_id", "is", null)

      if (individualError) throw individualError

      // Fetch family fees
      const { data: familyFees, error: familyError } = await supabase
        .from("membership_fees")
        .select(`
          id,
          year,
          amount_due,
          amount_paid,
          family_id,
          membership_type_id,
          membership_types (
            id,
            name,
            is_family_flat
          ),
          families (
            id,
            name,
            profiles!profiles_family_id_fkey (
              id,
              first_name,
              last_name,
              membership_types (
                id,
                name,
                is_family_flat
              )
            )
          )
        `)
        .eq("year", filters.year)
        .not("family_id", "is", null)

      if (familyError) throw familyError

      // Transform data to FeeEntry format
      const allEntries: FeeEntry[] = []

      // Process individual fees
      for (const fee of individualFees ?? []) {
        const profile = fee.profiles as { id: string; first_name: string; last_name: string; membership_types: { id: string; name: string } | null } | null
        if (!profile) continue

        const amountOpen = fee.amount_due - fee.amount_paid

        allEntries.push({
          id: fee.id,
          type: "individual",
          name: `${profile.first_name} ${profile.last_name}`,
          membershipTypeName: profile.membership_types?.name ?? null,
          amountDue: Number(fee.amount_due),
          amountPaid: Number(fee.amount_paid),
          amountOpen: Number(amountOpen),
          status: getPaymentStatus(Number(fee.amount_due), Number(fee.amount_paid)),
        })
      }

      // Process family fees
      for (const fee of familyFees ?? []) {
        const family = fee.families as {
          id: string
          name: string
          profiles: Array<{
            id: string
            first_name: string
            last_name: string
            membership_types: { id: string; name: string } | null
          }>
        } | null

        if (!family) continue

        const amountOpen = fee.amount_due - fee.amount_paid
        const membershipType = fee.membership_types as { id: string; name: string; is_family_flat: boolean } | null
        // SECURITY-2: Nutze is_family_flat Feld statt String-Check
        const isFamilyFlat = membershipType?.is_family_flat ?? false

        allEntries.push({
          id: fee.id,
          type: "family",
          name: `Familie ${family.name}`,
          membershipTypeName: membershipType?.name ?? null,
          amountDue: Number(fee.amount_due),
          amountPaid: Number(fee.amount_paid),
          amountOpen: Number(amountOpen),
          status: getPaymentStatus(Number(fee.amount_due), Number(fee.amount_paid)),
          memberCount: family.profiles?.length ?? 0,
          isFamilyFlat,
          members: family.profiles?.map((p) => ({
            id: p.id,
            name: `${p.first_name} ${p.last_name}`,
            membershipTypeName: p.membership_types?.name ?? null,
            amountDue: 0,
            amountPaid: 0,
            status: "open" as PaymentStatus,
          })),
        })
      }

      // Apply filters
      let filtered = allEntries

      // BUG-1: View mode filter
      if (filters.viewMode === "families") {
        filtered = filtered.filter((e) => e.type === "family")
      }

      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase()
        filtered = filtered.filter((e) => e.name.toLowerCase().includes(search))
      }

      // Status filter
      if (filters.status !== "all") {
        filtered = filtered.filter((e) => e.status === filters.status)
      }

      // Only open filter
      if (filters.onlyOpen) {
        filtered = filtered.filter((e) => e.status !== "paid")
      }

      // Sort: families first, then alphabetically
      filtered.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "family" ? -1 : 1
        }
        return a.name.localeCompare(b.name, "de")
      })

      setEntries(filtered)

      // Calculate stats (from all entries, not filtered)
      const totalDue = allEntries.reduce((sum, e) => sum + e.amountDue, 0)
      const totalPaid = allEntries.reduce((sum, e) => sum + e.amountPaid, 0)
      const totalOpen = totalDue - totalPaid
      const paymentRate = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0

      setStats({
        totalDue,
        totalPaid,
        totalOpen,
        paymentRate,
      })
    } catch (error) {
      console.error("Error fetching fees:", error)
      toast.error("Fehler beim Laden der Beiträge")
    } finally {
      setIsLoading(false)
    }
  }, [supabase, filters])

  // Fetch preview for generation
  const fetchGeneratePreview = React.useCallback(async () => {
    try {
      // Get members with membership type (individuals without family)
      const { data: individuals, error: indError } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          membership_type_id,
          family_id,
          membership_types (
            id,
            annual_fee
          )
        `)
        .eq("status", "active")
        .is("family_id", null)

      if (indError) throw indError

      // Get families with their members
      const { data: families, error: famError } = await supabase
        .from("families")
        .select(`
          id,
          name,
          profiles!profiles_family_id_fkey (
            id,
            first_name,
            last_name,
            membership_type_id,
            membership_types (
              id,
              name,
              annual_fee,
              is_family_flat
            )
          )
        `)

      if (famError) throw famError

      // Calculate preview
      let individualCount = 0
      let familyCount = 0
      let totalAmount = 0
      const membersWithoutTypeNames: string[] = []

      // Process individuals
      for (const member of individuals ?? []) {
        const membershipType = member.membership_types as { id: string; annual_fee: number } | null
        if (membershipType) {
          individualCount++
          totalAmount += Number(membershipType.annual_fee)
        } else {
          membersWithoutTypeNames.push(`${member.first_name} ${member.last_name}`)
        }
      }

      // Process families
      for (const family of families ?? []) {
        const members = family.profiles as Array<{
          id: string
          first_name: string
          last_name: string
          membership_type_id: string | null
          membership_types: { id: string; name: string; annual_fee: number; is_family_flat: boolean } | null
        }> | null

        if (!members || members.length === 0) continue

        // SECURITY-2: Check if any member has a family-flat type using is_family_flat field
        const familyFlatMember = members.find((m) =>
          m.membership_types?.is_family_flat === true
        )

        if (familyFlatMember && familyFlatMember.membership_types) {
          // Family-Flat: use the flat rate
          familyCount++
          totalAmount += Number(familyFlatMember.membership_types.annual_fee)
        } else {
          // Individual billing: sum all members
          let hasAnyType = false
          for (const m of members) {
            if (m.membership_types) {
              hasAnyType = true
              totalAmount += Number(m.membership_types.annual_fee)
            } else {
              membersWithoutTypeNames.push(`${m.first_name} ${m.last_name}`)
            }
          }
          if (hasAnyType) {
            familyCount++
          }
        }
      }

      setGeneratePreview({
        year: filters.year,
        individualCount,
        familyCount,
        totalAmount,
        membersWithoutType: membersWithoutTypeNames.length,
        membersWithoutTypeNames,
      })
    } catch (error) {
      console.error("Error fetching preview:", error)
      toast.error("Fehler beim Laden der Vorschau")
    }
  }, [supabase, filters.year])

  // Generate fees
  async function handleGenerate() {
    if (!generatePreview) return

    setIsGenerating(true)
    try {
      // Get individuals without family
      const { data: individuals } = await supabase
        .from("profiles")
        .select(`
          id,
          membership_type_id,
          membership_types (
            id,
            annual_fee
          )
        `)
        .eq("status", "active")
        .is("family_id", null)
        .not("membership_type_id", "is", null)

      // Get families
      const { data: families } = await supabase
        .from("families")
        .select(`
          id,
          profiles!profiles_family_id_fkey (
            id,
            membership_type_id,
            membership_types (
              id,
              name,
              annual_fee,
              is_family_flat
            )
          )
        `)

      const feesToInsert: Array<{
        year: number
        profile_id?: string
        family_id?: string
        amount_due: number
        membership_type_id?: string
      }> = []

      // Create entries for individuals
      for (const member of individuals ?? []) {
        const membershipType = member.membership_types as { id: string; annual_fee: number } | null
        if (!membershipType) continue

        feesToInsert.push({
          year: filters.year,
          profile_id: member.id,
          amount_due: Number(membershipType.annual_fee),
          membership_type_id: member.membership_type_id!,
        })
      }

      // Create entries for families
      for (const family of families ?? []) {
        const members = family.profiles as Array<{
          id: string
          membership_type_id: string | null
          membership_types: { id: string; name: string; annual_fee: number; is_family_flat: boolean } | null
        }> | null

        if (!members || members.length === 0) continue

        // SECURITY-2: Check for family-flat using is_family_flat field
        const familyFlatMember = members.find((m) =>
          m.membership_types?.is_family_flat === true
        )

        if (familyFlatMember && familyFlatMember.membership_types) {
          feesToInsert.push({
            year: filters.year,
            family_id: family.id,
            amount_due: Number(familyFlatMember.membership_types.annual_fee),
            membership_type_id: familyFlatMember.membership_type_id!,
          })
        } else {
          // Sum individual fees
          let totalFamilyFee = 0
          let firstMembershipTypeId: string | null = null
          for (const m of members) {
            if (m.membership_types) {
              totalFamilyFee += Number(m.membership_types.annual_fee)
              if (!firstMembershipTypeId) {
                firstMembershipTypeId = m.membership_type_id
              }
            }
          }

          if (totalFamilyFee > 0) {
            feesToInsert.push({
              year: filters.year,
              family_id: family.id,
              amount_due: totalFamilyFee,
              membership_type_id: firstMembershipTypeId ?? undefined,
            })
          }
        }
      }

      // Insert all fees
      if (feesToInsert.length > 0) {
        const { error } = await supabase.from("membership_fees").insert(feesToInsert)
        if (error) throw error
      }

      toast.success(`${feesToInsert.length} Beiträge für ${filters.year} generiert`)
      setShowGenerateDialog(false)
      await fetchData()
      await fetchAvailableYears()
    } catch (error) {
      console.error("Error generating fees:", error)
      toast.error("Fehler beim Generieren der Beiträge")
    } finally {
      setIsGenerating(false)
    }
  }

  // Adjust fee
  async function handleAdjust(feeId: string, newAmount: number, reason: string) {
    try {
      // BUG-3: Get current user and old amount for history
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Get the old amount before updating
      const { data: currentFee, error: fetchError } = await supabase
        .from("membership_fees")
        .select("amount_due")
        .eq("id", feeId)
        .single()

      if (fetchError) throw fetchError
      const oldAmount = Number(currentFee.amount_due)

      // Update the fee
      const { error: updateError } = await supabase
        .from("membership_fees")
        .update({
          amount_due: newAmount,
          adjustment_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", feeId)

      if (updateError) throw updateError

      // BUG-3: Write to fee_adjustments history table
      const { error: historyError } = await supabase
        .from("fee_adjustments")
        .insert({
          fee_id: feeId,
          old_amount: oldAmount,
          new_amount: newAmount,
          reason: reason,
          adjusted_by: user.id,
        })

      if (historyError) {
        console.error("Error writing adjustment history:", historyError)
        // Don't throw - the main update succeeded
      }

      toast.success("Beitrag angepasst")
      setAdjustingEntry(null)
      await fetchData()
    } catch (error) {
      console.error("Error adjusting fee:", error)
      toast.error("Fehler beim Anpassen des Beitrags")
      throw error
    }
  }

  // Open generate dialog
  function handleOpenGenerateDialog() {
    setGeneratePreview(null) // Reset preview to show loading state
    setShowGenerateDialog(true)
    fetchGeneratePreview()
  }

  // BUG-4: Fetch members without fee for the selected year
  const fetchMembersWithoutFee = React.useCallback(async () => {
    setIsLoadingMembersWithoutFee(true)
    try {
      // Get existing fee profile_ids and family_ids for this year
      const { data: existingFees } = await supabase
        .from("membership_fees")
        .select("profile_id, family_id")
        .eq("year", filters.year)

      const existingProfileIds = new Set(
        existingFees?.filter((f) => f.profile_id).map((f) => f.profile_id) ?? []
      )
      const existingFamilyIds = new Set(
        existingFees?.filter((f) => f.family_id).map((f) => f.family_id) ?? []
      )

      const membersWithout: MemberWithoutFee[] = []

      // Get individuals without family who don't have a fee
      const { data: individuals } = await supabase
        .from("profiles")
        .select(`
          id,
          first_name,
          last_name,
          membership_type_id,
          membership_types (
            id,
            name,
            annual_fee
          )
        `)
        .eq("status", "active")
        .is("family_id", null)
        .not("membership_type_id", "is", null)

      for (const member of individuals ?? []) {
        if (existingProfileIds.has(member.id)) continue
        const membershipType = member.membership_types as { id: string; name: string; annual_fee: number } | null
        if (!membershipType) continue

        membersWithout.push({
          id: member.id,
          type: "individual",
          name: `${member.first_name} ${member.last_name}`,
          membershipTypeName: membershipType.name,
          annualFee: Number(membershipType.annual_fee),
        })
      }

      // Get families without a fee
      const { data: families } = await supabase
        .from("families")
        .select(`
          id,
          name,
          profiles!profiles_family_id_fkey (
            id,
            membership_type_id,
            membership_types (
              id,
              name,
              annual_fee,
              is_family_flat
            )
          )
        `)

      for (const family of families ?? []) {
        if (existingFamilyIds.has(family.id)) continue

        const members = family.profiles as Array<{
          id: string
          membership_type_id: string | null
          membership_types: { id: string; name: string; annual_fee: number; is_family_flat: boolean } | null
        }> | null

        if (!members || members.length === 0) continue

        // SECURITY-2: Check if any member has a family-flat type using is_family_flat field
        const familyFlatMember = members.find((m) =>
          m.membership_types?.is_family_flat === true
        )

        let totalFee = 0
        let typeName: string | null = null

        if (familyFlatMember && familyFlatMember.membership_types) {
          totalFee = Number(familyFlatMember.membership_types.annual_fee)
          typeName = familyFlatMember.membership_types.name
        } else {
          for (const m of members) {
            if (m.membership_types) {
              totalFee += Number(m.membership_types.annual_fee)
              if (!typeName) typeName = m.membership_types.name
            }
          }
        }

        if (totalFee > 0) {
          membersWithout.push({
            id: `family-${family.id}`,
            type: "family",
            name: `Familie ${family.name}`,
            membershipTypeName: typeName,
            annualFee: totalFee,
            familyId: family.id,
          })
        }
      }

      setMembersWithoutFee(membersWithout)
    } catch (error) {
      console.error("Error fetching members without fee:", error)
      toast.error("Fehler beim Laden der Mitglieder")
    } finally {
      setIsLoadingMembersWithoutFee(false)
    }
  }, [supabase, filters.year])

  // BUG-4: Add single fees
  async function handleAddSingleFees(memberIds: string[], familyIds: string[]) {
    try {
      const feesToInsert: Array<{
        year: number
        profile_id?: string
        family_id?: string
        amount_due: number
        membership_type_id?: string
      }> = []

      // Add individual fees
      for (const memberId of memberIds) {
        const member = membersWithoutFee.find((m) => m.id === memberId && m.type === "individual")
        if (!member) continue

        const { data: profile } = await supabase
          .from("profiles")
          .select("membership_type_id")
          .eq("id", memberId)
          .single()

        if (profile?.membership_type_id) {
          feesToInsert.push({
            year: filters.year,
            profile_id: memberId,
            amount_due: member.annualFee,
            membership_type_id: profile.membership_type_id,
          })
        }
      }

      // Add family fees
      for (const familyId of familyIds) {
        const member = membersWithoutFee.find((m) => m.familyId === familyId && m.type === "family")
        if (!member) continue

        // Get first membership type from family members
        const { data: familyMembers } = await supabase
          .from("profiles")
          .select("membership_type_id")
          .eq("family_id", familyId)
          .not("membership_type_id", "is", null)
          .limit(1)

        feesToInsert.push({
          year: filters.year,
          family_id: familyId,
          amount_due: member.annualFee,
          membership_type_id: familyMembers?.[0]?.membership_type_id ?? undefined,
        })
      }

      if (feesToInsert.length > 0) {
        const { error } = await supabase.from("membership_fees").insert(feesToInsert)
        if (error) throw error
      }

      toast.success(`${feesToInsert.length} Beitrag${feesToInsert.length !== 1 ? "e" : ""} hinzugefügt`)
      await fetchData()
    } catch (error) {
      console.error("Error adding single fees:", error)
      toast.error("Fehler beim Hinzufügen der Beiträge")
      throw error
    }
  }

  // BUG-4: Open add single fee dialog
  function handleOpenAddSingleFeeDialog() {
    fetchMembersWithoutFee()
    setShowAddSingleFeeDialog(true)
  }

  // Initial load
  React.useEffect(() => {
    fetchAvailableYears()
  }, [fetchAvailableYears])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // BUG-5: Vergangene Jahre sind readonly
  const isReadonly = filters.year < currentYear

  // BUG-6: Nur aktuelles Jahr und Jahr+1 können Beiträge generieren
  const canGenerateFees = !hasFeesForYear && filters.year <= currentYear + 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Beiträge {filters.year}
          </h1>
          <p className="text-muted-foreground">
            Übersicht aller Mitgliedsbeiträge
          </p>
        </div>
        <div className="flex gap-2">
          {canGenerateFees && (
            <Button onClick={handleOpenGenerateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Beiträge generieren
            </Button>
          )}
          {/* BUG-4: Button zum Hinzufügen einzelner Beiträge */}
          {hasFeesForYear && !isReadonly && (
            <Button variant="outline" onClick={handleOpenAddSingleFeeDialog}>
              <UserPlus className="mr-2 h-4 w-4" />
              Beitrag hinzufügen
            </Button>
          )}
        </div>
      </div>

      {/* BUG-5: Hinweis für vergangene Jahre (readonly) */}
      {isReadonly && (
        <Alert>
          <Lock className="h-4 w-4" />
          <AlertDescription>
            Vergangene Jahre können nicht mehr bearbeitet werden. Wählen Sie das aktuelle Jahr, um Beiträge anzupassen.
          </AlertDescription>
        </Alert>
      )}

      {/* BUG-2: Hinweis wenn Beiträge bereits generiert wurden */}
      {hasFeesForYear && !isReadonly && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Beiträge für {filters.year} wurden bereits generiert.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <FeeStatsCards stats={stats} isLoading={isLoading} year={filters.year} />

      {/* Toolbar */}
      <FeesToolbar
        filters={filters}
        onFiltersChange={setFilters}
        availableYears={availableYears}
      />

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <FeesTable
          entries={entries}
          onAdjust={setAdjustingEntry}
          isLoading={isLoading}
          isReadonly={isReadonly}
        />
      )}

      {/* Generate Dialog */}
      <GenerateFeesDialog
        open={showGenerateDialog}
        onOpenChange={setShowGenerateDialog}
        preview={generatePreview}
        isGenerating={isGenerating}
        onGenerate={handleGenerate}
        year={filters.year}
      />

      {/* Adjustment Modal */}
      <FeeAdjustmentModal
        open={!!adjustingEntry}
        onOpenChange={(open) => !open && setAdjustingEntry(null)}
        entry={adjustingEntry}
        onSubmit={handleAdjust}
      />

      {/* BUG-4: Add Single Fee Dialog */}
      <AddSingleFeeDialog
        open={showAddSingleFeeDialog}
        onOpenChange={setShowAddSingleFeeDialog}
        year={filters.year}
        membersWithoutFee={membersWithoutFee}
        isLoading={isLoadingMembersWithoutFee}
        onAdd={handleAddSingleFees}
      />
    </div>
  )
}
