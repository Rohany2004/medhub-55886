import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Heart, AlertTriangle, CheckCircle, Plus, X, Search, Shield } from 'lucide-react';

interface DrugInteraction {
  severity: 'low' | 'moderate' | 'high';
  description: string;
  recommendation: string;
}

interface InteractionResult {
  drug1: string;
  drug2: string;
  interaction: DrugInteraction | null;
}

const InteractionChecker: React.FC = () => {
  const [medicines, setMedicines] = useState<string[]>([]);
  const [currentMedicine, setCurrentMedicine] = useState('');
  const [results, setResults] = useState<InteractionResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const addMedicine = () => {
    if (!currentMedicine.trim()) return;
    
    if (medicines.includes(currentMedicine.trim())) {
      toast({
        title: "Duplicate Medicine",
        description: "This medicine is already in the list.",
        variant: "destructive",
      });
      return;
    }
    
    setMedicines([...medicines, currentMedicine.trim()]);
    setCurrentMedicine('');
  };

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const checkInteractions = async () => {
    if (medicines.length < 2) {
      toast({
        title: "Insufficient Medicines",
        description: "Please add at least 2 medicines to check interactions.",
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    
    // Simulate API call for drug interactions
    // In a real app, this would call a drug interaction API
    setTimeout(() => {
      const mockResults: InteractionResult[] = [];
      
      for (let i = 0; i < medicines.length; i++) {
        for (let j = i + 1; j < medicines.length; j++) {
          const drug1 = medicines[i];
          const drug2 = medicines[j];
          
          // Mock interaction detection based on common drug names
          let interaction: DrugInteraction | null = null;
          
          if ((drug1.toLowerCase().includes('warfarin') && drug2.toLowerCase().includes('aspirin')) ||
              (drug1.toLowerCase().includes('aspirin') && drug2.toLowerCase().includes('warfarin'))) {
            interaction = {
              severity: 'high',
              description: 'Increased risk of bleeding when taken together.',
              recommendation: 'Consult your doctor immediately. This combination requires careful monitoring.'
            };
          } else if ((drug1.toLowerCase().includes('ibuprofen') && drug2.toLowerCase().includes('aspirin')) ||
                     (drug1.toLowerCase().includes('aspirin') && drug2.toLowerCase().includes('ibuprofen'))) {
            interaction = {
              severity: 'moderate',
              description: 'Both are NSAIDs and may increase risk of stomach irritation.',
              recommendation: 'Take with food and consider spacing doses apart.'
            };
          } else if (Math.random() > 0.7) {
            // Random mild interactions for demo
            interaction = {
              severity: 'low',
              description: 'Minor interaction detected. May slightly affect absorption.',
              recommendation: 'Take doses 2 hours apart for best results.'
            };
          }
          
          mockResults.push({
            drug1,
            drug2,
            interaction
          });
        }
      }
      
      setResults(mockResults);
      setIsChecking(false);
      
      const highRiskCount = mockResults.filter(r => r.interaction?.severity === 'high').length;
      if (highRiskCount > 0) {
        toast({
          title: "High Risk Interactions Found",
          description: `${highRiskCount} high-risk interaction(s) detected. Please consult your doctor.`,
          variant: "destructive",
        });
      }
    }, 2000);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'moderate':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'low':
        return <CheckCircle className="w-4 h-4 text-success" />;
      default:
        return <CheckCircle className="w-4 h-4 text-success" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'moderate':
        return 'secondary';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Medicine Interaction Checker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter medicine name..."
              value={currentMedicine}
              onChange={(e) => setCurrentMedicine(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addMedicine()}
              className="flex-1"
            />
            <Button onClick={addMedicine} className="btn-medical">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {medicines.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Medicines to Check:</h4>
              <div className="flex flex-wrap gap-2">
                {medicines.map((medicine, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {medicine}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMedicine(index)}
                      className="h-4 w-4 p-0 hover:bg-transparent"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={checkInteractions} 
            disabled={medicines.length < 2 || isChecking}
            className="btn-accent w-full"
          >
            {isChecking ? (
              <>
                <Search className="w-4 h-4 mr-2 animate-spin" />
                Checking Interactions...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                Check Interactions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Interaction Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">
                    {result.drug1} + {result.drug2}
                  </div>
                  {result.interaction ? (
                    <Badge variant={getSeverityColor(result.interaction.severity) as any} className="flex items-center gap-1">
                      {getSeverityIcon(result.interaction.severity)}
                      {result.interaction.severity.toUpperCase()}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-success" />
                      NO INTERACTION
                    </Badge>
                  )}
                </div>
                
                {result.interaction && (
                  <Alert className={result.interaction.severity === 'high' ? 'border-destructive' : ''}>
                    <AlertDescription>
                      <div className="space-y-2">
                        <p><strong>Description:</strong> {result.interaction.description}</p>
                        <p><strong>Recommendation:</strong> {result.interaction.recommendation}</p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ))}
            
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                <strong>Disclaimer:</strong> This tool provides general information only. 
                Always consult with your healthcare provider or pharmacist before making any changes to your medication regimen.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InteractionChecker;