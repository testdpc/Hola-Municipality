import { useLocation, useParams } from "wouter";
import { useGetGRN, useUpdateGRN } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Check, ClipboardCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export default function GRNDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: grn, isLoading, refetch } = useGetGRN(Number(id));
  const updateMutation = useUpdateGRN();
  const { toast } = useToast();
  
  const [inspectionStatus, setInspectionStatus] = useState<string>("accepted");
  const [inspectionNotes, setInspectionNotes] = useState("");
  const [isInspectOpen, setIsInspectOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    return status === 'posted' 
      ? <Badge className="bg-emerald-100 text-emerald-800 border-none">Posted</Badge>
      : <Badge variant="secondary">Draft</Badge>;
  };

  const getInspectionBadge = (status: string) => {
    switch(status) {
      case 'accepted': return <Badge className="bg-emerald-100 text-emerald-800 border-none">Accepted</Badge>;
      case 'rejected': return <Badge variant="destructive">Rejected</Badge>;
      case 'pending': return <Badge className="bg-amber-100 text-amber-800 border-none">Pending</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handlePost = () => {
    updateMutation.mutate({ id: Number(id), data: { status: 'posted' } }, {
      onSuccess: () => {
        toast({ title: "GRN Posted to Inventory" });
        refetch();
      }
    });
  };

  const handleInspect = () => {
    updateMutation.mutate({ 
      id: Number(id), 
      data: { inspectionStatus: inspectionStatus as any, notes: inspectionNotes ? `${grn?.notes ? grn.notes + '\n' : ''}Inspection: ${inspectionNotes}` : undefined } 
    }, {
      onSuccess: () => {
        toast({ title: "Inspection status updated" });
        setIsInspectOpen(false);
        refetch();
      }
    });
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!grn) return <div className="p-8 text-center">GRN not found.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/grn")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">GRN: {grn.grnNumber}</h1>
              {getStatusBadge(grn.status)}
              {getInspectionBadge(grn.inspectionStatus)}
            </div>
            <p className="text-muted-foreground mt-1">Received on {format(new Date(grn.dateReceived), "MMMM d, yyyy")}</p>
          </div>
        </div>
        
        {grn.status === 'draft' && (
          <div className="flex gap-2">
            <Dialog open={isInspectOpen} onOpenChange={setIsInspectOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2"><ClipboardCheck className="h-4 w-4" /> Inspect</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Update Inspection Status</DialogTitle></DialogHeader>
                <div className="py-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <Select value={inspectionStatus} onValueChange={setInspectionStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Inspection Notes</label>
                    <Input value={inspectionNotes} onChange={e => setInspectionNotes(e.target.value)} placeholder="Add remarks..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInspectOpen(false)}>Cancel</Button>
                  <Button onClick={handleInspect} disabled={updateMutation.isPending}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={handlePost} className="gap-2 bg-emerald-600 hover:bg-emerald-700" disabled={updateMutation.isPending || grn.inspectionStatus === 'rejected' || grn.inspectionStatus === 'pending'}>
              <Check className="h-4 w-4" /> Post to Inventory
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-border/50">
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Supplier</span>
              <span className="font-medium">{grn.supplierName}</span>
            </div>
            <div className="flex justify-between border-b pb-2 pt-2">
              <span className="text-muted-foreground">LPO Number</span>
              <span className="font-medium">{grn.lpoNumber || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b pb-2 pt-2">
              <span className="text-muted-foreground">Delivery Note</span>
              <span className="font-medium">{grn.deliveryNoteNumber || "N/A"}</span>
            </div>
            <div className="flex justify-between border-b pb-2 pt-2">
              <span className="text-muted-foreground">Receiving Officer</span>
              <span className="font-medium">{grn.receivingOfficerName || "System"}</span>
            </div>
          </CardContent>
        </Card>

        {grn.notes && (
          <Card className="shadow-sm border-border/50">
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 bg-muted/50 p-3 rounded-md whitespace-pre-wrap">{grn.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="shadow-sm border-border/50">
        <CardHeader><CardTitle>Received Items</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Item</TableHead>
                {grn.purchaseOrderId && <TableHead className="text-right">Ordered</TableHead>}
                <TableHead className="text-right">Received</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grn.items?.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  {grn.purchaseOrderId && <TableCell className="text-right">{item.quantityOrdered}</TableCell>}
                  <TableCell className="text-right font-medium">{item.quantityReceived}</TableCell>
                  <TableCell className="text-right">{item.unitPrice.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium">{(item.quantityReceived * item.unitPrice).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}