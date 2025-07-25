import { useEffect, useState, type ReactNode } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlaceById, updatePlace, updatePlaceWithImages } from "@/api/places";
import { getCategories } from "@/api/categories";
import type { Place, Category, UpdatePlacePayload } from "@/api/types";
import { getAssetUrl } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Camera, Pencil, Clock, Info, Image as ImageIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const detailsSchema = z.object({ name: z.string().min(2, "Name is required"), categoryId: z.string().nullable().optional() });
const descriptionSchema = z.object({ description: z.string().min(10, "Description must be at least 10 characters.") });
const hoursSchema = z.object({ businessHours: z.string().min(2, "Business hours are required") });
const imageSchema = z.object({ logo: z.any().optional(), cover: z.any().optional() });

type DetailsFormValues = z.infer<typeof detailsSchema>;
type DescriptionFormValues = z.infer<typeof descriptionSchema>;
type HoursFormValues = z.infer<typeof hoursSchema>;
type ImageFormValues = z.infer<typeof imageSchema>;

export default function StoreInformationPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: placeData, isLoading: isLoadingPlace } = useQuery({
        queryKey: ['myPlace', user?.placeId],
        queryFn: () => getPlaceById(user!.placeId!),
        enabled: !!user?.placeId,
    });

    const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    const updateMutation = useMutation({
        mutationFn: updatePlace,
        onSuccess: () => {
            toast.success("Store information updated.");
            queryClient.invalidateQueries({ queryKey: ['myPlace', user?.placeId] });
        },
        onError: (err: any) => toast.error("Update failed", { description: err.response?.data?.message }),
    });

    const updateImagesMutation = useMutation({
        mutationFn: updatePlaceWithImages,
        onSuccess: () => {
            toast.success("Image updated successfully.");
            queryClient.invalidateQueries({ queryKey: ['myPlace', user?.placeId] });
        },
        onError: (err: any) => toast.error("Update failed", { description: err.response?.data?.message }),
    });

    useEffect(() => {
        document.title = "Store Information | Binhinav Merchant";
    }, []);

    if (!user?.placeId) {
        return (
            <Card className="mt-8"><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-6 w-6 text-muted-foreground" /><span>Store Not Assigned</span></CardTitle><CardDescription>Your merchant account is active, but it has not been assigned to a physical store location yet.</CardDescription></CardHeader><CardContent><p>Please contact the system administrator to have your account linked to a store.</p></CardContent></Card>
        );
    }

    if (isLoadingPlace || isLoadingCategories) {
        return <p>Loading store data...</p>;
    }

    return (
        <div className="space-y-6">
            <div className="mb-4">
                <h1 className="text-3xl font-bold tracking-tight">Store Information</h1>
                <p className="text-muted-foreground">Manage the public-facing details of your store.</p>
            </div>

            <Card className="overflow-hidden">
                <div className="relative">
                    <EditImageDialog field="cover" title="Update Cover Photo" currentImageUrl={placeData?.coverUrl} onUpdate={updateImagesMutation.mutateAsync} isPending={updateImagesMutation.isPending}>
                        <Button variant="secondary" className="absolute top-4 right-4 z-10"><Camera className="mr-2 h-4 w-4" /> Edit Cover</Button>
                    </EditImageDialog>
                    <div className="w-full bg-muted aspect-[16/9] max-h-64">{placeData?.coverUrl ? <img src={getAssetUrl(placeData.coverUrl)} alt="Cover" className="h-full w-full object-cover" /> : <div className="flex items-center justify-center h-full w-full"><ImageIcon className="h-16 w-16 text-muted-foreground" /></div>}</div>
                </div>
                <div className="p-6">
                    <div className="relative flex flex-col md:flex-row gap-6 -mt-20 md:-mt-24">
                        <div className="relative h-36 w-36 shrink-0 rounded-full border-4 border-background bg-background group aspect-square">
                            {placeData?.logoUrl ? <img src={getAssetUrl(placeData.logoUrl)} alt="Logo" className="h-full w-full rounded-full object-cover" /> : <div className="flex items-center justify-center h-full w-full rounded-full bg-muted"><Building2 className="h-16 w-16 text-muted-foreground" /></div>}
                            <EditImageDialog field="logo" title="Update Logo" currentImageUrl={placeData?.logoUrl} onUpdate={updateImagesMutation.mutateAsync} isPending={updateImagesMutation.isPending}>
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Camera className="h-8 w-8 text-white" /></div>
                            </EditImageDialog>
                        </div>
                        <div className="pt-20 md:pt-24 flex-grow">
                            <EditDetailsDialog place={placeData || null} categories={categories} onUpdate={updateMutation.mutateAsync} isPending={updateMutation.isPending}><Button variant="outline" size="sm" className="float-right"><Pencil className="mr-2 h-3 w-3" /> Edit</Button></EditDetailsDialog>
                            <h2 className="text-3xl font-bold">{placeData?.name}</h2>
                            <p className="text-muted-foreground">{placeData?.category?.name || 'No Category Assigned'}</p>
                        </div>
                    </div>
                    <Separator className="my-6" />
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card><CardHeader><EditDescriptionDialog place={placeData || null} onUpdate={updateMutation.mutateAsync} isPending={updateMutation.isPending}><Button variant="outline" size="sm" className="float-right"><Pencil className="mr-2 h-3 w-3" /> Edit</Button></EditDescriptionDialog><CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> About</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground whitespace-pre-wrap">{placeData?.description || 'No description provided.'}</p></CardContent></Card>
                        <Card><CardHeader><EditHoursDialog place={placeData || null} onUpdate={updateMutation.mutateAsync} isPending={updateMutation.isPending}><Button variant="outline" size="sm" className="float-right"><Pencil className="mr-2 h-3 w-3" /> Edit</Button></EditHoursDialog><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Business Hours</CardTitle></CardHeader><CardContent><p className="text-sm font-medium">{placeData?.businessHours || 'Not specified'}</p></CardContent></Card>
                    </div>
                </div>
            </Card>
        </div>
    );
}

interface DialogProps<T extends Partial<UpdatePlacePayload>> {
    children: ReactNode;
    place: Place | null;
    onUpdate: (vars: { id: string; payload: T }) => Promise<any>;
    isPending: boolean;
}

interface ImageDialogProps {
    children: ReactNode;
    field: 'logo' | 'cover';
    title: string;
    currentImageUrl?: string | null;
    onUpdate: (vars: { id: string, formData: FormData }) => Promise<any>;
    isPending: boolean;
}

function EditDetailsDialog({ children, place, categories, onUpdate, isPending }: DialogProps<DetailsFormValues> & { categories: Category[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const { register, handleSubmit, formState: { errors }, reset, control } = useForm<DetailsFormValues>({ resolver: zodResolver(detailsSchema) });

    useEffect(() => {
        if (place && isOpen) reset({ name: place.name, categoryId: place.category?.id || 'none' });
    }, [place, isOpen, reset]);

    const onSubmit = async (data: DetailsFormValues) => {
        if (!place) return;
        const payload = { ...data, categoryId: data.categoryId === 'none' ? null : data.categoryId };
        await onUpdate({ id: place.id, payload }).then(() => setIsOpen(false));
    };

    return <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogTrigger asChild>{children}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Edit Store Details</DialogTitle><DialogDescription>Update your store's name and category.</DialogDescription></DialogHeader><form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4"><div className="space-y-2"><Label htmlFor="name">Store Name</Label><Input id="name" {...register("name")} /><p className="text-sm text-red-500">{errors.name?.message}</p></div><div className="space-y-2"><Label>Category</Label><Controller name="categoryId" control={control} render={({ field }) => (<Select onValueChange={field.onChange} value={field.value ?? 'none'}><SelectTrigger className="w-full"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent><SelectItem value="none"><span className="text-muted-foreground">-- No Category --</span></SelectItem>{categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}</SelectContent></Select>)} /></div><DialogFooter><Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</Button></DialogFooter></form></DialogContent></Dialog>
}

function EditDescriptionDialog({ children, place, onUpdate, isPending }: DialogProps<DescriptionFormValues>) {
    const [isOpen, setIsOpen] = useState(false);
    const { register, handleSubmit, formState: { errors }, reset } = useForm<DescriptionFormValues>({ resolver: zodResolver(descriptionSchema) });
    useEffect(() => { if (place && isOpen) reset({ description: place.description }); }, [place, isOpen, reset]);
    const onSubmit = async (data: DescriptionFormValues) => { if (place) await onUpdate({ id: place.id, payload: data }).then(() => setIsOpen(false)) };
    return <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogTrigger asChild>{children}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Edit Description</DialogTitle><DialogDescription>Provide a detailed description for your store.</DialogDescription></DialogHeader><form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4"><Textarea {...register("description")} rows={8} /><p className="text-sm text-red-500">{errors.description?.message}</p><DialogFooter><Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</Button></DialogFooter></form></DialogContent></Dialog>
}

function EditHoursDialog({ children, place, onUpdate, isPending }: DialogProps<HoursFormValues>) {
    const [isOpen, setIsOpen] = useState(false);
    const { register, handleSubmit, formState: { errors }, reset } = useForm<HoursFormValues>({ resolver: zodResolver(hoursSchema) });
    useEffect(() => { if (place && isOpen) reset({ businessHours: place.businessHours }); }, [place, isOpen, reset]);
    const onSubmit = async (data: HoursFormValues) => { if (place) await onUpdate({ id: place.id, payload: data }).then(() => setIsOpen(false)) };
    return <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogTrigger asChild>{children}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Edit Business Hours</DialogTitle><DialogDescription>Let customers know when you are open.</DialogDescription></DialogHeader><form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4"><Input {...register("businessHours")} placeholder="e.g., 9:00 AM - 9:00 PM Daily" /><p className="text-sm text-red-500">{errors.businessHours?.message}</p><DialogFooter><Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Changes'}</Button></DialogFooter></form></DialogContent></Dialog>
}

function EditImageDialog({ children, field, title, currentImageUrl, onUpdate, isPending }: ImageDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const { register, handleSubmit, reset } = useForm<ImageFormValues>({ resolver: zodResolver(imageSchema) });
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen) setPreview(currentImageUrl ? getAssetUrl(currentImageUrl) : null);
    }, [currentImageUrl, isOpen]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPreview(URL.createObjectURL(file));
    };

    const onSubmit = async (data: ImageFormValues) => {
        const file = data[field]?.[0];
        if (file && user?.placeId) {
            const formData = new FormData();
            formData.append(field, file);
            await onUpdate({ id: user.placeId, formData }).then(() => setIsOpen(false));
        } else {
            toast.info("No new image selected.");
        }
    };

    const onOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) reset();
    };

    return <Dialog open={isOpen} onOpenChange={onOpenChange}><DialogTrigger asChild>{children}</DialogTrigger><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{field === 'cover' ? "Upload a new banner. 16:9 ratio recommended." : "Upload a new logo. 1:1 (square) ratio recommended."}</DialogDescription></DialogHeader><form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4"><div className="flex justify-center bg-muted/50 rounded-lg p-4">{preview ? <img src={preview} alt="Preview" className={`object-contain rounded-md border max-h-60 ${field === 'logo' ? 'aspect-square' : 'aspect-video'}`} /> : <div className={`flex items-center justify-center bg-muted rounded-md h-48 ${field === 'logo' ? 'w-48' : 'w-full'}`}><ImageIcon className="h-12 w-12 text-muted-foreground" /></div>}</div><div className="space-y-2"><Label htmlFor={field}>New Image</Label><Input id={field} type="file" accept="image/jpeg,image/png,image/gif,image/svg+xml" {...register(field, { onChange: handleFileChange })} /></div><DialogFooter><Button type="submit" disabled={isPending}>{isPending ? 'Uploading...' : 'Upload & Save'}</Button></DialogFooter></form></DialogContent></Dialog>;
}
