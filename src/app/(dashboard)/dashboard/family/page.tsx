import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getFamilyMembers } from "@/actions/family";
import { FamilyList } from "@/components/family/family-list";

export const metadata = {
  title: "Family | smart-med",
  description: "Manage your family members",
};

export default async function FamilyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: members, error } = await getFamilyMembers();

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Family</h1>
          <p className="text-muted-foreground">Manage your family members</p>
        </div>
        <div className="text-red-500 bg-red-50 dark:bg-red-950 p-4 rounded-lg">
          Error loading family members: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Family</h1>
        <p className="text-muted-foreground">
          Manage your family members and their health records
        </p>
      </div>

      <FamilyList initialMembers={members || []} />
    </div>
  );
}
