import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MONITORED_SYSTEMS } from "@/lib/mock-data";
import { FileText, Download, Calendar, BarChart3, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ReportsPage() {
  // Mock data for charts
  const weeklyStats = [
    { day: 'Mon', success: 450, fail: 23, risk: 5 },
    { day: 'Tue', success: 520, fail: 15, risk: 2 },
    { day: 'Wed', success: 480, fail: 30, risk: 8 },
    { day: 'Thu', success: 610, fail: 45, risk: 12 },
    { day: 'Fri', success: 550, fail: 20, risk: 4 },
    { day: 'Sat', success: 300, fail: 10, risk: 1 },
    { day: 'Sun', success: 280, fail: 5, risk: 0 },
  ];

  const systemHealth = MONITORED_SYSTEMS.map(sys => ({
    name: sys.name,
    score: sys.status === 'online' ? 98 : 85,
    status: sys.status
  }));

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Weekly Analysis Reports</h2>
          <p className="text-muted-foreground">Automated system performance and security analysis per system.</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="current">
            <SelectTrigger className="w-[180px] bg-background/50">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">This Week (Nov 20-27)</SelectItem>
              <SelectItem value="last">Last Week (Nov 13-20)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" className="space-y-6">
        <TabsList className="bg-sidebar/50 border border-sidebar-border">
          <TabsTrigger value="summary">Executive Summary</TabsTrigger>
          <TabsTrigger value="systems">System Breakdown</TabsTrigger>
        </TabsList>

        {/* EXECUTIVE SUMMARY TAB */}
        <TabsContent value="summary" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-sidebar/30 border-sidebar-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Operations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">3,428</div>
                <p className="text-xs text-green-500 flex items-center mt-1">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> 96.5% Success Rate
                </p>
              </CardContent>
            </Card>
            <Card className="bg-sidebar/30 border-sidebar-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Security Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-orange-500">32</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Most frequent: Unauthorized Access
                </p>
              </CardContent>
            </Card>
            <Card className="bg-sidebar/30 border-sidebar-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">System Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono text-blue-500">99.9%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All critical systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-sidebar/30 border-sidebar-border">
            <CardHeader>
              <CardTitle>Weekly Operation Volume</CardTitle>
              <CardDescription>Operations processed across all Huawei systems</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyStats}>
                  <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--sidebar))', borderColor: 'hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="success" name="Successful" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="fail" name="Failed" stackId="a" fill="hsl(var(--destructive))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="risk" name="High Risk" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SYSTEM BREAKDOWN TAB */}
        <TabsContent value="systems" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {MONITORED_SYSTEMS.map((sys) => (
              <Card key={sys.id} className="bg-sidebar/30 border-sidebar-border hover:border-primary/30 transition-colors">
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg font-mono text-primary">{sys.name}</CardTitle>
                    <CardDescription>{sys.ip} • {sys.type}</CardDescription>
                  </div>
                  {sys.status === 'online' ? (
                    <div className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-bold uppercase flex items-center">
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Online
                    </div>
                  ) : (
                    <div className="px-2 py-1 rounded bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase flex items-center">
                      <AlertTriangle className="h-3 w-3 mr-1" /> Warning
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                   <div className="space-y-4 mt-2">
                     <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                         <span className="text-muted-foreground">Compliance Score</span>
                         <span className="font-mono font-bold">{sys.status === 'online' ? '98%' : '85%'}</span>
                       </div>
                       <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                         <div 
                           className={`h-full ${sys.status === 'online' ? 'bg-green-500' : 'bg-orange-500'}`} 
                           style={{ width: sys.status === 'online' ? '98%' : '85%' }}
                         ></div>
                       </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4 pt-2">
                       <div className="p-3 rounded bg-background/50 border border-border">
                         <div className="text-xs text-muted-foreground mb-1">Top Operation</div>
                         <div className="font-mono text-sm truncate">Configuration_Update</div>
                       </div>
                       <div className="p-3 rounded bg-background/50 border border-border">
                         <div className="text-xs text-muted-foreground mb-1">Last Incident</div>
                         <div className="font-mono text-sm text-red-400 truncate">
                           {sys.status === 'online' ? 'None' : 'Auth_Failure'}
                         </div>
                       </div>
                     </div>
                     
                     <div className="pt-2 flex justify-end">
                       <Button variant="ghost" size="sm" className="text-xs">
                         <FileText className="h-3 w-3 mr-2" />
                         View Full Report
                       </Button>
                     </div>
                   </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
