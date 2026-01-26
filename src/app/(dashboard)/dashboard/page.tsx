import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, FileText, Pill, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { InteractionAlert } from "@/components/interactions/interaction-alert";

async function getStats(userId: string) {
  const supabase = await createClient();

  // Get family member count
  const { count: familyCount } = await supabase
    .from("family_members")
    .select("*", { count: "exact", head: true })
    .eq("created_by", userId);

  // Get document count (through family members)
  const { data: familyIds } = await supabase
    .from("family_members")
    .select("id")
    .eq("created_by", userId);

  let documentCount = 0;
  let medicineCount = 0;
  let interactionCount = 0;

  if (familyIds && familyIds.length > 0) {
    const ids = familyIds.map((f) => f.id);

    const { count: docCount } = await supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .in("owner_id", ids);
    documentCount = docCount || 0;

    const { count: medCount } = await supabase
      .from("medicines")
      .select("*", { count: "exact", head: true })
      .in("owner_id", ids)
      .eq("is_active", true);
    medicineCount = medCount || 0;

    // Get medicine IDs for interaction check
    const { data: medicineIds } = await supabase
      .from("medicines")
      .select("id")
      .in("owner_id", ids)
      .eq("is_active", true);

    if (medicineIds && medicineIds.length > 0) {
      const medIds = medicineIds.map((m) => m.id);
      const { count: intCount } = await supabase
        .from("drug_interactions")
        .select("*", { count: "exact", head: true })
        .in("medicine_1_id", medIds)
        .eq("is_acknowledged", false);
      interactionCount = intCount || 0;
    }
  }

  return {
    familyCount: familyCount || 0,
    documentCount,
    medicineCount,
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
        </div>
      </div>
    </div>
  );
}
