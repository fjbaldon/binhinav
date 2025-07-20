import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getMerchantChanges } from '@/api/audit-logs';
import { type AuditLog } from '@/api/types';
import { getCategories } from '@/api/categories';
import { type ColumnDef } from '@tanstack/react-table';

// UI Components
import { Card, CardContent } from "@/components/ui/card";
import { UserCircle2 } from "lucide-react";
import { DataTable } from '@/components/shared/DataTable';

export default function RecentChangesPage() {
    useEffect(() => {
        document.title = "Recent Changes | Binhinav Admin";
    }, []);

    // --- DATA FETCHING ---
    const { data: logs = [], isLoading: isLoadingLogs, isError: isErrorLogs } = useQuery({
        queryKey: ['merchantChanges'],
        queryFn: getMerchantChanges,
    });

    const { data: categories = [], isLoading: isLoadingCategories, isError: isErrorCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    // --- CONTEXTUAL DATA MAPPING ---
    const categoryMap = useMemo(() => {
        if (!categories) return new Map<string | null, string>();

        const map = new Map<string | null, string>();
        categories.forEach(cat => map.set(cat.id, cat.name));
        map.set(null, 'None');
        return map;
    }, [categories]);

    const renderChanges = (changes: AuditLog['changes']) => {
        if (!changes || Object.keys(changes).length === 0) {
            return <span className="text-muted-foreground">No specific changes logged.</span>;
        }

        const friendlyDescriptions = Object.entries(changes).map(([key, value]) => {
            const { to } = value;
            const fieldName = key.replace(/([A-Z])/g, ' $1').toLowerCase();

            switch (key) {
                case 'name':
                case 'businessHours':
                    return `Updated ${fieldName} to "${to}".`;
                case 'description':
                    return 'Updated the store description.';
                case 'logo':
                    return 'Updated the store logo.';
                case 'cover':
                    return 'Updated the store cover image.';
                case 'category':
                    const fromName = value.from || 'None';
                    const toName = categoryMap.get(to) ?? `ID: ${to}`;
                    return `Changed category from "${fromName}" to "${toName}".`;
                default:
                    return `Updated the ${fieldName}.`;
            }
        });

        return (
            <ul className="list-disc list-inside text-sm space-y-1">
                {friendlyDescriptions.map((desc, index) => <li key={index}>{desc}</li>)}
            </ul>
        );
    };

    const isLoading = isLoadingLogs || isLoadingCategories;
    const isError = isErrorLogs || isErrorCategories;

    // --- TABLE COLUMNS ---
    const columns: ColumnDef<AuditLog>[] = [
        {
            accessorKey: 'timestamp',
            header: 'Timestamp',
            cell: ({ row }) => (
                <div className="align-top">
                    <div className="font-medium">{format(new Date(row.original.timestamp), "MMM d, yyyy")}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(row.original.timestamp), "h:mm a")}</div>
                </div>
            )
        },
        {
            accessorKey: 'username',
            header: 'Merchant',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <UserCircle2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span>{row.original.username}</span>
                </div>
            )
        },
        {
            accessorKey: 'changes',
            header: 'Changes Made',
            cell: ({ row }) => <div className="align-top">{renderChanges(row.original.changes)}</div>
        }
    ];

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Recent Changes</h2>
                <p className="text-muted-foreground">A log of all updates made by merchants to their store information.</p>
            </div>
            <Card>
                <CardContent className="pt-6">
                    {isLoading && <p>Loading changes...</p>}
                    {isError && <p className="text-destructive">Failed to fetch recent changes.</p>}
                    {!isLoading && !isError && (
                        <DataTable columns={columns} data={logs} />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
