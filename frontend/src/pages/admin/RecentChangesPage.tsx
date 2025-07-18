import { useEffect, useState, useMemo } from 'react';
import { apiClient } from '@/api';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from 'date-fns';

// Updated interface based on the new, richer log format
interface AuditLog {
    id: string;
    changes: { [key: string]: { from: any; to: any } };
    username: string;
    timestamp: string;
}

// Interface to hold category data for context
interface Category {
    id: string;
    name: string;
}

export default function RecentChangesPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        document.title = "Recent Changes | Binhinav Admin";
        const fetchPageData = async () => {
            try {
                setLoading(true);
                // Fetch both logs and categories in parallel for efficiency
                const [logsRes, catsRes] = await Promise.all([
                    apiClient.get<AuditLog[]>('/audit-logs/merchant-changes'),
                    apiClient.get<Category[]>('/categories')
                ]);
                setLogs(logsRes.data);
                setCategories(catsRes.data);
            } catch (err) {
                setError('Failed to fetch recent changes.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchPageData();
    }, []);

    // Create a lookup map for category names. useMemo prevents recreating it on every render.
    const categoryMap = useMemo(() => {
        const map = new Map<string | null, string>();
        categories.forEach(cat => map.set(cat.id, cat.name));
        map.set(null, 'None');
        return map;
    }, [categories]);

    // This function translates the raw 'changes' object into a user-friendly list.
    const renderChanges = (changes: AuditLog['changes']) => {
        if (!changes || Object.keys(changes).length === 0) {
            return <span className="text-muted-foreground">No specific changes logged.</span>;
        }

        const friendlyDescriptions = Object.entries(changes).map(([key, value]) => {
            const { to } = value;
            // Converts camelCase to Title Case e.g., "businessHours" -> "business hours"
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
                    const toName = categoryMap.get(to) || 'Uncategorized';
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

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-3xl font-bold tracking-tight">Recent Changes</h2>
                <p className="text-muted-foreground">A log of all updates made by merchants to their store information.</p>
            </div>
            <Card>
                <CardContent className="pt-6">
                    {loading && <p>Loading changes...</p>}
                    {error && <p className="text-red-500">{error}</p>}
                    {!loading && !error && (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">Timestamp</TableHead>
                                    <TableHead>Merchant</TableHead>
                                    <TableHead className="w-[60%]">Changes Made</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                            No recent changes from merchants have been recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="align-top">
                                            <div className="font-medium">{format(new Date(log.timestamp), "MMM d, yyyy")}</div>
                                            <div className="text-xs text-muted-foreground">{format(new Date(log.timestamp), "h:mm a")}</div>
                                        </TableCell>
                                        <TableCell className="align-top">{log.username}</TableCell>
                                        <TableCell className="align-top">{renderChanges(log.changes)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
