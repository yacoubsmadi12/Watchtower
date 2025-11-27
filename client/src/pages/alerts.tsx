import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/lib/mock-data";

export default function AlertsPage() {
  // In a real app, we would fetch this. Here we will just show static data or reuse context if we moved it up.
  // For now, let's generate some static mock alerts for this view
  const alerts: Alert[] = [
    {
        id: '1',
        eventId: 'evt-1',
        rule: 'FORBIDDEN_OPERATION',
        severity: 'critical',
        createdAt: new Date().toISOString(),
        details: 'User admin attempted forbidden operation: DELETE_LOGS'
    },
    {
        id: '2',
        eventId: 'evt-2',
        rule: 'SENSITIVE_OPERATION',
        severity: 'high',
        createdAt: new Date(Date.now() - 100000).toISOString(),
        details: 'Sensitive operation detected: ROOT_LOGIN'
    }
  ];

  return (
    <DashboardLayout>
       <div>
         <h2 className="text-3xl font-bold tracking-tight mb-1">Security Alerts</h2>
         <p className="text-muted-foreground">Detailed view of security incidents and rule violations.</p>
       </div>

       <Card className="mt-6 bg-sidebar/30 border-sidebar-border">
         <CardHeader>
           <CardTitle>Active Incidents</CardTitle>
         </CardHeader>
         <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="font-mono text-sm">
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>{new Date(alert.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="font-bold">{alert.rule}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{alert.severity}</Badge>
                    </TableCell>
                    <TableCell>{alert.details}</TableCell>
                    <TableCell>
                      <span className="text-blue-400 underline cursor-pointer">Investigate</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
         </CardContent>
       </Card>
    </DashboardLayout>
  );
}
