import DashboardLayout from "@/components/layout/dashboard-layout";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { LiveFeed } from "@/components/dashboard/live-feed";
import { AlertsPanel } from "@/components/dashboard/alerts-panel";
import { useWatchtower } from "@/hooks/use-watchtower";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default function Dashboard() {
  const { events, alerts, ingestLog } = useWatchtower();

  const simulateCritical = () => {
    ingestLog('CEF:0|Huawei|NMS|V1.0|100|Operation Log|5|src=192.168.1.10 user=ops_user operation=DELETE_LOGS msg=Attempted to delete logs');
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-end mb-2">
         <div>
           <h2 className="text-3xl font-bold tracking-tight mb-1">Overview</h2>
           <p className="text-muted-foreground">Real-time monitoring status and operational insights.</p>
         </div>
         <Button variant="destructive" size="sm" onClick={simulateCritical} className="font-mono text-xs">
           <Play className="h-3 w-3 mr-2" />
           SIMULATE ATTACK
         </Button>
      </div>

      <StatsCards eventCount={events.length} alertCount={alerts.length} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        <div className="lg:col-span-2 h-full">
          <LiveFeed events={events} />
        </div>
        <div className="h-full">
          <AlertsPanel alerts={alerts} />
        </div>
      </div>
    </DashboardLayout>
  );
}
