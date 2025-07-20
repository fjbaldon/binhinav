import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMerchants, createMerchant, updateMerchant, deleteMerchant } from "@/api/merchants";
import type { Merchant, MerchantPayload } from "@/api/types";
import type { ColumnDef, SortingState } from "@tanstack/react-table";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, UserCircle2, AlertCircle, ArrowUpDown } from 'lucide-react';
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";

const merchantSchema = z.object({
    name: z.string().min(2, "Name is required."),
    username: z.string().min(4, "Username must be at least 4 characters."),
    password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
});

type MerchantFormValues = z.infer<typeof merchantSchema>;

export default function MerchantsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);

    const form = useForm({
        resolver: zodResolver(merchantSchema),
    });
    const queryClient = useQueryClient();

    // --- DATA FETCHING (READ) ---
    const { data: merchants = [], isLoading, isError } = useQuery({
        queryKey: ['merchants'],
        queryFn: getMerchants,
    });

    // --- DATA MUTATIONS ---
    const createMutation = useMutation({
        mutationFn: createMerchant,
        onSuccess: () => {
            toast.success("Merchant created successfully.");
            queryClient.invalidateQueries({ queryKey: ['merchants'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => toast.error("Creation Failed", { description: error.response?.data?.message || "Username might already be in use." })
    });

    const updateMutation = useMutation({
        mutationFn: updateMerchant,
        onSuccess: () => {
            toast.success("Merchant updated successfully.");
            queryClient.invalidateQueries({ queryKey: ['merchants'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => toast.error("Update Failed", { description: error.response?.data?.message || "Username might already be in use." })
    });

    const deleteMutation = useMutation({
        mutationFn: deleteMerchant,
        onSuccess: () => {
            toast.success("Merchant deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ['merchants'] });
        },
        onError: () => toast.error("Failed to delete merchant.")
    });

    useEffect(() => {
        document.title = "Merchants | Binhinav Admin";
    }, []);

    const handleOpenDialog = (merchant: Merchant | null = null) => {
        setEditingMerchant(merchant);
        form.reset(merchant ? { name: merchant.name, username: merchant.username, password: '' } : { name: "", username: "", password: "" });
        setIsDialogOpen(true);
    };

    const onSubmit = (data: MerchantFormValues) => {
        if (editingMerchant) {
            const payload: Partial<MerchantPayload> = { name: data.name, username: data.username };
            if (data.password) {
                payload.password = data.password;
            }
            updateMutation.mutate({ id: editingMerchant.id, payload });
        } else {
            if (!data.password) {
                form.setError("password", { message: "Password is required for new merchants." });
                return;
            }
            createMutation.mutate(data as MerchantPayload);
        }
    };

    const handleDelete = (id: string) => deleteMutation.mutate(id);

    const isMutating = createMutation.isPending || updateMutation.isPending;

    // Calculate unassigned merchants for the summary card
    const unassignedCount = merchants.filter(m => !m.place).length;

    // --- TABLE COLUMNS DEFINITION ---
    const columns: ColumnDef<Merchant>[] = [
        {
            accessorKey: "name",
            header: "Merchant",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <UserCircle2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <div className="font-semibold">{row.original.name}</div>
                        <div className="text-sm text-muted-foreground">@{row.original.username}</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "place.name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    // FIX: Remove default button padding and adjust alignment
                    className="justify-start -ml-4"
                >
                    Assigned Place
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                row.original.place ? (
                    <span>{row.original.place.name}</span>
                ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-500">Unassigned</Badge>
                )
            )
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(row.original)} disabled={deleteMutation.isPending}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <ConfirmationDialog
                        title="Delete this merchant?"
                        description="This will permanently delete the merchant's account. This action cannot be undone."
                        onConfirm={() => handleDelete(row.original.id)}
                        variant="destructive"
                        confirmText="Delete"
                        triggerButton={
                            <Button variant="ghost" size="icon" className="text-red-500" disabled={deleteMutation.isPending}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        }
                    />
                </div>
            )
        }
    ];

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Merchants</h2>
                    <p className="text-muted-foreground">Manage merchant accounts and credentials.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Merchant
                </Button>
            </div>

            {unassignedCount > 0 && (
                <Card className="mb-6 bg-amber-50 border-amber-200">
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <AlertCircle className="h-6 w-6 text-amber-600 mt-1" />
                            <div>
                                <CardTitle className="text-amber-900">Action Required</CardTitle>
                                <CardDescription className="text-amber-800">
                                    You have {unassignedCount} unassigned {unassignedCount === 1 ? 'merchant' : 'merchants'}.
                                    Assign them to a place from the <a href="/admin/places" className="underline font-semibold">Places page</a> to allow them to manage their store information.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            )}

            <Card>
                <CardContent className="pt-6">
                    {isLoading && <p>Loading merchants...</p>}
                    {isError && <p className="text-destructive">Failed to load merchants.</p>}
                    {!isLoading && !isError && (
                        <DataTable
                            columns={columns}
                            data={merchants}
                            sorting={sorting}
                            setSorting={setSorting}
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingMerchant ? "Edit Merchant" : "Create New Merchant"}</DialogTitle>
                        <DialogDescription>
                            {editingMerchant
                                ? "Edit the merchant's details below. To change the assigned place, go to the Places page."
                                : "Enter the new merchant's details. You can assign them to a place from the Places page later."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Merchant's Full Name</Label>
                            <Input id="name" {...form.register("name")} />
                            <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" {...form.register("username")} />
                            <p className="text-sm text-red-500">{form.formState.errors.username?.message}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" {...form.register("password")} placeholder={editingMerchant ? "Leave blank to keep unchanged" : ""} />
                            <p className="text-sm text-red-500">{form.formState.errors.password?.message}</p>
                        </div>
                        <Button type="submit" disabled={isMutating} className="w-full">
                            {isMutating ? "Saving..." : "Save Merchant"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
