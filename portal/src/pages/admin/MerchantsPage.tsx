import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMerchants, updateMerchant, deleteMerchant } from "@/api/merchants";
import type { Merchant } from "@/api/types";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { MerchantsEditDialog } from './components/MerchantsEditDialog';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash2, UserCircle2, AlertCircle, ArrowUpDown } from 'lucide-react';
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { DataTable } from "@/components/shared/DataTable";
import { Badge } from "@/components/ui/badge";

export default function MerchantsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
    const [sorting, setSorting] = useState<SortingState>([]);

    const queryClient = useQueryClient();

    const { data: merchants = [], isLoading, isError } = useQuery({
        queryKey: ['merchants'],
        queryFn: getMerchants,
    });

    const updateMutation = useMutation({
        mutationFn: updateMerchant,
        onSuccess: () => {
            toast.success("Merchant updated successfully.");
            queryClient.invalidateQueries({ queryKey: ['merchants'] });
            setIsDialogOpen(false);
        },
        onError: (error: any) => {
            if (error.response?.status === 401) return;
            toast.error("Update Failed", { description: error.response?.data?.message || "Username might already be in use." });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteMerchant,
        onSuccess: () => {
            toast.success("Merchant deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ['merchants'] });
        },
        onError: (error: any) => {
            if (error.response?.status === 401) return;
            toast.error("Failed to delete merchant.");
        }
    });

    useEffect(() => {
        document.title = "Merchants | Binhinav Admin";
    }, []);

    const handleOpenDialog = (merchant: Merchant) => {
        setEditingMerchant(merchant);
        setIsDialogOpen(true);
    };

    const handleDelete = (id: string) => deleteMutation.mutate(id);

    const unassignedCount = merchants.filter(m => !m.place).length;

    const columns: ColumnDef<Merchant>[] = [
        {
            accessorKey: "name",
            header: "Merchant",
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <UserCircle2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <div className="font-semibold">{row.original.name}</div>
                        <div className="text-sm text-muted-foreground">@{row.original.username}</div>
                    </div>
                </div>
            )
        },
        {
            accessorKey: "place.name",
            header: ({ column }) => (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="justify-start -ml-4">
                    Assigned Place
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                row.original.place ? (
                    <span>{row.original.place.name}</span>
                ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-500">Unassigned</Badge>
                )
            )
        },
        {
            id: 'actions',
            header: () => <div className="text-right">Actions</div>,
            cell: ({ row }) => (
                <div className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(row.original)} disabled={deleteMutation.isPending}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <ConfirmationDialog
                        title="Delete this merchant?"
                        description="This will permanently delete the merchant's account. This action cannot be undone."
                        onConfirm={() => handleDelete(row.original.id)}
                        variant="destructive"
                        confirmText="Delete"
                        triggerButton={
                            <Button variant="ghost" size="icon" className="text-red-500" disabled={deleteMutation.isPending}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        }
                    />
                </div>
            )
        }
    ];

    return (
        <>
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Merchants</h2>
                <p className="text-muted-foreground">
                    Manage merchant accounts. New merchants are created and assigned on the Places page.
                </p>
            </div>

            {unassignedCount > 0 && (
                <Card className="mb-6 bg-amber-50 border-amber-200">
                    <CardHeader>
                        <div className="flex items-start gap-4">
                            <AlertCircle className="h-6 w-6 text-amber-600 mt-1" />
                            <div>
                                <CardTitle className="text-amber-900">Action Required</CardTitle>
                                <CardDescription className="text-amber-800">
                                    You have {unassignedCount} unassigned {unassignedCount === 1 ? 'merchant' : 'merchants'}.
                                    Assign them to a place from the <a href="/admin/places" className="underline font-semibold">Places page</a>.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            )}

            <Card>
                <CardContent className="pt-6">
                    {isLoading && <p>Loading merchants...</p>}
                    {isError && <p className="text-destructive">Failed to load merchants.</p>}
                    {!isLoading && !isError && (
                        <DataTable columns={columns} data={merchants} sorting={sorting} setSorting={setSorting} />
                    )}
                </CardContent>
            </Card>

            {editingMerchant && (
                <MerchantsEditDialog
                    isOpen={isDialogOpen}
                    setIsOpen={setIsDialogOpen}
                    merchant={editingMerchant}
                    updateMutation={updateMutation}
                />
            )}
        </>
    );
}
