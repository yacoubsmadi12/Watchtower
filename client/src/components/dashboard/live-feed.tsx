import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Event } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";

export function LiveFeed({ events }: { events: Event[] }) {
  return (
    <Card className="border-sidebar-border bg-sidebar/30">
      <CardHeader>
        <CardTitle className="text-md font-mono flex items-center">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse mr-2"></span>
          LIVE OPERATION LOGS
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-auto pr-2">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-sidebar-border">
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[120px]">Source</TableHead>
                <TableHead className="w-[100px]">Severity</TableHead>
                <TableHead>Raw Content</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="font-mono text-xs">
              {events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                    Waiting for incoming logs...
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id} className="border-sidebar-border hover:bg-sidebar-accent/50 transition-colors">
                    <TableCell className="text-muted-foreground">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{event.source}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        event.severity === 'critical' ? 'border-red-500 text-red-500 bg-red-500/10' :
                        event.severity === 'high' ? 'border-orange-500 text-orange-500 bg-orange-500/10' :
                        'border-border text-muted-foreground'
                      }>
                        {event.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[400px] truncate" title={event.raw}>
                      {event.raw}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
