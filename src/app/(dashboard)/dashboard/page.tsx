import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, FileText, Pill, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { InteractionAlert } from "@/components/interactions/interaction-alert";

async function getStats(userId: string) {
  const supabase = await createClient();

  // Get family members first (needed for filtering other queries)
  const { data: members } = await supabase
    .from("family_members")
    .select("id")
    .eq("created_by", userId);

  const memberIds = members?.map((m) => m.id) ?? [];

  if (memberIds.length === 0) {
    return {
      familyCount: 0,
      documentCount: 0,
      medicineCount: 0,
      interactionCount: 0,
    };
  }

  // Run remaining counts in parallel
  const [familyResult, docsResult, medsResult, medsForInteractions] =
    await Promise.all([
      supabase
        .from("family_members")
        .select("*", { count: "exact", head: true })
        .eq("created_by", userId),
      supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .in("owner_id", memberIds),
      supabase
        .from("medicines")
        .select("*", { count: "exact", head: true })
        .in("owner_id", memberIds)
        .eq("is_active", true),
      supabase
        .from("medicines")
        .select("id")
        .in("owner_id", memberIds)
        .eq("is_active", true),
    ]);

  const medicineIds = medsForInteractions.data?.map((m) => m.id) ?? [];

  let interactionCount = 0;
  if (medicineIds.length > 0) {
    const { count } = await supabase
      .from("drug_interactions")
      .select("*", { count: "exact", head: true })
      .or(
        `medicine_1_id.in.(${medicineIds.join(",")}),medicine_2_id.in.(${medicineIds.join(",")})`
      )
      .eq("is_acknowledged", false);
    interactionCount = count ?? 0;
  }

  return {
    familyCount: familyResult.count ?? 0,
    documentCount: docsResult.count ?? 0,
    medicineCount: medsResult.count ?? 0,
    interactionCount,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const displayName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  const stats = await getStats(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {displayName}!
        </h1>
        <p className="text-muted-foreground">
          Your family health hub. Manage health records for your family.
        </p>
      </div>

      {/* Interaction Alert */}
      <InteractionAlert count={stats.interactionCount} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/dashboard/family"
          className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Family Members</h3>
          </div>
          <p className="text-3xl font-bold text-primary mt-2">
            {stats.familyCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.familyCount === 0
              ? "Add family members to get started"
              : `${stats.familyCount} member${stats.familyCount !== 1 ? "s" : ""} added`}
          </p>
        </Link>

        <Link
          href="/dashboard/documents"
          className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Documents</h3>
          </div>
          <p className="text-3xl font-bold text-primary mt-2">
            {stats.documentCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload prescriptions
          </p>
        </Link>

        <Link
          href="/dashboard/medicines"
          className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Active Medicines</h3>
          </div>
          <p className="text-3xl font-bold text-primary mt-2">
            {stats.medicineCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Currently active medications
          </p>
        </Link>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`h-5 w-5 ${
                stats.interactionCount > 0 ? "text-red-500" : "text-primary"
              }`}
            />
            <h3 className="font-semibold">Interactions</h3>
          </div>
          <p
            className={`text-3xl font-bold mt-2 ${
              stats.interactionCount > 0 ? "text-red-500" : "text-primary"
            }`}
          >
            {stats.interactionCount}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.interactionCount > 0
              ? "Requires attention!"
              : "No interaction alerts"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/dashboard/family"
            className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Add Family Member</p>
              <p className="text-sm text-muted-foreground">
                Build your family tree
              </p>
            </div>
          </Link>
          <Link
            href="/dashboard/documents"
            className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Upload Prescription</p>
              <p className="text-sm text-muted-foreground">
                Scan and extract medicines
              </p>
            </div>
          </Link>
{/* Phase 6: Glucose Tracking - Coming Soon
          <Link
            href="/dashboard/glucose"
            className="flex items-center gap-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Log Glucose</p>
              <p className="text-sm text-muted-foreground">
                Track blood sugar levels
              </p>
            </div>
          </Link>
          */}
        </div>
      </div>
    </div>
  );
}
