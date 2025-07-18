import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

// Interfaces for related data
interface Category { id: string; name: string; }
interface FloorPlan { id: string; name: string; }
interface Merchant { id: string; name: string; }
interface Place {
    id: string;
    name: string;
    category?: Category;
    floorPlan: FloorPlan;
    merchant?: Merchant;
}

// Schema for form validation, matches CreatePlaceDto
const placeSchema = z.object({
    name: z.string().min(2, "Name is required."),
    description: z.string().min(10, "Description is required."),
    businessHours: z.string().min(2, "Business hours are required."),
    locationX: z.coerce.number().refine(val => !isNaN(val), { message: "Must be a number" }),
    locationY: z.coerce.number().refine(val => !isNaN(val), { message: "Must be a number" }),
    floorPlanId: z.uuid("A floor plan must be selected."),
    categoryId: z.uuid().optional(),
    merchantId: z.uuid().optional(),
    logo: z.any().optional(),
    cover: z.any().optional(),
});

type PlaceFormValues = z.infer<typeof placeSchema>;

export default function PlacesPage() {
    // State for all data types
    const [places, setPlaces] = useState<Place[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
    const [merchants, setMerchants] = useState<Merchant[]>([]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlace, setEditingPlace] = useState<Place | null>(null);

    const form = useForm({
        resolver: zodResolver(placeSchema),
    });

    // Fetch all required data in parallel
    const fetchData = async () => {
        try {
            const [placesRes, catRes, fpRes, merchRes] = await Promise.all([
                apiClient.get<Place[]>("/places"),
                apiClient.get<Category[]>("/categories"),
                apiClient.get<FloorPlan[]>("/floor-plans"),
                apiClient.get<Merchant[]>("/merchants"),
            ]);
            setPlaces(placesRes.data);
            setCategories(catRes.data);
            setFloorPlans(fpRes.data);
            setMerchants(merchRes.data);
        } catch (error) {
            toast.error("Failed to fetch page data");
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenDialog = async (place: Place | null = null) => {
        setEditingPlace(place);
        if (place) {
            // For editing, we need to fetch the full place details
            const response = await apiClient.get(`/places/${place.id}`);
            const fullPlace = response.data;
            form.reset({
                name: fullPlace.name,
                description: fullPlace.description,
                businessHours: fullPlace.businessHours,
                locationX: fullPlace.locationX,
                locationY: fullPlace.locationY,
                floorPlanId: fullPlace.floorPlan.id,
                categoryId: fullPlace.category?.id,
                merchantId: fullPlace.merchant?.id,
            });
        } else {
            form.reset();
        }
        setIsDialogOpen(true);
    };

    const onSubmit = async (data: PlaceFormValues) => {
        const formData = new FormData();

        // Append all text/number fields
        Object.entries(data).forEach(([key, value]) => {
            if (key !== 'logo' && key !== 'cover' && value !== undefined && value !== null) {
                formData.append(key, String(value));
            }
        });

        // Append files if they exist
        if (data.logo && data.logo[0]) formData.append('logo', data.logo[0]);
        if (data.cover && data.cover[0]) formData.append('cover', data.cover[0]);

        try {
            const config = { headers: { 'Content-Type': 'multipart/form-data' } };
            if (editingPlace) {
                await apiClient.patch(`/places/${editingPlace.id}`, formData, config);
                toast.success("Place updated.");
            } else {
                await apiClient.post("/places", formData, config);
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
        if (!window.confirm("Are you sure you want to delete this place?")) return;
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
                    <p className="text-muted-foreground">Manage all store locations, details, and assignments.</p>
                </div>
                <Button onClick={() => handleOpenDialog()} disabled={floorPlans.length === 0}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Place
                </Button>
            </div>
            {floorPlans.length === 0 && <p className="text-orange-500 mb-4">You must create a Floor Plan before you can add a Place.</p>}

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Floor Plan</TableHead>
                                <TableHead>Assigned Merchant</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {places.map((place) => (
                                <TableRow key={place.id}>
                                    <TableCell className="font-medium">{place.name}</TableCell>
                                    <TableCell>{place.category?.name ?? 'N/A'}</TableCell>
                                    <TableCell>{place.floorPlan?.name ?? 'N/A'}</TableCell>
                                    <TableCell>{place.merchant?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(place)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(place.id)}>
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
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>{editingPlace ? "Edit Place" : "Create New Place"}</DialogTitle>
                        <DialogDescription>Use the map in the main app to get X/Y coordinates.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[70vh] pr-6">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                            {/* Basic Info */}
                            <Label>Basic Information</Label>
                            <Input placeholder="Place Name" {...form.register("name")} />
                            {form.formState.errors.name && <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>}

                            <Textarea placeholder="Description" {...form.register("description")} />
                            {form.formState.errors.description && <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>}

                            <Input placeholder="Business Hours (e.g., 9AM - 9PM)" {...form.register("businessHours")} />
                            {form.formState.errors.businessHours && <p className="text-sm text-red-500">{form.formState.errors.businessHours.message}</p>}

                            {/* Location */}
                            <div className="grid grid-cols-2 gap-4">
                                <Input type="number" step="any" placeholder="Location X" {...form.register("locationX")} />
                                <Input type="number" step="any" placeholder="Location Y" {...form.register("locationY")} />
                            </div>

                            {/* Assignments */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Select onValueChange={(v) => form.setValue('floorPlanId', v)} defaultValue={form.getValues('floorPlanId')}>
                                    <SelectTrigger><SelectValue placeholder="* Select Floor Plan" /></SelectTrigger>
                                    <SelectContent>{floorPlans.map(fp => <SelectItem key={fp.id} value={fp.id}>{fp.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <Select onValueChange={(v) => form.setValue('categoryId', v)} defaultValue={form.getValues('categoryId')}>
                                    <SelectTrigger><SelectValue placeholder="Select Category (Optional)" /></SelectTrigger>
                                    <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <Select onValueChange={(v) => form.setValue('merchantId', v)} defaultValue={form.getValues('merchantId')}>
                                    <SelectTrigger><SelectValue placeholder="Assign Merchant (Optional)" /></SelectTrigger>
                                    <SelectContent>{merchants.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            {form.formState.errors.floorPlanId && <p className="text-sm text-red-500">{form.formState.errors.floorPlanId.message}</p>}

                            {/* File Uploads */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="logo">Logo</Label>
                                    <Input id="logo" type="file" {...form.register("logo")} />
                                </div>
                                <div>
                                    <Label htmlFor="cover">Cover Image</Label>
                                    <Input id="cover" type="file" {...form.register("cover")} />
                                </div>
                            </div>

                            <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                                {form.formState.isSubmitting ? "Saving..." : "Save Place"}
                            </Button>
                        </form>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
}
