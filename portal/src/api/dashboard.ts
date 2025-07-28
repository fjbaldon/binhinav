import { apiClient } from ".";

export interface KpiData {
    places: number;
    merchants: number;
    kiosks: number;
    searches30Days: number;
}

export interface ChartDataPoint {
    name: string;
    count: number;
}
export interface CategoryChartDataPoint {
    name: string;
    count: string;
}
export interface SearchTermDataPoint {
    term: string;
    count: number;
}

export interface DateChartDataPoint {
    date: string;
    count: number;
}

export interface OperationalSnapshot {
    unassignedMerchants: number;
    latestChange: {
        id: string;
        username: string;
        timestamp: string;
        changes: any;
    } | null;
    inactiveAds: number;
}

export interface DashboardData {
    kpiData: KpiData;
    topSearchedPlaces: ChartDataPoint[];
    topSearchTerms: SearchTermDataPoint[];
    topNotFoundTerms: SearchTermDataPoint[];
    categoryPopularity: CategoryChartDataPoint[];
    operationalSnapshot: OperationalSnapshot;
    dailySearchActivity: DateChartDataPoint[];
}

export const getDashboardData = async (): Promise<DashboardData> => {
    const response = await apiClient.get('/dashboard');
    return response.data;
};

export const getSearchTerms = async (params: { withResults: boolean, limit: number }): Promise<SearchTermDataPoint[]> => {
    const response = await apiClient.get('/dashboard/search-terms', { params });
    return response.data;
}
