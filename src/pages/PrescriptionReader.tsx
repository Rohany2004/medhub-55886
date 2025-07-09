import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileText, Camera } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const PrescriptionReader = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a prescription image",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "Please sign in to use this feature",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Upload image to Supabase storage
      const fileName = `prescription-${Date.now()}.${selectedFile.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('medicine-photos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('medicine-photos')
        .getPublicUrl(fileName);

      // Process prescription
      const { data, error } = await supabase.functions.invoke('ocr-prescription', {
        body: {
          imageUrl: publicUrl,
          userId: user.id,
        },
      });

      if (error) throw error;
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to process prescription",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHome = () => {
    window.location.href = '/';
  };

  const handleNewUpload = () => {
    window.location.href = '/medicine-identifier';
  };

  return (
    <div className="min-h-screen">
      <Navigation onHome={handleHome} onNewUpload={handleNewUpload} showBackButton={true} />
      
      <div className="pt-16">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Prescription Reader</h1>
            <p className="text-xl text-muted-foreground">
              Upload your prescription to extract medicine information using OCR
            </p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Upload Prescription
              </CardTitle>
              <CardDescription>
                Take a photo or upload an image of your prescription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="prescription-upload"
                  />
                  <label htmlFor="prescription-upload" className="cursor-pointer">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Prescription preview"
                        className="max-w-full h-64 object-contain mx-auto mb-4"
                      />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-16 h-16 text-gray-400 mb-4" />
                        <p className="text-lg font-medium">Click to upload prescription</p>
                        <p className="text-sm text-gray-500">or drag and drop</p>
                      </div>
                    )}
                  </label>
                </div>

                <Button 
                  onClick={handleSubmit}
                  disabled={!selectedFile || loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing prescription...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Process Prescription
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Prescription Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {results.extractedText && (
                    <div>
                      <h3 className="font-semibold mb-2">Extracted Text:</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-mono">{results.extractedText}</p>
                      </div>
                    </div>
                  )}

                  {results.doctorName && (
                    <div>
                      <h3 className="font-semibold mb-2">Doctor:</h3>
                      <Badge variant="outline">{results.doctorName}</Badge>
                    </div>
                  )}

                  {results.patientName && (
                    <div>
                      <h3 className="font-semibold mb-2">Patient:</h3>
                      <Badge variant="outline">{results.patientName}</Badge>
                    </div>
                  )}

                  {results.medicines && results.medicines.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Prescribed Medicines:</h3>
                      <div className="space-y-3">
                        {results.medicines.map((medicine: any, index: number) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-medium">{medicine.name}</h4>
                            {medicine.dosage && (
                              <p className="text-sm text-gray-600">Dosage: {medicine.dosage}</p>
                            )}
                            {medicine.frequency && (
                              <p className="text-sm text-gray-600">Frequency: {medicine.frequency}</p>
                            )}
                            {medicine.duration && (
                              <p className="text-sm text-gray-600">Duration: {medicine.duration}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.diagnosis && (
                    <div>
                      <h3 className="font-semibold mb-2">Diagnosis:</h3>
                      <p className="text-muted-foreground">{results.diagnosis}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This tool helps digitize your prescriptions for record-keeping. 
              Always follow your doctor's instructions and consult healthcare professionals for medical advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionReader;