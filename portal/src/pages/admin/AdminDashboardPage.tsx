import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData, type ChartDataPoint, type SearchTermDataPoint, type CategoryChartDataPoint } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, TvMinimal, Search, AlertCircle, Sparkles, BarChart2, Activity } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { formatDistanceToNowStrict } from 'date-fns';
import { Link } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

export default function AdminDashboardPage() {
    useEffect(() => { document.title = "Dashboard | Binhinav Admin"; }, []);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['dashboardData'],
        queryFn: getDashboardData,
    });

    if (isLoading) return <div className="text-center py-10">Loading dashboard...</div>;
    if (isError) return <div className="text-center py-10 text-destructive">Failed to load dashboard data.</div>;
    if (!data) return null;

    const { kpiData, topSearchedPlaces, topSearchTerms, topNotFoundTerms, categoryPopularity, operationalSnapshot } = data;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">A high-level overview of your system's activity and status.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <KpiCard title="Total Places" value={kpiData.places} icon={Building} />
                <KpiCard title="Active Merchants" value={kpiData.merchants} icon={Users} />
                <KpiCard title="Kiosks Online" value={kpiData.kiosks} icon={TvMinimal} />
                <KpiCard title="Searches (30 Days)" value={kpiData.searches30Days} icon={Search} />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Top Searched Places</CardTitle></CardHeader>
                    <CardContent>
                        <SimpleBarChart data={topSearchedPlaces} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle>Category Popularity</CardTitle></CardHeader>
                    <CardContent>
                        <SimplePieChart data={categoryPopularity} />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Search Analytics</CardTitle></CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <SearchTermList title="Top Search Terms" icon={BarChart2} terms={topSearchTerms} />
                        <SearchTermList title="Top 'Not Found' Searches" icon={AlertCircle} terms={topNotFoundTerms} emptyText="No failed searches logged." />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Operational Snapshot</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="space-y-4 text-sm">
                            <li className="flex items-center">
                                <Activity className="h-5 w-5 mr-3 text-muted-foreground" />
                                <div>
                                    <span className="font-semibold">{operationalSnapshot.unassignedMerchants}</span> Unassigned Merchants
                                    {operationalSnapshot.unassignedMerchants > 0 && <Link to="/admin/merchants" className="text-xs text-blue-500 hover:underline ml-2">Assign</Link>}
                                </div>
                            </li>
                            <li className="flex items-start">
                                <Sparkles className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                                <div>
                                    Latest Merchant Change:
                                    {operationalSnapshot.latestChange ?
                                        <div className="text-muted-foreground">
                                            @{operationalSnapshot.latestChange.username} - {formatDistanceToNowStrict(new Date(operationalSnapshot.latestChange.timestamp))} ago
                                            <Link to="/admin/recent-changes" className="text-xs text-blue-500 hover:underline ml-2">View</Link>
                                        </div>
                                        : <span className="text-muted-foreground"> None</span>
                                    }
                                </div>
                            </li>
                            <li className="flex items-center">
                                <AlertCircle className="h-5 w-5 mr-3 text-muted-foreground" />
                                <div><span className="font-semibold">{operationalSnapshot.inactiveAds}</span> Inactive Ads</div>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const KpiCard = ({ title, value, icon: Icon }: { title: string, value: number, icon: React.ElementType }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
        </CardContent>
    </Card>
);

const SimpleBarChart = ({ data }: { data: ChartDataPoint[] }) => {
    if (data.length === 0) return <div className="text-center text-muted-foreground py-10">Not enough data yet.</div>;
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
};

const SimplePieChart = ({ data }: { data: CategoryChartDataPoint[] }) => {
    const parsedData = data.map(d => ({ ...d, count: parseInt(d.count, 10) }));
    if (parsedData.length === 0) return <div className="text-center text-muted-foreground py-10">No selections logged yet.</div>;
    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie data={parsedData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {parsedData.map((_entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
            </PieChart>
        </ResponsiveContainer>
    );
}

const SearchTermList = ({ title, icon: Icon, terms, emptyText = "No searches logged." }: { title: string, icon: React.ElementType, terms: SearchTermDataPoint[], emptyText?: string }) => (
    <div className="space-y-2">
        <h3 className="font-semibold flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /> {title}</h3>
        {terms.length > 0 ? (
            <ul className="text-sm text-muted-foreground space-y-1">
                {terms.map(item => (
                    <li key={item.term} className="flex justify-between">
                        <span>"{item.term}"</span>
                        <span className="font-semibold text-foreground">{item.count}</span>
                    </li>
                ))}
            </ul>
        ) : <p className="text-sm text-muted-foreground">{emptyText}</p>}
    </div>
);
