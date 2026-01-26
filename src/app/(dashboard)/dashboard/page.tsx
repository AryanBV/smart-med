export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to smart-med. Your family health hub.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Family Members</h3>
          <p className="text-2xl font-bold text-primary">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Documents</h3>
          <p className="text-2xl font-bold text-primary">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Active Medicines</h3>
          <p className="text-2xl font-bold text-primary">0</p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold">Interactions</h3>
          <p className="text-2xl font-bold text-primary">0</p>
        </div>
      </div>
    </div>
  );
}
