import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Save, Server, Shield, RefreshCw, Plus, Trash2, Edit } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { LogSource } from "@shared/schema";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SettingsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<LogSource | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    ipAddress: "",
    status: "active",
    description: "",
  });

  const { data: sources = [], isLoading } = useQuery<LogSource[]>({
    queryKey: ["/api/sources"],
  });

  const createSourceMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("/api/sources", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      setIsDialogOpen(false);
      setFormData({ name: "", ipAddress: "", status: "active", description: "" });
      toast({
        title: "Source Added",
        description: "Log source has been successfully added",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add log source",
        variant: "destructive",
      });
    },
  });

  const updateSourceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      return apiRequest(`/api/sources/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      setIsDialogOpen(false);
      setEditingSource(null);
      setFormData({ name: "", ipAddress: "", status: "active", description: "" });
      toast({
        title: "Source Updated",
        description: "Log source has been successfully updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update log source",
        variant: "destructive",
      });
    },
  });

  const deleteSourceMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/sources/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sources"] });
      toast({
        title: "Source Deleted",
        description: "Log source has been successfully deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete log source",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (editingSource) {
      updateSourceMutation.mutate({ id: editingSource.id, data: formData });
    } else {
      createSourceMutation.mutate(formData);
    }
  };

  const handleEdit = (source: LogSource) => {
    setEditingSource(source);
    setFormData({
      name: source.name,
      ipAddress: source.ipAddress,
      status: source.status,
      description: source.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingSource(null);
    setFormData({ name: "", ipAddress: "", status: "active", description: "" });
    setIsDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-1">System Settings</h2>
        <p className="text-muted-foreground">Configure global system parameters and connection settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Log Sources Management */}
          <Card className="bg-sidebar/30 border-sidebar-border">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <Server className="h-5 w-5 text-primary" />
                    <CardTitle>Log Sources</CardTitle>
                  </div>
                  <CardDescription>Manage systems that send logs to Watchtower</CardDescription>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={handleAddNew} data-testid="button-add-source">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Source
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingSource ? "Edit Log Source" : "Add New Log Source"}</DialogTitle>
                      <DialogDescription>
                        Configure a new system to monitor for log entries
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Source Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="NCE FAN HQ"
                          data-testid="input-source-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ip">IP Address</Label>
                        <Input
                          id="ip"
                          value={formData.ipAddress}
                          onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                          placeholder="10.119.19.95"
                          className="font-mono"
                          data-testid="input-source-ip"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={formData.status}
                          onValueChange={(value) => setFormData({ ...formData, status: value })}
                        >
                          <SelectTrigger id="status" data-testid="select-source-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Optional description"
                          data-testid="input-source-description"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={handleSubmit}
                        disabled={createSourceMutation.isPending || updateSourceMutation.isPending}
                        data-testid="button-submit-source"
                      >
                        {editingSource ? "Update" : "Add"} Source
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {isLoading ? (
                  <div className="text-sm text-muted-foreground">Loading sources...</div>
                ) : sources.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No log sources configured. Click "Add Source" to get started.
                  </div>
                ) : (
                  sources.map((source) => (
                    <div
                      key={source.id}
                      className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-md bg-background/50 border border-border"
                      data-testid={`source-item-${source.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-medium text-sm">{source.name}</div>
                          <Badge
                            variant={source.status === "active" ? "outline" : "secondary"}
                            className={source.status === "active" ? "border-green-500 text-green-500 bg-green-500/10" : ""}
                          >
                            {source.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground font-mono mt-1">
                          {source.ipAddress}
                          {source.description && ` • ${source.description}`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(source)}
                          data-testid={`button-edit-source-${source.id}`}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteSourceMutation.mutate(source.id)}
                          disabled={deleteSourceMutation.isPending}
                          data-testid={`button-delete-source-${source.id}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

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
