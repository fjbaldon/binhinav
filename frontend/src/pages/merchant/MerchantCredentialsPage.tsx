import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";

const credentialsSchema = z.object({
    username: z.string().min(4, "Username must be at least 4 characters.").optional().or(z.literal('')),
    password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
}).refine(data => data.username || data.password, {
    message: "At least one field (username or password) must be filled.",
    path: ["username"], // Attach error to a field
});

type CredentialsFormValues = z.infer<typeof credentialsSchema>;

export default function MerchantCredentialsPage() {
    const { user } = useAuth();

    useEffect(() => {
        document.title = "Credentials | Binhinav Merchant";
    }, []);
    
    const form = useForm({
        resolver: zodResolver(credentialsSchema),
        defaultValues: { username: user?.username || '' }
    });

    const onSubmit = async (data: CredentialsFormValues) => {
        // Filter out empty fields so we only send what's being changed
        const payload: Partial<CredentialsFormValues> = {};
        if (data.username) payload.username = data.username;
        if (data.password) payload.password = data.password;

        if (Object.keys(payload).length === 0) {
            toast.info("Nothing to update", {
                description: "Please enter a new username or password.",
            });
            return;
        }

        try {
            await apiClient.patch('/merchants/me', payload);
            toast.success("Credentials updated.", {
                description: "You may need to log in again if you changed your username.",
            });
            form.reset({ username: data.username, password: '' });
        } catch (error: any) {
            toast.error("Update Failed", {
                description: error.response?.data?.message || "Username may already be taken.",
            });
        }
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Credentials</h2>
                <p className="text-muted-foreground">Update your merchant login information.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Update Login Details</CardTitle>
                    <CardDescription>Leave fields blank to keep them unchanged.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" {...form.register("username")} />
                            <p className="text-sm text-red-500">{form.formState.errors.username?.message}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input id="password" type="password" {...form.register("password")} placeholder="Enter a new password" />
                            <p className="text-sm text-red-500">{form.formState.errors.password?.message}</p>
                        </div>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Saving..." : "Update Credentials"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
