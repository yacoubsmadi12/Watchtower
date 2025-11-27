import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PERMISSIONS, ROLES } from "@/lib/mock-data";
import { ShieldCheck, Users, Lock } from "lucide-react";

export default function RulesPage() {
  return (
    <DashboardLayout>
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-1">Rules & Permissions</h2>
        <p className="text-muted-foreground">Manage role-based access control and detection rules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Card className="lg:col-span-2 bg-sidebar/30 border-sidebar-border">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-primary" />
              <CardTitle>Active Permission Rules</CardTitle>
            </div>
            <CardDescription>Defined operations and their allowed status per role.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Operation</TableHead>
                   <TableHead>Role</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Severity If Violated</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {PERMISSIONS.map((perm) => {
                    const roleName = ROLES.find(r => r.id === perm.roleId)?.name || 'Unknown';
                    return (
                      <TableRow key={perm.id} className="hover:bg-sidebar-accent/50">
                        <TableCell className="font-mono font-bold text-sm">{perm.operation}</TableCell>
                        <TableCell>{roleName}</TableCell>
                        <TableCell>
                          {perm.allowed ? (
                            <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10">ALLOWED</Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-500 text-red-500 bg-red-500/10">FORBIDDEN</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                           <span className={`text-xs uppercase font-bold ${
                             perm.severity === 'critical' ? 'text-red-500' :
                             perm.severity === 'high' ? 'text-orange-500' :
                             'text-muted-foreground'
                           }`}>
                             {perm.severity}
                           </span>
                        </TableCell>
                      </TableRow>
                    );
                 })}
               </TableBody>
             </Table>
          </CardContent>
        </Card>

        <div className="space-y-6">
           <Card className="bg-sidebar/30 border-sidebar-border">
             <CardHeader>
               <div className="flex items-center space-x-2">
                 <Users className="h-5 w-5 text-primary" />
                 <CardTitle>Roles</CardTitle>
               </div>
             </CardHeader>
             <CardContent>
                <div className="space-y-4">
                  {ROLES.map(role => (
                    <div key={role.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50 border border-border">
                      <span className="font-medium">{role.name}</span>
                      <Badge variant="secondary" className="text-xs">ID: {role.id}</Badge>
                    </div>
                  ))}
                </div>
             </CardContent>
           </Card>

           <Card className="bg-sidebar/30 border-sidebar-border">
             <CardHeader>
               <div className="flex items-center space-x-2">
                 <ShieldCheck className="h-5 w-5 text-primary" />
                 <CardTitle>Detection Status</CardTitle>
               </div>
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Rule Set Version</span>
                  <span className="font-mono">2025.11.27</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Active Correlations</span>
                  <span className="font-mono text-green-500">Enabled</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Anomaly Detection</span>
                  <span className="font-mono text-green-500">Learning</span>
                </div>
             </CardContent>
           </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
