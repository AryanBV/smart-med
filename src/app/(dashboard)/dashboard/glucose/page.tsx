import { getGlucoseReadings } from "@/actions/glucose";
import { getFamilyMembers } from "@/actions/family";
import { GlucoseForm } from "@/components/glucose/glucose-form";
import { GlucoseList } from "@/components/glucose/glucose-list";
import { GlucoseChart } from "@/components/glucose/glucose-chart";
import { GlucoseStats } from "@/components/glucose/glucose-stats";

export default async function GlucosePage() {
  const [readingsResult, membersResult] = await Promise.all([
    getGlucoseReadings(),
    getFamilyMembers(),
  ]);

  const readings = readingsResult.data || [];
  const members = membersResult.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Glucose Tracking</h1>
          <p className="text-muted-foreground">
            Log and monitor blood sugar readings for your family
          </p>
        </div>
        <GlucoseForm familyMembers={members} />
      </div>

      {readings.length > 0 && (
        <>
          <GlucoseStats readings={readings} />
          <GlucoseChart readings={readings} />
        </>
      )}

      <GlucoseList readings={readings} />
    </div>
  );
}
