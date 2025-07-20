import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminAds, createAd, updateAd, deleteAd } from "@/api/ads";
import { type Ad } from "@/api/types";
import { getAssetUrl } from "@/api";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';

const adSchema = z.object({
    name: z.string().min(2, "Name is required."),
    isActive: z.boolean().default(true),
    displayOrder: z.coerce.number().int().optional(),
    image: z.any().optional(),
});

type AdFormValues = z.infer<typeof adSchema>;

export default function AdsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);
    const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

    const form = useForm({
        resolver: zodResolver(adSchema),
        defaultValues: { name: "", isActive: true, displayOrder: undefined, image: undefined },
    });
    const queryClient = useQueryClient();

    // --- DATA FETCHING (READ) ---
    const { data: ads = [], isLoading, isError } = useQuery({
        queryKey: ['adminAds'], // Unique key for this data
        queryFn: getAdminAds,
    });

    // --- DATA MUTATION (CREATE, UPDATE, DELETE) ---
    const createMutation = useMutation({
        mutationFn: createAd,
        onSuccess: () => {
            toast.success("Ad created successfully.");
            queryClient.invalidateQueries({ queryKey: ['adminAds'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error("Creation Failed", { description: error.response?.data?.message || "Something went wrong." });
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateAd,
        onSuccess: () => {
            toast.success("Ad updated successfully.");
            queryClient.invalidateQueries({ queryKey: ['adminAds'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error("Update Failed", { description: error.response?.data?.message || "Something went wrong." });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteAd,
        onSuccess: () => {
            toast.success("Ad deleted.");
            queryClient.invalidateQueries({ queryKey: ['adminAds'] });
        },
        onError: () => {
            toast.error("Failed to delete ad");
        }
    });

    useEffect(() => {
        document.title = "Ads | Binhinav Admin";
    }, []);

    const handleOpenDialog = (ad: Ad | null = null) => {
        setEditingAd(ad);
        if (ad) {
            form.reset({
                name: ad.name,
                isActive: ad.isActive,
                displayOrder: ad.displayOrder ?? undefined,
                image: undefined,
            });
        } else {
            form.reset({ name: "", isActive: true, displayOrder: undefined, image: undefined });
        }
        setIsDialogOpen(true);
    };

    const onSubmit = (data: AdFormValues) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('isActive', String(data.isActive));
        if (data.displayOrder !== undefined && data.displayOrder !== null) {
            formData.append('displayOrder', String(data.displayOrder));
        }
        if (data.image && data.image[0]) {
            formData.append('image', data.image[0]);
        }

        if (!editingAd && (!data.image || !data.image[0])) {
            form.setError('image', { message: 'Image is required for new ads.' });
            return;
        }

        if (editingAd) {
            updateMutation.mutate({ id: editingAd.id, formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if (!window.confirm("Are you sure you want to delete this ad?")) return;
        deleteMutation.mutate(id);
    }

    const isMutating = createMutation.isPending || updateMutation.isPending;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Ads</h2>
                    <p className="text-muted-foreground">Manage advertisements shown on kiosks during inactivity.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Ad
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading && <p>Loading ads...</p>}
                    {isError && <p className="text-destructive">Failed to load ads.</p>}
                    {!isLoading && !isError && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Display Order</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ads.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No ads found. Click "Add New Ad" to create one.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    ads.map((ad) => (
                                        <TableRow key={ad.id}>
                                            <TableCell>
                                                <img src={getAssetUrl(ad.imageUrl)} alt={ad.name} className="h-16 w-28 object-cover rounded-md border" />
                                            </TableCell>
                                            <TableCell className="font-medium">{ad.name}</TableCell>
                                            <TableCell>
                                                {ad.isActive ?
                                                    <Badge className="bg-green-500 hover:bg-green-600">Active</Badge> :
                                                    <Badge variant="secondary">Inactive</Badge>
                                                }
                                            </TableCell>
                                            <TableCell>{ad.displayOrder ?? <span className="text-muted-foreground">N/A</span>}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setViewingImageUrl(ad.imageUrl)} disabled={deleteMutation.isPending}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(ad)} disabled={deleteMutation.isPending}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(ad.id)} disabled={deleteMutation.isPending}>
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
                        <DialogTitle>{editingAd ? "Edit Ad" : "Create New Ad"}</DialogTitle>
                        <DialogDescription>
                            Fill in the ad details below. Ads are displayed in ascending order of their display number.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Ad Name (for internal reference)</Label>
                            <Input id="name" {...form.register("name")} />
                            <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="image">Ad Image</Label>
                            <Input id="image" type="file" accept="image/*" {...form.register("image")} />
                            {editingAd && <p className="text-sm text-muted-foreground mt-1">Leave blank to keep the current image.</p>}
                            <p className="text-sm text-red-500">{typeof form.formState.errors.image?.message === "string" ? form.formState.errors.image.message : ""}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Controller
                                    name="isActive"
                                    control={form.control}
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={(value) => field.onChange(value === 'true')}
                                            value={String(field.value)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Set status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="true">Active</SelectItem>
                                                <SelectItem value="false">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="displayOrder">Display Order</Label>
                                <Input id="displayOrder" type="number" {...form.register("displayOrder")} placeholder="e.g., 1, 2, 3..." />
                                <p className="text-sm text-red-500">{form.formState.errors.displayOrder?.message}</p>
                            </div>
                        </div>

                        <Button type="submit" disabled={isMutating} className="w-full">
                            {isMutating ? "Saving..." : "Save Ad"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingImageUrl} onOpenChange={(isOpen) => !isOpen && setViewingImageUrl(null)}>
                <DialogContent className="max-w-4xl p-4">
                    <DialogHeader>
                        <DialogTitle>Ad Preview</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <img
                            src={getAssetUrl(viewingImageUrl)}
                            alt="Ad Preview"
                            className="w-full h-auto max-h-[80vh] object-contain rounded-md"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
