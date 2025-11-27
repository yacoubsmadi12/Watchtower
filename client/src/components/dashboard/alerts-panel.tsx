import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/lib/mock-data";
import { AlertTriangle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  return (
    <Card className="border-sidebar-border bg-sidebar/30 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-md font-mono flex items-center text-red-500">
          <AlertTriangle className="h-4 w-4 mr-2" />
          RECENT ALERTS
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-[400px] px-6 pb-4">
          <div className="space-y-4">
            {alerts.length === 0 ? (
              <div className="text-center text-muted-foreground py-10 text-sm">
                No active alerts. System secure.
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="p-4 rounded-lg border border-red-900/50 bg-red-950/10 relative overflow-hidden group hover:border-red-500/50 transition-colors">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-600"></div>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-bold text-red-400 font-mono">{alert.rule}</h4>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mb-2">{alert.details}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
                      {alert.severity}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
