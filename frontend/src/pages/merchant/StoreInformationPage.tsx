import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { apiClient, getAssetUrl } from "@/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2 } from "lucide-react";

// Based on your Place entity and UpdatePlaceDto
const storeInfoSchema = z.object({
    name: z.string().min(2, "Name is required"),
    description: z.string().min(10, "Description is required"),
    businessHours: z.string().min(2, "Business hours are required"),
    logo: z.any().optional(),
    cover: z.any().optional(),
});

type StoreInfoFormValues = z.infer<typeof storeInfoSchema>;

export default function StoreInformationPage() {
    const { user } = useAuth();

    const form = useForm({
        resolver: zodResolver(storeInfoSchema),
    });

    useEffect(() => {
        document.title = "Store Information | Binhinav Merchant";
        // If there's no placeId, we don't need to fetch anything.
        // The component will render the "Not Assigned" message.
        if (!user?.placeId) return;

        const fetchPlaceData = async () => {
            try {
                const response = await apiClient.get(`/places/${user.placeId}`);
                const place = response.data;
                form.reset({
                    name: place.name,
                    description: place.description,
                    businessHours: place.businessHours,
                });
                // Set image previews
                if (place.logoUrl) {
                    const logoPreview = document.getElementById('logo-preview') as HTMLImageElement;
                    if (logoPreview) logoPreview.src = getAssetUrl(place.logoUrl);
                }
                if (place.coverUrl) {
                    const coverPreview = document.getElementById('cover-preview') as HTMLImageElement;
                    if (coverPreview) coverPreview.src = getAssetUrl(place.coverUrl);
                }

            } catch (error) {
                toast.error("Failed to load store data");
            }
        };

        fetchPlaceData();
    }, [user, form]);

    // If the merchant is not assigned to a place, show a message instead of the form.
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

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Store Information</h2>
                <p className="text-muted-foreground">Manage the public-facing details for your store.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Edit Store Details</CardTitle>
                    <CardDescription>Update the name, description, hours, and images for your store.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Store Name</Label>
                            <Input id="name" {...form.register("name")} />
                            <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...form.register("description")} />
                            <p className="text-sm text-red-500">{form.formState.errors.description?.message}</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="businessHours">Business Hours</Label>
                            <Input id="businessHours" {...form.register("businessHours")} placeholder="e.g., 9:00 AM - 9:00 PM" />
                            <p className="text-sm text-red-500">{form.formState.errors.businessHours?.message}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="logo">Logo Image</Label>
                                <Input id="logo" type="file" accept="image/*" {...form.register("logo")} />
                                <p className="text-sm text-muted-foreground">Current Logo:</p>
                                <img id="logo-preview" className="h-24 w-24 object-cover rounded-md border" alt="Logo Preview" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cover">Cover Image</Label>
                                <Input id="cover" type="file" accept="image/*" {...form.register("cover")} />
                                <p className="text-sm text-muted-foreground">Current Cover:</p>
                                <img id="cover-preview" className="h-24 w-full object-cover rounded-md border" alt="Cover Preview" />
                            </div>
                        </div>


                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
