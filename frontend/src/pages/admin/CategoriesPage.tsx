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
import { PlusCircle, Edit, Trash2 } from 'lucide-react';

// From your DTO/Entity
interface Category {
    id: string;
    name: string;
    iconKey: string;
}

const categorySchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    iconKey: z.string().min(2, "Icon Key is required (e.g., FaStore)."),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const form = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: "", iconKey: "" },
    });

    const fetchCategories = async () => {
        try {
            const response = await apiClient.get<Category[]>("/categories");
            setCategories(response.data);
        } catch (error) {
            toast.error("Failed to fetch categories");
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleOpenDialog = (category: Category | null = null) => {
        setEditingCategory(category);
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
                toast.success("Category updated successfully.", {
                    description: "Success",
                });
            } else {
                await apiClient.post("/categories", data);
                toast.success("Category created successfully.", {
                    description: "Success",
                });
            }
            fetchCategories();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Something went wrong.", {
                description: "An error occurred",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this category?")) return;
        try {
            await apiClient.delete(`/categories/${id}`);
            toast.success("Category deleted.", {
                description: "Success",
            });
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
                                <TableHead>Name</TableHead>
                                <TableHead>Icon Key</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categories.map((category) => (
                                <TableRow key={category.id}>
                                    <TableCell className="font-medium">{category.name}</TableCell>
                                    <TableCell>{category.iconKey}</TableCell>
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
                            Fill in the details below. The Icon Key should match an icon name from your chosen library (e.g., lucide-react).
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Category Name</Label>
                            <Input id="name" {...form.register("name")} />
                            <p className="text-sm text-red-500">{form.formState.errors.name?.message}</p>
                        </div>
                        <div>
                            <Label htmlFor="iconKey">Icon Key</Label>
                            <Input id="iconKey" {...form.register("iconKey")} placeholder="e.g., Store, Utensils, Shirt" />
                            <p className="text-sm text-red-500">{form.formState.errors.iconKey?.message}</p>
                        </div>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}
