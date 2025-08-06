import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData, getSearchTerms, type SearchTermDataPoint } from '@/api/dashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Building, Users, TvMinimal, Search, AlertCircle, Sparkles, LineChart as LineChartIcon, Loader2, PieChart as PieChartIcon } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, LabelList, LineChart, Line, CartesianGrid } from 'recharts';
import { formatDistanceToNowStrict } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';

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

const CustomLineChartTooltip = ({ active, payload, label }: any) => {
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

const SearchTermsDialog = ({ title, withResults }: { title: string; withResults: boolean; }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [limit, setLimit] = useState(10);
    const [inputValue, setInputValue] = useState(String(limit));

    const { data: terms = [], isLoading } = useQuery({
        queryKey: ['searchTermsDialog', withResults, limit],
        queryFn: () => getSearchTerms({ withResults, limit }),
        enabled: isOpen,
        staleTime: 1000 * 60,
    });

    const maxCount = terms.length > 0 ? terms[0].count : 0;

    const handleApplyLimit = () => {
        const newLimit = parseInt(inputValue, 10);
        if (newLimit && newLimit > 0) {
            setLimit(newLimit);
            toast.success(`Showing top ${newLimit} results.`);
        } else {
            toast.error("Invalid Limit", { description: "Please enter a positive number." });
            setInputValue(String(limit));
        }
    };

    useEffect(() => {
        if (isOpen) {
            setInputValue(String(limit));
        }
    }, [isOpen, limit]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs px-3">View More</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        An extended list of the most frequent search terms.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-end gap-2 py-2">
                    <Label htmlFor="limit-input" className="text-sm text-muted-foreground">Show Top:</Label>
                    <Input
                        id="limit-input"
                        type="number"
                        min="1"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        className="w-24 h-9"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleApplyLimit() }}
                    />
                    <Button onClick={handleApplyLimit} className="h-9">Apply</Button>
                </div>
                <ScrollArea className="h-72 w-full pr-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />Loading...
                        </div>
                    ) : (
                        <div className="space-y-4">
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
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

const CategoryPopularityDialog = ({ title, data }: { title: string; data: { name: string; count: number }[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const maxCount = data.length > 0 ? data[0].count : 0;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs px-3">View All</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>A full list of category selections, sorted by popularity.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-80 w-full pr-4">
                    <div className="space-y-4">
                        {data.map(item => (
                            <div key={item.name} className="text-sm">
                                <div className="flex justify-between mb-1">
                                    <span className="text-muted-foreground truncate pr-4">{item.name}</span>
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
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};


const SearchTermList = ({ title, initialTerms, withResults, emptyText = "No searches logged." }: { title: string, initialTerms: SearchTermDataPoint[], withResults: boolean, emptyText?: string }) => {
    const displayTerms = initialTerms || [];
    const maxCount = displayTerms.length > 0 ? displayTerms[0].count : 0;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-sm">{title}</h3>
                {displayTerms.length > 0 && (
                    <SearchTermsDialog title={title} withResults={withResults} />
                )}
            </div>
            {displayTerms.length > 0 ? (
                <div className="space-y-2 pt-2">
                    {displayTerms.map(item => (
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
            ) : <p className="text-sm text-muted-foreground pt-2">{emptyText}</p>}
        </div>
    );
};

export default function AdminDashboardPage() {
    const [chartColors, setChartColors] = useState<string[]>([]);
    const NUM_CATEGORIES_IN_CHART = 4;

    useEffect(() => {
        document.title = "Dashboard | Binhinav Admin";
        const rootStyles = getComputedStyle(document.documentElement);
        const primaryColor = rootStyles.getPropertyValue('--primary').trim();
        const colors = [
            `oklch(from ${primaryColor} l c h / 1)`, `oklch(from ${primaryColor} l c h / 0.8)`,
            `oklch(from ${primaryColor} l c h / 0.6)`, `oklch(from ${primaryColor} l c h / 0.4)`,
            `oklch(from ${primaryColor} l c h / 0.2)`,
        ];
        setChartColors(colors);
    }, []);

    const { data, isLoading, isError } = useQuery({ queryKey: ['dashboardData'], queryFn: getDashboardData });

    if (isLoading || chartColors.length === 0) return <div className="text-center py-10">Loading dashboard...</div>;
    if (isError) return <div className="text-center py-10 text-destructive">Failed to load dashboard data.</div>;
    if (!data) return null;

    const { kpiData, topSearchedPlaces, topSearchTerms, topNotFoundTerms, categoryPopularity, operationalSnapshot, dailySearchActivity } = data;
    const formattedDailyActivity = dailySearchActivity.map(d => ({ ...d, date: new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) }));

    const parsedCategoryPopularity = categoryPopularity
        .map(d => ({ ...d, count: parseInt(d.count, 10) }))
        .sort((a, b) => b.count - a.count);

    const topCategories = parsedCategoryPopularity.slice(0, NUM_CATEGORIES_IN_CHART);
    const otherCategories = parsedCategoryPopularity.slice(NUM_CATEGORIES_IN_CHART);
    const otherCount = otherCategories.reduce((sum, item) => sum + item.count, 0);

    const pieChartData = [...topCategories];
    if (otherCount > 0) {
        pieChartData.push({ name: 'Other', count: otherCount });
    }

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

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Daily Search Activity</CardTitle>
                        <CardDescription>Total searches performed over the last 14 days.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {formattedDailyActivity.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={formattedDailyActivity} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomLineChartTooltip />} />
                                    <Line type="monotone" dataKey="count" stroke={chartColors[0]} strokeWidth={2} dot={{ r: 4, fill: chartColors[0] }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[250px] text-muted-foreground"><LineChartIcon className="mr-2 h-5 w-5" />Not enough search data yet.</div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Search Analytics</CardTitle>
                                <CardDescription>Most common successful and failed search terms.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-8">
                                <SearchTermList title="Top Search Terms" initialTerms={topSearchTerms} withResults={true} />
                                <SearchTermList title="Top 'Not Found' Searches" initialTerms={topNotFoundTerms} withResults={false} emptyText="No failed searches logged." />
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

                    <div className="space-y-6 lg:flex lg:flex-col lg:space-y-0 lg:gap-6">
                        <Card className="lg:flex lg:flex-col lg:flex-grow">
                            <CardHeader>
                                <CardTitle>Top Searched Places</CardTitle>
                                <CardDescription>The 5 most frequently selected places after a search.</CardDescription>
                            </CardHeader>
                            <CardContent className="lg:flex-grow">
                                {topSearchedPlaces.length > 0 ? (
                                    <div className="h-[350px] lg:h-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={topSearchedPlaces} layout="vertical" margin={{ left: 10, right: 50, top: 5, bottom: 5 }}>
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={120} />
                                                <Tooltip content={<CustomBarChartTooltip />} cursor={{ fill: 'transparent' }} />
                                                <Bar dataKey="count" fill={chartColors[0]} radius={[4, 4, 4, 4]} animationDuration={800}>
                                                    <LabelList dataKey="count" position="right" offset={8} className="fill-foreground font-semibold" fontSize={12} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-[350px] text-muted-foreground">Not enough data to display.</div>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Category Popularity</CardTitle>
                                        <CardDescription>Breakdown of selections by store category.</CardDescription>
                                    </div>
                                    {parsedCategoryPopularity.length > NUM_CATEGORIES_IN_CHART && (
                                        <CategoryPopularityDialog title="Category Popularity" data={parsedCategoryPopularity} />
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                {parsedCategoryPopularity.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <PieChart>
                                            <Pie data={pieChartData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={5} labelLine={false}>
                                                {pieChartData.map((_entry, index) => <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />)}
                                            </Pie>
                                            <Tooltip content={<CustomPieChartTooltip />} />
                                            <Legend content={<CustomLegend />} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[350px] text-muted-foreground"><PieChartIcon className="mr-2 h-5 w-5" />No selections logged yet.</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
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
