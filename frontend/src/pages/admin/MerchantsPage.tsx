import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

// Based on your Merchant entity
interface Merchant {
    id: string;
    name: string;
    username: string;
    place?: { id: string, name: string }; // Optional place relationship
}

// Interface for a Place, needed for the assignment dropdown
interface Place {
    id: string;
    name: string;
    merchant?: { id: string }; // We only need to know if a merchant is present
}

// Schema for form validation
const merchantSchema = z.object({
    name: z.string().min(2, "Name is required."),
    username: z.string().min(4, "Username must be at least 4 characters."),
    password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
    placeId: z.string().uuid("A valid place must be selected.").optional(),
});

type MerchantFormValues = z.infer<typeof merchantSchema>;

export default function MerchantsPage() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [places, setPlaces] = useState<Place[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);

    const form = useForm({
        resolver: zodResolver(merchantSchema),
    });

    const fetchData = async () => {
        try {
            const [merchantsRes, placesRes] = await Promise.all([
                apiClient.get<Merchant[]>("/merchants"),
                apiClient.get<Place[]>("/places")
            ]);
            setMerchants(merchantsRes.data);
            setPlaces(placesRes.data);
        } catch (error) {
            toast.error("Failed to fetch data for this page.");
        }
    };

    // Get a list of places that are not currently assigned to any merchant
    const unassignedPlaces = useMemo(() => {
        return places.filter(place => !place.merchant);
    }, [places]);

    useEffect(() => {
        document.title = "Merchants | Binhinav Admin";
        fetchData();
    }, []);

    const handleOpenDialog = (merchant: Merchant | null = null) => {
        setEditingMerchant(merchant);
        if (merchant) {
            form.reset({ name: merchant.name, username: merchant.username, password: '', placeId: undefined });
        } else {
            form.reset({ name: "", username: "", password: "", placeId: undefined });
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
                // Password and placeId are required for creation
                if (!data.password) {
                    form.setError("password", { message: "Password is required for new merchants." });
                }
                if (!data.placeId) {
                    form.setError("placeId", { message: "A place must be assigned to a new merchant." });
                }
                // If either check fails, stop submission
                if (!data.password || !data.placeId) return;

                await apiClient.post("/merchants", data);
                toast.success("Merchant created successfully.");
            }
            fetchData();
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
            toast.success("Merchant deleted successfully.");
            fetchData();
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
                        <DialogDescription>
                            {editingMerchant
                                ? "Edit the merchant's details below. To change the assigned place, go to the Places page."
                                : "Enter the merchant's details. A new merchant must be assigned to an available place."}
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
                        {!editingMerchant && (
                            <div className="space-y-2">
                                <Label htmlFor="placeId">Assign to Place</Label>
                                <Select onValueChange={(value) => form.setValue('placeId', value)} defaultValue={form.getValues('placeId')}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select an unassigned place" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {unassignedPlaces.length > 0 ? (
                                            unassignedPlaces.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)
                                        ) : (
                                            <div className="p-2 text-center text-sm text-muted-foreground">
                                                No unassigned places available.
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-red-500">{form.formState.errors.placeId?.message}</p>
                            </div>
                        )}
                        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                            {form.formState.isSubmitting ? "Saving..." : "Save Merchant"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
