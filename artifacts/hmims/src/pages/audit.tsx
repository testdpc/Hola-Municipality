import { useState } from "react";
import { useListAuditLogs } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, Search } from "lucide-react";
import { format } from "date-fns";

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-100 text-emerald-800",
  UPDATE: "bg-blue-100 text-blue-800",
  DELETE: "bg-red-100 text-red-800",
  LOGIN: "bg-purple-100 text-purple-800",
  LOGOUT: "bg-gray-100 text-gray-700",
  APPROVE: "bg-teal-100 text-teal-800",
  REJECT: "bg-orange-100 text-orange-800",
};

export default function AuditTrail() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const { data: logs, isLoading } = useListAuditLogs({
    from: from || undefined,
    to: to || undefined,
  });

  const filtered = logs?.filter((l) =>
    actionFilter === "all" ? true : l.action.toUpperCase().includes(actionFilter.toUpperCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
        <p className="text-muted-foreground mt-1">Complete record of all system actions and changes.</p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">From:</span>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">To:</span>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-44">
            <Search className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="approve">Approve</SelectItem>
            <SelectItem value="reject">Reject</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered?.length ?? 0} records
        </span>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Record ID</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : !filtered?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                    <ShieldCheck className="mx-auto h-8 w-8 mb-2 opacity-20" />
                    No audit records found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((log) => {
                  const actionKey = log.action.toUpperCase();
                  const colorClass = Object.entries(ACTION_COLORS).find(([k]) => actionKey.includes(k))?.[1] || "bg-gray-100 text-gray-700";
                  return (
                    <TableRow key={log.id} className="hover:bg-muted/30 text-sm">
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                      </TableCell>
                      <TableCell className="font-medium">{log.userName}</TableCell>
                      <TableCell>
                        <Badge className={`${colorClass} border-none text-xs`}>{log.action}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{log.tableName}</TableCell>
                      <TableCell className="text-muted-foreground">{log.recordId ?? "—"}</TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{log.ipAddress || "—"}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
