import { MyWorkgroupsContent } from "@/components/workgroups/my-workgroups-content"

export default function MemberWorkgroupsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Meine Workgroups</h1>
        <p className="text-muted-foreground">
          Projektgruppen, denen du zugewiesen bist.
        </p>
      </div>

      {/* Content */}
      <MyWorkgroupsContent basePath="/member/workgroups" />
    </div>
  )
}
