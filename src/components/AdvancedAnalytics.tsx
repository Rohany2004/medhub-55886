import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, DollarSign, Calendar, Pill, AlertTriangle, Activity } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalMedicines: number;
  totalValue: number;
  expiringMedicines: number;
  categoriesSummary: { category: string; count: number; value: number }[];
  monthlySpending: { month: string; amount: number }[];
  usagePatterns: { medicine: string; usage: number }[];
  upcomingExpiries: { medicine: string; expiry: string; daysUntilExpiry: number }[];
}

const AdvancedAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('3months');
  const { user } = useAuth();
  const { toast } = useToast();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Get date range
      const now = new Date();
      const rangeMonths = timeRange === '1month' ? 1 : timeRange === '6months' ? 6 : 3;
      const startDate = new Date(now.getFullYear(), now.getMonth() - rangeMonths, 1);

      // Fetch medicines data
      const { data: medicines, error: medicinesError } = await supabase
        .from('medicine_entries')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString());

      if (medicinesError) throw medicinesError;

      // Fetch usage logs
      const { data: usageLogs, error: usageError } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', user?.id)
        .gte('logged_at', startDate.toISOString());

      if (usageError) throw usageError;

      // Calculate analytics
      const totalMedicines = medicines?.length || 0;
      const totalValue = medicines?.reduce((sum, med) => sum + (med.price || 0), 0) || 0;

      // Expiring medicines (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const expiringMedicines = medicines?.filter(med => 
        med.expiry_date && new Date(med.expiry_date) <= thirtyDaysFromNow
      ).length || 0;

      // Categories summary
      const categoriesMap = new Map();
      medicines?.forEach(med => {
        const category = med.category || 'Other';
        if (categoriesMap.has(category)) {
          const existing = categoriesMap.get(category);
          categoriesMap.set(category, {
            count: existing.count + 1,
            value: existing.value + (med.price || 0)
          });
        } else {
          categoriesMap.set(category, { count: 1, value: med.price || 0 });
        }
      });

      const categoriesSummary = Array.from(categoriesMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        value: data.value
      }));

      // Monthly spending
      const monthlyMap = new Map();
      medicines?.forEach(med => {
        if (med.price && med.created_at) {
          const date = new Date(med.created_at);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + med.price);
        }
      });

      const monthlySpending = Array.from(monthlyMap.entries())
        .map(([month, amount]) => ({ month, amount }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // Usage patterns
      const usageMap = new Map();
      usageLogs?.forEach(log => {
        if (log.medicine_id && log.action_type === 'take_dose') {
          const medicine = medicines?.find(m => m.id === log.medicine_id);
          if (medicine) {
            usageMap.set(medicine.medicine_name, (usageMap.get(medicine.medicine_name) || 0) + 1);
          }
        }
      });

      const usagePatterns = Array.from(usageMap.entries())
        .map(([medicine, usage]) => ({ medicine, usage }))
        .sort((a, b) => b.usage - a.usage)
        .slice(0, 10);

      // Upcoming expiries
      const upcomingExpiries = medicines
        ?.filter(med => med.expiry_date)
        .map(med => {
          const expiryDate = new Date(med.expiry_date!);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return {
            medicine: med.medicine_name,
            expiry: med.expiry_date!,
            daysUntilExpiry
          };
        })
        .filter(item => item.daysUntilExpiry <= 90) // Next 90 days
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
        .slice(0, 10) || [];

      setAnalytics({
        totalMedicines,
        totalValue,
        expiringMedicines,
        categoriesSummary,
        monthlySpending,
        usagePatterns,
        upcomingExpiries
      });

    } catch (error) {
      toast({
        title: "Error loading analytics",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getExpiryColor = (days: number) => {
    if (days < 0) return 'text-red-600';
    if (days <= 7) return 'text-red-500';
    if (days <= 30) return 'text-orange-500';
    return 'text-yellow-500';
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center p-8">No analytics data available.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Medicine Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1month">Last Month</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Medicines</p>
                <p className="text-2xl font-bold">{analytics.totalMedicines}</p>
              </div>
              <Pill className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">{formatCurrency(analytics.totalValue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold">{analytics.expiringMedicines}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{analytics.categoriesSummary.length}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Medicines by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoriesSummary}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ category, count }) => `${category}: ${count}`}
                >
                  {analytics.categoriesSummary.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Spending */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Usage Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>Most Used Medicines</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.usagePatterns} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="medicine" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="usage" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upcoming Expiries */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Expiries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.upcomingExpiries.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No medicines expiring in the next 90 days
                </p>
              ) : (
                analytics.upcomingExpiries.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.medicine}</p>
                      <p className="text-sm text-muted-foreground">
                        Expires: {new Date(item.expiry).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={getExpiryColor(item.daysUntilExpiry)}>
                      {item.daysUntilExpiry < 0 
                        ? `Expired ${Math.abs(item.daysUntilExpiry)} days ago`
                        : `${item.daysUntilExpiry} days`
                      }
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Value Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Value Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.categoriesSummary.map((category, index) => (
              <div key={category.category} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{category.category}</h3>
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    {category.count} medicines
                  </p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(category.value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalytics;