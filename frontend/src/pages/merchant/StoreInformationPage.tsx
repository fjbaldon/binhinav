import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { apiClient, getAssetUrl } from "@/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Camera, Pencil, Clock, Info, Image as ImageIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Schemas for individual dialog forms
const detailsSchema = z.object({
    name: z.string().min(2, "Name is required"),
    categoryId: z.string().nullable().optional(),
});
const descriptionSchema = z.object({
    description: z.string().min(10, "Description is required"),
});
const hoursSchema = z.object({
    businessHours: z.string().min(2, "Business hours are required"),
});
const imageSchema = z.object({
    logo: z.any().optional(),
    cover: z.any().optional(),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;
type DescriptionFormValues = z.infer<typeof descriptionSchema>;
type HoursFormValues = z.infer<typeof hoursSchema>;
type ImageFormValues = z.infer<typeof imageSchema>;

interface Category {
    id: string;
    name: string;
}

interface Place {
    id: string;
    name: string;
    description: string;
    businessHours: string;
    logoUrl?: string;
    coverUrl?: string;
    category?: Category;
}

export default function StoreInformationPage() {
    const { user } = useAuth();

    const [categories, setCategories] = useState<Category[]>([]);
    const [placeData, setPlaceData] = useState<Place | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchPlaceData = useCallback(async () => {
        if (!user?.placeId) {
            setIsLoading(false);
            return;
        }
        try {
            const [placeRes, categoriesRes] = await Promise.all([
                apiClient.get(`/places/${user.placeId}`),
                apiClient.get('/categories')
            ]);
            setPlaceData(placeRes.data);
            setCategories(categoriesRes.data);
        } catch (error) {
            toast.error("Failed to load store data");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        document.title = "Store Information | Binhinav Merchant";
        fetchPlaceData();
    }, [fetchPlaceData]);

    if (!user?.placeId) {
        return (
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                        <span>Store Not Assigned</span>
                    </CardTitle>
                    <CardDescription>
                        Your merchant account is active, but it has not been assigned to a physical store location yet.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p>You can manage your login credentials, but you will not be able to edit store information until an administrator assigns you to a place.</p>
                    <p className="mt-4">Please contact the system administrator to have your account linked to a store.</p>
                </CardContent>
            </Card>
        );
    }

    const handleUpdate = async (payload: Partial<Place>, onComplete: () => void) => {
        if (!user?.placeId) return false;
        try {
            await apiClient.patch(`/places/${user.placeId}`, payload);
            toast.success("Store information updated.");
            await fetchPlaceData();
            onComplete();
            return true;
        } catch (error: any) {
            toast.error("Update failed", {
                description: error.response?.data?.message || "Something went wrong.",
            });
            return false;
        }
    };

    const handleImageUpdate = async (formData: FormData, onComplete: () => void) => {
        if (!user?.placeId) return false;
        try {
            await apiClient.patch(`/places/${user.placeId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success("Image updated successfully.");
            await fetchPlaceData();
            onComplete();
            return true;
        } catch (error: any) {
            toast.error("Update failed", {
                description: error.response?.data?.message || "Something went wrong.",
            });
            return false;
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <h1 className="text-3xl font-bold tracking-tight">Store Information</h1>
                <p className="text-muted-foreground">Manage the public-facing details of your store.</p>
            </div>

            {isLoading ? <p>Loading store data...</p> : (
                <Card className="overflow-hidden">
                    <div className="relative">
                        <EditImageDialog
                            field="cover"
                            title="Update Cover Photo"
                            currentImageUrl={placeData?.coverUrl}
                            onUpdate={handleImageUpdate}
                        >
                            <Button variant="secondary" className="absolute top-4 right-4 z-10">
                                <Camera className="mr-2 h-4 w-4" /> Edit Cover
                            </Button>
                        </EditImageDialog>
                        <div className="w-full bg-muted aspect-[16/9] max-h-64">
                            {placeData?.coverUrl ? (
                                <img src={getAssetUrl(placeData.coverUrl)} alt="Cover" className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex items-center justify-center h-full w-full">
                                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="relative flex flex-col md:flex-row gap-6 -mt-20 md:-mt-24">
                            <div className="relative h-36 w-36 shrink-0 rounded-full border-4 border-background bg-background group aspect-square">
                                {placeData?.logoUrl ? (
                                    <img src={getAssetUrl(placeData.logoUrl)} alt="Logo" className="h-full w-full rounded-full object-cover" />
                                ) : (
                                    <div className="flex items-center justify-center h-full w-full rounded-full bg-muted">
                                        <Building2 className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                )}
                                <EditImageDialog
                                    field="logo"
                                    title="Update Logo"
                                    currentImageUrl={placeData?.logoUrl}
                                    onUpdate={handleImageUpdate}
                                >
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <Camera className="h-8 w-8 text-white" />
                                    </div>
                                </EditImageDialog>
                            </div>

                            <div className="pt-20 md:pt-24 flex-grow">
                                <EditDetailsDialog
                                    place={placeData}
                                    categories={categories}
                                    onUpdate={handleUpdate}
                                >
                                    <Button variant="outline" size="sm" className="float-right"><Pencil className="mr-2 h-3 w-3" /> Edit</Button>
                                </EditDetailsDialog>
                                <h2 className="text-3xl font-bold">{placeData?.name}</h2>
                                <p className="text-muted-foreground">{placeData?.category?.name || 'No Category Assigned'}</p>
                            </div>
                        </div>

                        <Separator className="my-6" />

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <EditDescriptionDialog place={placeData} onUpdate={handleUpdate}>
                                        <Button variant="outline" size="sm" className="float-right"><Pencil className="mr-2 h-3 w-3" /> Edit</Button>
                                    </EditDescriptionDialog>
                                    <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> About</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{placeData?.description || 'No description provided.'}</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <EditHoursDialog place={placeData} onUpdate={handleUpdate}>
                                        <Button variant="outline" size="sm" className="float-right"><Pencil className="mr-2 h-3 w-3" /> Edit</Button>
                                    </EditHoursDialog>
                                    <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Business Hours</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm font-medium">{placeData?.businessHours || 'Not specified'}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}

// Sub-components for Dialogs

interface EditDetailsDialogProps {
    children: ReactNode;
    place: Place | null;
    categories: Category[];
    onUpdate: (payload: Partial<Place>, onComplete: () => void) => Promise<boolean>;
}

function EditDetailsDialog({ children, place, categories, onUpdate }: EditDetailsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<DetailsFormValues>({
        resolver: zodResolver(detailsSchema),
    });
    useEffect(() => {
        if (place) reset({ name: place.name, categoryId: place.category?.id || 'none' });
    }, [place, isOpen, reset]);

    const onSubmit = async (data: DetailsFormValues) => {
        const payload = { ...data, categoryId: data.categoryId === 'none' ? null : data.categoryId };
        await onUpdate(payload, () => setIsOpen(false));
    };

    return <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogTrigger asChild>{children}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Edit Store Details</DialogTitle><DialogDescription>Update your store's name and category.</DialogDescription></DialogHeader><form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="name">Store Name</Label><Input id="name" {...register("name")} /><p className="text-sm text-red-500">{errors.name?.message}</p></div><div className="space-y-2"><Label>Category</Label><Controller name="categoryId" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value ?? 'none'}><SelectTrigger className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent><SelectItem value="none"><span className="text-muted-foreground">-- No Category --</span></SelectItem>{categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select>)} /></div><DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button></DialogFooter></form></DialogContent></Dialog>
}

interface EditDescriptionDialogProps {
    children: ReactNode;
    place: Place | null;
    onUpdate: (payload: Partial<Place>, onComplete: () => void) => Promise<boolean>;
}

function EditDescriptionDialog({ children, place, onUpdate }: EditDescriptionDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<DescriptionFormValues>({ resolver: zodResolver(descriptionSchema) });
    useEffect(() => { if (place) reset({ description: place.description }); }, [place, isOpen, reset]);

    const onSubmit = async (data: DescriptionFormValues) => { await onUpdate(data, () => setIsOpen(false)) };

    return <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogTrigger asChild>{children}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Edit Description</DialogTitle><DialogDescription>Provide a detailed description for your store.</DialogDescription></DialogHeader><form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4"><Textarea {...register("description")} rows={8} /><p className="text-sm text-red-500">{errors.description?.message}</p><DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button></DialogFooter></form></DialogContent></Dialog>
}

interface EditHoursDialogProps {
    children: ReactNode;
    place: Place | null;
    onUpdate: (payload: Partial<Place>, onComplete: () => void) => Promise<boolean>;
}

function EditHoursDialog({ children, place, onUpdate }: EditHoursDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<HoursFormValues>({ resolver: zodResolver(hoursSchema) });
    useEffect(() => { if (place) reset({ businessHours: place.businessHours }); }, [place, isOpen, reset]);

    const onSubmit = async (data: HoursFormValues) => { await onUpdate(data, () => setIsOpen(false)) };

    return <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogTrigger asChild>{children}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Edit Business Hours</DialogTitle><DialogDescription>Let customers know when you are open.</DialogDescription></DialogHeader><form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4"><Input {...register("businessHours")} placeholder="e.g., 9:00 AM - 9:00 PM Daily" /><p className="text-sm text-red-500">{errors.businessHours?.message}</p><DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button></DialogFooter></form></DialogContent></Dialog>
}

interface EditImageDialogProps {
    children: ReactNode;
    field: 'logo' | 'cover';
    title: string;
    currentImageUrl?: string | null;
    onUpdate: (formData: FormData, onComplete: () => void) => Promise<boolean>;
}

function EditImageDialog({ children, field, title, currentImageUrl, onUpdate }: EditImageDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const { register, handleSubmit, formState: { isSubmitting }, reset } = useForm<ImageFormValues>({ resolver: zodResolver(imageSchema) });

    useEffect(() => {
        setPreview(currentImageUrl ? getAssetUrl(currentImageUrl) : null);
    }, [currentImageUrl]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPreview(URL.createObjectURL(file));
    };

    const onSubmit = async (data: ImageFormValues) => {
        const file = data[field]?.[0];
        if (file) {
            const formData = new FormData();
            formData.append(field, file);
            await onUpdate(formData, () => setIsOpen(false));
        } else {
            toast.info("No new image selected.");
        }
    };

    const onOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            reset();
            setPreview(currentImageUrl ? getAssetUrl(currentImageUrl) : null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {field === 'cover'
                            ? "Upload a new banner. 16:9 ratio is recommended."
                            : "Upload a new logo. 1:1 (square) ratio is recommended."
                        }
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="flex justify-center bg-muted/50 rounded-lg p-4">
                        {preview ? (
                            <img src={preview} alt="Preview" className={`object-contain rounded-md border max-h-60 ${field === 'logo' ? 'aspect-square' : 'aspect-video'}`} />
                        ) : (
                            <div className={`flex items-center justify-center bg-muted rounded-md h-48 ${field === 'logo' ? 'w-48' : 'w-full'}`}>
                                <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            </div>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor={field}>New Image</Label>
                        <Input id={field} type="file" accept="image/*" {...register(field, { onChange: handleFileChange })} />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Uploading...' : 'Upload & Save'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
