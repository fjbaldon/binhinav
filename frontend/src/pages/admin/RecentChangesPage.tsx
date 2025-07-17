import { useEffect, useState } from 'react';
import { apiClient } from '@/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
            case 'CREATE': return <Badge variant="default" className="bg-green-500">Create</Badge>;
            case 'UPDATE': return <Badge variant="default" className="bg-blue-500">Update</Badge>;
            case 'DELETE': return <Badge variant="destructive">Delete</Badge>;
            default: return <Badge variant="secondary">{action}</Badge>;
        }
    }

    const renderChanges = (changes: any) => {
        if (!changes || Object.keys(changes).length === 0) return 'N/A';
        return (
            <ul className='list-disc pl-4'>
                {Object.entries(changes).map(([key, value]: [string, any]) => (
                    <li key={key}>
                        <strong>{key}:</strong>
                        <span className="text-red-500 line-through">{String(value.from)}</span> {'->'} <span className="text-green-500">{String(value.to)}</span>
                    </li>
                ))}
            </ul>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Merchant Changes</CardTitle>
                <CardDescription>A log of all updates made by merchants to their store information.</CardDescription>
            </CardHeader>
            <CardContent>
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
                            {logs.map((log) => (
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
    );
}
