import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { apiClient, getAssetUrl } from "@/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Eye } from "lucide-react";

// Based on your Place entity and UpdatePlaceDto
const storeInfoSchema = z.object({
    name: z.string().min(2, "Name is required"),
    categoryId: z.string().nullable().optional(),
    description: z.string().min(10, "Description is required"),
    businessHours: z.string().min(2, "Business hours are required"),
    logo: z.any().optional(),
    cover: z.any().optional(),
});

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

type StoreInfoFormValues = z.infer<typeof storeInfoSchema>;

export default function StoreInformationPage() {
    const { user } = useAuth();
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, control } = useForm<StoreInfoFormValues>({
        resolver: zodResolver(storeInfoSchema),
    });

    const [categories, setCategories] = useState<Category[]>([]);
    const [placeData, setPlaceData] = useState<Place | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

    useEffect(() => {
        document.title = "Store Information | Binhinav Merchant";
        if (!user?.placeId) {
            setPlaceData(null); // Clear data if user has no placeId
            return;
        }

        const fetchAllData = async () => {
            try {
                const [placeRes, categoriesRes] = await Promise.all([
                    apiClient.get(`/places/${user.placeId}`),
                    apiClient.get('/categories')
                ]);

                setPlaceData(placeRes.data);
                setCategories(categoriesRes.data);

            } catch (error) {
                toast.error("Failed to load store data");
                setPlaceData(null);
            }
        };

        fetchAllData();
    }, [user]);

    // This new effect safely resets the form only when all required data is loaded into state.
    useEffect(() => {
        if (placeData && categories.length > 0) {
            reset({
                name: placeData.name,
                description: placeData.description,
                businessHours: placeData.businessHours,
                categoryId: placeData.category?.id || 'none',
            });
            if (placeData.logoUrl) setLogoPreview(getAssetUrl(placeData.logoUrl));
            else setLogoPreview(null);
            if (placeData.coverUrl) setCoverPreview(getAssetUrl(placeData.coverUrl));
            else setCoverPreview(null);
        }
    }, [placeData, categories, reset]);

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

    const onSubmit = async (data: StoreInfoFormValues) => {
        if (!user?.placeId) return;

        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description);
        formData.append('businessHours', data.businessHours);
        if (data.logo && data.logo[0]) {
            formData.append('logo', data.logo[0]);
        }
        if (data.cover && data.cover[0]) {
            formData.append('cover', data.cover[0]);
        }

        const categoryIdValue = data.categoryId;
        if (categoryIdValue && categoryIdValue !== 'none') {
            formData.append('categoryId', categoryIdValue);
        } else {
            formData.append('categoryId', '');
        }

        try {
            await apiClient.patch(`/places/${user.placeId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast.success("Store information updated.");
        } catch (error: any) {
            toast.error("Update failed", {
                description: error.response?.data?.message || "Something went wrong.",
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
        const file = e.target.files?.[0];
        if (file) {
            setter(URL.createObjectURL(file));
        }
    };

    return (
        <>
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Store Information</h2>
                <p className="text-muted-foreground">Manage the public-facing details for your store.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Store Details</CardTitle>
                        <CardDescription>Update the name, description, hours, and images for your store.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Full-width text fields */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Store Name</Label>
                            <Input id="name" {...register("name")} />
                            <p className="text-sm text-red-500">{errors.name?.message}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...register("description")} rows={5} />
                            <p className="text-sm text-red-500">{errors.description?.message}</p>
                        </div>

                        {/* Two-column grid for the rest of the fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Controller
                                    name="categoryId"
                                    control={control}
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value ?? 'none'}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none"><span className="text-muted-foreground">-- No Category --</span></SelectItem>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="businessHours">Business Hours</Label>
                                <Input id="businessHours" {...register("businessHours")} placeholder="e.g., 9:00 AM - 9:00 PM" />
                                <p className="text-sm text-red-500">{errors.businessHours?.message}</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="logo">Logo Image</Label>
                                <Input id="logo" type="file" accept="image/*"
                                    {...register("logo", {
                                        onChange: (e) => handleFileChange(e, setLogoPreview)
                                    })}
                                />
                                {logoPreview && (
                                    <div className="mt-2">
                                        <p className="text-sm font-medium text-muted-foreground">Preview:</p>
                                        <div className="relative w-fit group">
                                            <img src={logoPreview} className="h-32 w-32 object-cover rounded-lg border" alt="Logo Preview" />
                                            <Button type="button" variant="outline" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setViewingImageUrl(logoPreview)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cover">Cover Image</Label>
                                <Input id="cover" type="file" accept="image/*"
                                    {...register("cover", {
                                        onChange: (e) => handleFileChange(e, setCoverPreview)
                                    })}
                                />
                                {coverPreview && (
                                    <div className="mt-2">
                                        <p className="text-sm font-medium text-muted-foreground">Preview:</p>
                                        <div className="relative group">
                                            <img src={coverPreview} className="h-32 w-full object-cover rounded-lg border" alt="Cover Preview" />
                                            <Button type="button" variant="outline" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setViewingImageUrl(coverPreview)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            <Dialog open={!!viewingImageUrl} onOpenChange={(isOpen) => !isOpen && setViewingImageUrl(null)}>
                <DialogContent className="max-w-4xl p-4">
                    <DialogHeader>
                        <DialogTitle>Image Preview</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <img
                            src={viewingImageUrl ?? ''}
                            alt="Image Preview"
                            className="w-full h-auto max-h-[80vh] object-contain rounded-md"
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
