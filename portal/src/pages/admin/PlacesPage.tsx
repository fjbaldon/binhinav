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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, MapPin, Building2, ArrowUpDown, Info } from 'lucide-react';
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { DataTable } from "@/components/shared/DataTable";
import { DynamicIcon } from "@/components/shared/DynamicIcon";
import { LocationSetterDialog } from "./components/LocationSetterDialog";
import { ViewLocationDialog } from "./components/ViewLocationDialog";

const placeDetailsSchema = z.object({
    name: z.string().min(2, "Name is required."),
    floorPlanId: z.string({ error: "A floor plan must be selected." }),
    merchantId: z.string().optional(),
    newMerchantName: z.string().optional(),
    newMerchantUsername: z.string().optional(),
    newMerchantPassword: z.string().optional(),
}).refine(data => data.merchantId !== 'new' || (data.newMerchantName && data.newMerchantName.length >= 2), {
    message: "Name is required.",
    path: ['newMerchantName']
}).refine(data => data.merchantId !== 'new' || (data.newMerchantUsername && data.newMerchantUsername.length >= 4), {
    message: "Username must be at least 4 characters.",
    path: ['newMerchantUsername']
}).refine(data => data.merchantId !== 'new' || (data.newMerchantPassword && data.newMerchantPassword.length >= 8), {
    message: "Password must be at least 8 characters.",
    path: ['newMerchantPassword']
});

type PlaceDetailsFormValues = z.infer<typeof placeDetailsSchema>;

export default function PlacesPage() {
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
    const [editingPlace, setEditingPlace] = useState<Place | null>(null);
    const [viewingPlace, setViewingPlace] = useState<Place | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [tempDetails, setTempDetails] = useState<PlaceDetailsFormValues | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);
    const form = useForm({ resolver: zodResolver(placeDetailsSchema) });
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
            setIsLocationDialogOpen(false);
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
            setIsLocationDialogOpen(false);
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

    const unassignedCount = useMemo(() => {
        if (!places) return 0;
        return places.filter(p => !p.merchant).length;
    }, [places]);

    const availableMerchants = useMemo(() => {
        const assignedMerchantIds = new Set(places.map(p => p.merchant?.id).filter(Boolean));
        return merchants.filter(m => !assignedMerchantIds.has(m.id) || m.id === editingPlace?.merchant?.id);
    }, [merchants, places, editingPlace]);

    useEffect(() => { document.title = "Places | Binhinav Admin"; }, []);

    const handleOpenDetailsDialog = async (place: Place | null = null) => {
        if (!place && floorPlans.length === 0) {
            toast.warning("Cannot Add Place", { description: "You must create a Floor Plan first." });
            return;
        }
        setEditingPlace(place);
        form.reset();
        if (place) {
            const fullPlace = await queryClient.fetchQuery({ queryKey: ['place', place.id], queryFn: () => getPlaceById(place.id) });
            form.reset({ name: fullPlace.name, floorPlanId: fullPlace.floorPlan.id, merchantId: fullPlace.merchant?.id || 'none' });
        } else {
            form.reset({ name: '', floorPlanId: undefined, merchantId: 'none' });
        }
        setIsDetailsDialogOpen(true);
    };

    const handleOpenViewDialog = (place: Place) => {
        setViewingPlace(place);
        setIsViewDialogOpen(true);
    };

    const handleDetailsSubmit = (data: PlaceDetailsFormValues) => {
        setTempDetails(data);
        setIsDetailsDialogOpen(false);
        setIsLocationDialogOpen(true);
    };

    const handleLocationSave = (coords: { x: number, y: number }) => {
        if (!tempDetails) return;
        const finalPayload = { ...tempDetails, locationX: coords.x, locationY: coords.y };

        const payload: Partial<PlacePayload | UpdatePlacePayload> & { [key: string]: any } = {
            name: finalPayload.name,
            locationX: finalPayload.locationX,
            locationY: finalPayload.locationY,
            floorPlanId: finalPayload.floorPlanId,
        };
        if (finalPayload.merchantId === 'new') {
            payload.newMerchantName = finalPayload.newMerchantName;
            payload.newMerchantUsername = finalPayload.newMerchantUsername;
            payload.newMerchantPassword = finalPayload.newMerchantPassword;
            payload.merchantId = undefined;
        } else if (finalPayload.merchantId && finalPayload.merchantId !== 'none') {
            payload.merchantId = finalPayload.merchantId;
        } else {
            payload.merchantId = null;
        }

        if (editingPlace) {
            updateMutation.mutate({ id: editingPlace.id, payload });
        } else {
            createMutation.mutate(payload as PlacePayload);
        }
    };

    const handleBackToDetails = () => {
        setIsLocationDialogOpen(false);
        setIsDetailsDialogOpen(true);
    };

    const handleDelete = (id: string) => deleteMutation.mutate(id);
    const selectedFloorPlanForLocation = useMemo(() => floorPlans.find(fp => fp.id === tempDetails?.floorPlanId), [floorPlans, tempDetails]);

    const placesOnSelectedFloor = useMemo(() => {
        if (!selectedFloorPlanForLocation) return [];
        const currentPlaceId = editingPlace?.id;
        return places.filter(p => p.floorPlan.id === selectedFloorPlanForLocation.id && p.id !== currentPlaceId);
    }, [places, selectedFloorPlanForLocation, editingPlace]);

    const placesForViewing = useMemo(() => {
        if (!viewingPlace) return [];
        return places.filter(p => p.floorPlan.id === viewingPlace.floorPlan.id);
    }, [places, viewingPlace]);

    const columns: ColumnDef<Place>[] = [
        {
            accessorKey: "name",
            header: "Place Details",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                        {row.original.logoUrl ? (
                            <img src={getAssetUrl(row.original.logoUrl)} alt={row.original.name} className="h-full w-full object-contain rounded-md" />
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
                    className="justify-start -ml-4"
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
                    <Button variant="ghost" size="icon" title="View on map" onClick={() => handleOpenViewDialog(row.original)}><MapPin className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Edit place" onClick={() => handleOpenDetailsDialog(row.original)}><Edit className="h-4 w-4" /></Button>
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
                <Button onClick={() => handleOpenDetailsDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Add New Place</Button>
            </div>

            {unassignedCount > 0 && (
                <Card className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                            <div>
                                <CardTitle className="text-blue-900 dark:text-blue-200 text-base">Unassigned Places</CardTitle>
                                <CardDescription className="text-blue-800 dark:text-blue-300">
                                    You have {unassignedCount} {unassignedCount === 1 ? 'place' : 'places'} without an assigned merchant.
                                    Edit a place to assign one.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            )}

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

            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingPlace ? "Edit Place Details" : "Step 1: Add Place Details"}</DialogTitle>
                        <DialogDescription>Set the place's name, floor plan, and assign a merchant. Location will be set in the next step.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(handleDetailsSubmit)} className="space-y-4 pt-4" autoComplete="off">
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
                                        {availableMerchants.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Floor Plan</Label>
                            <Select onValueChange={(v) => form.setValue('floorPlanId', v, { shouldValidate: true })} value={form.getValues('floorPlanId')}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select Floor Plan" /></SelectTrigger>
                                <SelectContent>{floorPlans.map(fp => <SelectItem key={fp.id} value={fp.id}>{fp.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <p className="text-sm text-red-500">{form.formState.errors.floorPlanId?.message}</p>
                        </div>
                        {watchedMerchantId === 'new' && (
                            <Card className="bg-muted/50 p-4">
                                <h3 className="text-sm font-semibold mb-3 text-primary">New Merchant Details</h3>
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
                        <Button type="submit" className="w-full">Continue to Set Location</Button>
                    </form>
                </DialogContent>
            </Dialog>

            {selectedFloorPlanForLocation && (
                <LocationSetterDialog
                    isOpen={isLocationDialogOpen}
                    onOpenChange={setIsLocationDialogOpen}
                    onSave={handleLocationSave}
                    onBack={handleBackToDetails}
                    floorPlan={selectedFloorPlanForLocation}
                    placesOnFloor={placesOnSelectedFloor}
                    initialCoords={editingPlace ? [editingPlace.locationX, editingPlace.locationY] : null}
                    isPending={isMutating}
                />
            )}

            <ViewLocationDialog
                isOpen={isViewDialogOpen}
                onOpenChange={setIsViewDialogOpen}
                item={viewingPlace}
                placesOnFloor={placesForViewing}
            />
        </>
    );
}
