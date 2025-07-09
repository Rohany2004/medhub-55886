import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Breadcrumb from '@/components/Breadcrumb';
import ExpiryAlert from '@/components/ExpiryAlert';
import ReminderManager from '@/components/ReminderManager';
import AdvancedAnalytics from '@/components/AdvancedAnalytics';
import FamilySharing from '@/components/FamilySharing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Pill, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Heart,
  BarChart3,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type MedicineEntry = Tables<'medicine_entries'>;

interface HealthStats {
  totalMedicines: number;
  expiringSoon: number;
  categoriesCount: number;
  recentlyAdded: number;
}

const Dashboard = () => {
  const [medicines, setMedicines] = useState<MedicineEntry[]>([]);
  const [recentMedicines, setRecentMedicines] = useState<MedicineEntry[]>([]);
  const [healthStats, setHealthStats] = useState<HealthStats>({
    totalMedicines: 0,
    expiringSoon: 0,
    categoriesCount: 0,
    recentlyAdded: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleHome = () => {
    window.location.href = '/';
  };

  const handleNewUpload = () => {
    window.location.href = '/medicine-identifier';
  };

  const fetchDashboardData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('medicine_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const allMedicines = data || [];
      setMedicines(allMedicines);
      setRecentMedicines(allMedicines.slice(0, 5));

      // Calculate health stats
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const expiringSoon = allMedicines.filter(med => {
        if (!med.expiry_date) return false;
        const expiryDate = new Date(med.expiry_date);
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
        return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
      }).length;

      const recentlyAdded = allMedicines.filter(med => 
        new Date(med.created_at) >= thirtyDaysAgo
      ).length;

      const categories = new Set(allMedicines.map(med => med.category || 'Other'));

      setHealthStats({
        totalMedicines: allMedicines.length,
        expiringSoon,
        categoriesCount: categories.size,
        recentlyAdded
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation onHome={handleHome} onNewUpload={handleNewUpload} showBackButton={true} />
        <div className="pt-16 px-4 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <div className="animate-pulse-slow">
                <Activity className="w-16 h-16 mx-auto mb-4 text-primary" />
                <p className="text-xl text-muted-foreground">Loading your health dashboard...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation onHome={handleHome} onNewUpload={handleNewUpload} showBackButton={true} />
      
      <div className="pt-16 px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Breadcrumb items={[{ label: 'Health Dashboard', active: true }]} />
          </div>
          
          <div className="text-center mb-12 animate-fade-in">
            <div className="mx-auto mb-8 w-24 h-24 rounded-full glass-card flex items-center justify-center">
              <Activity className="w-12 h-12 text-primary" />
            </div>
            
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Health Dashboard
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              Your personal medicine management overview
            </p>
          </div>

          {/* Health Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-card hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Medicines</CardTitle>
                <Pill className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthStats.totalMedicines}</div>
                <p className="text-xs text-muted-foreground">
                  In your collection
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{healthStats.expiringSoon}</div>
                <p className="text-xs text-muted-foreground">
                  Within 30 days
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <BarChart3 className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthStats.categoriesCount}</div>
                <p className="text-xs text-muted-foreground">
                  Medicine types
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recently Added</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{healthStats.recentlyAdded}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Medicines & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Medicines */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recent Medicines
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentMedicines.length === 0 ? (
                  <div className="text-center py-8">
                    <Pill className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No medicines added yet</p>
                    <Button onClick={() => window.location.href = '/medicine-identifier'} className="btn-medical mt-4">
                      Add Your First Medicine
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentMedicines.map((medicine) => (
                      <div key={medicine.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                        <div className="flex items-center gap-3">
                          {medicine.photo_url && (
                            <img
                              src={medicine.photo_url}
                              alt={medicine.medicine_name}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <p className="font-medium">{medicine.medicine_name}</p>
                            <p className="text-sm text-muted-foreground">{medicine.category}</p>
                          </div>
                        </div>
                        {medicine.expiry_date && (
                          <ExpiryAlert expiryDate={medicine.expiry_date} className="text-xs" />
                        )}
                      </div>
                    ))}
                    <Button 
                      onClick={() => window.location.href = '/my-medicines'} 
                      variant="outline" 
                      className="w-full"
                    >
                      View All Medicines
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-accent" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button 
                    onClick={() => window.location.href = '/medicine-identifier'} 
                    className="btn-medical w-full justify-start"
                  >
                    <Pill className="w-4 h-4 mr-2" />
                    Identify New Medicine
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = '/barcode-scanner'} 
                    className="btn-accent w-full justify-start"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Scan Barcode
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = '/interaction-checker'} 
                    className="btn-secondary w-full justify-start"
                    variant="secondary"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Check Interactions
                  </Button>
                  
                  <Button 
                    onClick={() => window.location.href = '/manual-medicine-entry'} 
                    variant="outline" 
                    className="w-full justify-start"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Manual Entry
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;