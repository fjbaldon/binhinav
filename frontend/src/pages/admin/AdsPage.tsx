import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient, getAssetUrl } from "@/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

interface Ad {
    id: string;
    name: string;
    imageUrl: string;
    isActive: boolean;
    displayOrder: number | null;
}

const adSchema = z.object({
    name: z.string().min(2, "Name is required."),
    isActive: z.boolean().default(true),
    displayOrder: z.coerce.number().int().optional(),
    image: z.any().optional(),
});

type AdFormValues = z.infer<typeof adSchema>;

export default function AdsPage() {
    const [ads, setAds] = useState<Ad[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);

    const form = useForm({
        resolver: zodResolver(adSchema),
        defaultValues: { name: "", isActive: true, displayOrder: undefined, image: undefined },
    });

    const fetchAds = async () => {
        try {
            const response = await apiClient.get<Ad[]>("/ads");
            setAds(response.data);
        } catch (error) {
            toast.error("Failed to fetch ads");
        }
    };

    useEffect(() => {
        fetchAds();
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

    const onSubmit = async (data: AdFormValues) => {
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

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            if (editingAd) {
                await apiClient.patch(`/ads/${editingAd.id}`, formData, config);
                toast.success("Ad updated successfully.");
            } else {
                await apiClient.post("/ads", formData, config);
                toast.success("Ad created successfully.");
            }
            fetchAds();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error("An error occurred", {
                description: error.response?.data?.message || "Something went wrong.",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this ad?")) return;
        try {
            await apiClient.delete(`/ads/${id}`);
            toast.success("Ad deleted.");
            fetchAds();
        } catch (error) {
            toast.error("Failed to delete ad");
        }
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Advertisements</h2>
                    <p className="text-muted-foreground">Manage ads shown on kiosks during inactivity.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Ad
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
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
                            {ads.map((ad) => (
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
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(ad)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(ad.id)}>
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
                        <DialogTitle>{editingAd ? "Edit Ad" : "Create New Ad"}</DialogTitle>
                        <DialogDescription>
                            Fill in the ad details below. Ads are displayed in ascending order of their display number.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div>
                            <Label htmlFor="name">Ad Name (for internal reference)</Label>
                            <Input id="name" {...form.register("name")} />
                            <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                        </div>
                        <div>
                            <Label htmlFor="image">Ad Image</Label>
                            <Input id="image" type="file" accept="image/*" {...form.register("image")} />
                            {editingAd && <p className="text-sm text-muted-foreground mt-1">Leave blank to keep the current image.</p>}
                            <p className="text-sm text-red-500">{typeof form.formState.errors.image?.message === "string" ? form.formState.errors.image.message : ""}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Status</Label>
                                <Select
                                    onValueChange={(value) => form.setValue('isActive', value === 'true')}
                                    defaultValue={String(form.getValues('isActive'))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Set status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Active</SelectItem>
                                        <SelectItem value="false">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="displayOrder">Display Order</Label>
                                <Input id="displayOrder" type="number" {...form.register("displayOrder")} placeholder="e.g., 1, 2, 3..." />
                                <p className="text-sm text-red-500">{form.formState.errors.displayOrder?.message}</p>
                            </div>
                        </div>

                        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                            {form.formState.isSubmitting ? "Saving..." : "Save Ad"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
