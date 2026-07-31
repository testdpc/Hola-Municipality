import { useState } from "react";
import { useListUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { useDepartments } from "@/hooks/use-departments";

const schema = z.object({
  username: z.string().min(1, "Username required"),
  fullName: z.string().min(1, "Full name required"),
  email: z.string().email(),
  role: z.enum(["administrator", "storekeeper", "procurement_officer", "finance_officer", "department_user", "auditor"]),
  department: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().optional(), // Required only for create
});

export default function Users() {
  const { data: users, isLoading, refetch } = useListUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const { toast } = useToast();
  const { data: departments } = useDepartments();

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", fullName: "", email: "", role: "department_user", department: "", phone: "", password: "" },
  });

  const openEdit = (user: any) => {
    setEditingId(user.id);
    form.reset({ 
      username: user.username, 
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department || "",
      phone: user.phone || "",
      password: ""
    });
    setIsOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    form.reset({ username: "", fullName: "", email: "", role: "department_user", department: "", phone: "", password: "" });
    setIsOpen(true);
  };

  const onSubmit = (values: z.infer<typeof schema>) => {
    if (editingId) {
      const updateData = { ...values };
      if (!updateData.password) delete updateData.password;
      
      updateMutation.mutate({ id: editingId, data: updateData }, {
        onSuccess: () => {
          toast({ title: "User updated" });
          setIsOpen(false);
          refetch();
        }
      });
    } else {
      if (!values.password) {
        form.setError("password", { message: "Password required for new user" });
        return;
      }
      createMutation.mutate({ data: values as any }, {
        onSuccess: () => {
          toast({ title: "User created" });
          setIsOpen(false);
          refetch();
        }
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Deactivate this user?")) {
      deleteMutation.mutate({ id }, {
        onSuccess: () => {
          toast({ title: "User deactivated" });
          refetch();
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">System Users</h1>
          <p className="text-muted-foreground mt-1">Manage access control and roles.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit User" : "New User"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="username" render={({ field }) => (
                  <FormItem><FormLabel>Username</FormLabel><FormControl><Input {...field} disabled={!!editingId} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem><FormLabel>{editingId ? "Reset Password" : "Password"}</FormLabel><FormControl><Input type="password" placeholder={editingId ? "Leave blank to keep unchanged" : ""} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="administrator">Administrator</SelectItem>
                        <SelectItem value="storekeeper">Storekeeper</SelectItem>
                        <SelectItem value="procurement_officer">Procurement Officer</SelectItem>
                        <SelectItem value="finance_officer">Finance Officer</SelectItem>
                        <SelectItem value="department_user">Department User</SelectItem>
                        <SelectItem value="auditor">Auditor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="department" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(departments || []).map(d => (
                          <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24">Loading...</TableCell></TableRow>
              ) : users?.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No users found.</TableCell></TableRow>
              ) : (
                users?.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{user.fullName}</div>
                      <div className="text-xs text-muted-foreground">{user.email} • {user.username}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">{user.role.replace('_', ' ')}</Badge>
                    </TableCell>
                    <TableCell>{user.department || "-"}</TableCell>
                    <TableCell>
                      {user.isActive ? <Badge className="bg-emerald-100 text-emerald-800 border-none">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(user)}><Edit2 className="h-4 w-4" /></Button>
                      {user.isActive && (
                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}