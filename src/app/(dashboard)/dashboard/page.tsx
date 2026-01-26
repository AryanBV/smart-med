import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, FileText, Pill, AlertTriangle } from "lucide-react";

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Family Members</h3>
          </div>
          <p className="text-3xl font-bold text-primary mt-2">0</p>
          <p className="text-xs text-muted-foreground mt-1">
            Add family members to get started
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Documents</h3>
          </div>
          <p className="text-3xl font-bold text-primary mt-2">0</p>
          <p className="text-xs text-muted-foreground mt-1">
            Upload prescriptions
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Active Medicines</h3>
          </div>
          <p className="text-3xl font-bold text-primary mt-2">0</p>
          <p className="text-xs text-muted-foreground mt-1">
            Currently active medications
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Interactions</h3>
          </div>
          <p className="text-3xl font-bold text-primary mt-2">0</p>
          <p className="text-xs text-muted-foreground mt-1">
            Drug interaction alerts
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <a
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
          </a>
          <a
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
          </a>
          <a
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
          </a>
        </div>
      </div>
    </div>
  );
}
