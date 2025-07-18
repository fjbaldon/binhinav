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
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit, Trash2, Target, ZoomIn, ZoomOut, MapPin } from 'lucide-react';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";

// Interfaces for related data
interface Category { id: string; name: string; }
interface FloorPlan { id: string; name: string; imageUrl: string; }
interface Merchant { id: string; name: string; }
interface Place {
    id: string;
    name: string;
    locationX: number;
    locationY: number;
    category?: Category;
    floorPlan: FloorPlan;
    merchant?: Merchant;
}

// Schema for form validation, simplified for admin
const placeSchema = z.object({
    name: z.string().min(2, "Name is required."),
    locationX: z.coerce.number({ message: "Please select a location on the map." }),
    locationY: z.coerce.number({ message: "Please select a location on the map." }),
    floorPlanId: z.uuid("A floor plan must be selected."),
    merchantId: z.uuid().optional(),
});

type PlaceFormValues = z.infer<typeof placeSchema>;

const Controls = () => {
    const { zoomIn, zoomOut } = useControls();
    return (
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
            <Button size="icon" type="button" onClick={() => zoomIn()}><ZoomIn /></Button>
            <Button size="icon" type="button" onClick={() => zoomOut()}><ZoomOut /></Button>
        </div>
    );
};

export default function PlacesPage() {
    // State for all data types
    const [places, setPlaces] = useState<Place[]>([]);
    const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
    const [merchants, setMerchants] = useState<Merchant[]>([]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlace, setEditingPlace] = useState<Place | null>(null);
    const [viewingPlace, setViewingPlace] = useState<Place | null>(null);
    const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);

    const form = useForm({
        resolver: zodResolver(placeSchema),
    });

    const watchedFloorPlanId = form.watch("floorPlanId");
    const selectedFloorPlan = floorPlans.find(fp => fp.id === watchedFloorPlanId);

    // Fetch all required data in parallel
    const fetchData = async () => {
        try {
            const [placesRes, fpRes, merchRes] = await Promise.all([
                apiClient.get<Place[]>("/places"),
                apiClient.get<FloorPlan[]>("/floor-plans"),
                apiClient.get<Merchant[]>("/merchants"),
            ]);
            setPlaces(placesRes.data);
            setFloorPlans(fpRes.data);
            setMerchants(merchRes.data);
        } catch (error) {
            toast.error("Failed to fetch page data");
        }
    };

    useEffect(() => {
        document.title = "Places | Binhinav Admin";
        fetchData();
    }, []);

    const handleOpenDialog = async (place: Place | null = null) => {
        if (!place && floorPlans.length === 0) {
            toast.warning("Cannot Add Place", {
                description: "You must create a Floor Plan before you can add a Place.",
            });
            return;
        }

        setEditingPlace(place);
        if (place) {
            const response = await apiClient.get<Place>(`/places/${place.id}`);
            const fullPlace = response.data;
            form.reset({
                name: fullPlace.name,
                locationX: fullPlace.locationX,
                locationY: fullPlace.locationY,
                floorPlanId: fullPlace.floorPlan.id,
                merchantId: fullPlace.merchant?.id,
            });
            setSelectedCoords([fullPlace.locationX, fullPlace.locationY]);
        } else {
            form.reset();
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

    const onSubmit = async (data: PlaceFormValues) => {
        try {
            if (editingPlace) {
                await apiClient.patch(`/places/${editingPlace.id}`, data);
                toast.success("Place updated.");
            } else {
                await apiClient.post("/places", data);
                toast.success("Place created.");
            }
            fetchData();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error("An error occurred", {
                description: error.response?.data?.message?.toString() || "Something went wrong.",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this place? This will also unassign any merchant linked to it.")) return;
        try {
            await apiClient.delete(`/places/${id}`);
            toast.success("Place deleted.");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete place");
        }
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Places</h2>
                    <p className="text-muted-foreground">Manage store locations and assign merchants to them.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Place
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Floor Plan</TableHead>
                                <TableHead>Assigned Merchant</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {places.map((place) => (
                                <TableRow key={place.id}>
                                    <TableCell className="font-medium">{place.name}</TableCell>
                                    <TableCell>{place.floorPlan?.name ?? 'N/A'}</TableCell>
                                    <TableCell>{place.merchant?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" title="View on map" onClick={() => setViewingPlace(place)}>
                                            <MapPin className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Edit place" onClick={() => handleOpenDialog(place)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" title="Delete place" className="text-red-500" onClick={() => handleDelete(place.id)}>
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
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingPlace ? "Edit Place" : "Create New Place"}</DialogTitle>
                        <DialogDescription>Set the place's name, floor plan, and location by double-clicking the map.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] pr-6">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Place Name</Label>
                                    <Input id="name" {...form.register("name")} />
                                    {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Assign Merchant (Optional)</Label>
                                    <Select onValueChange={(v) => form.setValue('merchantId', v === 'none' ? undefined : v)} defaultValue={form.getValues('merchantId')}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Assign Merchant" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Unassigned</SelectItem>
                                            {merchants.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Floor Plan</Label>
                                <Select onValueChange={(v) => { form.setValue('floorPlanId', v); setSelectedCoords(null); form.setValue('locationX', undefined); form.setValue('locationY', undefined); }} defaultValue={form.getValues('floorPlanId')}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="* Select a Floor Plan to place the pin" /></SelectTrigger>
                                    <SelectContent>{floorPlans.map(fp => <SelectItem key={fp.id} value={fp.id}>{fp.name}</SelectItem>)}</SelectContent>
                                </Select>
                                {form.formState.errors.floorPlanId && <p className="text-sm text-red-500">{form.formState.errors.floorPlanId.message}</p>}
                            </div>

                            {selectedFloorPlan && (
                                <div className="space-y-2">
                                    <Label>Set Location</Label>
                                    <div className="relative w-full rounded-md border bg-muted/20 overflow-hidden">
                                        <TransformWrapper doubleClick={{ disabled: true }} panning={{ disabled: false, velocityDisabled: true }}>
                                            <Controls />
                                            <TransformComponent wrapperStyle={{ maxHeight: '60vh', width: '100%' }} contentStyle={{ width: '100%', height: '100%', cursor: 'crosshair' }} contentProps={{ onDoubleClick: handleMapDoubleClick }}>
                                                <div className="relative">
                                                    <img src={getAssetUrl(selectedFloorPlan.imageUrl)} alt={selectedFloorPlan.name} />
                                                    {selectedCoords && (
                                                        <Target className="absolute text-red-500 w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: selectedCoords[0], top: selectedCoords[1] }} />
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
                                {form.formState.isSubmitting ? "Saving..." : "Save Place"}
                            </Button>
                        </form>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* View Location Dialog */}
            <Dialog open={!!viewingPlace} onOpenChange={(isOpen) => !isOpen && setViewingPlace(null)}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Location for: {viewingPlace?.name}</DialogTitle>
                        <DialogDescription>Floor Plan: {viewingPlace?.floorPlan.name}</DialogDescription>
                    </DialogHeader>
                    <div className="relative mt-4 w-full rounded-md border bg-muted/20 overflow-hidden">
                        <img src={getAssetUrl(viewingPlace?.floorPlan.imageUrl)} alt={viewingPlace?.floorPlan.name} className="max-h-[70vh] w-full object-contain" />
                        {viewingPlace && (
                            <Target className="absolute text-red-500 w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: viewingPlace.locationX, top: viewingPlace.locationY }} strokeWidth={2.5} />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
