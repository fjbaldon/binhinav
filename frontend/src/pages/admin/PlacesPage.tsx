import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaces, createPlace, updatePlace, deletePlace, getPlaceById } from "@/api/places";
import { type Place } from "@/api/types";
import { getFloorPlans } from "@/api/floor-plans";
import { getMerchants } from "@/api/merchants";
import { getAssetUrl } from "@/api";

// UI Components
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

const placeSchema = z.object({
    name: z.string().min(2, "Name is required."),
    locationX: z.coerce.number({ error: "Please select a location on the map." }),
    locationY: z.coerce.number({ error: "Please select a location on the map." }),
    floorPlanId: z.uuid({ error: "A floor plan must be selected." }),
    merchantId: z.uuid().nullable().optional(),
});

type PlaceFormValues = z.infer<typeof placeSchema>;

const Controls = () => {
    const { zoomIn, zoomOut } = useControls();
    return (
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-1"><Button size="icon" type="button" onClick={() => zoomIn()}><ZoomIn /></Button><Button size="icon" type="button" onClick={() => zoomOut()}><ZoomOut /></Button></div>
    );
};

export default function PlacesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlace, setEditingPlace] = useState<Place | null>(null);
    const [viewingPlace, setViewingPlace] = useState<Place | null>(null);
    const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);

    const form = useForm({ resolver: zodResolver(placeSchema) });
    const watchedFloorPlanId = form.watch("floorPlanId");

    const queryClient = useQueryClient();

    // --- DATA FETCHING (READ) ---
    // Fetch all necessary data in parallel
    const { data: places = [], isLoading: isLoadingPlaces } = useQuery({ queryKey: ['places'], queryFn: getPlaces });
    const { data: floorPlans = [], isLoading: isLoadingFloorPlans } = useQuery({ queryKey: ['floorPlans'], queryFn: getFloorPlans });
    const { data: merchants = [], isLoading: isLoadingMerchants } = useQuery({ queryKey: ['merchants'], queryFn: getMerchants });

    const selectedFloorPlan = useMemo(() => floorPlans.find(fp => fp.id === watchedFloorPlanId), [floorPlans, watchedFloorPlanId]);

    // --- DATA MUTATIONS ---
    const createMutation = useMutation({
        mutationFn: createPlace,
        onSuccess: () => {
            toast.success("Place created.");
            queryClient.invalidateQueries({ queryKey: ['places'] });
            setIsDialogOpen(false);
        },
        onError: (err: any) => toast.error("Creation failed", { description: err.response?.data?.message }),
    });

    const updateMutation = useMutation({
        mutationFn: updatePlace,
        onSuccess: () => {
            toast.success("Place updated.");
            queryClient.invalidateQueries({ queryKey: ['places'] });
            setIsDialogOpen(false);
        },
        onError: (err: any) => toast.error("Update failed", { description: err.response?.data?.message }),
    });

    const deleteMutation = useMutation({
        mutationFn: deletePlace,
        onSuccess: () => {
            toast.success("Place deleted.");
            queryClient.invalidateQueries({ queryKey: ['places'] });
        },
        onError: () => toast.error("Failed to delete place"),
    });

    // --- LOGIC & MEMOS ---
    const availableMerchants = useMemo(() => {
        const assignedMerchantIds = new Set(places.map(p => p.merchant?.id).filter(Boolean));
        return merchants.filter(m => !assignedMerchantIds.has(m.id) || m.id === editingPlace?.merchant?.id);
    }, [merchants, places, editingPlace]);

    useEffect(() => {
        document.title = "Places | Binhinav Admin";
    }, []);

    const handleOpenDialog = async (place: Place | null = null) => {
        if (!place && floorPlans.length === 0) {
            toast.warning("Cannot Add Place", { description: "You must create a Floor Plan first." });
            return;
        }
        setEditingPlace(place);
        if (place) {
            // Fetch fresh data for the specific item being edited to ensure it's up to date.
            const fullPlace = await queryClient.fetchQuery({ queryKey: ['place', place.id], queryFn: () => getPlaceById(place.id) });
            form.reset({ name: fullPlace.name, locationX: fullPlace.locationX, locationY: fullPlace.locationY, floorPlanId: fullPlace.floorPlan.id, merchantId: fullPlace.merchant?.id });
            setSelectedCoords([fullPlace.locationX, fullPlace.locationY]);
        } else {
            form.reset({ name: '', locationX: undefined, locationY: undefined, floorPlanId: undefined, merchantId: undefined });
            setSelectedCoords(null);
        }
        setIsDialogOpen(true);
    };

    const handleMapDoubleClick = (event: React.MouseEvent<HTMLDivElement>) => {
        const { offsetX, offsetY } = event.nativeEvent;
        setSelectedCoords([offsetX, offsetY]);
        form.setValue("locationX", offsetX, { shouldValidate: true });
        form.setValue("locationY", offsetY, { shouldValidate: true });
    };

    const onSubmit = (data: PlaceFormValues) => {
        if (editingPlace) {
            updateMutation.mutate({ id: editingPlace.id, payload: data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = (id: string) => {
        if (!window.confirm("Are you sure? This will unassign any linked merchant.")) return;
        deleteMutation.mutate(id);
    };

    const isLoading = isLoadingPlaces || isLoadingFloorPlans || isLoadingMerchants;
    const isMutating = createMutation.isPending || updateMutation.isPending;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-3xl font-bold tracking-tight">Places</h2><p className="text-muted-foreground">Manage store locations and assign merchants to them.</p></div>
                <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Add New Place</Button>
            </div>
            <Card>
                <CardContent className="pt-6">
                    {isLoading && <p>Loading data...</p>}
                    {!isLoading && (
                        <Table>
                            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Floor Plan</TableHead><TableHead>Assigned Merchant</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {places.map((place) => (
                                    <TableRow key={place.id}>
                                        <TableCell className="font-medium">{place.name}</TableCell>
                                        <TableCell>{place.floorPlan?.name ?? 'N/A'}</TableCell>
                                        <TableCell>{place.merchant?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" title="View on map" onClick={() => setViewingPlace(place)}><MapPin className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" title="Edit place" onClick={() => handleOpenDialog(place)}><Edit className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="icon" title="Delete place" className="text-red-500" onClick={() => handleDelete(place.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader><DialogTitle>{editingPlace ? "Edit Place" : "Create New Place"}</DialogTitle><DialogDescription>Set the place's name, floor plan, and location by double-clicking the map.</DialogDescription></DialogHeader>
                    <ScrollArea className="max-h-[70vh] pr-6">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-1 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><Label htmlFor="name">Place Name</Label><Input id="name" {...form.register("name")} /><p className="text-sm text-red-500">{form.formState.errors.name?.message}</p></div>
                                <div className="space-y-2">
                                    <Label>Assign Merchant (Optional)</Label>
                                    <Select onValueChange={(v) => form.setValue('merchantId', v === 'none' ? null : v)} value={form.getValues('merchantId') || 'none'}>
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Assign Merchant" /></SelectTrigger>
                                        <SelectContent><SelectItem value="none">Unassigned</SelectItem>{availableMerchants.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Floor Plan</Label>
                                <Select onValueChange={(v) => { form.setValue('floorPlanId', v, { shouldValidate: true }); setSelectedCoords(null); form.setValue('locationX', undefined, { shouldValidate: true }); form.setValue('locationY', undefined, { shouldValidate: true }); }} value={form.getValues('floorPlanId')}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="* Select a Floor Plan to place the pin" /></SelectTrigger>
                                    <SelectContent>{floorPlans.map(fp => <SelectItem key={fp.id} value={fp.id}>{fp.name}</SelectItem>)}</SelectContent>
                                </Select><p className="text-sm text-red-500">{form.formState.errors.floorPlanId?.message}</p>
                            </div>
                            {selectedFloorPlan && (
                                <div className="space-y-2">
                                    <Label>Set Location</Label>
                                    <div className="relative w-full rounded-md border bg-muted/20 overflow-hidden">
                                        <TransformWrapper doubleClick={{ disabled: true }} panning={{ disabled: false, velocityDisabled: true }}><Controls /><TransformComponent wrapperStyle={{ maxHeight: '60vh', width: '100%' }} contentStyle={{ width: '100%', height: '100%', cursor: 'crosshair' }} contentProps={{ onDoubleClick: handleMapDoubleClick }}>
                                            <div className="relative"><img src={getAssetUrl(selectedFloorPlan.imageUrl)} alt={selectedFloorPlan.name} />{selectedCoords && (<Target className="absolute text-red-500 w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: selectedCoords[0], top: selectedCoords[1] }} />)}</div>
                                        </TransformComponent></TransformWrapper>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Current Coordinates: {selectedCoords ? `(${selectedCoords[0].toFixed(0)}, ${selectedCoords[1].toFixed(0)})` : 'Double-click on the map to set'}</p>
                                    <p className="text-sm text-red-500">{form.formState.errors.locationX?.message}</p>
                                </div>
                            )}
                            <Button type="submit" disabled={isMutating} className="w-full">{isMutating ? "Saving..." : "Save Place"}</Button>
                        </form>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingPlace} onOpenChange={(isOpen) => !isOpen && setViewingPlace(null)}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader><DialogTitle>Location for: {viewingPlace?.name}</DialogTitle><DialogDescription>Floor Plan: {viewingPlace?.floorPlan.name}</DialogDescription></DialogHeader>
                    <div className="relative mt-4 w-full rounded-md border bg-muted/20 overflow-hidden"><img src={getAssetUrl(viewingPlace?.floorPlan.imageUrl)} alt={viewingPlace?.floorPlan.name} className="max-h-[70vh] w-full object-contain" />{viewingPlace && (<Target className="absolute text-red-500 w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: viewingPlace.locationX, top: viewingPlace.locationY }} strokeWidth={2.5} />)}</div>
                </DialogContent>
            </Dialog>
        </>
    );
}
