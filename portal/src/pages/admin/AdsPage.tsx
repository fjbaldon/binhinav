import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminAds, createAd, updateAd, deleteAd, reorderAds } from "@/api/ads";
import { type Ad } from "@/api/types";
import { getAssetUrl } from "@/api";
import { type ColumnDef, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, closestCenter, DragOverlay } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Eye, AlertTriangle, GripVertical, Video, Loader2 } from 'lucide-react';
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { cn } from "@/lib/utils";

const adSchema = z.object({
    name: z.string().min(2, "Name is required."),
    isActive: z.boolean().default(true),
    displayOrder: z.coerce.number().int().optional(),
    file: z.any().optional(),
});

type AdFormValues = z.infer<typeof adSchema>;

const DraggableTableRow = ({ row, reorderMutation }: { row: any, reorderMutation: any }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id: row.original.id,
        transition: null,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0 : 1,
        zIndex: isDragging ? 0 : 'auto',
    };

    return (
        <TableRow ref={setNodeRef} style={style} {...attributes} className={cn(isDragging && "bg-muted shadow-lg")}>
            <TableCell style={{ width: '60px' }}>
                <Button variant="ghost" {...listeners} className="cursor-grab" disabled={reorderMutation.isPending}>
                    <GripVertical className="h-5 w-5" />
                </Button>
            </TableCell>
            {row.getVisibleCells().map((cell: any) => (
                <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    );
};

export default function AdsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAd, setEditingAd] = useState<Ad | null>(null);
    const [viewingAd, setViewingAd] = useState<Ad | null>(null);
    const [activeAds, setActiveAds] = useState<Ad[]>([]);
    const [draggingAd, setDraggingAd] = useState<Ad | null>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const [columnWidths, setColumnWidths] = useState<number[]>([]);

    const form = useForm({
        resolver: zodResolver(adSchema),
        defaultValues: { name: "", isActive: true, displayOrder: undefined, file: undefined },
    });
    const queryClient = useQueryClient();

    const { data: ads = [], isLoading, isError } = useQuery({
        queryKey: ['adminAds'],
        queryFn: getAdminAds,
    });

    const reorderMutation = useMutation({
        mutationFn: reorderAds,
        onSuccess: () => {
            toast.success("Ad order saved.");
            queryClient.invalidateQueries({ queryKey: ['adminAds'] });
        },
        onError: () => {
            toast.error("Failed to save new order.");
            setActiveAds(ads);
        },
    });

    useEffect(() => {
        if (ads && !reorderMutation.isPending) {
            setActiveAds(ads);
        }
    }, [ads, reorderMutation.isPending]);

    const createMutation = useMutation({
        mutationFn: createAd,
        onSuccess: () => {
            toast.success("Ad created successfully.");
            queryClient.invalidateQueries({ queryKey: ['adminAds'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => toast.error("Creation Failed", { description: error.response?.data?.message || "Something went wrong." })
    });

    const updateMutation = useMutation({
        mutationFn: updateAd,
        onSuccess: () => {
            toast.success("Ad updated successfully.");
            queryClient.invalidateQueries({ queryKey: ['adminAds'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => toast.error("Update Failed", { description: error.response?.data?.message || "Something went wrong." })
    });

    const deleteMutation = useMutation({
        mutationFn: deleteAd,
        onSuccess: () => {
            toast.success("Ad deleted.");
            queryClient.invalidateQueries({ queryKey: ['adminAds'] });
        },
        onError: () => toast.error("Failed to delete ad")
    });

    const handleOpenDialog = (ad: Ad | null = null) => {
        setEditingAd(ad);
        form.reset(ad ? { name: ad.name, isActive: ad.isActive, displayOrder: ad.displayOrder ?? undefined, file: undefined } : { name: "", isActive: true, displayOrder: undefined, file: undefined });
        setIsDialogOpen(true);
    };

    const onSubmit = (data: AdFormValues) => {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('isActive', String(data.isActive));
        if (data.displayOrder !== undefined && data.displayOrder !== null) formData.append('displayOrder', String(data.displayOrder));
        if (data.file && data.file[0]) formData.append('file', data.file[0]);

        if (!editingAd && (!data.file || !data.file[0])) {
            form.setError('file', { message: 'Image or video file is required for new ads.' });
            return;
        }

        if (editingAd) updateMutation.mutate({ id: editingAd.id, formData });
        else createMutation.mutate(formData);
    };

    const handleDelete = (id: string) => deleteMutation.mutate(id);

    const columns: ColumnDef<Ad>[] = [
        { accessorKey: "fileUrl", header: "Preview", cell: ({ row }) => { const ad = row.original; return ad.type === 'video' ? (<div className="h-16 w-28 rounded-md border bg-muted flex items-center justify-center"><Video className="h-8 w-8 text-muted-foreground" /></div>) : (<img src={getAssetUrl(ad.fileUrl)} alt={ad.name} className="h-16 w-28 object-contain rounded-md border" />) } },
        { accessorKey: "name", header: "Details", cell: ({ row }) => (<div className="align-top"><div className="font-semibold">{row.original.name}</div><div className="text-sm text-muted-foreground">Order: {row.original.displayOrder ?? 'N/A'}</div></div>) },
        { accessorKey: "isActive", header: "Status", cell: ({ row }) => (row.original.isActive ? <Badge className="bg-green-500 hover:bg-green-600">Active</Badge> : <Badge variant="secondary">Inactive</Badge>) },
        { id: 'actions', header: () => <div className="text-right">Actions</div>, cell: ({ row }) => (<div className="text-right"><Button variant="ghost" size="icon" onClick={() => setViewingAd(row.original)} disabled={deleteMutation.isPending}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleOpenDialog(row.original)} disabled={deleteMutation.isPending}><Edit className="h-4 w-4" /></Button><ConfirmationDialog title="Delete this ad?" description="This action cannot be undone and will permanently remove the ad." onConfirm={() => handleDelete(row.original.id)} variant="destructive" confirmText="Delete" triggerButton={<Button variant="ghost" size="icon" className="text-red-500" disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>} /></div>) },
    ];

    const table = useReactTable({ data: activeAds, columns, getCoreRowModel: getCoreRowModel() });
    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setDraggingAd(activeAds.find(ad => ad.id === active.id) || null);
        if (tableRef.current) {
            const headerCells = tableRef.current.querySelectorAll('thead th');
            const widths = Array.from(headerCells).map(cell => cell.getBoundingClientRect().width);
            setColumnWidths(widths);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setDraggingAd(null);
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = activeAds.findIndex((ad) => ad.id === active.id);
            const newIndex = activeAds.findIndex((ad) => ad.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                let reorderedAds = arrayMove(activeAds, oldIndex, newIndex);
                reorderedAds = reorderedAds.map((ad, index) => ({
                    ...ad,
                    displayOrder: index + 1,
                }));

                setActiveAds(reorderedAds);
                reorderMutation.mutate(reorderedAds.map(ad => ad.id));
            }
        }
    };

    const handleDragCancel = () => {
        setDraggingAd(null);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Ads</h2>
                    <p className="text-muted-foreground">Manage advertisements shown on kiosks. Drag and drop rows to reorder.</p>
                </div>
                <div className="flex items-center gap-2">
                    {reorderMutation.isPending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Saving order...</span></div>}
                    <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Add New Ad</Button>
                </div>
            </div>
            <Card>
                <CardContent className="pt-6">
                    {isLoading && <p>Loading ads...</p>}
                    {isError && <p className="text-destructive">Failed to load ads.</p>}
                    {!isLoading && !isError && (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragCancel={handleDragCancel}
                            modifiers={[restrictToVerticalAxis]}
                        >
                            <Table ref={tableRef}>
                                <TableHeader>
                                    {table.getHeaderGroups().map(headerGroup => (
                                        <TableRow key={headerGroup.id}>
                                            <TableHead style={{ width: '60px' }} />
                                            {headerGroup.headers.map(header => (
                                                <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                                            ))}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    <SortableContext items={activeAds.map(ad => ad.id)} strategy={verticalListSortingStrategy}>
                                        {table.getRowModel().rows.map(row => (
                                            <DraggableTableRow key={row.id} row={row} reorderMutation={reorderMutation} />
                                        ))}
                                    </SortableContext>
                                </TableBody>
                            </Table>
                            <DragOverlay>
                                {draggingAd ? (
                                    <Table className="shadow-lg">
                                        <TableBody>
                                            <TableRow className="bg-background">
                                                <TableCell style={{ width: columnWidths[0] }}><Button variant="ghost" className="cursor-grabbing"><GripVertical className="h-5 w-5" /></Button></TableCell>
                                                <TableCell style={{ width: columnWidths[1] }}>{draggingAd.type === 'video' ? <div className="h-16 w-28 rounded-md border bg-muted flex items-center justify-center"><Video className="h-8 w-8 text-muted-foreground" /></div> : <img src={getAssetUrl(draggingAd.fileUrl)} alt={draggingAd.name} className="h-16 w-28 object-contain rounded-md border" />}</TableCell>
                                                <TableCell style={{ width: columnWidths[2] }}><div className="align-top"><div className="font-semibold">{draggingAd.name}</div><div className="text-sm text-muted-foreground">Order: {draggingAd.displayOrder ?? 'N/A'}</div></div></TableCell>
                                                <TableCell style={{ width: columnWidths[3] }}>{draggingAd.isActive ? <Badge className="bg-green-500 hover:bg-green-600">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                                                <TableCell style={{ width: columnWidths[4] }} className="text-right"><div className="text-right"><Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                ) : null}
                            </DragOverlay>
                        </DndContext>
                    )}
                </CardContent>
            </Card>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAd ? "Edit Ad" : "Create New Ad"}</DialogTitle>
                        <DialogDescription>Fill in the ad details below. The order can be changed on the main page via drag-and-drop.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4" autoComplete="off">
                        <div className="space-y-2">
                            <Label htmlFor="name">Ad Name (for internal reference)</Label>
                            <Input id="name" {...form.register("name")} />
                            <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file">Ad File (Image or Video)</Label>
                            <Input id="file" type="file" accept="image/*,video/mp4,video/webm,video/quicktime" {...form.register("file")} />
                            <div className="flex items-start gap-2 text-xs text-muted-foreground p-2 bg-muted/50 rounded-md border mt-2">
                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                                <p>For the best display on the kiosk, please upload a file with a 16:9 aspect ratio (e.g., 1920x1080 pixels).</p>
                            </div>
                            {editingAd && <p className="text-sm text-muted-foreground mt-1">Leave blank to keep the current file.</p>}
                            <p className="text-sm text-red-500">{typeof form.formState.errors.file?.message === "string" ? form.formState.errors.file.message : ""}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Controller name="isActive" control={form.control} render={({ field }) => (<Select onValueChange={(value) => field.onChange(value === 'true')} value={String(field.value)}><SelectTrigger className="w-full"><SelectValue placeholder="Set status" /></SelectTrigger><SelectContent><SelectItem value="true">Active</SelectItem><SelectItem value="false">Inactive</SelectItem></SelectContent></Select>)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="displayOrder">Display Order (Initial)</Label>
                                <Input id="displayOrder" type="number" {...form.register("displayOrder")} placeholder="e.g., 1, 2, 3..." />
                                <p className="text-sm text-red-500">{form.formState.errors.displayOrder?.message}</p>
                            </div>
                        </div>
                        <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="w-full">
                            {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Ad"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog open={!!viewingAd} onOpenChange={(isOpen) => !isOpen && setViewingAd(null)}>
                <DialogContent className="max-w-4xl p-4">
                    <DialogHeader><DialogTitle>Ad Preview</DialogTitle></DialogHeader>
                    <div className="py-4">
                        {viewingAd?.type === 'video' ? (
                            <video src={getAssetUrl(viewingAd.fileUrl)} controls autoPlay className="w-full h-auto max-h-[80vh] object-contain rounded-md" />
                        ) : viewingAd?.type === 'image' ? (
                            <img src={getAssetUrl(viewingAd.fileUrl)} alt="Ad Preview" className="w-full h-auto max-h-[80vh] object-contain rounded-md" />
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
