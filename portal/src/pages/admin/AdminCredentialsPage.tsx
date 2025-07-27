import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from '@tanstack/react-query';
import { updateAdminProfile } from "@/api/admins";
import { type AdminPayload } from "@/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";

const credentialsSchema = z.object({
    username: z.string().min(4, "Username must be at least 4 characters.").optional().or(z.literal('')),
    password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
}).refine(data => !!data.username || !!data.password, {
    message: "At least one field must be filled.",
    path: ["username"],
});

type CredentialsFormValues = z.infer<typeof credentialsSchema>;

export default function AdminCredentialsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const form = useForm({
        resolver: zodResolver(credentialsSchema),
        defaultValues: { username: user?.username || '', password: '' }
    });

    const updateMutation = useMutation({
        mutationFn: updateAdminProfile,
        onSuccess: (data, variables) => {
            if (variables.username) {
                toast.success("Username updated!", {
                    description: "For security, you will be logged out in 3 seconds.",
                });
                setTimeout(() => {
                    logout();
                    navigate("/login");
                }, 3000);
            } else {
                toast.success("Password updated successfully.");
                form.reset({ username: data.username, password: '' });
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
        document.title = "Credentials | Binhinav Admin";
    }, []);

    const onSubmit = (data: CredentialsFormValues) => {
        const payload: AdminPayload = {};
        if (data.username && data.username !== user?.username) {
            payload.username = data.username;
        }
        if (data.password) {
            payload.password = data.password;
        }

        if (Object.keys(payload).length === 0) {
            toast.info("Nothing to update", {
                description: "You didn't change the username or enter a new password."
            });
            return;
        }

        updateMutation.mutate(payload);
    };

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Credentials</h2>
                <p className="text-muted-foreground">Update your admin login information.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Update Your Login Details</CardTitle>
                    <CardDescription>
                        Modify your username or password below. Leave a field blank to keep it unchanged.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-8 md:grid-cols-2">
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" {...form.register("username")} />
                                {form.formState.errors.username && <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">New Password</Label>
                                <Input id="password" type="password" {...form.register("password")} placeholder="Enter a new password" />
                                {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
                            </div>
                            <Button type="submit" disabled={updateMutation.isPending}>
                                {updateMutation.isPending ? "Saving..." : "Update Credentials"}
                            </Button>
                        </form>
                        <div className="space-y-4 border-l md:pl-8">
                            <div className="flex items-center gap-4">
                                <KeyRound className="h-10 w-10 text-muted-foreground" />
                                <h3 className="text-lg font-semibold">Security Best Practices</h3>
                            </div>
                            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                                <li>Use a strong, unique password to protect your account.</li>
                                <li>Your new password must be at least 8 characters long.</li>
                                <li>Avoid using easily guessable information like your name or birthdate.</li>
                                <li>If you change your username, you will be automatically logged out.</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
