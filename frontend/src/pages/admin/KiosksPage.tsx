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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

interface FloorPlan { id: string; name: string; }
interface Kiosk {
    id: string;
    name: string;
    locationX: number;
    locationY: number;
    floorPlan: FloorPlan;
}

const kioskSchema = z.object({
    name: z.string().min(2, "Name is required."),
    locationX: z.coerce.number().refine(val => !isNaN(val), { message: "Must be a number" }),
    locationY: z.coerce.number().refine(val => !isNaN(val), { message: "Must be a number" }),
    floorPlanId: z.uuid("A floor plan must be selected."),
});

type KioskFormValues = z.infer<typeof kioskSchema>;

export default function KiosksPage() {
    const [kiosks, setKiosks] = useState<Kiosk[]>([]);
    const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingKiosk, setEditingKiosk] = useState<Kiosk | null>(null);

    const form = useForm({ resolver: zodResolver(kioskSchema) });

    const fetchData = async () => {
        try {
            const [kiosksRes, floorPlansRes] = await Promise.all([
                apiClient.get<Kiosk[]>("/kiosks"),
                apiClient.get<FloorPlan[]>("/floor-plans"),
            ]);
            setKiosks(kiosksRes.data);
            setFloorPlans(floorPlansRes.data);
        } catch (error) {
            toast.error("Failed to fetch data");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenDialog = (kiosk: Kiosk | null = null) => {
        setEditingKiosk(kiosk);
        if (kiosk) {
            form.reset({
                name: kiosk.name,
                locationX: kiosk.locationX,
                locationY: kiosk.locationY,
                floorPlanId: kiosk.floorPlan.id,
            });
        } else {
            form.reset({ name: "", locationX: 0, locationY: 0, floorPlanId: undefined });
        }
        setIsDialogOpen(true);
    };

    const onSubmit = async (data: KioskFormValues) => {
        try {
            if (editingKiosk) {
                await apiClient.patch(`/kiosks/${editingKiosk.id}`, data);
                toast.success("Kiosk updated.");
            } else {
                await apiClient.post("/kiosks", data);
                toast.success("Kiosk created.");
            }
            fetchData();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error("An error occurred", {
                description: error.response?.data?.message || "Something went wrong.",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this kiosk?")) return;
        try {
            await apiClient.delete(`/kiosks/${id}`);
            toast.success("Kiosk deleted.");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete kiosk");
        }
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Kiosks</h2>
                    <p className="text-muted-foreground">Manage physical kiosk locations.</p>
                </div>
                <Button onClick={() => handleOpenDialog()} disabled={floorPlans.length === 0}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Kiosk
                </Button>
            </div>
            {floorPlans.length === 0 && <p className="text-orange-500 mb-4">You must create a Floor Plan before you can add a Kiosk.</p>}

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Location (X, Y)</TableHead>
                                <TableHead>Floor Plan</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {kiosks.map((kiosk) => (
                                <TableRow key={kiosk.id}>
                                    <TableCell className="font-medium">{kiosk.name}</TableCell>
                                    <TableCell>{`(${kiosk.locationX}, ${kiosk.locationY})`}</TableCell>
                                    <TableCell>{kiosk.floorPlan?.name ?? 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(kiosk)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(kiosk.id)}>
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
                        <DialogTitle>{editingKiosk ? "Edit Kiosk" : "Create New Kiosk"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div>
                            <Label htmlFor="name">Kiosk Name</Label>
                            <Input id="name" {...form.register("name")} />
                            <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="locationX">Location X</Label>
                                <Input id="locationX" type="number" step="any" {...form.register("locationX")} />
                                <p className="text-sm text-red-500">{form.formState.errors.locationX?.message}</p>
                            </div>
                            <div>
                                <Label htmlFor="locationY">Location Y</Label>
                                <Input id="locationY" type="number" step="any" {...form.register("locationY")} />
                                <p className="text-sm text-red-500">{form.formState.errors.locationY?.message}</p>
                            </div>
                        </div>
                        <div>
                            <Label>Floor Plan</Label>
                            <Select onValueChange={(value) => form.setValue('floorPlanId', value)} defaultValue={form.getValues('floorPlanId')}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a floor plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {floorPlans.map(fp => <SelectItem key={fp.id} value={fp.id}>{fp.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-red-500">{form.formState.errors.floorPlanId?.message}</p>
                        </div>
                        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                            {form.formState.isSubmitting ? "Saving..." : "Save Kiosk"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
