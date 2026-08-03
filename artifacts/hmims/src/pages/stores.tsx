import { useEffect, useState } from "react";
import { useListStores, useCreateStore, useUpdateStore, useDeleteStore } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Search } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  storeCode: z.string().min(1, "Store code is required"),
  name: z.string().min(1, "Name is required"),
  location: z.string().optional(),
  description: z.string().optional(),
});

export default function Stores() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const { data: stores, isLoading, refetch } = useListStores();
  const createMutation = useCreateStore();
  const updateMutation = useUpdateStore();
  const deleteMutation = useDeleteStore();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [blockedDeleteMessage, setBlockedDeleteMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { storeCode: "", name: "", location: "", description: "" },
  });

  const filteredStores = stores?.filter((store) =>
    store.storeCode.toLowerCase().includes(search.toLowerCase()) ||
    store.name.toLowerCase().includes(search.toLowerCase()) ||
    (store.location || "").toLowerCase().includes(search.toLowerCase()) ||
    (store.description || "").toLowerCase().includes(search.toLowerCase()),
  );

  const pageCount = Math.max(1, Math.ceil((filteredStores?.length ?? 0) / pageSize));
  const paginatedStores = filteredStores?.slice((currentPage - 1) * pageSize, currentPage * pageSize) ?? [];

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const formatDate = (value?: string) =>
    value ? new Date(value).toLocaleString() : "-";

  const openEdit = (store: any) => {
    setEditingId(store.id);
    form.reset({ storeCode: store.storeCode, name: store.name, location: store.location || "", description: store.description || "" });
    setIsOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    form.reset({ storeCode: "", name: "", location: "", description: "" });
    setIsOpen(true);
  };

  const onSubmit = (values: z.infer<typeof schema>) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: values }, {
        onSuccess: () => {
          toast({ title: "Store updated" });
          setIsOpen(false);
          refetch();
        },
      });
    } else {
      createMutation.mutate({ data: values }, {
        onSuccess: () => {
          toast({ title: "Store created" });
          setIsOpen(false);
          refetch();
        },
      });
    }
  };

  const handleDelete = () => {
    if (pendingDeleteId === null) return;

    deleteMutation.mutate({ id: pendingDeleteId }, {
      onSuccess: () => {
        toast({ title: "Store deleted" });
        setPendingDeleteId(null);
        setBlockedDeleteMessage(null);
        refetch();
      },
      onError: (error) => {
        const message = error instanceof Error ? error.message : "Unable to delete store right now.";
        setBlockedDeleteMessage(message);
        setPendingDeleteId(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Stores</h1>
          <p className="text-muted-foreground mt-1">Maintain physical store locations and warehouse records.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add Store
        </Button>
      </div>

      <AlertDialog open={pendingDeleteId !== null} onOpenChange={(open) => { if (!open) { setPendingDeleteId(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Store</AlertDialogTitle>
            <AlertDialogDescription>This action permanently deletes the store and cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={blockedDeleteMessage !== null} onOpenChange={(open) => !open && setBlockedDeleteMessage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unable to delete store</AlertDialogTitle>
            <AlertDialogDescription>{blockedDeleteMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setBlockedDeleteMessage(null)}>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Store" : "New Store"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="storeCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Code</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button type="submit">{editingId ? "Update" : "Create"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-sm border-border/50">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border/50 flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stores..."
                className="pl-9 bg-muted/50"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Store Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={8} className="text-center h-24">Loading...</TableCell></TableRow>
                ) : filteredStores?.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center h-24 text-muted-foreground">No stores found.</TableCell></TableRow>
                ) : (
                  paginatedStores?.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium text-gray-900">{store.storeCode}</TableCell>
                      <TableCell>{store.name}</TableCell>
                      <TableCell>{store.location || "-"}</TableCell>
                      <TableCell>{store.description || "-"}</TableCell>
                      <TableCell>{formatDate(store.createdAt)}</TableCell>
                      <TableCell>{formatDate(store.updatedAt)}</TableCell>
                      <TableCell>
                        {store.isActive ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(store)}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setPendingDeleteId(store.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {pageCount > 1 && (
            <div className="p-4">
              <Pagination>
                <PaginationContent>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                    }}
                  />
                  {Array.from({ length: pageCount }, (_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === index + 1}
                        onClick={(event) => {
                          event.preventDefault();
                          setCurrentPage(index + 1);
                        }}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault();
                      setCurrentPage((prev) => Math.min(pageCount, prev + 1));
                    }}
                  />
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
