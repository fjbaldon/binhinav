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
import { useEffect, useState } from "react";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { LayoutDashboard, Store, MapPinned, Eye, EyeOff, Loader2 } from 'lucide-react';
import { AxiosError } from "axios";

const loginSchema = z.object({
    username: z.string().min(1, { message: "Username is required" }),
    password: z.string().min(1, { message: "Password is required" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const featureSlides = [
    {
        icon: LayoutDashboard,
        title: "Visualize Your Space",
        description: "Bring your floor plans to life with interactive, easy-to-manage maps.",
    },
    {
        icon: Store,
        title: "Empower Your Merchants",
        description: "Give store owners the power to manage their own information seamlessly.",
    },
    {
        icon: MapPinned,
        title: "Guide Every Visitor",
        description: "Provide an intuitive navigation experience on sleek, modern kiosks.",
    },
];

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        document.title = "Login | Binhinav";
    }, []);

    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: "", password: "" },
    });

    const onSubmit = async (data: LoginFormValues) => {
        try {
            const response = await apiClient.post('/auth/login', data);
            await login(response.data.access_token);
            navigate('/');
        } catch (err) {
            let description = "An unknown error occurred. Please try again.";
            if (err instanceof AxiosError && err.response?.data?.message) {
                description = err.response.data.message;
            } else if (err instanceof Error) {
                description = err.message;
            }
            toast.error("Login Failed", { description });
        }
    };

    return (
        <div className="flex min-h-screen w-full flex-col overflow-hidden md:flex-row">
            <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center gap-6 bg-primary p-12 text-center text-primary-foreground animate-in fade-in-50 slide-in-from-left-12 duration-500">
                <img src="/binhinav-logo.svg" alt="Binhinav Logo" className="h-28 w-28 brightness-0 invert" />

                <Carousel
                    className="w-full max-w-xs"
                    plugins={[
                        Autoplay({
                            delay: 4000,
                            stopOnInteraction: false,
                            stopOnMouseEnter: true,
                        }),
                    ]}
                >
                    <CarouselContent>
                        {featureSlides.map((slide, index) => (
                            <CarouselItem key={index}>
                                <div className="flex flex-col items-center justify-center p-2 space-y-4 h-52">
                                    <slide.icon className="h-12 w-12" />
                                    <h2 className="text-2xl font-bold">{slide.title}</h2>
                                    <p className="text-primary-foreground/80">{slide.description}</p>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>

            <div className="flex w-full items-center justify-center bg-background p-6 md:w-1/2 animate-in fade-in-50 slide-in-from-right-12 duration-500">
                <div className="absolute top-8 left-8 flex items-center gap-4 md:hidden">
                    <img src="/binhinav-logo.svg" alt="Binhinav Logo" className="h-10 w-10" />
                    <div>
                        <h1 className="text-2xl font-bold text-primary">binhinav</h1>
                        <p className="text-sm text-muted-foreground">locate indoors</p>
                    </div>
                </div>

                <Card className="w-full max-w-sm shrink-0 border-0 shadow-none sm:border sm:shadow-lg">
                    <CardHeader className="text-center sm:text-left">
                        <CardTitle className="text-2xl">Login</CardTitle>
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
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        className="pr-10"
                                        {...form.register("password")}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                                {form.formState.errors.password && <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>}
                            </div>
                            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {form.formState.isSubmitting ? 'Logging in...' : 'Login'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
