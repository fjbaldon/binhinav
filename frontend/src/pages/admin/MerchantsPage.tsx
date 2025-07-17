import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

// Based on your Merchant entity
interface Merchant {
    id: string;
    name: string;
    username: string;
    place?: { id: string, name: string }; // Optional place relationship
}

// Schema for form validation
const merchantSchema = z.object({
    name: z.string().min(2, "Name is required."),
    username: z.string().min(4, "Username must be at least 4 characters."),
    password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
});

type MerchantFormValues = z.infer<typeof merchantSchema>;

export default function MerchantsPage() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);

    const form = useForm<MerchantFormValues>({
        resolver: zodResolver(merchantSchema),
    });

    const fetchMerchants = async () => {
        try {
            const response = await apiClient.get<Merchant[]>("/merchants");
            setMerchants(response.data);
        } catch (error) {
            toast.error("Failed to fetch merchants");
        }
    };

    useEffect(() => {
        fetchMerchants();
    }, []);

    const handleOpenDialog = (merchant: Merchant | null = null) => {
        setEditingMerchant(merchant);
        if (merchant) {
            form.reset({ name: merchant.name, username: merchant.username, password: '' });
        } else {
            form.reset({ name: "", username: "", password: "" });
        }
        setIsDialogOpen(true);
    };

    const onSubmit = async (data: MerchantFormValues) => {
        try {
            if (editingMerchant) {
                // Filter out empty password so it's not sent on update unless changed
                const payload: Partial<MerchantFormValues> = { name: data.name, username: data.username };
                if (data.password) {
                    payload.password = data.password;
                }
                await apiClient.patch(`/merchants/${editingMerchant.id}`, payload);
                toast.success("Merchant updated successfully.");
            } else {
                // Password is required for creation
                if (!data.password) {
                    form.setError("password", { message: "Password is required for new merchants." });
                    return;
                }
                await apiClient.post("/merchants", data);
                toast.success("Merchant created successfully.");
            }
            fetchMerchants();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error("An error occurred", {
                description: error.response?.data?.message || "Username might already be in use.",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this merchant? This cannot be undone.")) return;
        try {
            await apiClient.delete(`/merchants/${id}`);
            toast.success("Merchant deleted.");
            fetchMerchants();
        } catch (error) {
            toast.error("Failed to delete merchant");
        }
    }

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
                            {merchants.map((merchant) => (
                                <TableRow key={merchant.id}>
                                    <TableCell className="font-medium">{merchant.name}</TableCell>
                                    <TableCell>{merchant.username}</TableCell>
                                    <TableCell>{merchant.place?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(merchant)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(merchant.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingMerchant ? "Edit Merchant" : "Create New Merchant"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div>
                            <Label htmlFor="name">Merchant's Full Name</Label>
                            <Input id="name" {...form.register("name")} />
                            <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                        </div>
                        <div>
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" {...form.register("username")} />
                            <p className="text-sm text-red-500">{form.formState.errors.username?.message}</p>
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" {...form.register("password")} placeholder={editingMerchant ? "Leave blank to keep unchanged" : ""} />
                            <p className="text-sm text-red-500">{form.formState.errors.password?.message}</p>
                        </div>
                        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                            {form.formState.isSubmitting ? "Saving..." : "Save Merchant"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
