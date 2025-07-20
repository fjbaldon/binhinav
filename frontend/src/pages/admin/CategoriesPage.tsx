import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/api/categories";
import { type Category } from "@/api/types";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";

// Icons
import {
    PlusCircle, Edit, Trash2, Store, Utensils, Shirt, Home, Smartphone, HeartPulse, Music, Car, Star, ConciergeBell, ShoppingBag, Salad, Book, Watch, Gem, Gift, Building2, Ticket, Camera, Scissors, Banknote, ToyBrick,
    Landmark, Coffee, CakeSlice, Dumbbell, Pill, PawPrint, Film, Wrench, Glasses, Baby
} from 'lucide-react';

const availableIcons = [
    { name: 'Store', component: Store }, { name: 'Utensils', component: Utensils }, { name: 'Shirt', component: Shirt }, { name: 'Home', component: Home }, { name: 'Smartphone', component: Smartphone }, { name: 'HeartPulse', component: HeartPulse }, { name: 'Music', component: Music }, { name: 'Car', component: Car }, { name: 'Star', component: Star }, { name: 'ConciergeBell', component: ConciergeBell }, { name: 'ShoppingBag', component: ShoppingBag }, { name: 'Salad', component: Salad }, { name: 'Book', component: Book }, { name: 'Watch', component: Watch }, { name: 'Gem', component: Gem }, { name: 'Gift', component: Gift }, { name: 'Building2', component: Building2 }, { name: 'Ticket', component: Ticket }, { name: 'Camera', component: Camera }, { name: 'Scissors', component: Scissors }, { name: 'Banknote', component: Banknote }, { name: 'ToyBrick', component: ToyBrick }, { name: 'Landmark', component: Landmark }, { name: 'Coffee', component: Coffee }, { name: 'CakeSlice', component: CakeSlice }, { name: 'Dumbbell', component: Dumbbell }, { name: 'Pill', component: Pill }, { name: 'PawPrint', component: PawPrint }, { name: 'Film', component: Film }, { name: 'Wrench', component: Wrench }, { name: 'Glasses', component: Glasses }, { name: 'Baby', component: Baby },
];
const iconMap = new Map(availableIcons.map(i => [i.name, i.component]));
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = iconMap.get(name);
    return IconComponent ? <IconComponent className={cn("h-5 w-5", className)} /> : null;
};

const categorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    iconKey: z.string().min(1, "An icon must be selected."),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    const form = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: "", iconKey: "" },
    });
    const watchedIconKey = form.watch("iconKey");

    const queryClient = useQueryClient();

    // --- DATA FETCHING (READ) ---
    // Replaces useState and useEffect for fetching. The `queryKey` uniquely identifies this data.
    const { data: categories = [], isLoading, isError } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    // --- DATA MUTATION (CREATE) ---
    const createMutation = useMutation({
        mutationFn: createCategory,
        onSuccess: () => {
            toast.success("Category created successfully.");
            // Invalidate the cache to trigger a refetch of the categories list
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error("Creation failed", { description: error.response?.data?.message || "Something went wrong." });
        },
    });

    // --- DATA MUTATION (UPDATE) ---
    const updateMutation = useMutation({
        mutationFn: updateCategory,
        onSuccess: () => {
            toast.success("Category updated successfully.");
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error("Update failed", { description: error.response?.data?.message || "Something went wrong." });
        },
    });

    // --- DATA MUTATION (DELETE) ---
    const deleteMutation = useMutation({
        mutationFn: deleteCategory,
        onSuccess: () => {
            toast.success("Category deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
        onError: () => {
            toast.error("Failed to delete category.");
        },
    });

    useEffect(() => {
        document.title = "Categories | Binhinav Admin";
    }, []);

    const handleOpenDialog = (category: Category | null = null) => {
        setEditingCategory(category);
        setActiveTooltip(null);
        if (category) {
            form.reset({ name: category.name, iconKey: category.iconKey });
        } else {
            form.reset({ name: "", iconKey: "" });
        }
        setIsDialogOpen(true);
    };

    const onSubmit = (data: CategoryFormValues) => {
        if (editingCategory) {
            updateMutation.mutate({ id: editingCategory.id, payload: data });
        } else {
            createMutation.mutate(data);
        }
    };

    const handleDelete = (id: string) => {
        deleteMutation.mutate(id);
    };

    // Check the combined pending state of all mutations for disabling buttons
    const isMutating = createMutation.isPending || updateMutation.isPending;

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
                    {isLoading && <p>Loading categories...</p>}
                    {isError && <p className="text-destructive">Failed to load categories.</p>}
                    {!isLoading && !isError && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[250px]">Name</TableHead>
                                    <TableHead>Icon</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            No categories found. Click "Add New Category" to start.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    categories.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell className="font-medium">{category.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <DynamicIcon name={category.iconKey} className="h-4 w-4" />
                                                    <span>{category.iconKey}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(category)} disabled={deleteMutation.isPending}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <ConfirmationDialog
                                                    title="Delete this category?"
                                                    description="This action cannot be undone..."
                                                    onConfirm={() => handleDelete(category.id)}
                                                    variant="destructive"
                                                    confirmText="Delete"
                                                    triggerButton={
                                                        <Button variant="ghost" size="icon" className="text-red-500">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
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
                                        <Tooltip key={icon.name} open={activeTooltip === icon.name} onOpenChange={(isOpen) => !isOpen && setActiveTooltip(null)}>
                                            <TooltipTrigger asChild>
                                                <Button type="button" variant="outline" size="icon" onClick={() => { form.setValue('iconKey', icon.name, { shouldValidate: true }); setActiveTooltip(prev => prev === icon.name ? null : icon.name); }} className={cn("h-10 w-10", watchedIconKey === icon.name && "ring-2 ring-primary border-primary")}>
                                                    <icon.component className="h-5 w-5" />
                                                    <span className="sr-only">{icon.name}</span>
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent><p>{icon.name}</p></TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            </div>
                            <p className="text-sm text-red-500">{form.formState.errors.iconKey?.message}</p>
                        </div>
                        <Button type="submit" disabled={isMutating} className="w-full">
                            {isMutating ? "Saving..." : "Save Category"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
