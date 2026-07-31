import { useListGRNs } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";
import { format } from "date-fns";

export default function GRNs() {
  const { data: grns, isLoading } = useListGRNs();
  const [, setLocation] = useLocation();

  const getStatusBadge = (status: string) => {
    return status === 'posted' 
      ? <Badge className="bg-emerald-100 text-emerald-800 border-none">Posted</Badge>
      : <Badge variant="secondary">Draft</Badge>;
  };

  const getInspectionBadge = (status: string) => {
    switch(status) {
      case 'passed': return <Badge className="bg-emerald-100 text-emerald-800 border-none">Passed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'partial': return <Badge className="bg-amber-100 text-amber-800 border-none">Partial</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Goods Received Notes</h1>
          <p className="text-muted-foreground mt-1">Manage items received into the inventory.</p>
        </div>
        <Button onClick={() => setLocation("/grn/new")} className="gap-2">
          <Plus className="h-4 w-4" /> Create GRN
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>GRN Number</TableHead>
                <TableHead>Date Received</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>LPO Number</TableHead>
                <TableHead>Inspection</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : grns?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No GRNs found.</TableCell></TableRow>
              ) : (
                grns?.map(grn => (
                  <TableRow key={grn.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setLocation(`/grn/${grn.id}`)}>
                    <TableCell className="font-mono font-medium">{grn.grnNumber}</TableCell>
                    <TableCell>{format(new Date(grn.dateReceived), "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-medium text-gray-900">{grn.supplierName}</TableCell>
                    <TableCell>{grn.lpoNumber || "-"}</TableCell>
                    <TableCell>{getInspectionBadge(grn.inspectionStatus)}</TableCell>
                    <TableCell>{getStatusBadge(grn.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setLocation(`/grn/${grn.id}`); }}>
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