import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertTriangle, Database, ShieldAlert } from "lucide-react";

interface StatsProps {
  eventCount: number;
  alertCount: number;
}

export function StatsCards({ eventCount, alertCount }: StatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-sidebar/50 border-sidebar-border backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
          <Activity className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">{eventCount}</div>
          <p className="text-xs text-muted-foreground">+20.1% from last hour</p>
        </CardContent>
      </Card>

      <Card className="bg-sidebar/50 border-sidebar-border backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Active Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-red-500">{alertCount}</div>
          <p className="text-xs text-muted-foreground">3 Critical needs attention</p>
        </CardContent>
      </Card>

      <Card className="bg-sidebar/50 border-sidebar-border backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Database Status</CardTitle>
          <Database className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono text-green-500">ONLINE</div>
          <p className="text-xs text-muted-foreground">MySQL @ 192.168.1.50</p>
        </CardContent>
      </Card>

      <Card className="bg-sidebar/50 border-sidebar-border backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Rules Engine</CardTitle>
          <ShieldAlert className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">ACTIVE</div>
          <p className="text-xs text-muted-foreground">Monitoring 12 rules</p>
        </CardContent>
      </Card>
    </div>
  );
}
