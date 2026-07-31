import { useListPurchaseOrders } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye } from "lucide-react";
import { format } from "date-fns";

export default function PurchaseOrders() {
  const { data: pos, isLoading } = useListPurchaseOrders();
  const [, setLocation] = useLocation();

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <Badge className="bg-emerald-100 text-emerald-800 border-none">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'received': return <Badge className="bg-blue-100 text-blue-800 border-none">Received</Badge>;
      case 'pending_approval': return <Badge className="bg-amber-100 text-amber-800 border-none">Pending Approval</Badge>;
      default: return <Badge variant="secondary" className="capitalize">{status.replace('_', ' ')}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Purchase Orders</h1>
          <p className="text-muted-foreground mt-1">Manage Local Purchase Orders (LPOs).</p>
        </div>
        <Button onClick={() => setLocation("/purchase-orders/new")} className="gap-2">
          <Plus className="h-4 w-4" /> Create LPO
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>LPO Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Total Amount (KES)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : pos?.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground">No purchase orders found.</TableCell></TableRow>
              ) : (
                pos?.map(po => (
                  <TableRow key={po.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => setLocation(`/purchase-orders/${po.id}`)}>
                    <TableCell className="font-mono font-medium">{po.lpoNumber}</TableCell>
                    <TableCell>{format(new Date(po.createdAt), "MMM d, yyyy")}</TableCell>
                    <TableCell className="font-medium text-gray-900">{po.supplierName}</TableCell>
                    <TableCell>{po.department}</TableCell>
                    <TableCell className="text-right font-medium">{po.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setLocation(`/purchase-orders/${po.id}`); }}>
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