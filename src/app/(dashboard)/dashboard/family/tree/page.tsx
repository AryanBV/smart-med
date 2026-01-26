import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getFamilyMembers } from "@/actions/family";
import { getRelationships } from "@/actions/relationships";
import { Button } from "@/components/ui/button";
import { FamilyTree } from "@/components/family/family-tree";
import { AddRelationshipDialog } from "@/components/family/add-relationship-dialog";
import { RelationshipsList } from "@/components/family/relationships-list";

export default async function FamilyTreePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [membersResult, relationshipsResult] = await Promise.all([
    getFamilyMembers(),
    getRelationships(),
  ]);

  const members = membersResult.data || [];
  const relationships = relationshipsResult.data || [];
  const hasError = membersResult.error || relationshipsResult.error;

  return (
    <div className="space-y-6">
      {/* Error banner */}
      {hasError && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-4">
          <p className="text-sm">
            Failed to load some data: {membersResult.error || relationshipsResult.error}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/family">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Family Tree</h1>
            <p className="text-muted-foreground">
              Visualize how your family members are connected
            </p>
          </div>
        </div>

        {members.length >= 2 && (
          <AddRelationshipDialog
            members={members}
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Relationship
              </Button>
            }
          />
        )}
      </div>

      {/* Not enough members */}
      {members.length < 2 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Need More Family Members</h2>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Add at least 2 family members to start building your family tree.
          </p>
          <Link href="/dashboard/family">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Family Members
            </Button>
          </Link>
        </div>
      )}

      {/* Tree visualization */}
      {members.length >= 2 && (
        <>
          <FamilyTree
            members={members}
            relationships={relationships}
            onNodeClick={(memberId) => {
              // Could open a detail dialog or navigate
              console.log("Clicked member:", memberId);
            }}
          />

          {/* Relationships list */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Relationships</h2>
              <AddRelationshipDialog
                members={members}
                trigger={
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                }
              />
            </div>
            <RelationshipsList relationships={relationships} />
          </div>
        </>
      )}
    </div>
  );
}
