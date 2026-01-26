import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { getUnacknowledgedInteractions } from "@/actions/interactions";
import { InteractionCard } from "@/components/interactions/interaction-card";

export default async function InteractionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: interactions, error } = await getUnacknowledgedInteractions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Drug Interactions</h1>
        <p className="text-muted-foreground">
          Review potential interactions between your family&apos;s medications
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {(!interactions || interactions.length === 0) && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/20">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="font-semibold mb-1">No Interactions Detected</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            No drug interactions have been detected between your family&apos;s current
            medications. We&apos;ll alert you if any are found.
          </p>
        </div>
      )}

      {interactions && interactions.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Important Disclaimer
              </p>
              <p className="text-yellow-700 dark:text-yellow-300">
                This information is for educational purposes only and is not a substitute
                for professional medical advice. Always consult your doctor or pharmacist
                before making any changes to your medications.
              </p>
            </div>
          </div>
        </div>
      )}

      {interactions && interactions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {interactions.length} Interaction{interactions.length !== 1 ? "s" : ""} to Review
          </h2>
          <div className="grid gap-4">
            {interactions.map((interaction) => (
              <InteractionCard
                key={interaction.id}
                interaction={interaction}
                showOwner={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
