import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient, getAssetUrl } from "@/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

interface FloorPlan {
    id: string;
    name: string;
    imageUrl: string;
}

const floorPlanSchema = z.object({
    name: z.string().min(1, "Name is required."),
    image: z.any()
});

type FloorPlanFormValues = z.infer<typeof floorPlanSchema>;

export default function FloorPlansPage() {
    const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFloorPlan, setEditingFloorPlan] = useState<FloorPlan | null>(null);

    const form = useForm<FloorPlanFormValues>({ resolver: zodResolver(floorPlanSchema) });

    const fetchFloorPlans = async () => {
        try {
            const response = await apiClient.get<FloorPlan[]>("/floor-plans");
            setFloorPlans(response.data);
        } catch (error) {
            toast.error("Failed to fetch floor plans");
        }
    };

    useEffect(() => {
        fetchFloorPlans();
    }, []);

    const handleOpenDialog = (fp: FloorPlan | null = null) => {
        setEditingFloorPlan(fp);
        if (fp) {
            form.reset({ name: fp.name });
        } else {
            form.reset({ name: "", image: undefined });
        }
        setIsDialogOpen(true);
    };

    const onSubmit = async (data: FloorPlanFormValues) => {
        const formData = new FormData();
        formData.append('name', data.name);
        if (data.image && data.image[0]) {
            formData.append('image', data.image[0]);
        }

        // Image is required for creation, but not for update
        if (!editingFloorPlan && (!data.image || !data.image[0])) {
            form.setError('image', { message: 'Image is required for new floor plans.' });
            return;
        }

        try {
            if (editingFloorPlan) {
                await apiClient.patch(`/floor-plans/${editingFloorPlan.id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                toast.success("Success", {
                    description: "Floor plan updated.",
                });
            } else {
                await apiClient.post("/floor-plans", formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                toast.success("Floor plan created.");
            }
            fetchFloorPlans();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error("An error occurred", {
                description: error.response?.data?.message || "Something went wrong.",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure? Deleting a floor plan will also delete all associated places.")) return;
        try {
            await apiClient.delete(`/floor-plans/${id}`);
            toast.success("Floor plan deleted.");
            fetchFloorPlans();
        } catch (error) {
            toast.error("Failed to delete floor plan");
        }
    }

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
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {floorPlans.map((fp) => (
                                <TableRow key={fp.id}>
                                    <TableCell>
                                        <img src={getAssetUrl(fp.imageUrl)} alt={fp.name} className="h-16 w-24 object-cover rounded-md border" />
                                    </TableCell>
                                    <TableCell className="font-medium">{fp.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(fp)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(fp.id)}>
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
                        <DialogTitle>{editingFloorPlan ? "Edit Floor Plan" : "Create New Floor Plan"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div>
                            <Label htmlFor="name">Floor Name (e.g., "Ground Floor", "Level 1")</Label>
                            <Input id="name" {...form.register("name")} />
                            <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                        </div>
                        <div>
                            <Label htmlFor="image">Floor Plan Image</Label>
                            <Input id="image" type="file" accept="image/*" {...form.register("image")} />
                            <p className="text-sm text-muted-foreground">
                                {editingFloorPlan ? "Upload a new image to replace the current one." : ""}
                            </p>
                            <p className="text-sm text-red-500">{typeof form.formState.errors.image?.message === "string" ? form.formState.errors.image?.message : ""}</p>
                        </div>
                        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                            {form.formState.isSubmitting ? "Saving..." : "Save Floor Plan"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
