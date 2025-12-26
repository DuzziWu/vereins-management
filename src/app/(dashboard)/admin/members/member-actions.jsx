'use client'

import { useState } from 'react'
import { MoreVertical, UserCog, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { updateMemberRole, removeMember } from '@/actions/members'
import { USER_ROLES, ROLE_LABELS } from '@/lib/constants'

export function MemberActions({ member, currentUserId }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isCurrentUser = member.id === currentUserId

  async function handleRoleChange(newRole) {
    setIsLoading(true)
    const formData = new FormData()
    formData.set('memberId', member.id)
    formData.set('role', newRole)
    await updateMemberRole(formData)
    setIsLoading(false)
    setIsOpen(false)
  }

  async function handleRemove() {
    if (!confirm(`${member.full_name} wirklich aus dem Verein entfernen?`)) {
      return
    }
    setIsLoading(true)
    await removeMember(member.id)
    setIsLoading(false)
  }

  if (isCurrentUser) {
    return null
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
      >
        <MoreVertical className="h-4 w-4" />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md border border-border bg-card shadow-lg">
            <div className="p-1">
              <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Rolle ändern
              </p>
              {Object.values(USER_ROLES).map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  disabled={member.role === role}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-secondary disabled:opacity-50"
                >
                  <UserCog className="h-4 w-4" />
                  {ROLE_LABELS[role]}
                  {member.role === role && ' ✓'}
                </button>
              ))}

              <div className="my-1 h-px bg-border" />

              <button
                onClick={handleRemove}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Entfernen
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
