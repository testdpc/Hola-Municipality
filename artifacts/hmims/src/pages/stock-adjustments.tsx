import { useState } from "react";
import { useListStockAdjustments, useCreateStockAdjustment, useListInventoryItems, useGetInventoryItem, useGetMe } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { getListStockAdjustmentsQueryKey } from "@workspace/api-client-react";

const ADJUSTMENT_TYPES = [
  { value: "lost", label: "Lost" },
  { value: "damaged", label: "Damaged" },
  { value: "expired", label: "Expired" },
  { value: "count_correction", label: "Count Correction" },
  { value: "other", label: "Other" },
];

export default function StockAdjustments() {
  const { data: adjustments, isLoading } = useListStockAdjustments();
  const { data: items } = useListInventoryItems();
  const { data: me } = useGetMe();
  const createAdjustment = useCreateStockAdjustment();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [form, setForm] = useState({
    adjustmentType: "",
    quantityAfter: "",
    reason: "",
    adjustmentDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const selectedItem = items?.find((i) => String(i.id) === selectedItemId);

  const typeBadge = (t: string) => {
    const colors: Record<string, string> = {
      lost: "bg-red-100 text-red-800",
      damaged: "bg-orange-100 text-orange-800",
      expired: "bg-amber-100 text-amber-800",
      count_correction: "bg-blue-100 text-blue-800",
      other: "bg-gray-100 text-gray-800",
    };
    return <Badge className={`${colors[t] || "bg-gray-100"} border-none`}>{t.replace("_", " ")}</Badge>;
  };

  const handleSubmit = () => {
    if (!selectedItemId || !form.adjustmentType || !form.quantityAfter || !form.reason) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    createAdjustment.mutate(
      {
        data: {
          inventoryItemId: parseInt(selectedItemId),
          adjustmentType: form.adjustmentType as "lost" | "damaged" | "expired" | "count_correction" | "other",
          quantityAfter: parseInt(form.quantityAfter),
          reason: form.reason,
          adjustedById: me?.id || 1,
          adjustmentDate: form.adjustmentDate,
          notes: form.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Adjustment Recorded", description: "Stock level has been adjusted successfully." });
          queryClient.invalidateQueries({ queryKey: getListStockAdjustmentsQueryKey() });
          setOpen(false);
          setSelectedItemId("");
          setForm({ adjustmentType: "", quantityAfter: "", reason: "", adjustmentDate: new Date().toISOString().split("T")[0], notes: "" });
        },
        onError: () => toast({ title: "Error", description: "Failed to record adjustment.", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Adjustments</h1>
          <p className="text-muted-foreground mt-1">Record lost, damaged, expired, or corrected stock levels.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Adjustment
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Adj. Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Before</TableHead>
                <TableHead>After</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Adjusted By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : !adjustments?.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                    <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-20" />
                    No stock adjustments recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                adjustments.map((a) => {
                  const change = a.quantityAfter - a.quantityBefore;
                  return (
                    <TableRow key={a.id} className="hover:bg-muted/30">
                      <TableCell className="font-mono font-medium">{a.adjustmentNumber}</TableCell>
                      <TableCell>{format(new Date(a.adjustmentDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>{a.itemName || `Item #${a.inventoryItemId}`}</TableCell>
                      <TableCell>{typeBadge(a.adjustmentType)}</TableCell>
                      <TableCell>{a.quantityBefore}</TableCell>
                      <TableCell>{a.quantityAfter}</TableCell>
                      <TableCell>
                        <span className={`flex items-center gap-1 font-medium ${change >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {change >= 0 ? "+" : ""}{change}
                        </span>
                      </TableCell>
                      <TableCell>{a.adjustedByName || `User #${a.adjustedById}`}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Stock Adjustment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Item *</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger><SelectValue placeholder="Select item..." /></SelectTrigger>
                <SelectContent>
                  {items?.map((item) => (
                    <SelectItem key={item.id} value={String(item.id)}>
                      {item.itemName} (Current: {item.currentQuantity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedItem && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                <span className="text-muted-foreground">Current stock: </span>
                <span className="font-semibold">{selectedItem.currentQuantity} {selectedItem.unitOfMeasure}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label>Adjustment Type *</Label>
              <Select value={form.adjustmentType} onValueChange={(v) => setForm((f) => ({ ...f, adjustmentType: v }))}>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {ADJUSTMENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>New Quantity *</Label>
                <Input type="number" min="0" value={form.quantityAfter} onChange={(e) => setForm((f) => ({ ...f, quantityAfter: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Adjustment Date *</Label>
                <Input type="date" value={form.adjustmentDate} onChange={(e) => setForm((f) => ({ ...f, adjustmentDate: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea placeholder="Reason for adjustment..." value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createAdjustment.isPending}>
              {createAdjustment.isPending ? "Saving..." : "Save Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
