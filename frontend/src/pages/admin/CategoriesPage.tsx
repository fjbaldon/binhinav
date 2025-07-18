import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import {
    PlusCircle, Edit, Trash2, Store, Utensils, Shirt, Home, Smartphone, HeartPulse, Music, Car, Star, ConciergeBell, ShoppingBag, Salad, Book, Watch, Gem, Gift, Building2, Ticket, Camera, Scissors, Banknote, ToyBrick,
    // --- THE 10 NEW ICONS ---
    Landmark, Coffee, CakeSlice, Dumbbell, Pill, PawPrint, Film, Wrench, Glasses, Baby
} from 'lucide-react';

// From your DTO/Entity
interface Category {
    id: string;
    name: string;
    iconKey: string;
}

// Define the available icons for selection
const availableIcons = [
    // Existing Icons
    { name: 'Store', component: Store },
    { name: 'Utensils', component: Utensils },
    { name: 'Shirt', component: Shirt },
    { name: 'Home', component: Home },
    { name: 'Smartphone', component: Smartphone },
    { name: 'HeartPulse', component: HeartPulse },
    { name: 'Music', component: Music },
    { name: 'Car', component: Car },
    { name: 'Star', component: Star },
    { name: 'ConciergeBell', component: ConciergeBell },
    { name: 'ShoppingBag', component: ShoppingBag },
    { name: 'Salad', component: Salad },
    { name: 'Book', component: Book },
    { name: 'Watch', component: Watch },
    { name: 'Gem', component: Gem },
    { name: 'Gift', component: Gift },
    { name: 'Building2', component: Building2 },
    { name: 'Ticket', component: Ticket },
    { name: 'Camera', component: Camera },
    { name: 'Scissors', component: Scissors },
    { name: 'Banknote', component: Banknote },
    { name: 'ToyBrick', component: ToyBrick },
    { name: 'Landmark', component: Landmark },
    { name: 'Coffee', component: Coffee },
    { name: 'CakeSlice', component: CakeSlice },
    { name: 'Dumbbell', component: Dumbbell },
    { name: 'Pill', component: Pill },
    { name: 'PawPrint', component: PawPrint },
    { name: 'Film', component: Film },
    { name: 'Wrench', component: Wrench },
    { name: 'Glasses', component: Glasses },
    { name: 'Baby', component: Baby },
];

const iconMap = new Map(availableIcons.map(i => [i.name, i.component]));

// A helper component to render icons dynamically from the key
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = iconMap.get(name);
    return IconComponent ? <IconComponent className={cn("h-5 w-5", className)} /> : null;
};

// Update the schema and message for the new icon picker
const categorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    iconKey: z.string().min(1, "An icon must be selected."),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: "", iconKey: "" },
    });

    const watchedIconKey = form.watch("iconKey");

    const fetchCategories = async () => {
        try {
            const response = await apiClient.get<Category[]>("/categories");
            setCategories(response.data);
        } catch (error) {
            toast.error("Failed to fetch categories");
        }
    };

    useEffect(() => {
        document.title = "Categories | Binhinav Admin";
        fetchCategories();
    }, []);

    const handleOpenDialog = (category: Category | null = null) => {
        setEditingCategory(category);
        setActiveTooltip(null); // Close any open tooltips when dialog opens
        if (category) {
            form.reset({ name: category.name, iconKey: category.iconKey });
        } else {
            form.reset({ name: "", iconKey: "" });
        }
        setIsDialogOpen(true);
    };

    const onSubmit = async (data: CategoryFormValues) => {
        try {
            if (editingCategory) {
                await apiClient.patch(`/categories/${editingCategory.id}`, data);
                toast.success("Category updated successfully.");
            } else {
                await apiClient.post("/categories", data);
                toast.success("Category created successfully.");
            }
            fetchCategories();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error("An error occurred", {
                description: error.response?.data?.message || "Something went wrong.",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;
        try {
            await apiClient.delete(`/categories/${id}`);
            toast.success("Category deleted.");
            fetchCategories();
        } catch (error) {
            toast.error("Failed to delete category");
        }
    }

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
                    <p className="text-muted-foreground">Manage place categories for filtering.</p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
                </Button>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[250px]">Name</TableHead>
                                <TableHead>Icon</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <DynamicIcon name={category.iconKey} className="h-4 w-4" />
                                            <span>{category.iconKey}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(category)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(category.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCategory ? "Edit Category" : "Create New Category"}</DialogTitle>
                        <DialogDescription>
                            Provide a name for the category and select an appropriate icon.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Category Name</Label>
                            <Input id="name" {...form.register("name")} />
                            <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                        </div>

                        <div className="space-y-2">
                            <Label>Choose an Icon</Label>
                            <div className="w-full rounded-md border p-4">
                                <div className="grid grid-cols-8 gap-2">
                                    {availableIcons.map((icon) => (
                                        <Tooltip
                                            key={icon.name}
                                            open={activeTooltip === icon.name}
                                            onOpenChange={(isOpen) => !isOpen && setActiveTooltip(null)}
                                        >
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={() => {
                                                        form.setValue('iconKey', icon.name, { shouldValidate: true });
                                                        setActiveTooltip(prev => prev === icon.name ? null : icon.name);
                                                    }}
                                                    className={cn(
                                                        "h-10 w-10",
                                                        watchedIconKey === icon.name && "ring-2 ring-primary border-primary"
                                                    )}
                                                >
                                                    <icon.component className="h-5 w-5" />
                                                    <span className="sr-only">{icon.name}</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{icon.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-red-500">{form.formState.errors.iconKey?.message}</p>
                        </div>

                        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                            {form.formState.isSubmitting ? "Saving..." : "Save Category"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
