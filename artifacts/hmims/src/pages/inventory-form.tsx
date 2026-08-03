import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetInventoryItem, useCreateInventoryItem, useUpdateInventoryItem, useListCategories, useListSuppliers, useListDepartments, useListStores, useListUsers } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const unitOptions = ["pcs", "box", "carton", "ream", "roll", "pair", "packet", "set", "litre", "millilitre", "kilogram", "gram", "metre", "centimetre"];

const optionalStringField = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}, z.string().optional());

const optionalNumberField = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}, z.coerce.number().min(0).optional());

const optionalEmailField = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return String(value).trim();
}, z.string().email("Enter a valid email address").optional());

const itemSchema = z.object({
  itemCode: z.string().optional(),
  itemName: z.string().min(1, "Item name is required"),
  categoryId: z.coerce.number().min(1, "Category is required"),
  description: optionalStringField,
  unitOfMeasure: z.string().min(1, "Unit of measure is required"),
  currentQuantity: z.coerce.number().min(0, "Current quantity cannot be negative"),
  minimumStock: z.coerce.number().min(0, "Minimum stock cannot be negative"),
  maximumStock: optionalNumberField,
  reorderLevel: optionalNumberField,
  shelfBinLocation: optionalStringField,
  purchasePrice: z.coerce.number().min(0, "Purchase cost cannot be negative"),
  supplierId: z.coerce.number().optional(),
  departmentId: z.coerce.number().optional(),
  storeId: z.coerce.number().optional(),
  procurementOfficerName: optionalStringField,
  procurementOfficerPhone: optionalStringField,
  procurementOfficerEmail: optionalEmailField,
  quantityReceived: z.coerce.number().min(0, "Quantity received cannot be negative"),
  quantityAvailable: z.coerce.number().min(0, "Quantity available cannot be negative"),
  purchaseDate: z.string().optional(),
  dateReceived: z.string().optional(),
});

export default function InventoryForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: item, isLoading: loadingItem } = useGetInventoryItem(Number(id), {
    query: { queryKey: ["inventory-item", Number(id)], enabled: !isNew },
  });
  const { data: categories } = useListCategories();
  const { data: suppliers } = useListSuppliers();
  const { data: departments } = useListDepartments();
  const { data: stores } = useListStores();
  const { data: users } = useListUsers();

  const createMutation = useCreateInventoryItem();
  const updateMutation = useUpdateInventoryItem();

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      itemCode: "",
      itemName: "",
      categoryId: 0,
      description: "",
      unitOfMeasure: "pcs",
      currentQuantity: 0,
      minimumStock: 0,
      maximumStock: undefined,
      reorderLevel: undefined,
      shelfBinLocation: "",
      purchasePrice: 0,
      supplierId: undefined,
      departmentId: undefined,
      storeId: undefined,
      procurementOfficerName: "",
      procurementOfficerPhone: "",
      procurementOfficerEmail: "",
      quantityReceived: 0,
      quantityAvailable: 0,
      purchaseDate: "",
      dateReceived: "",
    },
  });

  useEffect(() => {
    if (item && !isNew) {
      form.reset({
        itemCode: item.itemCode,
        itemName: item.itemName,
        categoryId: item.categoryId,
        description: item.description || "",
        unitOfMeasure: item.unitOfMeasure,
        currentQuantity: item.currentQuantity,
        minimumStock: item.minimumStock,
        maximumStock: item.maximumStock ?? undefined,
        reorderLevel: item.reorderLevel ?? undefined,
        shelfBinLocation: item.shelfBinLocation || "",
        purchasePrice: item.purchasePrice,
        supplierId: item.supplierId || undefined,
        departmentId: item.departmentId || undefined,
        storeId: item.storeId || undefined,
        procurementOfficerName: item.procurementOfficerName || "",
        procurementOfficerPhone: item.procurementOfficerPhone || "",
        procurementOfficerEmail: item.procurementOfficerEmail || "",
        quantityReceived: item.quantityReceived ?? item.currentQuantity,
        quantityAvailable: item.quantityAvailable ?? item.currentQuantity,
        purchaseDate: item.purchaseDate || "",
        dateReceived: item.dateReceived || "",
      });
    }
  }, [item, isNew, form]);

  const onSubmit = (values: z.infer<typeof itemSchema>) => {
    const payload = {
      ...values,
      itemCode: undefined,
      description: values.description?.trim() || undefined,
      maximumStock: values.maximumStock ?? undefined,
      reorderLevel: values.reorderLevel ?? undefined,
      shelfBinLocation: values.shelfBinLocation?.trim() || undefined,
      procurementOfficerName: values.procurementOfficerName?.trim() || undefined,
      procurementOfficerPhone: values.procurementOfficerPhone?.trim() || undefined,
      procurementOfficerEmail: values.procurementOfficerEmail?.trim() || undefined,
    };

    const onError = (error: unknown) => {
      const message = error instanceof Error ? error.message : "Please review the form and try again.";
      toast({ title: "Unable to save inventory item", description: message, variant: "destructive" });
    };

    if (isNew) {
      createMutation.mutate({ data: payload }, {
        onSuccess: () => {
          toast({ title: "Item created successfully" });
          setLocation("/inventory");
        },
        onError,
      });
    } else {
      updateMutation.mutate({ id: Number(id), data: payload }, {
        onSuccess: () => {
          toast({ title: "Item updated successfully" });
          setLocation("/inventory");
        },
        onError,
      });
    }
  };

  if (!isNew && loadingItem) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/inventory")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {isNew ? "New Inventory Item" : "Edit Item"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isNew ? "Enter details for the new inventory item." : `Editing item ${item?.itemCode}`}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="itemCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Code</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} readOnly disabled placeholder="Auto-generated when saved" />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">Auto-generated when saved</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? String(field.value) : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unitOfMeasure"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit of Measure</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {unitOptions.map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Description</FormLabel>
                        <span className="text-[11px] text-muted-foreground">(Optional)</span>
                      </div>
                      <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>Stock & Location</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="currentQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Qty</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minimumStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Stock</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maximumStock"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Max Stock</FormLabel>
                      <span className="text-[11px] text-muted-foreground">(Optional)</span>
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reorderLevel"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Reorder Level</FormLabel>
                      <span className="text-[11px] text-muted-foreground">(Optional)</span>
                    </div>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shelfBinLocation"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Shelf/Bin Location</FormLabel>
                      <span className="text-[11px] text-muted-foreground">(Optional)</span>
                    </div>
                    <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>Procurement & Accountability</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Cost (KES)</FormLabel>
                    <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? String(field.value) : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {suppliers?.map((supplier) => (
                          <SelectItem key={supplier.id} value={String(supplier.id)}>{supplier.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? String(field.value) : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {departments?.map((department) => (
                          <SelectItem key={department.id} value={String(department.id)}>{department.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="storeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value ? String(field.value) : ""}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select store" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {stores?.map((store) => (
                          <SelectItem key={store.id} value={String(store.id)}>{store.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <Card className="border-dashed border-border/70 bg-muted/20">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <h3 className="font-medium text-sm">Procurement Officer Details</h3>
                      <p className="text-sm text-muted-foreground">These details are stored with the inventory item.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="procurementOfficerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Officer Name</FormLabel>
                            <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="procurementOfficerPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl><Input {...field} value={field.value ?? ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="procurementOfficerEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl><Input type="email" {...field} value={field.value ?? ""} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
              <FormField
                control={form.control}
                name="quantityReceived"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qty Received</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantityAvailable"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qty Available</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateReceived"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Received</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => setLocation("/inventory")}>Cancel</Button>
            <Button type="submit" className="gap-2" disabled={createMutation.isPending || updateMutation.isPending}>
              <Save className="h-4 w-4" /> Save Item
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}