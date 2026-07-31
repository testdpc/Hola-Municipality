import { useLocation, useParams } from "wouter";
import { useGetPurchaseOrder, useApprovePurchaseOrder, useRejectPurchaseOrder } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function PurchaseOrderDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: po, isLoading, refetch } = useGetPurchaseOrder(Number(id));
  const approveMutation = useApprovePurchaseOrder();
  const rejectMutation = useRejectPurchaseOrder();
  const { toast } = useToast();
  
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'approved': return <Badge className="bg-emerald-100 text-emerald-800 border-none">Approved</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'received': return <Badge className="bg-blue-100 text-blue-800 border-none">Received</Badge>;
      case 'pending_approval': return <Badge className="bg-amber-100 text-amber-800 border-none">Pending Approval</Badge>;
      default: return <Badge variant="secondary" className="capitalize">{status.replace('_', ' ')}</Badge>;
    }
  };

  const handleApprove = () => {
    approveMutation.mutate({ id: Number(id) }, {
      onSuccess: () => {
        toast({ title: "Purchase Order Approved" });
        refetch();
      }
    });
  };

  const handleReject = () => {
    if (!rejectReason) {
      toast({ title: "Reason required", variant: "destructive" });
      return;
    }
    rejectMutation.mutate({ id: Number(id), data: { reason: rejectReason } }, {
      onSuccess: () => {
        toast({ title: "Purchase Order Rejected" });
        setIsRejectOpen(false);
        refetch();
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!po) return <div className="p-8 text-center">Purchase order not found.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/purchase-orders")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">LPO: {po.lpoNumber}</h1>
              {getStatusBadge(po.status)}
            </div>
            <p className="text-muted-foreground mt-1">Created on {format(new Date(po.createdAt), "MMMM d, yyyy")}</p>
          </div>
        </div>
        
        {po.status === 'draft' && (
          <div className="flex gap-2">
            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2"><X className="h-4 w-4" /> Reject</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Reject Purchase Order</DialogTitle></DialogHeader>
                <div className="py-4">
                  <label className="text-sm font-medium mb-2 block">Reason for rejection</label>
                  <Input value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Please explain why this LPO is rejected" />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleReject} disabled={rejectMutation.isPending}>Confirm Rejection</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={handleApprove} className="gap-2" disabled={approveMutation.isPending}>
              <Check className="h-4 w-4" /> Approve LPO
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border/50">
          <CardHeader><CardTitle>Supplier Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{po.supplierName}</span>
            </div>
            <div className="flex justify-between border-b pb-2 pt-2">
              <span className="text-muted-foreground">Requesting Dept</span>
              <span className="font-medium">{po.department}</span>
            </div>
            <div className="flex justify-between border-b pb-2 pt-2">
              <span className="text-muted-foreground">Requested By</span>
              <span className="font-medium">{po.requestedByName || "System"}</span>
            </div>
          </CardContent>
        </Card>

        {po.notes && (
          <Card className="shadow-sm border-border/50">
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 bg-muted/50 p-3 rounded-md">{po.notes}</p>
            </CardContent>
          </Card>
        )}
        
        {po.rejectionReason && (
          <Card className="shadow-sm border-destructive/50 bg-destructive/5 col-span-1 md:col-span-2">
            <CardHeader><CardTitle className="text-destructive">Rejection Reason</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-destructive">{po.rejectionReason}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {po.items?.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{item.unitPrice.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">{item.totalPrice.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/30">
                <TableCell colSpan={3} className="text-right font-bold">Grand Total (KES)</TableCell>
                <TableCell className="text-right font-bold text-lg">{po.totalAmount.toLocaleString()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}