import { useState } from "react";
import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreatePurchaseOrder, useListSuppliers, useListInventoryItems } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const itemSchema = z.object({
  inventoryItemId: z.coerce.number().min(1, "Required"),
  itemName: z.string(),
  quantity: z.coerce.number().min(1, "Must be > 0"),
  unitPrice: z.coerce.number().min(0, "Must be >= 0"),
  totalPrice: z.number()
});

const poSchema = z.object({
  supplierId: z.coerce.number().min(1, "Supplier is required"),
  department: z.string().min(1, "Department is required"),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item")
});

export default function PurchaseOrderForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: suppliers } = useListSuppliers();
  const { data: inventoryItems } = useListInventoryItems();
  const createMutation = useCreatePurchaseOrder();

  const form = useForm<z.infer<typeof poSchema>>({
    resolver: zodResolver(poSchema),
    defaultValues: { supplierId: 0, department: "", notes: "", items: [] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const onSubmit = (values: z.infer<typeof poSchema>) => {
    // Recalculate totals just to be sure
    const processedItems = values.items.map(item => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice
    }));
    
    createMutation.mutate({ data: { ...values, items: processedItems } }, {
      onSuccess: () => {
        toast({ title: "Purchase Order created" });
        setLocation("/purchase-orders");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/purchase-orders")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create Purchase Order</h1>
          <p className="text-muted-foreground mt-1">Draft a new LPO.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader><CardTitle>LPO Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="supplierId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier</FormLabel>
                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value ? String(field.value) : ""}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {suppliers?.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="department" render={({ field }) => (
                <FormItem><FormLabel>Requesting Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="md:col-span-2">
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Notes / Instructions</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Line Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ inventoryItemId: 0, itemName: "", quantity: 1, unitPrice: 0, totalPrice: 0 })}>
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </CardHeader>
            <CardContent>
              {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No items added. Click 'Add Item' to start.</p>}
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
                            form.setValue(`items.${index}.totalPrice`, item.purchasePrice * form.getValues(`items.${index}.quantity`));
                          }
                        }} value={selectField.value ? String(selectField.value) : ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {inventoryItems?.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.itemName} ({i.itemCode})</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="w-full sm:w-24">
                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: inputField }) => (
                      <FormItem>
                        <FormLabel>Qty</FormLabel>
                        <FormControl>
                          <Input type="number" {...inputField} onChange={(e) => {
                            inputField.onChange(e);
                            const qty = Number(e.target.value);
                            const price = form.getValues(`items.${index}.unitPrice`);
                            form.setValue(`items.${index}.totalPrice`, qty * price);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="w-full sm:w-32">
                    <FormField control={form.control} name={`items.${index}.unitPrice`} render={({ field: inputField }) => (
                      <FormItem>
                        <FormLabel>Unit Price</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...inputField} onChange={(e) => {
                            inputField.onChange(e);
                            const price = Number(e.target.value);
                            const qty = form.getValues(`items.${index}.quantity`);
                            form.setValue(`items.${index}.totalPrice`, qty * price);
                          }} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="w-full sm:w-32">
                    <FormItem>
                      <FormLabel>Total</FormLabel>
                      <div className="h-10 flex items-center px-3 bg-muted rounded-md font-medium text-sm">
                        {form.watch(`items.${index}.totalPrice`)?.toLocaleString()}
                      </div>
                    </FormItem>
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex justify-end mt-4 pt-4 border-t border-border/50">
                <div className="text-xl font-bold">
                  Total: KES {form.watch("items")?.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/purchase-orders")}>Cancel</Button>
            <Button type="submit" className="gap-2" disabled={createMutation.isPending}>
              <Save className="h-4 w-4" /> Save as Draft
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}