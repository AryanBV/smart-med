import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
        <WifiOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold mb-2">You're offline</h1>
      <p className="text-muted-foreground text-center max-w-md">
        Please check your internet connection and try again. Your data will sync
        automatically when you're back online.
      </p>
    </div>
  );
}
