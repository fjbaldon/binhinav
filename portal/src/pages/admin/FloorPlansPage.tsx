import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFloorPlans, createFloorPlan, updateFloorPlan, deleteFloorPlan, reorderFloorPlans } from "@/api/floor-plans";
import { type FloorPlan } from "@/api/types";
import { getAssetUrl } from "@/api";
import { type ColumnDef, type Row, useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";
import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent, closestCenter, DragOverlay } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, Eye, GripVertical, Loader2 } from 'lucide-react';
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";

const floorPlanSchema = z.object({
    name: z.string().min(1, "Name is required."),
    image: z.any().optional(),
    displayOrder: z.coerce.number().int().min(0, "Order must be a positive number.").optional().nullable(),
});

type FloorPlanFormValues = z.infer<typeof floorPlanSchema>;

const DraggableTableRow = ({ row, reorderMutation }: { row: Row<FloorPlan>, reorderMutation: any }) => {
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
        opacity: isDragging ? 0.8 : 1,
        zIndex: isDragging ? 1 : 'auto',
    };

    return (
        <TableRow ref={setNodeRef} style={style} {...attributes} data-state={isDragging ? "selected" : ""}>
            <TableCell style={{ width: '60px' }}>
                <Button variant="ghost" {...listeners} className="cursor-grab" disabled={reorderMutation.isPending}>
                    <GripVertical className="h-5 w-5" />
                </Button>
            </TableCell>
            {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
            ))}
        </TableRow>
    );
};

export default function FloorPlansPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingFloorPlan, setEditingFloorPlan] = useState<FloorPlan | null>(null);
    const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [activeFloorPlans, setActiveFloorPlans] = useState<FloorPlan[]>([]);
    const [draggingRow, setDraggingRow] = useState<Row<FloorPlan> | null>(null);

    const form = useForm({
        resolver: zodResolver(floorPlanSchema),
        defaultValues: { name: "", image: undefined, displayOrder: null }
    });
    const queryClient = useQueryClient();

    const { data: floorPlans = [], isLoading, isError } = useQuery({
        queryKey: ['floorPlans'],
        queryFn: getFloorPlans
    });

    const reorderMutation = useMutation({
        mutationFn: reorderFloorPlans,
        onSuccess: () => {
            toast.success("Floor plan order saved.");
            queryClient.invalidateQueries({ queryKey: ['floorPlans'] });
        },
        onError: () => {
            toast.error("Failed to save new order.");
            setActiveFloorPlans(floorPlans);
        },
    });

    useEffect(() => {
        if (floorPlans && !reorderMutation.isPending) {
            setActiveFloorPlans(floorPlans);
        }
    }, [floorPlans, reorderMutation.isPending]);

    const createMutation = useMutation({
        mutationFn: createFloorPlan,
        onSuccess: () => {
            toast.success("Floor plan created.");
            queryClient.invalidateQueries({ queryKey: ['floorPlans'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            if (error.response?.status === 401) return;
            toast.error("Creation Failed", { description: error.response?.data?.message || "Something went wrong." });
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateFloorPlan,
        onSuccess: () => {
            toast.success("Floor plan updated.");
            queryClient.invalidateQueries({ queryKey: ['floorPlans'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            if (error.response?.status === 401) return;
            toast.error("Update Failed", { description: error.response?.data?.message || "Something went wrong." });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteFloorPlan,
        onSuccess: () => {
            toast.success("Floor plan deleted.");
            queryClient.invalidateQueries({ queryKey: ['floorPlans'] });
        },
        onError: (error: any) => {
            if (error.response?.status === 401) return;
            toast.error("Failed to delete floor plan.");
        }
    });

    useEffect(() => {
        document.title = "Floor Plans | Binhinav Admin";
    }, []);

    const handleOpenDialog = (fp: FloorPlan | null = null) => {
        setEditingFloorPlan(fp);
        form.reset(fp ? { name: fp.name, displayOrder: fp.displayOrder } : { name: "", image: undefined, displayOrder: null });
        setIsDialogOpen(true);
    };

    const handleOpenViewDialog = (imageUrl: string) => {
        setViewingImageUrl(imageUrl);
        setIsViewDialogOpen(true);
    };

    const onSubmit = (data: FloorPlanFormValues) => {
        const formData = new FormData();
        formData.append('name', data.name);
        if (data.image && data.image[0]) {
            formData.append('image', data.image[0]);
        }
        if (data.displayOrder !== undefined && data.displayOrder !== null) {
            formData.append('displayOrder', String(data.displayOrder));
        }

        if (!editingFloorPlan && (!data.image || !data.image[0])) {
            form.setError('image', { message: 'Image is required for new floor plans.' });
            return;
        }

        if (editingFloorPlan) {
            updateMutation.mutate({ id: editingFloorPlan.id, formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleDelete = (id: string) => deleteMutation.mutate(id);

    const isMutating = createMutation.isPending || updateMutation.isPending;

    const columns: ColumnDef<FloorPlan>[] = [
        {
            accessorKey: "imageUrl", header: "Preview",
            cell: ({ row }) => (<img src={getAssetUrl(row.original.imageUrl)} alt={row.original.name} className="h-16 w-24 object-contain rounded-md border" />),
        },
        {
            accessorKey: "name", header: "Name",
            cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
        },
        {
            accessorKey: "displayOrder", header: "Order",
            cell: ({ row }) => <div className="text-center font-mono text-muted-foreground">{row.original.displayOrder ?? 'N/A'}</div>,
        },
        {
            id: "usage", header: "Usage",
            cell: ({ row }) => {
                const placesCount = row.original.places?.length || 0;
                const kiosksCount = row.original.kiosks?.length || 0;
                return (<div className="text-sm text-muted-foreground"><div>{placesCount} {placesCount === 1 ? 'Place' : 'Places'}</div><div>{kiosksCount} {kiosksCount === 1 ? 'Kiosk' : 'Kiosks'}</div></div>);
            },
        },
        {
            id: 'actions', header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (<div className="text-right"><Button variant="ghost" size="icon" onClick={() => handleOpenViewDialog(row.original.imageUrl)} disabled={deleteMutation.isPending}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleOpenDialog(row.original)} disabled={deleteMutation.isPending}><Edit className="h-4 w-4" /></Button><ConfirmationDialog title="Delete this floor plan?" description="This will also delete all associated places and kiosks. This action cannot be undone." onConfirm={() => handleDelete(row.original.id)} variant="destructive" confirmText="Delete" triggerButton={<Button variant="ghost" size="icon" className="text-red-500" disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4" /></Button>} /></div>),
        },
    ];

    const table = useReactTable({ data: activeFloorPlans, columns, getCoreRowModel: getCoreRowModel() });
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const row = table.getRowModel().rows.find(r => r.original.id === active.id);
        if (row) {
            setDraggingRow(row);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setDraggingRow(null);
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = activeFloorPlans.findIndex((fp) => fp.id === active.id);
            const newIndex = activeFloorPlans.findIndex((fp) => fp.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                const reordered = arrayMove(activeFloorPlans, oldIndex, newIndex);
                reordered.forEach((fp, index) => {
                    fp.displayOrder = index;
                });
                setActiveFloorPlans(reordered);
                reorderMutation.mutate(reordered.map(fp => fp.id));
            }
        }
    };

    const handleDragCancel = () => {
        setDraggingRow(null);
    };

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Floor Plans</h2>
                    <p className="text-muted-foreground">Manage floor layout images. Drag and drop rows to reorder.</p>
                </div>
                <div className="flex items-center gap-2">
                    {reorderMutation.isPending && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /><span>Saving order...</span></div>}
                    <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Add New Floor Plan</Button>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {isLoading && <p>Loading floor plans...</p>}
                    {isError && <p className="text-destructive">Failed to load floor plans.</p>}
                    {!isLoading && !isError && (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel} modifiers={[restrictToVerticalAxis]}>
                            <Table>
                                <TableHeader>
                                    {table.getHeaderGroups().map(headerGroup => (<TableRow key={headerGroup.id}><TableHead style={{ width: '60px' }} />{headerGroup.headers.map(header => (<TableHead key={header.id} style={{ width: header.getSize() }}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>))}</TableRow>))}
                                </TableHeader>
                                <TableBody>
                                    <SortableContext items={activeFloorPlans.map(fp => fp.id)} strategy={verticalListSortingStrategy}>
                                        {table.getRowModel().rows.map(row => (<DraggableTableRow key={row.id} row={row} reorderMutation={reorderMutation} />))}
                                    </SortableContext>
                                </TableBody>
                            </Table>
                            <DragOverlay>
                                {draggingRow ? (
                                    <Table className="bg-background shadow-lg">
                                        <TableBody>
                                            <TableRow>
                                                <TableCell style={{ width: '60px' }}>
                                                    <Button variant="ghost" className="cursor-grabbing">
                                                        <GripVertical className="h-5 w-5" />
                                                    </Button>
                                                </TableCell>
                                                {draggingRow.getVisibleCells().map(cell => (
                                                    <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    </TableCell>
                                                ))}
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
                        <DialogTitle>{editingFloorPlan ? "Edit Floor Plan" : "Create New Floor Plan"}</DialogTitle>
                        <DialogDescription>Provide a name, image, and optional display order for the floor layout.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4" autoComplete="off">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                            <Label htmlFor="name">Floor Name</Label>
                            <Label htmlFor="displayOrder">Display Order</Label>

                            <Input id="name" {...form.register("name")} placeholder="e.g., Ground Floor" />
                            <Input id="displayOrder" type="number" {...form.register("displayOrder")} placeholder="Optional, e.g., 0" />

                            <p className="text-sm text-red-500 min-h-[1rem] -mt-1">{form.formState.errors.name?.message}</p>
                            <p className="text-sm min-h-[1rem] -mt-1">
                                {form.formState.errors.displayOrder ? (
                                    <span className="text-red-500">{form.formState.errors.displayOrder.message}</span>
                                ) : (
                                    <span className="text-muted-foreground">Can be changed later.</span>
                                )}
                            </p>
                        </div>
                        <div className="space-y-2 pt-2">
                            <Label htmlFor="image">Floor Plan Image</Label>
                            <Input id="image" type="file" accept="image/jpeg,image/png,image/gif,image/svg+xml" {...form.register("image")} />
                            <p className="text-sm text-muted-foreground">{editingFloorPlan ? "Leave blank to keep the current image." : ""}</p>
                            <p className="text-sm text-red-500">{typeof form.formState.errors.image?.message === "string" ? form.formState.errors.image.message : ""}</p>
                        </div>
                        {editingFloorPlan?.imageUrl && (<div className="space-y-2"><Label>Current Image</Label><img src={getAssetUrl(editingFloorPlan.imageUrl)} alt={editingFloorPlan.name} className="h-40 w-full object-contain rounded-md border bg-muted/30" /></div>)}
                        <Button type="submit" disabled={isMutating} className="w-full">{isMutating ? "Saving..." : "Save Floor Plan"}</Button>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-4xl p-4">
                    <DialogHeader>
                        <DialogTitle>Floor Plan Preview</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {viewingImageUrl && (
                            <img
                                src={getAssetUrl(viewingImageUrl)}
                                alt="Floor Plan Preview"
                                className="w-full h-auto max-h-[80vh] object-contain rounded-md"
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
