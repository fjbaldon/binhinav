import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const loginSchema = z.object({
    username: z.string().min(1, { message: "Username is required" }),
    password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: "", password: "" },
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            const response = await apiClient.post('/auth/login', data);
            await login(response.data.access_token);

            // The redirect logic is now in App.tsx, this just triggers it.
            navigate('/');

        } catch (error: any) {
            toast.error("Login Failed", {
                description: error.response?.data?.message || "Invalid credentials. Please try again.",
            });
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center gap-12 bg-background p-4 md:flex-row md:justify-evenly">

            {/* Left Section: Branding */}
            <div className="flex items-center gap-6">
                <img src="/binhinav-logo.svg" alt="Binhinav Logo" className="h-20 w-20 shrink-0 md:h-28 md:w-28" />

                <div className="flex flex-col">
                    {/* --- THE FIX IS HERE --- */}
                    {/* Applying a small negative margin to optically align the text */}
                    <h1 className="text-5xl font-extrabold text-primary md:text-6xl -ml-0.5">binhinav</h1>
                    <p className="text-muted-foreground">locate indoors</p>
                </div>
            </div>

            {/* Right Section: Login Form */}
            <Card className="w-full max-w-sm shrink-0">
                <CardHeader>
                    <CardTitle className="text-2xl">Panel Login</CardTitle>
                    <CardDescription>Enter your credentials to access your panel.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                {...form.register("username")}
                            />
                            {form.formState.errors.username && <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                {...form.register("password")}
                            />
                            {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
                        </div>
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
