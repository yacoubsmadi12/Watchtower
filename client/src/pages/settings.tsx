import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Server, Shield, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-1">System Settings</h2>
        <p className="text-muted-foreground">Configure global system parameters and connection settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Connection Settings */}
          <Card className="bg-sidebar/30 border-sidebar-border">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Server className="h-5 w-5 text-primary" />
                <CardTitle>Connection Configuration</CardTitle>
              </div>
              <CardDescription>Manage connection details for Huawei NMS and MySQL Database.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="syslog-port">Syslog UDP Port</Label>
                  <Input id="syslog-port" defaultValue="1514" className="font-mono bg-background/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api-port">API Port</Label>
                  <Input id="api-port" defaultValue="5000" className="font-mono bg-background/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mysql-host">MySQL Host IP</Label>
                <Input id="mysql-host" defaultValue="192.168.1.50" className="font-mono bg-background/50" />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Badge variant="outline" className="border-green-500 text-green-500 bg-green-500/10">
                  Connected
                </Badge>
                <span className="text-xs text-muted-foreground">Last heartbeat: 2s ago</span>
              </div>
            </CardContent>
          </Card>

          {/* Security Policies */}
          <Card className="bg-sidebar/30 border-sidebar-border">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Security Policies</CardTitle>
              </div>
              <CardDescription>Adjust the sensitivity of the Rules Engine.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Block Suspicious IPs</Label>
                  <p className="text-xs text-muted-foreground">Automatically add firewall rules for critical alerts</p>
                </div>
                <Switch />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Strict Role Enforcement</Label>
                  <p className="text-xs text-muted-foreground">Flag any operation not explicitly allowed in permissions</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Retention Period</Label>
                  <p className="text-xs text-muted-foreground">Days to keep raw logs in database</p>
                </div>
                <div className="w-[100px]">
                   <Input type="number" defaultValue="30" className="h-8 font-mono text-right" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status Side Panel */}
        <div className="space-y-6">
           <Card className="bg-sidebar/30 border-sidebar-border">
             <CardHeader>
               <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">System Health</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               <div className="space-y-1">
                 <div className="flex justify-between text-xs">
                   <span>CPU Usage</span>
                   <span className="font-mono">12%</span>
                 </div>
                 <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500 w-[12%]"></div>
                 </div>
               </div>
               
               <div className="space-y-1">
                 <div className="flex justify-between text-xs">
                   <span>Memory</span>
                   <span className="font-mono">2.4GB / 8GB</span>
                 </div>
                 <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                   <div className="h-full bg-purple-500 w-[30%]"></div>
                 </div>
               </div>

               <div className="space-y-1">
                 <div className="flex justify-between text-xs">
                   <span>Disk Space</span>
                   <span className="font-mono">45%</span>
                 </div>
                 <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                   <div className="h-full bg-green-500 w-[45%]"></div>
                 </div>
               </div>

               <div className="pt-4">
                 <Button variant="outline" className="w-full text-xs h-8">
                   <RefreshCw className="mr-2 h-3 w-3" />
                   Restart Services
                 </Button>
               </div>
             </CardContent>
           </Card>

           <div className="flex justify-end">
             <Button className="w-full lg:w-auto">
               <Save className="mr-2 h-4 w-4" />
               Save Changes
             </Button>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
