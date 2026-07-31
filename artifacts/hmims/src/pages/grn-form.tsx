import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateGRN, useListSuppliers, useListInventoryItems, useGetMe, useListPurchaseOrders, useListUsers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const itemSchema = z.object({
  inventoryItemId: z.coerce.number().min(1, "Required"),
  itemName: z.string(),
  quantityOrdered: z.coerce.number().min(0),
  quantityReceived: z.coerce.number().min(1, "Must be > 0"),
  unitPrice: z.coerce.number().min(0)
});

const grnSchema = z.object({
  supplierId: z.coerce.number().min(1, "Supplier is required"),
  purchaseOrderId: z.coerce.number().optional(),
  deliveryNoteNumber: z.string().optional(),
  dateReceived: z.string().min(1, "Date is required"),
  inspectionStatus: z.enum(["pending", "accepted", "rejected"]).default("pending"),
  officerId: z.coerce.number().min(1, "Officer is required"),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item")
});

export default function GRNForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: user } = useGetMe();
  const { data: suppliers } = useListSuppliers();
  const { data: pos } = useListPurchaseOrders();
  const { data: inventoryItems } = useListInventoryItems();
  const { data: users } = useListUsers();
  const createMutation = useCreateGRN();

  const form = useForm<z.infer<typeof grnSchema>>({
    resolver: zodResolver(grnSchema),
    defaultValues: { 
      supplierId: 0, 
      dateReceived: format(new Date(), 'yyyy-MM-dd'),
      inspectionStatus: "pending", 
      officerId: user?.id ?? 0,
      notes: "", 
      items: [] 
    },
  });

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "items" });

  const selectedPO = form.watch("purchaseOrderId");
  
  useEffect(() => {
    if (selectedPO && pos) {
      const po = pos.find(p => p.id === selectedPO);
      if (po && po.items) {
        form.setValue("supplierId", po.supplierId);
        replace(po.items.map(item => ({
          inventoryItemId: item.inventoryItemId,
          itemName: item.itemName,
          quantityOrdered: item.quantity,
          quantityReceived: item.quantity, // default to receiving all
          unitPrice: item.unitPrice
        })));
      }
    }
  }, [selectedPO, pos, form, replace]);

  const onSubmit = (values: z.infer<typeof grnSchema>) => {
    if (!user) return;
    const { officerId, ...rest } = values;
    createMutation.mutate({ 
      data: { 
        ...rest, 
        receivingOfficerId: officerId 
      } 
    }, {
      onSuccess: () => {
        toast({ title: "GRN created successfully" });
        setLocation("/grn");
      }
    });
  };

  const approvedPOs = pos?.filter(po => po.status === 'approved' || po.status === 'received');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/grn")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create Goods Received Note</h1>
          <p className="text-muted-foreground mt-1">Record items received from suppliers.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader><CardTitle>GRN Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="purchaseOrderId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Link to LPO (Optional)</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select LPO to auto-fill" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {approvedPOs?.map(po => <SelectItem key={po.id} value={String(po.id)}>{po.lpoNumber} - {po.supplierName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="supplierId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : ""} disabled={!!selectedPO}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {suppliers?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="dateReceived" render={({ field }) => (
                <FormItem><FormLabel>Date Received</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="deliveryNoteNumber" render={({ field }) => (
                <FormItem><FormLabel>Delivery Note Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="inspectionStatus" render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspection Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="officerId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Officer Involved</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select officer" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {users?.map(u => (
                        <SelectItem key={u.id} value={String(u.id)}>{u.fullName} — {u.role.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="md:col-span-2">
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes / Remarks</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Received Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ inventoryItemId: 0, itemName: "", quantityOrdered: 0, quantityReceived: 1, unitPrice: 0 })}>
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No items added.</p>}
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-end mb-4 bg-muted/20 p-4 rounded-lg border border-border/50">
                  <div className="flex-1 w-full">
                    <FormField control={form.control} name={`items.${index}.inventoryItemId`} render={({ field: selectField }) => (
                      <FormItem>
                        <FormLabel>Item</FormLabel>
                        <Select onValueChange={(v) => {
                          const item = inventoryItems?.find(i => i.id === Number(v));
                          selectField.onChange(Number(v));
                          if (item) {
                            form.setValue(`items.${index}.itemName`, item.itemName);
                            form.setValue(`items.${index}.unitPrice`, item.purchasePrice);
                          }
                        }} value={selectField.value ? String(selectField.value) : ""} disabled={!!selectedPO}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {inventoryItems?.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.itemName} ({i.itemCode})</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  {selectedPO && (
                    <div className="w-full sm:w-24">
                      <FormField control={form.control} name={`items.${index}.quantityOrdered`} render={({ field: inputField }) => (
                        <FormItem>
                          <FormLabel>Ordered</FormLabel>
                          <FormControl><Input type="number" disabled {...inputField} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  )}
                  <div className="w-full sm:w-24">
                    <FormField control={form.control} name={`items.${index}.quantityReceived`} render={({ field: inputField }) => (
                      <FormItem>
                        <FormLabel>Received Qty</FormLabel>
                        <FormControl><Input type="number" {...inputField} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={() => remove(index)} disabled={!!selectedPO}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/grn")}>Cancel</Button>
            <Button type="submit" className="gap-2" disabled={createMutation.isPending}>
              <Save className="h-4 w-4" /> Save GRN
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}