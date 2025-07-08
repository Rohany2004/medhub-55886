import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import Breadcrumb from '@/components/Breadcrumb';
import BarcodeScanner from '@/components/BarcodeScanner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanLine, ArrowRight, Pill } from 'lucide-react';

const BarcodeScannerPage = () => {
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleHome = () => {
    window.location.href = '/';
  };

  const handleNewUpload = () => {
    window.location.href = '/medicine-identifier';
  };

  const handleScanResult = (barcode: string) => {
    setScannedBarcode(barcode);
    setShowScanner(false);
  };

  const handleIdentifyMedicine = () => {
    // Navigate to medicine identifier with barcode data
    window.location.href = `/medicine-identifier?barcode=${scannedBarcode}`;
  };

  return (
    <div className="min-h-screen">
      <Navigation onHome={handleHome} onNewUpload={handleNewUpload} showBackButton={true} />
      
      <div className="pt-16 px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Breadcrumb items={[{ label: 'Barcode Scanner', active: true }]} />
          </div>
          
          <div className="text-center mb-12 animate-fade-in">
            <div className="mx-auto mb-8 w-24 h-24 rounded-full glass-card flex items-center justify-center">
              <ScanLine className="w-12 h-12 text-primary" />
            </div>
            
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Barcode Scanner
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              Scan medicine barcodes for quick identification
            </p>
          </div>

          {!showScanner && !scannedBarcode && (
            <Card className="glass-card max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-center">Ready to Scan</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="w-32 h-32 mx-auto bg-muted/20 rounded-lg flex items-center justify-center">
                  <ScanLine className="w-16 h-16 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  Point your camera at a medicine barcode to get started
                </p>
                <Button onClick={() => setShowScanner(true)} className="btn-medical w-full">
                  <ScanLine className="w-4 h-4 mr-2" />
                  Start Scanning
                </Button>
              </CardContent>
            </Card>
          )}

          {showScanner && (
            <div className="max-w-md mx-auto">
              <BarcodeScanner 
                onScanResult={handleScanResult}
                onClose={() => setShowScanner(false)}
              />
            </div>
          )}

          {scannedBarcode && (
            <Card className="glass-card max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-center text-success">Scan Successful!</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="p-4 bg-success/20 rounded-lg">
                  <p className="font-mono text-lg">{scannedBarcode}</p>
                </div>
                
                <p className="text-muted-foreground">
                  Barcode detected successfully. Proceed to identify this medicine.
                </p>
                
                <div className="space-y-2">
                  <Button onClick={handleIdentifyMedicine} className="btn-medical w-full">
                    <Pill className="w-4 h-4 mr-2" />
                    Identify Medicine
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      setScannedBarcode(null);
                      setShowScanner(true);
                    }} 
                    variant="outline" 
                    className="w-full"
                  >
                    Scan Another
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BarcodeScannerPage;