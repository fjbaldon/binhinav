import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from "@/api/admins";
import type { Admin, AdminPayload } from "@/api/types";
import { useAuth } from "@/hooks/useAuth";
import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle, Edit, Trash2, UserCircle2, ShieldCheck } from 'lucide-react';
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { DataTable } from "@/components/shared/DataTable";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const baseSchema = {
    name: z.string().min(2, "Name is required."),
    email: z.string().nonempty("Email is required.").pipe(z.email("A valid email is required.")),
    username: z.string().min(4, "Username must be at least 4 characters."),
    isSuperAdmin: z.boolean().default(false),
};

const createSchema = z.object({
    ...baseSchema,
    password: z.string().min(8, "Password must be at least 8 characters."),
});

const updateSchema = z.object({
    ...baseSchema,
    email: z.email("A valid email is required.").optional().or(z.literal('')),
    password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
});

type FormValues = z.infer<typeof updateSchema>;

export default function AdminsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const { user: currentUser } = useAuth();
    const queryClient = useQueryClient();

    const form = useForm({
        resolver: zodResolver(editingAdmin ? updateSchema : createSchema),
        defaultValues: { name: "", email: "", username: "", password: "", isSuperAdmin: false },
    });

    const { data: admins = [], isLoading, isError } = useQuery({
        queryKey: ['admins'],
        queryFn: getAdmins,
    });

    const createMutation = useMutation({
        mutationFn: createAdmin,
        onSuccess: () => {
            toast.success("Admin created successfully.");
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            if (error.response?.status === 401) return;
            toast.error("Creation Failed", { description: error.response?.data?.message || "Something went wrong." });
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateAdmin,
        onSuccess: () => {
            toast.success("Admin updated successfully.");
            queryClient.invalidateQueries({ queryKey: ['admins'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            if (error.response?.status === 401) return;
            toast.error("Update Failed", { description: error.response?.data?.message || "Something went wrong." });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteAdmin,
        onSuccess: () => {
            toast.success("Admin deleted.");
            queryClient.invalidateQueries({ queryKey: ['admins'] });
        },
        onError: (error: any) => {
            if (error.response?.status === 401) return;
            toast.error("Deletion Failed", { description: error.response?.data?.message || "Something went wrong." });
        }
    });

    useEffect(() => {
        document.title = "Admins | Binhinav Admin";
    }, []);

    const handleOpenDialog = (admin: Admin | null = null) => {
        setEditingAdmin(admin);
        if (admin) {
            form.reset({
                name: admin.name,
                email: admin.email || '',
                username: admin.username,
                password: '',
                isSuperAdmin: admin.isSuperAdmin,
            });
        } else {
            form.reset({ name: '', email: '', username: '', password: '', isSuperAdmin: false });
        }
        setIsDialogOpen(true);
    };

    const onSubmit = (data: FormValues) => {
        const payload: Partial<AdminPayload> = { ...data };

        if (editingAdmin) {
            if (!payload.password) {
                delete payload.password;
            }
            if (payload.email === '') {
                payload.email = null;
            }
            updateMutation.mutate({ id: editingAdmin.id, payload });
        } else {
            // The resolver ensures password exists, but we cast for TS confidence
            createMutation.mutate(payload as AdminPayload);
        }
    };

    const handleDelete = (id: string) => deleteMutation.mutate(id);

    const isMutating = createMutation.isPending || updateMutation.isPending;

    const columns: ColumnDef<Admin>[] = [
        {
            accessorKey: "name",
            header: "Admin",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <UserCircle2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <div className="font-semibold flex items-center gap-2">
                            {row.original.name}
                            {row.original.isSuperAdmin && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <ShieldCheck className="h-4 w-4 text-sky-500" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>Super Admin</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <div className="text-sm text-muted-foreground">{row.original.email}</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "username",
            header: "Username",
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => {
                const isCurrentUser = row.original.id === currentUser?.userId;
                return (
                    <div className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(row.original)} disabled={isCurrentUser}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <ConfirmationDialog
                            title="Delete this admin?"
                            description="This action cannot be undone and will permanently delete this admin account."
                            onConfirm={() => handleDelete(row.original.id)}
                            variant="destructive"
                            confirmText="Delete"
                            triggerButton={
                                <Button variant="ghost" size="icon" className="text-red-500" disabled={isCurrentUser || deleteMutation.isPending}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            }
                        />
                    </div>
                )
            },
        },
    ];

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Admins</h2>
                    <p className="text-muted-foreground">Add, remove, or edit administrator accounts.</p>
                </div>
                {currentUser?.isSuperAdmin && (
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add New Admin
                    </Button>
                )}
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading && <p>Loading admins...</p>}
                    {isError && <p className="text-destructive">Failed to load admins.</p>}
                    {!isLoading && !isError && (
                        <DataTable columns={columns} data={admins} />
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAdmin ? "Edit Admin" : "Create New Admin"}</DialogTitle>
                        <DialogDescription>
                            Fill in the details for the admin account below.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4" autoComplete="off">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" {...form.register("name")} />
                            <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" {...form.register("email")} />
                            <p className="text-sm text-red-500">{form.formState.errors.email?.message}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" {...form.register("username")} />
                            <p className="text-sm text-red-500">{form.formState.errors.username?.message}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" {...form.register("password")} placeholder={editingAdmin ? "Leave blank to keep unchanged" : ""} />
                            <p className="text-sm text-red-500">{form.formState.errors.password?.message}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="isSuperAdmin" onCheckedChange={(checked) => form.setValue('isSuperAdmin', !!checked)} checked={form.watch('isSuperAdmin')} />
                            <Label htmlFor="isSuperAdmin" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Make this user a Super Admin?
                            </Label>
                        </div>
                        <Button type="submit" disabled={isMutating} className="w-full">
                            {isMutating ? "Saving..." : (editingAdmin ? "Save Changes" : "Create Admin")}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
