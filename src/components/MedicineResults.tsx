import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface MedicineInfo {
  name?: string;
  generic_name?: string;
  manufacturer?: string;
  composition?: string[];
  uses?: string[];
  dosage?: string;
  side_effects?: string[];
  warnings?: string[];
  storage?: string;
  prescription_required?: boolean;
}

interface MedicineResultsProps {
  medicineInfo: MedicineInfo | null;
  isLoading: boolean;
  uploadedImage?: string;
}

const MedicineResults: React.FC<MedicineResultsProps> = ({ 
  medicineInfo, 
  isLoading, 
  uploadedImage 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleAddToMyMedicines = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save medicines to your collection.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!medicineInfo?.name) {
      toast({
        title: "Cannot save",
        description: "Medicine name is required to save.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('medicine_entries').insert({
        user_id: user.id,
        medicine_name: medicineInfo.name,
        manufacturer: medicineInfo.manufacturer || null,
        use_case: medicineInfo.uses?.join(', ') || null,
        daily_dosage: medicineInfo.dosage || null,
        additional_notes: medicineInfo.storage || null,
      });

      if (error) throw error;

      setIsSaved(true);
      toast({
        title: "Medicine saved!",
        description: `${medicineInfo.name} has been added to your medicines.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to save",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto animate-fade-in">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="animate-pulse-slow mb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent"></div>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Analyzing Your Medicine...
          </h3>
          <p className="text-muted-foreground">
            Our AI is identifying the medicine and gathering detailed information
          </p>
        </div>
      </div>
    );
  }

  if (!medicineInfo) {
    return null;
  }

  return (
    <div className="w-full max-w-6xl mx-auto animate-slide-up">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Image Preview */}
        {uploadedImage && (
          <div className="lg:col-span-1">
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg text-center">Uploaded Image</CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={uploadedImage}
                  alt="Uploaded medicine"
                  className="w-full rounded-xl object-contain max-h-64"
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Medicine Information */}
        <div className={`${uploadedImage ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
          {/* Basic Information */}
          <Card className="glass-card hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-xl">Medicine Information</CardTitle>
                <div className="flex items-center gap-2">
                  {medicineInfo.prescription_required && (
                    <Badge variant="destructive">Prescription Required</Badge>
                  )}
                  <Button
                    onClick={handleAddToMyMedicines}
                    disabled={isSaving || isSaved}
                    size="sm"
                    className="gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isSaved ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                    {isSaved ? 'Saved' : 'Add to My Medicines'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {medicineInfo.name && (
                <div>
                  <h3 className="font-semibold text-lg text-primary mb-1">
                    {medicineInfo.name}
                  </h3>
                  {medicineInfo.generic_name && (
                    <p className="text-muted-foreground">
                      Generic: {medicineInfo.generic_name}
                    </p>
                  )}
                </div>
              )}
              
              {medicineInfo.manufacturer && (
                <div>
                  <span className="font-medium">Manufacturer: </span>
                  <span className="text-muted-foreground">{medicineInfo.manufacturer}</span>
                </div>
              )}
              
              {medicineInfo.dosage && (
                <div>
                  <span className="font-medium">Dosage: </span>
                  <span className="text-muted-foreground">{medicineInfo.dosage}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Composition */}
          {medicineInfo.composition && medicineInfo.composition.length > 0 && (
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg">Composition</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {medicineInfo.composition.map((ingredient, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {ingredient}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Uses */}
          {medicineInfo.uses && medicineInfo.uses.length > 0 && (
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg text-success">Uses & Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {medicineInfo.uses.map((use, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-success mr-3 mt-2 flex-shrink-0"></span>
                      <span className="text-muted-foreground">{use}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Side Effects */}
          {medicineInfo.side_effects && medicineInfo.side_effects.length > 0 && (
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg text-warning">Side Effects</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {medicineInfo.side_effects.map((effect, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-warning mr-3 mt-2 flex-shrink-0"></span>
                      <span className="text-muted-foreground">{effect}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {medicineInfo.warnings && medicineInfo.warnings.length > 0 && (
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">Warnings & Precautions</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {medicineInfo.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start">
                      <span className="inline-block w-2 h-2 rounded-full bg-destructive mr-3 mt-2 flex-shrink-0"></span>
                      <span className="text-muted-foreground">{warning}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Storage Information */}
          {medicineInfo.storage && (
            <Card className="glass-card hover-lift">
              <CardHeader>
                <CardTitle className="text-lg">Storage Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{medicineInfo.storage}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicineResults;