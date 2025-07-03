import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Medicine Information</CardTitle>
                {medicineInfo.prescription_required && (
                  <Badge variant="destructive">Prescription Required</Badge>
                )}
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