import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getAdminProfile, updateAdminProfile } from "@/api/admins";
import { type AdminPayload } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    email: z.email("Invalid email address.").optional().or(z.literal('')),
    username: z.string().min(4, "Username must be at least 4 characters."),
    password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function AdminProfilePage() {
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const form = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: '', email: '', username: '', password: '' }
    });

    const { data: profileData } = useQuery({
        queryKey: ['adminProfile'],
        queryFn: getAdminProfile,
        enabled: !!user,
    });

    useEffect(() => {
        if (profileData) {
            form.reset({
                name: profileData.name || '',
                email: profileData.email || '',
                username: profileData.username || '',
                password: '',
            });
        }
    }, [profileData, form]);

    const updateMutation = useMutation({
        mutationFn: updateAdminProfile,
        onSuccess: (data, variables) => {
            updateUser(data);
            queryClient.invalidateQueries({ queryKey: ['adminProfile'] });
            if (variables.username) {
                toast.success("Username updated!", {
                    description: "For security, you will be logged out in 3 seconds.",
                });
                setTimeout(() => {
                    logout();
                    navigate("/login");
                }, 3000);
            } else {
                toast.success("Profile updated successfully.");
                form.reset({ ...form.getValues(), password: '' });
            }
        },
        onError: (error: any) => {
            if (error.response?.status === 401) return;
            toast.error("Update Failed", {
                description: error.response?.data?.message || "Something went wrong.",
            });
        }
    });


    useEffect(() => {
        document.title = "Profile | Binhinav Admin";
    }, []);

    const onSubmit = (data: ProfileFormValues) => {
        const payload: AdminPayload = {};
        if (data.name !== profileData?.name) payload.name = data.name;
        if (data.email !== profileData?.email) {
            payload.email = data.email ? data.email : null;
        }
        if (data.username !== profileData?.username) payload.username = data.username;
        if (data.password) payload.password = data.password;

        if (Object.keys(payload).length === 0) {
            toast.info("Nothing to update", {
                description: "You haven't changed any profile details."
            });
            return;
        }

        updateMutation.mutate(payload);
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
                <p className="text-muted-foreground">Update your personal details and login information.</p>
            </div>
            <Card>
                <form onSubmit={form.handleSubmit(onSubmit)} autoComplete="off">
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>
                            This information is used to identify you in the system.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" {...form.register("name")} />
                                <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" {...form.register("email")} />
                                <p className="text-sm text-red-500">{form.formState.errors.email?.message}</p>
                            </div>
                        </div>
                    </CardContent>

                    <Separator />

                    <CardHeader>
                        <CardTitle>Login Credentials</CardTitle>
                        <CardDescription>
                            Manage your sign-in details. If you change your username, you will be logged out.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" {...form.register("username")} />
                                <p className="text-sm text-red-500">{form.formState.errors.username?.message}</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input id="password" type="password" {...form.register("password")} placeholder="Leave blank to keep unchanged" />
                                <p className="text-sm text-red-500">{form.formState.errors.password?.message}</p>
                            </div>
                        </div>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? "Saving..." : "Update Profile"}
                        </Button>
                    </CardContent>
                </form>
            </Card>
        </div>
    )
}
