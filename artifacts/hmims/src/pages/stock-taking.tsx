import { useState } from "react";
import { useListStockTakings, useCreateStockTaking, useGetMe } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { getListStockTakingsQueryKey } from "@workspace/api-client-react";

export default function StockTaking() {
  const { data: sessions, isLoading } = useListStockTakings();
  const { data: me } = useGetMe();
  const createSession = useCreateStockTaking();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    startDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const statusBadge = (s: string) => {
    if (s === "completed") return <Badge className="bg-emerald-100 text-emerald-800 border-none">Completed</Badge>;
    if (s === "cancelled") return <Badge className="bg-red-100 text-red-800 border-none">Cancelled</Badge>;
    return <Badge className="bg-blue-100 text-blue-800 border-none">In Progress</Badge>;
  };

  const handleCreate = () => {
    if (!form.startDate) {
      toast({ title: "Error", description: "Start date is required.", variant: "destructive" });
      return;
    }
    createSession.mutate(
      {
        data: {
          conductedById: me?.id || 1,
          startDate: form.startDate,
          notes: form.notes || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Stock Taking Session Created", description: "A new stock taking session has been started." });
          queryClient.invalidateQueries({ queryKey: getListStockTakingsQueryKey() });
          setOpen(false);
          setForm({ startDate: new Date().toISOString().split("T")[0], notes: "" });
        },
        onError: () => toast({ title: "Error", description: "Failed to create session.", variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Taking</h1>
          <p className="text-muted-foreground mt-1">Conduct physical stock counts and reconcile with system quantities.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Session
        </Button>
      </div>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Session No.</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Conducted By</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : !sessions?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                    <CheckSquare className="mx-auto h-8 w-8 mb-2 opacity-20" />
                    No stock taking sessions recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((s) => (
                  <TableRow key={s.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono font-medium">{s.sessionNumber}</TableCell>
                    <TableCell>{format(new Date(s.startDate), "MMM d, yyyy")}</TableCell>
                    <TableCell>{s.endDate ? format(new Date(s.endDate), "MMM d, yyyy") : <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>{s.conductedByName || `User #${s.conductedById}`}</TableCell>
                    <TableCell>{statusBadge(s.status)}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">{s.notes || "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Start Stock Taking Session</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Any notes about this stock taking exercise..." value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createSession.isPending}>
              {createSession.isPending ? "Creating..." : "Start Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
