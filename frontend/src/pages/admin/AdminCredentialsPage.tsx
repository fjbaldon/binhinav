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

// Schema is identical to the merchant's, but will hit a different endpoint
const credentialsSchema = z.object({
    username: z.string().min(4, "Username must be at least 4 characters.").optional().or(z.literal('')),
    password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal('')),
}).refine(data => data.username || data.password, {
    message: "At least one field must be filled.",
    path: ["username"],
});

type CredentialsFormValues = z.infer<typeof credentialsSchema>;

export default function AdminCredentialsPage() {
    const { user } = useAuth();
    const form = useForm({
        resolver: zodResolver(credentialsSchema),
        defaultValues: { username: user?.username || '' }
    });

    const onSubmit = async (data: CredentialsFormValues) => {
        const payload: Partial<CredentialsFormValues> = {};
        if (data.username) payload.username = data.username;
        if (data.password) payload.password = data.password;

        if (Object.keys(payload).length === 0) {
            toast.info("Nothing to update");
            return;
        }

        try {
            // Hitting the /admins/me endpoint
            await apiClient.patch('/admins/me', payload);
            toast.success("Credentials updated.", {
                description: "You may need to log in again.",
            });
            form.reset({ username: data.username, password: '' });
        } catch (error: any) {
            toast.error("Update Failed", {
                description: error.response?.data?.message || "Something went wrong.",
            });

        }
    }

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Credentials</h2>
                <p className="text-muted-foreground">Update your admin login information.</p>
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
