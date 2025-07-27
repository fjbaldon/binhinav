import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPlaces, createPlace, updatePlace, deletePlace, getPlaceById } from "@/api/places";
import type { Place, PlacePayload, UpdatePlacePayload } from "@/api/types";
import { getFloorPlans } from "@/api/floor-plans";
import { getMerchants } from "@/api/merchants";
import { getAssetUrl } from "@/api";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, Edit, Trash2, Target, ZoomIn, ZoomOut, MapPin, Building2, ArrowUpDown } from 'lucide-react';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { DataTable } from "@/components/shared/DataTable";
import { DynamicIcon } from "@/components/shared/DynamicIcon";

const placeSchema = z.object({
    name: z.string().min(2, "Name is required."),
    locationX: z.coerce.number({ error: "Please select a location on the map." }),
    locationY: z.coerce.number({ error: "Please select a location on the map." }),
    floorPlanId: z.uuid({ error: "A floor plan must be selected." }),
    merchantId: z.string().optional(),
    newMerchantName: z.string().optional(),
    newMerchantUsername: z.string().optional(),
    newMerchantPassword: z.string().optional(),
}).refine((data) => {
    if (data.merchantId === 'new') {
        return (
            data.newMerchantName && data.newMerchantName.length >= 2 &&
            data.newMerchantUsername && data.newMerchantUsername.length >= 4 &&
            data.newMerchantPassword && data.newMerchantPassword.length >= 8
        );
    }
    return true;
}, {
    message: "Invalid merchant data",
    path: ['merchantId']
}).refine((data) => {
    if (data.merchantId === 'new') {
        return data.newMerchantName && data.newMerchantName.length >= 2;
    }
    return true;
}, {
    message: "Name is required.",
    path: ['newMerchantName']
}).refine((data) => {
    if (data.merchantId === 'new') {
        return data.newMerchantUsername && data.newMerchantUsername.length >= 4;
    }
    return true;
}, {
    message: "Username must be at least 4 characters.",
    path: ['newMerchantUsername']
}).refine((data) => {
    if (data.merchantId === 'new') {
        return data.newMerchantPassword && data.newMerchantPassword.length >= 8;
    }
    return true;
}, {
    message: "Password must be at least 8 characters.",
    path: ['newMerchantPassword']
});

type PlaceFormValues = z.infer<typeof placeSchema>;

const Controls = () => {
    const { zoomIn, zoomOut } = useControls();
    return (<div className="absolute top-2 right-2 z-10 flex flex-col gap-1"><Button size="icon" type="button" onClick={() => zoomIn()}><ZoomIn /></Button><Button size="icon" type="button" onClick={() => zoomOut()}><ZoomOut /></Button></div>);
};

export default function PlacesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlace, setEditingPlace] = useState<Place | null>(null);
    const [viewingPlace, setViewingPlace] = useState<Place | null>(null);
    const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);

    const form = useForm({ resolver: zodResolver(placeSchema) });
    const watchedFloorPlanId = form.watch("floorPlanId");
    const watchedMerchantId = form.watch("merchantId");

    const queryClient = useQueryClient();

    const { data: places = [], isLoading: isLoadingPlaces } = useQuery({ queryKey: ['places'], queryFn: getPlaces });
    const { data: floorPlans = [], isLoading: isLoadingFloorPlans } = useQuery({ queryKey: ['floorPlans'], queryFn: getFloorPlans });
    const { data: merchants = [], isLoading: isLoadingMerchants } = useQuery({ queryKey: ['merchants'], queryFn: getMerchants });

    const createMutation = useMutation({
        mutationFn: createPlace,
        onSuccess: () => {
            toast.success("Place created successfully.");
            queryClient.invalidateQueries({ queryKey: ['places'] });
            queryClient.invalidateQueries({ queryKey: ['merchants'] });
            setIsDialogOpen(false);
        },
        onError: (err: any) => {
            if (err.response?.status === 401) return;
            toast.error("Creation failed", { description: err.response?.data?.message });
        },
    });
    const updateMutation = useMutation({
        mutationFn: updatePlace,
        onSuccess: () => {
            toast.success("Place updated successfully.");
            queryClient.invalidateQueries({ queryKey: ['places'] });
            queryClient.invalidateQueries({ queryKey: ['merchants'] });
            setIsDialogOpen(false);
        },
        onError: (err: any) => {
            if (err.response?.status === 401) return;
            toast.error("Update failed", { description: err.response?.data?.message });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deletePlace,
        onSuccess: () => { toast.success("Place deleted."); queryClient.invalidateQueries({ queryKey: ['places'] }); },
        onError: (error: any) => {
            if (error.response?.status === 401) return;
            toast.error("Failed to delete place");
        },
    });

    const availableMerchants = useMemo(() => {
        const assignedMerchantIds = new Set(places.map(p => p.merchant?.id).filter(Boolean));
        return merchants.filter(m => !assignedMerchantIds.has(m.id) || m.id === editingPlace?.merchant?.id);
    }, [merchants, places, editingPlace]);

    useEffect(() => { document.title = "Places | Binhinav Admin"; }, []);

    const handleOpenDialog = async (place: Place | null = null) => {
        if (!place && floorPlans.length === 0) {
            toast.warning("Cannot Add Place", { description: "You must create a Floor Plan first." });
            return;
        }
        setEditingPlace(place);
        form.reset();
        if (place) {
            const fullPlace = await queryClient.fetchQuery({ queryKey: ['place', place.id], queryFn: () => getPlaceById(place.id) });
            form.reset({ name: fullPlace.name, locationX: fullPlace.locationX, locationY: fullPlace.locationY, floorPlanId: fullPlace.floorPlan.id, merchantId: fullPlace.merchant?.id || 'none' });
            setSelectedCoords([fullPlace.locationX, fullPlace.locationY]);
        } else {
            form.reset({ name: '', locationX: undefined, locationY: undefined, floorPlanId: undefined, merchantId: 'none' });
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
        const payload: Partial<PlacePayload | UpdatePlacePayload> & { [key: string]: any } = {
            name: data.name,
            locationX: data.locationX,
            locationY: data.locationY,
            floorPlanId: data.floorPlanId,
        };
        if (data.merchantId === 'new') {
            payload.newMerchantName = data.newMerchantName;
            payload.newMerchantUsername = data.newMerchantUsername;
            payload.newMerchantPassword = data.newMerchantPassword;
            payload.merchantId = undefined;
        } else if (data.merchantId && data.merchantId !== 'none') {
            payload.merchantId = data.merchantId;
        } else {
            payload.merchantId = null;
        }
        if (editingPlace) {
            updateMutation.mutate({ id: editingPlace.id, payload });
        } else {
            createMutation.mutate(payload as PlacePayload);
        }
    };

    const handleDelete = (id: string) => deleteMutation.mutate(id);
    const selectedFloorPlan = useMemo(() => floorPlans.find(fp => fp.id === watchedFloorPlanId), [floorPlans, watchedFloorPlanId]);

    const columns: ColumnDef<Place>[] = [
        {
            accessorKey: "name",
            header: "Place Details",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                        {row.original.logoUrl ? (
                            <img src={getAssetUrl(row.original.logoUrl)} alt={row.original.name} className="h-full w-full object-cover rounded-md" />
                        ) : (
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                        )}
                    </div>
                    <div>
                        <div className="font-semibold">{row.original.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                            {row.original.category ? (
                                <><DynamicIcon name={row.original.category.iconKey} className="h-3 w-3" /><span>{row.original.category.name}</span></>
                            ) : (<span>No Category</span>)}
                        </div>
                    </div>
                </div>
            )
        },
        { accessorKey: "floorPlan.name", header: "Floor Plan" },
        {
            accessorKey: "merchant.name",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Assigned Merchant
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => row.original.merchant?.name ?? <span className="text-muted-foreground">Unassigned</span>
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <Button variant="ghost" size="icon" title="View on map" onClick={() => setViewingPlace(row.original)}><MapPin className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Edit place" onClick={() => handleOpenDialog(row.original)}><Edit className="h-4 w-4" /></Button>
                    <ConfirmationDialog
                        title="Delete this place?"
                        description={"This action cannot be undone. It will permanently delete the place" + (row.original.merchant ? ` and the assigned merchant account for '${row.original.merchant.name}'.` : ".")}
                        onConfirm={() => handleDelete(row.original.id)}
                        variant="destructive"
                        confirmText="Delete"
                        triggerButton={
                            <Button variant="ghost" size="icon" title="Delete place" className="text-red-500" disabled={deleteMutation.isPending}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        }
                    />
                </div>
            )
        }
    ];

    const isLoading = isLoadingPlaces || isLoadingFloorPlans || isLoadingMerchants;
    const isMutating = createMutation.isPending || updateMutation.isPending;

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Places</h2>
                    <p className="text-muted-foreground">Manage store locations and assign merchants to them.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Add New Place</Button>
            </div>
            <Card>
                <CardContent className="pt-6">
                    {isLoading && <p>Loading data...</p>}
                    {!isLoading && (
                        <DataTable
                            columns={columns}
                            data={places}
                            sorting={sorting}
                            setSorting={setSorting}
                        />
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto pr-6">
                    <DialogHeader>
                        <DialogTitle>{editingPlace ? "Edit Place" : "Create New Place"}</DialogTitle>
                        <DialogDescription>Set the place's name, floor plan, and location. You can also assign or create a new merchant.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4" autoComplete="off">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Place Name</Label>
                                <Input id="name" {...form.register("name")} />
                                <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                            </div>
                            <div className="space-y-2">
                                <Label>Assign Merchant</Label>
                                <Select onValueChange={(v) => form.setValue('merchantId', v, { shouldValidate: true })} value={form.getValues('merchantId') || 'none'}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="Assign Merchant" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Unassigned</SelectItem>
                                        <SelectItem value="new">-- Create a new merchant --</SelectItem>
                                        {availableMerchants.length > 0 && <Separator className="my-1" />}
                                        {availableMerchants.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {watchedMerchantId === 'new' && (
                            <Card className="bg-muted/50 p-4">
                                <h3 className="text-sm font-semibold mb-3">New Merchant Details</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="newMerchantName">Merchant Name</Label>
                                        <Input id="newMerchantName" {...form.register("newMerchantName")} />
                                        {form.formState.errors.newMerchantName && <p className="text-sm text-red-500">{form.formState.errors.newMerchantName.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newMerchantUsername">Username</Label>
                                        <Input id="newMerchantUsername" {...form.register("newMerchantUsername")} />
                                        {form.formState.errors.newMerchantUsername && <p className="text-sm text-red-500">{form.formState.errors.newMerchantUsername.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="newMerchantPassword">Password</Label>
                                        <Input id="newMerchantPassword" type="password" {...form.register("newMerchantPassword")} />
                                        {form.formState.errors.newMerchantPassword && <p className="text-sm text-red-500">{form.formState.errors.newMerchantPassword.message}</p>}
                                    </div>
                                </div>
                            </Card>
                        )}

                        <div className="space-y-2">
                            <Label>Floor Plan</Label>
                            <Select onValueChange={(v) => { form.setValue('floorPlanId', v, { shouldValidate: true }); setSelectedCoords(null); form.setValue('locationX', undefined, { shouldValidate: true }); form.setValue('locationY', undefined, { shouldValidate: true }); }} value={form.getValues('floorPlanId')}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="* Select a Floor Plan to place the pin" /></SelectTrigger>
                                <SelectContent>{floorPlans.map(fp => <SelectItem key={fp.id} value={fp.id}>{fp.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <p className="text-sm text-red-500">{form.formState.errors.floorPlanId?.message}</p>
                        </div>

                        {selectedFloorPlan && (
                            <div className="space-y-2">
                                <Label>Set Location</Label>
                                <div className="relative w-full rounded-md border bg-muted/20 overflow-hidden">
                                    <TransformWrapper doubleClick={{ disabled: true }} panning={{ disabled: false, velocityDisabled: true }}>
                                        <Controls />
                                        <TransformComponent wrapperStyle={{ maxHeight: '60vh', width: '100%' }} contentStyle={{ width: '100%', height: '100%', cursor: 'crosshair' }} contentProps={{ onDoubleClick: handleMapDoubleClick }}>
                                            <div className="relative"><img src={getAssetUrl(selectedFloorPlan.imageUrl)} alt={selectedFloorPlan.name} />{selectedCoords && (<Target className="absolute text-red-500 w-6 h-6 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: selectedCoords[0], top: selectedCoords[1] }} />)}</div>
                                        </TransformComponent>
                                    </TransformWrapper>
                                </div>
                                <p className="text-sm text-muted-foreground">Coordinates: {selectedCoords ? `(${selectedCoords[0].toFixed(0)}, ${selectedCoords[1].toFixed(0)})` : 'Double-click map to set'}</p>
                                <p className="text-sm text-red-500">{form.formState.errors.locationX?.message}</p>
                            </div>
                        )}
                        <Button type="submit" disabled={isMutating} className="w-full">{isMutating ? "Saving..." : "Save Place"}</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {viewingPlace && (
                <Dialog open={!!viewingPlace} onOpenChange={(isOpen) => !isOpen && setViewingPlace(null)}>
                    <DialogContent className="sm:max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>Location for: {viewingPlace?.name}</DialogTitle>
                            <DialogDescription>Floor Plan: {viewingPlace?.floorPlan.name}</DialogDescription>
                        </DialogHeader>
                        <div className="relative mt-4 w-full rounded-md border bg-muted/20 overflow-hidden">
                            <img
                                src={getAssetUrl(viewingPlace?.floorPlan.imageUrl)}
                                alt={viewingPlace?.floorPlan.name}
                                className="max-h-[70vh] w-full object-contain"
                            />
                            {viewingPlace && (
                                <Target
                                    className="absolute text-red-500 w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                    style={{ left: viewingPlace.locationX, top: viewingPlace.locationY }}
                                    strokeWidth={2.5}
                                />
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}
