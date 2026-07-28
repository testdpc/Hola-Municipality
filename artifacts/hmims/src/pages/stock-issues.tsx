import { useListStockIssues } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";
import { format } from "date-fns";

export default function StockIssues() {
  const { data: issues, isLoading } = useListStockIssues();
  const [, setLocation] = useLocation();

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <Badge className="bg-emerald-100 text-emerald-800 border-none">Approved</Badge>;
      case 'issued': return <Badge className="bg-blue-100 text-blue-800 border-none">Issued</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-800 border-none">Pending</Badge>;
      default: return <Badge variant="secondary" className="capitalize">{status.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Stock Issues</h1>
          <p className="text-muted-foreground mt-1">Manage departmental stock requisitions.</p>
        </div>
        <Button onClick={() => setLocation("/stock-issues/new")} className="gap-2">
          <Plus className="h-4 w-4" /> New Request
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Request No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Requested By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : issues?.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No stock issues found.</TableCell></TableRow>
              ) : (
                issues?.map(issue => (
                  <TableRow key={issue.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setLocation(`/stock-issues/${issue.id}`)}>
                    <TableCell className="font-mono font-medium">{issue.requestNumber}</TableCell>
                    <TableCell>{format(new Date(issue.issueDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>{issue.department}</TableCell>
                    <TableCell>{issue.requestedByName}</TableCell>
                    <TableCell>{getStatusBadge(issue.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setLocation(`/stock-issues/${issue.id}`); }}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}