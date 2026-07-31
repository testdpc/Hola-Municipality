import { useLocation } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateStockIssue, useListInventoryItems, useGetMe } from "@workspace/api-client-react";
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
  quantity: z.coerce.number().min(1, "Must be > 0"),
});

const schema = z.object({
  department: z.string().min(1, "Department is required"),
  issueDate: z.string().min(1, "Date is required"),
  notes: z.string().optional(),
  items: z.array(itemSchema).min(1, "Add at least one item")
});

export default function StockIssueForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: user } = useGetMe();
  const { data: inventoryItems } = useListInventoryItems();
  const createMutation = useCreateStockIssue();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { 
      department: user?.department || "", 
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      notes: "", 
      items: [] 
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" });

  const onSubmit = (values: z.infer<typeof schema>) => {
    if (!user) return;
    
    createMutation.mutate({ 
      data: { 
        ...values, 
        requestedById: user.id 
      } 
    }, {
      onSuccess: () => {
        toast({ title: "Stock Issue Request created" });
        setLocation("/stock-issues");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/stock-issues")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Stock Requisition</h1>
          <p className="text-muted-foreground mt-1">Request items for department use.</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader><CardTitle>Request Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="department" render={({ field }) => (
                <FormItem><FormLabel>Department</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="issueDate" render={({ field }) => (
                <FormItem><FormLabel>Request Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="md:col-span-2">
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem><FormLabel>Reason / Notes</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Requested Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ inventoryItemId: 0, itemName: "", quantity: 1 })}>
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
                          }
                        }} value={selectField.value ? String(selectField.value) : ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {inventoryItems?.filter(i => i.status !== 'out_of_stock').map(i => 
                              <SelectItem key={i.id} value={String(i.id)}>
                                {i.itemName} ({i.currentQuantity} {i.unitOfMeasure} available)
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <div className="w-full sm:w-32">
                    <FormField control={form.control} name={`items.${index}.quantity`} render={({ field: inputField }) => (
                      <FormItem>
                        <FormLabel>Quantity</FormLabel>
                        <FormControl><Input type="number" {...inputField} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/stock-issues")}>Cancel</Button>
            <Button type="submit" className="gap-2" disabled={createMutation.isPending}>
              <Save className="h-4 w-4" /> Submit Request
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}