import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMerchants, createMerchant, updateMerchant, deleteMerchant } from "@/api/merchants";
import type { Merchant, MerchantPayload } from "@/api/types";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

const merchantSchema = z.object({
    name: z.string().min(2, "Name is required."),
    username: z.string().min(4, "Username must be at least 4 characters."),
    password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
});

type MerchantFormValues = z.infer<typeof merchantSchema>;

export default function MerchantsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);

    const form = useForm({
        resolver: zodResolver(merchantSchema),
    });
    const queryClient = useQueryClient();

    // --- DATA FETCHING (READ) ---
    const { data: merchants = [], isLoading, isError } = useQuery({
        queryKey: ['merchants'],
        queryFn: getMerchants,
    });

    // --- DATA MUTATIONS (CREATE, UPDATE, DELETE) ---
    const createMutation = useMutation({
        mutationFn: createMerchant,
        onSuccess: () => {
            toast.success("Merchant created successfully.");
            queryClient.invalidateQueries({ queryKey: ['merchants'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error("Creation Failed", { description: error.response?.data?.message || "Username might already be in use." });
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateMerchant,
        onSuccess: () => {
            toast.success("Merchant updated successfully.");
            queryClient.invalidateQueries({ queryKey: ['merchants'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error("Update Failed", { description: error.response?.data?.message || "Username might already be in use." });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteMerchant,
        onSuccess: () => {
            toast.success("Merchant deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ['merchants'] });
        },
        onError: () => {
            toast.error("Failed to delete merchant.");
        }
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
            // Only include the password in the payload if the user entered one
            if (data.password) {
                payload.password = data.password;
            }
            updateMutation.mutate({ id: editingMerchant.id, payload });
        } else {
            // Password is required for new merchants
            if (!data.password) {
                form.setError("password", { message: "Password is required for new merchants." });
                return;
            }
            createMutation.mutate(data as MerchantPayload);
        }
    };

    const handleDelete = (id: string) => {
        if (!window.confirm("Are you sure you want to delete this merchant? This cannot be undone.")) return;
        deleteMutation.mutate(id);
    }

    const isMutating = createMutation.isPending || updateMutation.isPending;

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

            <Card>
                <CardContent className="pt-6">
                    {isLoading && <p>Loading merchants...</p>}
                    {isError && <p className="text-destructive">Failed to load merchants.</p>}
                    {!isLoading && !isError && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Username</TableHead>
                                    <TableHead>Assigned Place</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {merchants.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No merchants found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    merchants.map((merchant) => (
                                        <TableRow key={merchant.id}>
                                            <TableCell className="font-medium">{merchant.name}</TableCell>
                                            <TableCell>{merchant.username}</TableCell>
                                            <TableCell>{merchant.place?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(merchant)} disabled={deleteMutation.isPending}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(merchant.id)} disabled={deleteMutation.isPending}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
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
