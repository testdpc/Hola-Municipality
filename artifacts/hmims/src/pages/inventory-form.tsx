import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useGetInventoryItem,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useListCategories,
  useListSuppliers,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const itemSchema = z.object({
  itemCode: z.string().min(1, "Item code is required"),
  itemName: z.string().min(1, "Item name is required"),
  categoryId: z.coerce.number().min(1, "Category is required"),
  description: z.string().optional(),
  unitOfMeasure: z.string().min(1, "UoM is required"),
  currentQuantity: z.coerce.number().min(0, "Cannot be negative"),
  minimumStock: z.coerce.number().min(0),
  maximumStock: z.coerce.number().min(0),
  reorderLevel: z.coerce.number().min(0),
  shelfBinLocation: z.string().optional(),
  purchasePrice: z.coerce.number().min(0),
  supplierId: z.coerce.number().optional(),
});

export default function InventoryForm() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: item, isLoading: loadingItem } = isNew
    ? { data: undefined, isLoading: false }
    : useGetInventoryItem(Number(id));
  const { data: categories } = useListCategories();
  const { data: suppliers } = useListSuppliers();

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
      maximumStock: 0,
      reorderLevel: 0,
      shelfBinLocation: "",
      purchasePrice: 0,
      supplierId: undefined,
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
        maximumStock: item.maximumStock,
        reorderLevel: item.reorderLevel,
        shelfBinLocation: item.shelfBinLocation || "",
        purchasePrice: item.purchasePrice,
        supplierId: item.supplierId || undefined,
      });
    }
  }, [item, isNew, form]);

  const onSubmit = (values: z.infer<typeof itemSchema>) => {
    if (isNew) {
      createMutation.mutate(
        { data: values },
        {
          onSuccess: () => {
            toast({ title: "Item created successfully" });
            setLocation("/inventory");
          },
        },
      );
    } else {
      updateMutation.mutate(
        { id: Number(id), data: values },
        {
          onSuccess: () => {
            toast({ title: "Item updated successfully" });
            setLocation("/inventory");
          },
        },
      );
    }
  };

  if (!isNew && loadingItem)
    return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/inventory")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {isNew ? "New Inventory Item" : "Edit Item"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isNew
              ? "Enter details for the new inventory item."
              : `Editing item ${item?.itemCode}`}
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
                      <Input {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={field.value ? String(field.value) : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
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
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
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
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maximumStock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Stock</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                    <FormLabel>Reorder Level</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
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
                    <FormLabel>Shelf/Bin Location</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50">
            <CardHeader>
              <CardTitle>Purchasing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="purchasePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Price (KES)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Supplier</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={field.value ? String(field.value) : ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {suppliers?.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/inventory")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="gap-2"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="h-4 w-4" /> Save Item
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
