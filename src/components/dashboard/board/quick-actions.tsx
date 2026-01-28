"use client"

import * as React from "react"
import { UserPlus, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MemberForm } from "@/components/members/member-form"
import { MemberFormData } from "@/lib/validations/member"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Database } from "@/lib/database.types"

interface Family {
  id: string
  name: string
}

interface MembershipType {
  id: string
  name: string
  annual_fee: number
}

export function QuickActions() {
  const [showMemberForm, setShowMemberForm] = React.useState(false)
  const [families, setFamilies] = React.useState<Family[]>([])
  const [membershipTypes, setMembershipTypes] = React.useState<MembershipType[]>([])

  async function fetchFamilies() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("families")
      .select("id, name")
      .order("name")

    if (!error && data) {
      setFamilies(data)
    }
  }

  async function fetchMembershipTypes() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("membership_types")
      .select("id, name, annual_fee")
      .order("name")

    if (!error && data) {
      setMembershipTypes(data)
    }
  }

  // Fetch data when component mounts
  React.useEffect(() => {
    fetchFamilies()
    fetchMembershipTypes()
  }, [])

  async function handleCreateMember(data: MemberFormData) {
    const supabase = createClient()

    // Prepare data for insert
    const insertData: Record<string, unknown> = {
      first_name: data.first_name,
      last_name: data.last_name,
      date_of_birth: data.date_of_birth,
      phone: data.phone || null,
      role: data.role,
      address_street: data.address_street || null,
      address_zip: data.address_zip || null,
      address_city: data.address_city || null,
      functional_tags: data.functional_tags?.length ? data.functional_tags : null,
      family_id: data.family_id && data.family_id !== "none" ? data.family_id : null,
      membership_type_id: data.membership_type_id && data.membership_type_id !== "none" ? data.membership_type_id : null,
      notes: data.notes || null,
      status: "active",
      is_active: true,
    }

    const { error } = await supabase
      .from("profiles")
      .insert(insertData as Database["public"]["Tables"]["profiles"]["Insert"])

    if (error) {
      console.error("Error creating member:", error)
      toast.error("Fehler beim Anlegen des Mitglieds")
      throw error
    }

    toast.success("Mitglied erfolgreich angelegt")
    // Refresh families in case a new family was referenced
    await fetchFamilies()
  }

  function handleSendMessage() {
    // Placeholder for future message feature
    toast.info("Diese Funktion wird bald verfügbar sein")
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setShowMemberForm(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Mitglied anlegen</span>
          <span className="sm:hidden">Anlegen</span>
        </Button>
        <Button variant="outline" onClick={handleSendMessage} className="gap-2">
          <Mail className="h-4 w-4" />
          <span className="hidden sm:inline">Mitteilung senden</span>
          <span className="sm:hidden">Mitteilung</span>
        </Button>
      </div>

      <MemberForm
        open={showMemberForm}
        onOpenChange={setShowMemberForm}
        families={families}
        membershipTypes={membershipTypes}
        onSubmit={handleCreateMember}
        onRefreshFamilies={fetchFamilies}
      />
    </>
  )
}
