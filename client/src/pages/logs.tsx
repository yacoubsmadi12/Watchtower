import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, FileDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { LogEntry, LogSource } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function LogsPage() {
  const { toast } = useToast();
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: sources = [] } = useQuery<LogSource[]>({
    queryKey: ["/api/sources"],
  });

  const { data: logs = [], isLoading } = useQuery<LogEntry[]>({
    queryKey: selectedSource === "all" ? ["/api/logs"] : ["/api/logs?sourceId=" + selectedSource],
  });

  const handleDownloadReport = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedSource !== "all") {
        params.append("sourceId", selectedSource);
      }
      
      const response = await fetch(`/api/reports?${params.toString()}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `log-report-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Downloaded",
        description: "Your log report has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download report",
        variant: "destructive",
      });
    }
  };

  const getSourceInfo = (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    return source || { name: "Unknown", ipAddress: "Unknown", status: "unknown" };
  };

  const getSeverityBadge = (severity: string) => {
    const config: Record<string, string> = {
      critical: "bg-red-500/10 text-red-500 border-red-500",
      error: "bg-red-500/10 text-red-500 border-red-500",
      warning: "bg-yellow-500/10 text-yellow-500 border-yellow-500",
      info: "bg-blue-500/10 text-blue-500 border-blue-500",
    };
    
    return (
      <Badge variant="outline" className={config[severity] || config.info}>
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const getAnalysisStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      pending: "bg-gray-500/10 text-gray-500 border-gray-500",
      "in-progress": "bg-blue-500/10 text-blue-500 border-blue-500",
      completed: "bg-green-500/10 text-green-500 border-green-500",
    };
    
    return (
      <Badge variant="outline" className={config[status] || config.pending}>
        {status.toUpperCase().replace("-", " ")}
      </Badge>
    );
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const sourceInfo = getSourceInfo(log.sourceId);
    return (
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sourceInfo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sourceInfo.ipAddress.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <DashboardLayout>
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-1">Log Explorer</h2>
        <p className="text-muted-foreground">Search and filter through operation logs with source and analysis tracking.</p>
      </div>

      <Card className="mt-6 bg-sidebar/30 border-sidebar-border">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="relative w-full md:w-[300px]">
               <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Search logs..." 
                 className="pl-8 bg-background/50"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 data-testid="input-search-logs"
               />
             </div>
             <div className="flex flex-wrap items-center gap-2">
               <Select value={selectedSource} onValueChange={setSelectedSource}>
                 <SelectTrigger className="w-[180px] bg-background/50" data-testid="select-source-filter">
                   <SelectValue placeholder="All Sources" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Sources</SelectItem>
                   {sources.map((source) => (
                     <SelectItem key={source.id} value={source.id}>
                       {source.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
               <Button variant="outline" size="sm" onClick={handleDownloadReport} data-testid="button-download-report">
                 <FileDown className="h-4 w-4 mr-2" />
                 Download Report
               </Button>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">Timestamp</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="w-[100px]">Severity</TableHead>
                <TableHead className="w-[120px]">Analysis Status</TableHead>
                <TableHead className="w-[100px]">Access Status</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                    No logs found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const sourceInfo = getSourceInfo(log.sourceId);
                  return (
                    <TableRow key={log.id} className="hover:bg-sidebar-accent/50" data-testid={`log-row-${log.id}`}>
                      <TableCell className="text-muted-foreground font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{sourceInfo.name}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{sourceInfo.ipAddress}</TableCell>
                      <TableCell>{getSeverityBadge(log.severity)}</TableCell>
                      <TableCell>{getAnalysisStatusBadge(log.analysisStatus)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={sourceInfo.status === "active" 
                            ? "border-green-500 text-green-500 bg-green-500/10" 
                            : "border-gray-500 text-gray-500 bg-gray-500/10"}
                        >
                          {sourceInfo.status.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[400px] truncate" title={log.message}>
                        {log.message}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
