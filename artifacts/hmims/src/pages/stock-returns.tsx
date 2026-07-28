import { useState } from "react";
import { useListStockReturns, useCreateStockReturn, useListInventoryItems, useGetMe } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, RefreshCcw } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { getListStockReturnsQueryKey } from "@workspace/api-client-react";

export default function StockReturns() {
  const { data: returns, isLoading } = useListStockReturns();
  const { data: items } = useListInventoryItems();
  const { data: me } = useGetMe();
  const createReturn = useCreateStockReturn();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    inventoryItemId: "",
    quantity: "",
    condition: "good",
    reason: "",
    returnDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const conditionBadge = (c: string) => {
    if (c === "good") return <Badge className="bg-emerald-100 text-emerald-800 border-none">Good</Badge>;
    if (c === "damaged") return <Badge className="bg-red-100 text-red-800 border-none">Damaged</Badge>;
    return <Badge className="bg-amber-100 text-amber-800 border-none">Expired</Badge>;
  };

  const handleSubmit = () => {
    if (!form.inventoryItemId || !form.quantity || !form.reason) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    createReturn.mutate(
      {
        data: {
          inventoryItemId: parseInt(form.inventoryItemId),
          quantity: parseInt(form.quantity),
          condition: form.condition as "good" | "damaged" | "expired",
          reason: form.reason,
          storekeeperI: me?.id || 1,
          returnDate: form.returnDate,
          notes: form.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Stock Return Recorded", description: "Return has been logged and stock updated." });
          queryClient.invalidateQueries({ queryKey: getListStockReturnsQueryKey() });
          setOpen(false);
          setForm({ inventoryItemId: "", quantity: "", condition: "good", reason: "", returnDate: new Date().toISOString().split("T")[0], notes: "" });
        },
        onError: () => toast({ title: "Error", description: "Failed to record return.", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Returns</h1>
          <p className="text-muted-foreground mt-1">Track items returned to the store.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Record Return
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Return No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : !returns?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                    <RefreshCcw className="mx-auto h-8 w-8 mb-2 opacity-20" />
                    No stock returns recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                returns.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono font-medium">{r.returnNumber}</TableCell>
                    <TableCell>{format(new Date(r.returnDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>{r.itemName || `Item #${r.inventoryItemId}`}</TableCell>
                    <TableCell>{r.quantity}</TableCell>
                    <TableCell>{conditionBadge(r.condition)}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{r.reason}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Stock Return</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Item *</Label>
              <Select value={form.inventoryItemId} onValueChange={(v) => setForm((f) => ({ ...f, inventoryItemId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select item..." /></SelectTrigger>
                <SelectContent>
                  {items?.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>{item.itemName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input type="number" min="1" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Return Date *</Label>
                <Input type="date" value={form.returnDate} onChange={(e) => setForm((f) => ({ ...f, returnDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Condition *</Label>
              <Select value={form.condition} onValueChange={(v) => setForm((f) => ({ ...f, condition: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea placeholder="Reason for return..." value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createReturn.isPending}>
              {createReturn.isPending ? "Saving..." : "Record Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
