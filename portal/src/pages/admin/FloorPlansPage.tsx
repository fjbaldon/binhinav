import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFloorPlans, createFloorPlan, updateFloorPlan, deleteFloorPlan } from "@/api/floor-plans";
import { type FloorPlan } from "@/api/types";
import { getAssetUrl } from "@/api";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { DataTable } from "@/components/shared/DataTable";

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

    const { data: floorPlans = [], isLoading, isError } = useQuery({
        queryKey: ['floorPlans'],
        queryFn: getFloorPlans
    });

    const createMutation = useMutation({
        mutationFn: createFloorPlan,
        onSuccess: () => {
            toast.success("Floor plan created.");
            queryClient.invalidateQueries({ queryKey: ['floorPlans'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => toast.error("Creation Failed", { description: error.response?.data?.message || "Something went wrong." })
    });

    const updateMutation = useMutation({
        mutationFn: updateFloorPlan,
        onSuccess: () => {
            toast.success("Floor plan updated.");
            queryClient.invalidateQueries({ queryKey: ['floorPlans'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => toast.error("Update Failed", { description: error.response?.data?.message || "Something went wrong." })
    });

    const deleteMutation = useMutation({
        mutationFn: deleteFloorPlan,
        onSuccess: () => {
            toast.success("Floor plan deleted.");
            queryClient.invalidateQueries({ queryKey: ['floorPlans'] });
        },
        onError: () => toast.error("Failed to delete floor plan.")
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

    const handleDelete = (id: string) => deleteMutation.mutate(id);

    const isMutating = createMutation.isPending || updateMutation.isPending;

    const columns: ColumnDef<FloorPlan>[] = [
        {
            accessorKey: "imageUrl",
            header: "Preview",
            cell: ({ row }) => (
                <img src={getAssetUrl(row.original.imageUrl)} alt={row.original.name} className="h-16 w-24 object-contain rounded-md border" />
            ),
        },
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
        },
        {
            id: "usage",
            header: "Usage",
            cell: ({ row }) => {
                const placesCount = row.original.places?.length || 0;
                const kiosksCount = row.original.kiosks?.length || 0;
                return (
                    <div className="text-sm text-muted-foreground">
                        <div>{placesCount} {placesCount === 1 ? 'Place' : 'Places'}</div>
                        <div>{kiosksCount} {kiosksCount === 1 ? 'Kiosk' : 'Kiosks'}</div>
                    </div>
                );
            },
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setViewingImageUrl(row.original.imageUrl)} disabled={deleteMutation.isPending}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(row.original)} disabled={deleteMutation.isPending}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <ConfirmationDialog
                        title="Delete this floor plan?"
                        description="This will also delete all associated places and kiosks. This action cannot be undone."
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
            ),
        },
    ];

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
                        <DataTable columns={columns} data={floorPlans} />
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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4" autoComplete="off">
                        <div className="space-y-2">
                            <Label htmlFor="name">Floor Name (e.g., "Ground Floor", "Level 1")</Label>
                            <Input id="name" {...form.register("name")} />
                            <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="image">Floor Plan Image</Label>
                            <Input id="image" type="file" accept="image/jpeg,image/png,image/gif,image/svg+xml" {...form.register("image")} />
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
