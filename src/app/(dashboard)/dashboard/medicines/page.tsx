import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Pill } from "lucide-react";
import { MedicineCard } from "@/components/medicines/medicine-card";
import type { MedicineDisplay } from "@/types/medicines";

async function getMedicinesForUser(userId: string): Promise<MedicineDisplay[]> {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("family_members")
    .select("id, full_name")
    .eq("created_by", userId);

  if (!members || members.length === 0) {
    return [];
  }

  const memberIds = members.map((m) => m.id);
  const memberMap = new Map(members.map((m) => [m.id, m.full_name]));

  const { data: medicines, error } = await supabase
    .from("medicines")
    .select("*")
    .in("owner_id", memberIds)
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching medicines:", error);
    return [];
  }

  return (medicines || []).map((med) => ({
    id: med.id,
    name: med.name,
    dosage: med.dosage,
    frequency: med.frequency,
    duration: med.duration,
    instructions: med.instructions,
    isActive: med.is_active ?? true,
    ownerName: memberMap.get(med.owner_id) || "Unknown",
    ownerId: med.owner_id,
    documentId: med.document_id,
    createdAt: med.created_at,
  }));
}

export default async function MedicinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const medicines = await getMedicinesForUser(user.id);
  const activeMedicines = medicines.filter((m) => m.isActive);
  const inactiveMedicines = medicines.filter((m) => !m.isActive);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Medicines</h1>
        <p className="text-muted-foreground">
          Track medications extracted from prescriptions
        </p>
      </div>

      {medicines.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
          <Pill className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold mb-1">No Medicines Yet</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Upload a prescription and click &quot;Extract Medicines&quot; to
            automatically detect medications.
          </p>
        </div>
      )}

      {activeMedicines.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">
            Active Medications ({activeMedicines.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeMedicines.map((med) => (
              <MedicineCard key={med.id} medicine={med} showOwner={true} />
            ))}
          </div>
        </div>
      )}

      {inactiveMedicines.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 text-muted-foreground">
            Inactive ({inactiveMedicines.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inactiveMedicines.map((med) => (
              <MedicineCard key={med.id} medicine={med} showOwner={true} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
