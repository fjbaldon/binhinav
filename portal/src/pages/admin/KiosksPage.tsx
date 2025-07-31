import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKiosks, createKiosk, updateKiosk, deleteKiosk } from "@/api/kiosks";
import { type Kiosk } from "@/api/types";
import { getFloorPlans } from "@/api/floor-plans";
import { getPlaces } from "@/api/places";
import { getAssetUrl } from "@/api";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, MapPin, TvMinimal, Copy } from 'lucide-react';
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";
import { LocationSetterDialog } from "./components/LocationSetterDialog";
import { ViewLocationDialog } from "./components/ViewLocationDialog";

const kioskDetailsSchema = z.object({
    name: z.string().min(2, "Name is required."),
    floorPlanId: z.string({ error: "A floor plan must be selected." }),
});

type KioskDetailsFormValues = z.infer<typeof kioskDetailsSchema>;

export default function KiosksPage() {
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
    const [editingKiosk, setEditingKiosk] = useState<Kiosk | null>(null);
    const [viewingKiosk, setViewingKiosk] = useState<Kiosk | null>(null);
    const [tempDetails, setTempDetails] = useState<KioskDetailsFormValues | null>(null);

    const form = useForm({ resolver: zodResolver(kioskDetailsSchema) });
    const queryClient = useQueryClient();

    const { data: kiosks = [], isLoading: isLoadingKiosks } = useQuery({ queryKey: ['kiosks'], queryFn: getKiosks });
    const { data: floorPlans = [], isLoading: isLoadingFloorPlans } = useQuery({ queryKey: ['floorPlans'], queryFn: getFloorPlans });
    const { data: places = [] } = useQuery({ queryKey: ['places'], queryFn: getPlaces });

    const createMutation = useMutation({
        mutationFn: createKiosk,
        onSuccess: () => { toast.success("Kiosk created."); queryClient.invalidateQueries({ queryKey: ['kiosks'] }); setIsLocationDialogOpen(false); },
        onError: (err: any) => {
            if (err.response?.status === 401) return;
            toast.error("Creation failed", { description: err.response?.data?.message });
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateKiosk,
        onSuccess: () => { toast.success("Kiosk updated."); queryClient.invalidateQueries({ queryKey: ['kiosks'] }); setIsLocationDialogOpen(false); },
        onError: (err: any) => {
            if (err.response?.status === 401) return;
            toast.error("Update failed", { description: err.response?.data?.message });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteKiosk,
        onSuccess: () => { toast.success("Kiosk deleted."); queryClient.invalidateQueries({ queryKey: ['kiosks'] }); },
        onError: (error: any) => {
            if (error.response?.status === 401) return;
            toast.error("Failed to delete kiosk");
        }
    });

    useEffect(() => { document.title = "Kiosks | Binhinav Admin"; }, []);

    const handleOpenDetailsDialog = (kiosk: Kiosk | null = null) => {
        if (!kiosk && floorPlans.length === 0) {
            toast.warning("Cannot Add Kiosk", { description: "You must create a Floor Plan first." });
            return;
        }
        setEditingKiosk(kiosk);
        if (kiosk) {
            form.reset({ name: kiosk.name, floorPlanId: kiosk.floorPlan.id });
        } else {
            form.reset({ name: "", floorPlanId: undefined });
        }
        setIsDetailsDialogOpen(true);
    };

    const handleDetailsSubmit = (data: KioskDetailsFormValues) => {
        setTempDetails(data);
        setIsDetailsDialogOpen(false);
        setIsLocationDialogOpen(true);
    };

    const handleLocationSave = (coords: { x: number, y: number }) => {
        if (!tempDetails) return;
        const finalPayload = { ...tempDetails, locationX: coords.x, locationY: coords.y };
        if (editingKiosk) {
            updateMutation.mutate({ id: editingKiosk.id, payload: finalPayload });
        } else {
            createMutation.mutate(finalPayload);
        }
    };

    const handleBackToDetails = () => {
        setIsLocationDialogOpen(false);
        setIsDetailsDialogOpen(true);
    };

    const handleDelete = (id: string) => deleteMutation.mutate(id);
    const isMutating = createMutation.isPending || updateMutation.isPending;
    const selectedFloorPlanForLocation = useMemo(() => floorPlans.find(fp => fp.id === tempDetails?.floorPlanId), [floorPlans, tempDetails]);

    const placesOnSelectedFloor = useMemo(() => {
        if (!selectedFloorPlanForLocation) return [];
        return places.filter(p => p.floorPlan.id === selectedFloorPlanForLocation.id);
    }, [places, selectedFloorPlanForLocation]);

    const placesForViewing = useMemo(() => {
        if (!viewingKiosk) return [];
        return places.filter(p => p.floorPlan.id === viewingKiosk.floorPlan.id);
    }, [places, viewingKiosk]);


    const columns: ColumnDef<Kiosk>[] = [
        {
            accessorKey: "name",
            header: "Kiosk",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <TvMinimal className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <div className="font-semibold">{row.original.name}</div>
                        <div className="text-xs text-muted-foreground font-mono flex items-center gap-2">
                            <span>{row.original.id}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => {
                                    navigator.clipboard.writeText(row.original.id);
                                    toast.success("Kiosk ID copied to clipboard!");
                                }}
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "provisioningKey",
            header: "Pairing Key",
            cell: ({ row }) => {
                const key = row.original.provisioningKey;
                if (!key) {
                    return <Badge variant="outline" className="text-green-600 border-green-500">Provisioned</Badge>;
                }
                return (
                    <div className="flex items-center gap-2 font-mono text-sm">
                        <span>{key}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Copy pairing key"
                            onClick={() => {
                                navigator.clipboard.writeText(key);
                                toast.success("Pairing key copied to clipboard!");
                            }}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                );
            }
        },
        {
            accessorKey: "floorPlan",
            header: "Floor Plan",
            cell: ({ row }) => (
                row.original.floorPlan ? (
                    <div className="flex items-center gap-3">
                        <img src={getAssetUrl(row.original.floorPlan.imageUrl)} alt={row.original.floorPlan.name} className="h-10 w-16 object-cover rounded-md border" />
                        <span>{row.original.floorPlan.name}</span>
                    </div>
                ) : ('N/A')
            )
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <Button variant="ghost" size="icon" title="View on map" onClick={() => setViewingKiosk(row.original)}><MapPin className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" title="Edit kiosk" onClick={() => handleOpenDetailsDialog(row.original)}><Edit className="h-4 w-4" /></Button>
                    <ConfirmationDialog
                        title="Delete this kiosk?"
                        description="This action cannot be undone and will permanently remove the kiosk."
                        onConfirm={() => handleDelete(row.original.id)}
                        variant="destructive"
                        confirmText="Delete"
                        triggerButton={
                            <Button variant="ghost" size="icon" title="Delete kiosk" className="text-red-500" disabled={deleteMutation.isPending}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        }
                    />
                </div>
            )
        }
    ];

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Kiosks</h2>
                    <p className="text-muted-foreground">Manage physical kiosk locations and their positions on the map.</p>
                </div>
                <Button onClick={() => handleOpenDetailsDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Kiosk
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoadingKiosks && <p>Loading kiosks...</p>}
                    {!isLoadingKiosks && <DataTable columns={columns} data={kiosks} />}
                </CardContent>
            </Card>

            <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingKiosk ? "Edit Kiosk" : "Step 1: Create New Kiosk"}</DialogTitle>
                        <DialogDescription>Provide a name and select a floor plan. You will set the location in the next step.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(handleDetailsSubmit)} className="space-y-4 pt-4" autoComplete="off">
                        <div className="space-y-2"><Label htmlFor="name">Kiosk Name</Label><Input id="name" {...form.register("name")} /><p className="text-sm text-red-500">{form.formState.errors.name?.message}</p></div>
                        <div className="space-y-2">
                            <Label>Floor Plan</Label>
                            <Select onValueChange={(value) => { form.setValue('floorPlanId', value, { shouldValidate: true }); }} value={form.getValues('floorPlanId')}>
                                <SelectTrigger className="w-full" disabled={isLoadingFloorPlans}><SelectValue placeholder="Select a floor plan" /></SelectTrigger>
                                <SelectContent>{floorPlans.map(fp => <SelectItem key={fp.id} value={fp.id}>{fp.name}</SelectItem>)}</SelectContent>
                            </Select>
                            <p className="text-sm text-red-500">{form.formState.errors.floorPlanId?.message}</p>
                        </div>
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
                    initialCoords={editingKiosk ? [editingKiosk.locationX, editingKiosk.locationY] : null}
                    isPending={isMutating}
                />
            )}

            <ViewLocationDialog
                isOpen={!!viewingKiosk}
                onOpenChange={(isOpen) => !isOpen && setViewingKiosk(null)}
                item={viewingKiosk}
                placesOnFloor={placesForViewing}
            />
        </>
    );
}
