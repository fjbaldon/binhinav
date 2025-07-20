import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFloorPlans, createFloorPlan, updateFloorPlan, deleteFloorPlan } from "@/api/floor-plans";
import { type FloorPlan } from "@/api/types";
import { getAssetUrl } from "@/api";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';

const floorPlanSchema = z.object({
    name: z.string().min(1, "Name is required."),
    image: z.any()
});

type FloorPlanFormValues = z.infer<typeof floorPlanSchema>;

export default function FloorPlansPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFloorPlan, setEditingFloorPlan] = useState<FloorPlan | null>(null);
    const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

    const form = useForm({ resolver: zodResolver(floorPlanSchema) });
    const queryClient = useQueryClient();

    // --- DATA FETCHING (READ) ---
    const { data: floorPlans = [], isLoading, isError } = useQuery({
        queryKey: ['floorPlans'],
        queryFn: getFloorPlans
    });

    // --- DATA MUTATION (CREATE, UPDATE, DELETE) ---
    const createMutation = useMutation({
        mutationFn: createFloorPlan,
        onSuccess: () => {
            toast.success("Floor plan created.");
            queryClient.invalidateQueries({ queryKey: ['floorPlans'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error("Creation Failed", { description: error.response?.data?.message || "Something went wrong." });
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateFloorPlan,
        onSuccess: () => {
            toast.success("Floor plan updated.");
            queryClient.invalidateQueries({ queryKey: ['floorPlans'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error("Update Failed", { description: error.response?.data?.message || "Something went wrong." });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteFloorPlan,
        onSuccess: () => {
            toast.success("Floor plan deleted.");
            queryClient.invalidateQueries({ queryKey: ['floorPlans'] });
        },
        onError: () => {
            toast.error("Failed to delete floor plan.");
        }
    });

    useEffect(() => {
        document.title = "Floor Plans | Binhinav Admin";
    }, []);

    const handleOpenDialog = (fp: FloorPlan | null = null) => {
        setEditingFloorPlan(fp);
        form.reset(fp ? { name: fp.name } : { name: "", image: undefined });
        setIsDialogOpen(true);
    };

    const onSubmit = (data: FloorPlanFormValues) => {
        const formData = new FormData();
        formData.append('name', data.name);
        if (data.image && data.image[0]) {
            formData.append('image', data.image[0]);
        }

        if (!editingFloorPlan && (!data.image || !data.image[0])) {
            form.setError('image', { message: 'Image is required for new floor plans.' });
            return;
        }

        if (editingFloorPlan) {
            updateMutation.mutate({ id: editingFloorPlan.id, formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => {
        if (!window.confirm("Are you sure? Deleting a floor plan will also delete all associated places.")) return;
        deleteMutation.mutate(id);
    }

    const isMutating = createMutation.isPending || updateMutation.isPending;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Floor Plans</h2>
                    <p className="text-muted-foreground">Manage floor layout images (e.g., Ground Floor, Level 1).</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Floor Plan
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading && <p>Loading floor plans...</p>}
                    {isError && <p className="text-destructive">Failed to load floor plans.</p>}
                    {!isLoading && !isError && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Image</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {floorPlans.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            No floor plans found. Click "Add New Floor Plan" to start.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    floorPlans.map((fp) => (
                                        <TableRow key={fp.id}>
                                            <TableCell>
                                                <img src={getAssetUrl(fp.imageUrl)} alt={fp.name} className="h-16 w-24 object-cover rounded-md border" />
                                            </TableCell>
                                            <TableCell className="font-medium">{fp.name}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => setViewingImageUrl(fp.imageUrl)} disabled={deleteMutation.isPending}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(fp)} disabled={deleteMutation.isPending}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(fp.id)} disabled={deleteMutation.isPending}>
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
                        <DialogTitle>{editingFloorPlan ? "Edit Floor Plan" : "Create New Floor Plan"}</DialogTitle>
                        <DialogDescription>
                            Provide a name and image for the floor layout.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Floor Name (e.g., "Ground Floor", "Level 1")</Label>
                            <Input id="name" {...form.register("name")} />
                            <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="image">Floor Plan Image</Label>
                            <Input id="image" type="file" accept="image/*" {...form.register("image")} />
                            <p className="text-sm text-muted-foreground">
                                {editingFloorPlan ? "Upload a new image to replace the current one." : ""}
                            </p>
                            <p className="text-sm text-red-500">{typeof form.formState.errors.image?.message === "string" ? form.formState.errors.image.message : ""}</p>
                        </div>
                        {editingFloorPlan && editingFloorPlan.imageUrl && (
                            <div className="space-y-2">
                                <Label>Current Image</Label>
                                <img
                                    src={getAssetUrl(editingFloorPlan.imageUrl)}
                                    alt={editingFloorPlan.name}
                                    className="h-40 w-full object-contain rounded-md border bg-muted/30"
                                />
                            </div>
                        )}
                        <Button type="submit" disabled={isMutating} className="w-full">
                            {isMutating ? "Saving..." : "Save Floor Plan"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingImageUrl} onOpenChange={(isOpen) => !isOpen && setViewingImageUrl(null)}>
                <DialogContent className="max-w-4xl p-4">
                    <DialogHeader>
                        <DialogTitle>Floor Plan Preview</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <img
                            src={getAssetUrl(viewingImageUrl)}
                            alt="Floor Plan Preview"
                            className="w-full h-auto max-h-[80vh] object-contain rounded-md"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
