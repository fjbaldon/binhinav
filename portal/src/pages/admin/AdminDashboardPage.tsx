import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData, type ChartDataPoint, type SearchTermDataPoint, type CategoryChartDataPoint } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building, Users, TvMinimal, Search, AlertCircle, Sparkles, Activity } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, LabelList } from 'recharts';
import { formatDistanceToNowStrict } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const CustomBarChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="font-bold">{label}</p>
                <p className="text-sm text-muted-foreground">Searches: {payload[0].value}</p>
            </div>
        );
    }
    return null;
};

const CustomPieChartTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
                <p className="font-bold">{payload[0].name}</p>
                <p className="text-sm text-muted-foreground">Selections: {payload[0].value}</p>
            </div>
        );
    }
    return null;
}

const CustomLegend = (props: any) => {
    const { payload } = props;
    const total = payload.reduce((sum: number, entry: any) => sum + entry.payload.count, 0);

    return (
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mt-4">
            {payload.map((entry: any, index: number) => {
                const percentage = total > 0 ? ((entry.payload.count / total) * 100).toFixed(0) : 0;
                return (
                    <div key={`item-${index}`} className="flex items-center space-x-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground flex-1 truncate">{entry.value}</span>
                        <span className="font-medium text-right">{percentage}%</span>
                    </div>
                );
            })}
        </div>
    );
};


export default function AdminDashboardPage() {
    const [chartColors, setChartColors] = useState<string[]>([]);

    useEffect(() => {
        document.title = "Dashboard | Binhinav Admin";
        const rootStyles = getComputedStyle(document.documentElement);
        // Create a palette from the primary color with different opacities
        const primaryColor = rootStyles.getPropertyValue('--primary').trim();
        const colors = [
            `oklch(from ${primaryColor} l c h / 1)`,
            `oklch(from ${primaryColor} l c h / 0.8)`,
            `oklch(from ${primaryColor} l c h / 0.6)`,
            `oklch(from ${primaryColor} l c h / 0.4)`,
            `oklch(from ${primaryColor} l c h / 0.2)`,
        ];
        setChartColors(colors);
    }, []);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['dashboardData'],
        queryFn: getDashboardData,
    });

    if (isLoading || chartColors.length === 0) return <div className="text-center py-10">Loading dashboard...</div>;
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
                <KpiCard title="Total Places" value={kpiData.places.toString()} icon={Building} description="All store locations" />
                <KpiCard title="Active Merchants" value={kpiData.merchants.toString()} icon={Users} description="All registered merchant accounts" />
                <KpiCard title="Kiosks Online" value={kpiData.kiosks.toString()} icon={TvMinimal} description="All physical kiosk units" />
                <KpiCard title="Searches (30 Days)" value={kpiData.searches30Days.toString()} icon={Search} description="Total searches performed" />
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Top Searched Places</CardTitle>
                        <CardDescription>The 5 most frequently selected places after a search.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topSearchedPlaces.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={topSearchedPlaces} layout="vertical" margin={{ left: 10, right: 50, top: 5, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={120} />
                                    <Tooltip content={<CustomBarChartTooltip />} cursor={{ fill: 'transparent' }} />
                                    <Bar dataKey="count" fill={chartColors[0]} radius={[4, 4, 4, 4]}>
                                        <LabelList dataKey="count" position="right" offset={8} className="fill-foreground font-semibold" fontSize={12} />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[350px] text-muted-foreground">Not enough data to display.</div>
                        )}
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Category Popularity</CardTitle>
                        <CardDescription>Breakdown of selections by store category.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {categoryPopularity.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie data={categoryPopularity.map(d => ({ ...d, count: parseInt(d.count, 10) }))} dataKey="count" nameKey="name" cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={5} labelLine={false}>
                                        {categoryPopularity.map((_entry, index) => <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomPieChartTooltip />} />
                                    <Legend content={<CustomLegend />} verticalAlign="bottom" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[350px] text-muted-foreground">No category selections logged yet.</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 md:items-start">
                <Card>
                    <CardHeader>
                        <CardTitle>Search Analytics</CardTitle>
                        <CardDescription>Most common successful and failed search terms.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-8">
                        <SearchTermList title="Top Search Terms" terms={topSearchTerms} />
                        <SearchTermList title="Top 'Not Found' Searches" terms={topNotFoundTerms} emptyText="No failed searches logged." />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Operational Snapshot</CardTitle>
                        <CardDescription>Key system health and administrative metrics.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-4">
                            <OperationalItem icon={Users} title="Unassigned Merchants" value={operationalSnapshot.unassignedMerchants} linkTo="/admin/merchants" />
                            <OperationalItem icon={AlertCircle} title="Inactive Ads" value={operationalSnapshot.inactiveAds} linkTo="/admin/ads" />
                            <li className="flex items-center p-2 rounded-lg transition-colors hover:bg-muted/50">
                                <Sparkles className="h-5 w-5 mr-4 text-muted-foreground" />
                                <div className="flex-1">
                                    <span className="font-medium">Latest Merchant Change</span>
                                    {operationalSnapshot.latestChange ? (
                                        <div className="text-sm text-muted-foreground">
                                            @{operationalSnapshot.latestChange.username} - {formatDistanceToNowStrict(new Date(operationalSnapshot.latestChange.timestamp))} ago
                                        </div>
                                    ) : <span className="text-sm text-muted-foreground">None</span>}
                                </div>
                                {operationalSnapshot.latestChange && <Link to="/admin/recent-changes" className="text-sm text-primary hover:underline">View</Link>}
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

const KpiCard = ({ title, value, icon: Icon, description }: { title: string, value: string, icon: React.ElementType, description: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

const SearchTermList = ({ title, terms, emptyText = "No searches logged." }: { title: string, terms: SearchTermDataPoint[], emptyText?: string }) => {
    const maxCount = terms.length > 0 ? terms[0].count : 0;
    return (
        <div className="space-y-2">
            <h3 className="font-semibold text-sm">{title}</h3>
            {terms.length > 0 ? (
                <div className="space-y-2">
                    {terms.map(item => (
                        <div key={item.term} className="text-sm">
                            <div className="flex justify-between mb-1">
                                <span className="text-muted-foreground truncate pr-4">"{item.term}"</span>
                                <span className="font-medium">{item.count}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                                <div
                                    className="bg-primary h-1.5 rounded-full"
                                    style={{ width: `${maxCount > 0 ? (item.count / maxCount) * 100 : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : <p className="text-sm text-muted-foreground">{emptyText}</p>}
        </div>
    );
};

const OperationalItem = ({ icon: Icon, title, value, linkTo }: { icon: React.ElementType, title: string, value: number, linkTo: string }) => (
    <li className={cn("flex items-center p-2 rounded-lg", value > 0 && "transition-colors hover:bg-muted/50")}>
        <Icon className={cn("h-5 w-5 mr-4", value > 0 ? "text-amber-500" : "text-muted-foreground")} />
        <div className="flex-1">
            <span className="font-medium">{title}</span>
            <div className="text-sm text-muted-foreground">{value} {value === 1 ? 'item' : 'items'} requiring attention</div>
        </div>
        {value > 0 && <Link to={linkTo} className="text-sm text-primary hover:underline">Manage</Link>}
    </li>
);
