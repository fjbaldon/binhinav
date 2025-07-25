import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getKiosks, createKiosk, updateKiosk, deleteKiosk } from "@/api/kiosks";
import { type Kiosk } from "@/api/types";
import { getFloorPlans } from "@/api/floor-plans";
import { getAssetUrl } from "@/api";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Target, ZoomIn, ZoomOut, MapPin, TvMinimal, Copy } from 'lucide-react';
import { TransformWrapper, TransformComponent, useControls } from "react-zoom-pan-pinch";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { DataTable } from "@/components/shared/DataTable";

const kioskSchema = z.object({
    name: z.string().min(2, "Name is required."),
    locationX: z.coerce.number({ error: "Please select a location on the map." }),
    locationY: z.coerce.number({ error: "Please select a location on the map." }),
    floorPlanId: z.uuid({ error: "A floor plan must be selected." }),
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
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingKiosk, setEditingKiosk] = useState<Kiosk | null>(null);
    const [viewingKiosk, setViewingKiosk] = useState<Kiosk | null>(null);
    const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);

    const form = useForm({ resolver: zodResolver(kioskSchema) });
    const watchedFloorPlanId = form.watch("floorPlanId");

    const queryClient = useQueryClient();

    const { data: kiosks = [], isLoading: isLoadingKiosks } = useQuery({ queryKey: ['kiosks'], queryFn: getKiosks });
    const { data: floorPlans = [], isLoading: isLoadingFloorPlans } = useQuery({ queryKey: ['floorPlans'], queryFn: getFloorPlans });
    const selectedFloorPlan = floorPlans.find(fp => fp.id === watchedFloorPlanId);

    const createMutation = useMutation({
        mutationFn: createKiosk,
        onSuccess: () => { toast.success("Kiosk created."); queryClient.invalidateQueries({ queryKey: ['kiosks'] }); setIsDialogOpen(false); },
        onError: (err: any) => toast.error("Creation failed", { description: err.response?.data?.message })
    });

    const updateMutation = useMutation({
        mutationFn: updateKiosk,
        onSuccess: () => { toast.success("Kiosk updated."); queryClient.invalidateQueries({ queryKey: ['kiosks'] }); setIsDialogOpen(false); },
        onError: (err: any) => toast.error("Update failed", { description: err.response?.data?.message })
    });

    const deleteMutation = useMutation({
        mutationFn: deleteKiosk,
        onSuccess: () => { toast.success("Kiosk deleted."); queryClient.invalidateQueries({ queryKey: ['kiosks'] }); },
        onError: () => toast.error("Failed to delete kiosk")
    });

    useEffect(() => { document.title = "Kiosks | Binhinav Admin"; }, []);

    const handleOpenDialog = (kiosk: Kiosk | null = null) => {
        if (!kiosk && floorPlans.length === 0) {
            toast.warning("Cannot Add Kiosk", { description: "You must create a Floor Plan first." });
            return;
        }
        setEditingKiosk(kiosk);
        if (kiosk) {
            form.reset({ name: kiosk.name, locationX: kiosk.locationX, locationY: kiosk.locationY, floorPlanId: kiosk.floorPlan.id });
            setSelectedCoords([kiosk.locationX, kiosk.locationY]);
        } else {
            form.reset({ name: "", locationX: undefined, locationY: undefined, floorPlanId: undefined });
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

    const onSubmit = (data: KioskFormValues) => {
        if (editingKiosk) {
            updateMutation.mutate({ id: editingKiosk.id, payload: data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = (id: string) => deleteMutation.mutate(id);

    const isMutating = createMutation.isPending || updateMutation.isPending;

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
                    <Button variant="ghost" size="icon" title="Edit kiosk" onClick={() => handleOpenDialog(row.original)}><Edit className="h-4 w-4" /></Button>
                    <ConfirmationDialog
                        title="Delete this kiosk?"
                        description="This action cannot be undone and will permanently remove the kiosk."
                        onConfirm={() => handleDelete(row.original.id)}
                        variant="destructive"
                        confirmText="Delete"
                        triggerButton={
                            <Button variant="ghost" size="icon" title="Delete kiosk" className="text-red-500">
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
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Kiosk
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoadingKiosks && <p>Loading kiosks...</p>}
                    {!isLoadingKiosks && <DataTable columns={columns} data={kiosks} />}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingKiosk ? "Edit Kiosk" : "Create New Kiosk"}</DialogTitle>
                        <DialogDescription>Provide a name, select a floor plan, and then double-click on the map to set the kiosk's location.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4" autoComplete="off">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="name">Kiosk Name</Label><Input id="name" {...form.register("name")} /><p className="text-sm text-red-500">{form.formState.errors.name?.message}</p></div>
                            <div className="space-y-2">
                                <Label>Floor Plan</Label>
                                <Select onValueChange={(value) => { form.setValue('floorPlanId', value, { shouldValidate: true }); setSelectedCoords(null); form.setValue('locationX', undefined, { shouldValidate: true }); form.setValue('locationY', undefined, { shouldValidate: true }); }} value={form.getValues('floorPlanId')}>
                                    <SelectTrigger className="w-full" disabled={isLoadingFloorPlans}><SelectValue placeholder="Select a floor plan" /></SelectTrigger>
                                    <SelectContent>{floorPlans.map(fp => <SelectItem key={fp.id} value={fp.id}>{fp.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <p className="text-sm text-red-500">{form.formState.errors.floorPlanId?.message}</p>
                            </div>
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
                        <Button type="submit" disabled={isMutating} className="w-full">{isMutating ? "Saving..." : "Save Kiosk"}</Button>

                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!viewingKiosk} onOpenChange={(isOpen) => !isOpen && setViewingKiosk(null)}>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader><DialogTitle>Location for: {viewingKiosk?.name}</DialogTitle><DialogDescription>Floor Plan: {viewingKiosk?.floorPlan.name}</DialogDescription></DialogHeader>
                    <div className="relative mt-4 w-full rounded-md border bg-muted/20 overflow-hidden"><img src={getAssetUrl(viewingKiosk?.floorPlan.imageUrl)} alt={viewingKiosk?.floorPlan.name} className="max-h-[70vh] w-full object-contain" />{viewingKiosk && (<Target className="absolute text-red-500 w-8 h-8 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" style={{ left: viewingKiosk.locationX, top: viewingKiosk.locationY }} strokeWidth={2.5} />)}</div>
                </DialogContent>
            </Dialog>
        </>
    );
}
