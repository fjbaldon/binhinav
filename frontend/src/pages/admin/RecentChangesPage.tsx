import { useEffect, useState } from 'react';
import { apiClient } from '@/api';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

// Based on your AuditLog entity
interface AuditLog {
    id: string;
    entityType: string;
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    changes: any;
    userId: string;
    username: string;
    userRole: string;
    timestamp: string;
}

export default function RecentChangesPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        document.title = "Recent Changes | Binhinav Admin";
        const fetchLogs = async () => {
            try {
                setLoading(true);
                const response = await apiClient.get<AuditLog[]>('/audit-logs/merchant-changes');
                setLogs(response.data);
            } catch (err) {
                setError('Failed to fetch recent changes.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const renderActionBadge = (action: string) => {
        switch (action) {
            case 'UPDATE': return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Update</Badge>;
            case 'CREATE': return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Create</Badge>;
            case 'DELETE': return <Badge variant="destructive">Delete</Badge>;
            default: return <Badge variant="secondary">{action}</Badge>;
        }
    }

    const renderChanges = (changes: any) => {
        if (!changes) {
            return <span className="text-muted-foreground">No details</span>;
        }

        const changeBadges = [];
        if (changes.updatedFields) {
            changes.updatedFields.forEach((field: string) => {
                changeBadges.push(<Badge variant="outline" key={field}>{field}</Badge>);
            });
        }
        if (changes.newLogoUploaded) {
            changeBadges.push(<Badge variant="outline" key="logo">logo</Badge>);
        }
        if (changes.newCoverUploaded) {
            changeBadges.push(<Badge variant="outline" key="cover">cover</Badge>);
        }

        if (changeBadges.length === 0) {
            return <span className="text-muted-foreground">No field changes</span>;
        }

        return <div className='flex flex-wrap gap-1'>{changeBadges}</div>;
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
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Merchant</TableHead>
                                    <TableHead>Entity</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Changes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            No recent changes found.
                                        </TableCell>
                                    </TableRow>
                                ) : logs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{format(new Date(log.timestamp), "MMM d, yyyy 'at' h:mm a")}</TableCell>
                                        <TableCell>{log.username}</TableCell>
                                        <TableCell>{log.entityType}</TableCell>
                                        <TableCell>{renderActionBadge(log.action)}</TableCell>
                                        <TableCell>{renderChanges(log.changes)}</TableCell>
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
