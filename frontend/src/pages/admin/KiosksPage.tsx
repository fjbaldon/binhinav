import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient, getAssetUrl } from "@/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Target, ZoomIn, ZoomOut, MapPin } from 'lucide-react';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

interface FloorPlan { id: string; name: string; imageUrl: string; }
interface Kiosk {
    id: string;
    name: string;
    locationX: number;
    locationY: number;
    floorPlan: FloorPlan;
}

const kioskSchema = z.object({
    name: z.string().min(2, "Name is required."),
    locationX: z.coerce.number({ message: "Please select a location on the map." }),
    locationY: z.coerce.number({ message: "Please select a location on the map." }),
    floorPlanId: z.uuid("A floor plan must be selected."),
});

type KioskFormValues = z.infer<typeof kioskSchema>;

const Controls = () => {
    const { zoomIn, zoomOut } = useControls();
    return (
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
            <Button size="icon" type="button" onClick={() => zoomIn()}><ZoomIn /></Button>
            <Button size="icon" type="button" onClick={() => zoomOut()}><ZoomOut /></Button>
        </div>
    );
};

export default function KiosksPage() {
    const [kiosks, setKiosks] = useState<Kiosk[]>([]);
    const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingKiosk, setEditingKiosk] = useState<Kiosk | null>(null);
    const [viewingKiosk, setViewingKiosk] = useState<Kiosk | null>(null);
    const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);

    const form = useForm({ resolver: zodResolver(kioskSchema) });
    const watchedFloorPlanId = form.watch("floorPlanId");
    const selectedFloorPlan = floorPlans.find(fp => fp.id === watchedFloorPlanId);

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
        document.title = "Kiosks | Binhinav Admin";
        fetchData();
    }, []);

    const handleOpenDialog = (kiosk: Kiosk | null = null) => {
        if (!kiosk && floorPlans.length === 0) {
            toast.warning("Cannot Add Kiosk", { description: "You must create a Floor Plan first." });
            return;
        }

        setEditingKiosk(kiosk);
        if (kiosk) {
            form.reset({
                name: kiosk.name,
                locationX: kiosk.locationX,
                locationY: kiosk.locationY,
                floorPlanId: kiosk.floorPlan.id,
            });
            setSelectedCoords([kiosk.locationX, kiosk.locationY]);
        } else {
            form.reset({ name: "", locationX: undefined, locationY: undefined, floorPlanId: undefined });
            setSelectedCoords(null);
        }
        setIsDialogOpen(true);
    };

    const handleMapDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const x = event.nativeEvent.offsetX;
        const y = event.nativeEvent.offsetY;

        setSelectedCoords([x, y]);
        form.setValue("locationX", x, { shouldValidate: true });
        form.setValue("locationY", y, { shouldValidate: true });
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
            toast.error("An error occurred", { description: error.response?.data?.message || "Something went wrong." });
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
                    <p className="text-muted-foreground">Manage physical kiosk locations and their positions on the map.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Kiosk
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Floor Plan</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {kiosks.map((kiosk) => (
                                <TableRow key={kiosk.id}>
                                    <TableCell className="font-medium">{kiosk.name}</TableCell>
                                    <TableCell>{kiosk.floorPlan?.name ?? 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" title="View on map" onClick={() => setViewingKiosk(kiosk)}>
                                            <MapPin className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Edit kiosk" onClick={() => handleOpenDialog(kiosk)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Delete kiosk" className="text-red-500" onClick={() => handleDelete(kiosk.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit/Create Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingKiosk ? "Edit Kiosk" : "Create New Kiosk"}</DialogTitle>
                        <DialogDescription>
                            Provide a name, select a floor plan, and then double-click on the map to set the kiosk's location.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Kiosk Name</Label>
                                <Input id="name" {...form.register("name")} />
                                <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Floor Plan</Label>
                                <Select onValueChange={(value) => { form.setValue('floorPlanId', value); setSelectedCoords(null); form.setValue('locationX', undefined); form.setValue('locationY', undefined); }} defaultValue={form.getValues('floorPlanId')}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a floor plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {floorPlans.map(fp => <SelectItem key={fp.id} value={fp.id}>{fp.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <p className="text-sm text-red-500">{form.formState.errors.floorPlanId?.message}</p>
                            </div>
                        </div>

                        {selectedFloorPlan && (
                            <div className="space-y-2">
                                <Label>Set Location</Label>
                                <div className="relative w-full rounded-md border bg-muted/20 overflow-hidden">
                                    <TransformWrapper
                                        doubleClick={{ disabled: true }}
                                        panning={{ disabled: false, velocityDisabled: true }}
                                    >
                                        <Controls />
                                        <TransformComponent
                                            wrapperStyle={{ maxHeight: '60vh', width: '100%' }}
                                            contentStyle={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                                            contentProps={{
                                                onDoubleClick: handleMapDoubleClick
                                            }}
                                        >
                                            <div className="relative">
                                                <img
                                                    src={getAssetUrl(selectedFloorPlan.imageUrl)}
                                                    alt={selectedFloorPlan.name}
                                                />
                                                {selectedCoords && (
                                                    <Target
                                                        className="absolute text-red-500 w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                                        style={{ left: selectedCoords[0], top: selectedCoords[1] }}
                                                    />
                                                )}
                                            </div>
                                        </TransformComponent>
                                    </TransformWrapper>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Current Coordinates: {selectedCoords ? `(${selectedCoords[0].toFixed(0)}, ${selectedCoords[1].toFixed(0)})` : 'Double-click on the map to set'}
                                </p>
                                <p className="text-sm text-red-500">{form.formState.errors.locationX?.message}</p>
                            </div>
                        )}

                        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                            {form.formState.isSubmitting ? "Saving..." : "Save Kiosk"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View Location Dialog */}
            <Dialog open={!!viewingKiosk} onOpenChange={(isOpen) => !isOpen && setViewingKiosk(null)}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Location for: {viewingKiosk?.name}</DialogTitle>
                        <DialogDescription>
                            Floor Plan: {viewingKiosk?.floorPlan.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative mt-4 w-full rounded-md border bg-muted/20 overflow-hidden">
                        <img
                            src={getAssetUrl(viewingKiosk?.floorPlan.imageUrl)}
                            alt={viewingKiosk?.floorPlan.name}
                            className="max-h-[70vh] w-full object-contain"
                        />
                        {viewingKiosk && (
                            <Target
                                className="absolute text-red-500 w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ left: viewingKiosk.locationX, top: viewingKiosk.locationY }}
                                strokeWidth={2.5}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
