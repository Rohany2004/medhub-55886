import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Pill, Search, Edit, Trash2, Calendar, Package, User, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type MedicineEntry = Tables<'medicine_entries'>;

const MyMedicines = () => {
  const [medicines, setMedicines] = useState<MedicineEntry[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<MedicineEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleHome = () => {
    window.location.href = '/';
  };

  const handleNewUpload = () => {
    window.location.href = '/medicine-identifier';
  };

  const fetchMedicines = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('medicine_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setMedicines(data || []);
      setFilteredMedicines(data || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
      toast({
        title: "Error",
        description: "Failed to load your medicines.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMedicine = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medicine_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMedicines(prev => prev.filter(med => med.id !== id));
      setFilteredMedicines(prev => prev.filter(med => med.id !== id));
      
      toast({
        title: "Success",
        description: "Medicine deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting medicine:', error);
      toast({
        title: "Error",
        description: "Failed to delete medicine.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [user]);

  useEffect(() => {
    const filtered = medicines.filter(medicine =>
      medicine.medicine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.use_case?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMedicines(filtered);
  }, [searchTerm, medicines]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navigation onHome={handleHome} onNewUpload={handleNewUpload} showBackButton={true} />
        <div className="pt-16 flex items-center justify-center min-h-screen">
          <div className="animate-pulse-slow text-center">
            <Pill className="w-16 h-16 mx-auto mb-4 text-primary" />
            <p className="text-xl text-muted-foreground">Loading your medicines...</p>
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
          <div className="text-center mb-12 animate-fade-in">
            <div className="mx-auto mb-8 w-24 h-24 rounded-full glass-card flex items-center justify-center">
              <Pill className="w-12 h-12 text-primary" />
            </div>
            
            <h1 className="text-5xl font-bold text-foreground mb-6">
              My Medicines
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              Manage your saved medicine collection
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {filteredMedicines.length === 0 ? (
            <div className="text-center py-12">
              <div className="glass-card rounded-2xl p-12 max-w-md mx-auto">
                <Pill className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No medicines found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchTerm ? 'Try a different search term' : 'Start by adding your first medicine'}
                </p>
                <Button onClick={() => window.location.href = '/manual-medicine-entry'} className="btn-medical">
                  Add Medicine
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMedicines.map((medicine) => (
                <Card key={medicine.id} className="glass-card overflow-hidden hover-lift">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">{medicine.medicine_name}</CardTitle>
                        {medicine.manufacturer && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Package className="w-4 h-4" />
                            <span>{medicine.manufacturer}</span>
                          </div>
                        )}
                      </div>
                      {medicine.photo_url && (
                        <img
                          src={medicine.photo_url}
                          alt={medicine.medicine_name}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {medicine.use_case && (
                      <div>
                        <h4 className="font-medium text-sm text-primary mb-1">Use Case</h4>
                        <p className="text-sm text-muted-foreground">{medicine.use_case}</p>
                      </div>
                    )}

                    {medicine.daily_dosage && (
                      <div>
                        <h4 className="font-medium text-sm text-accent mb-1">Dosage</h4>
                        <p className="text-sm text-muted-foreground">{medicine.daily_dosage}</p>
                      </div>
                    )}

                    {medicine.expiry_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Expires: {new Date(medicine.expiry_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {medicine.price && (
                      <div>
                        <Badge variant="secondary">₹{medicine.price}</Badge>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-xs text-muted-foreground">
                        Added {new Date(medicine.created_at).toLocaleDateString()}
                      </span>
                      <Button
                        onClick={() => deleteMedicine(medicine.id)}
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyMedicines;