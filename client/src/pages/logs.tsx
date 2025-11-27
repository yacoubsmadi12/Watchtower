import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter } from "lucide-react";
import { useWatchtower } from "@/hooks/use-watchtower";

export default function LogsPage() {
  const { events } = useWatchtower();

  return (
    <DashboardLayout>
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-1">Log Explorer</h2>
        <p className="text-muted-foreground">Search and filter through raw operation logs.</p>
      </div>

      <Card className="mt-6 bg-sidebar/30 border-sidebar-border">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="relative w-full md:w-[300px]">
               <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input placeholder="Search raw logs..." className="pl-8 bg-background/50" />
             </div>
             <div className="flex items-center gap-2">
               <Select defaultValue="all">
                 <SelectTrigger className="w-[140px] bg-background/50">
                   <SelectValue placeholder="Severity" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Levels</SelectItem>
                   <SelectItem value="critical">Critical</SelectItem>
                   <SelectItem value="high">High</SelectItem>
                   <SelectItem value="info">Info</SelectItem>
                 </SelectContent>
               </Select>
               <Select defaultValue="all">
                 <SelectTrigger className="w-[140px] bg-background/50">
                   <SelectValue placeholder="Source" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="all">All Sources</SelectItem>
                   <SelectItem value="huawei">Huawei NMS</SelectItem>
                 </SelectContent>
               </Select>
             </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="w-[500px]">Raw Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-xs">
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    No logs found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id} className="hover:bg-sidebar-accent/50">
                    <TableCell className="text-muted-foreground">
                      {new Date(event.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{event.source}</TableCell>
                    <TableCell>
                       <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground text-[10px] font-bold">
                         {event.parsed.format || 'UNKNOWN'}
                       </span>
                    </TableCell>
                    <TableCell className="truncate max-w-[500px]" title={event.raw}>
                      {event.raw}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
