import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const ImportData: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let j = 0; j < lines[i].length; j++) {
        const char = lines[i][j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());

      if (values.length >= headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          const key = header.toLowerCase().replace(/\s+/g, '_');
          row[key] = values[index] || '';
        });
        data.push(row);
      }
    }

    return data;
  };

  const mapCSVToMedicine = (csvRow: any) => {
    return {
      medicine_name: csvRow.medicine_name || csvRow.name || '',
      category: csvRow.category || 'Other',
      manufacturer: csvRow.manufacturer || null,
      use_case: csvRow.use_case || null,
      daily_dosage: csvRow.daily_dosage || null,
      price: csvRow.price ? parseFloat(csvRow.price.replace(/[^0-9.-]+/g, '')) : null,
      expiry_date: csvRow.expiry_date || null,
      additional_notes: csvRow.additional_notes || csvRow.notes || null,
      user_id: user?.id
    };
  };

  const importFromCSV = async (file: File) => {
    try {
      setIsImporting(true);
      setImportResult(null);

      const text = await file.text();
      const csvData = parseCSV(text);

      if (csvData.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      const result: ImportResult = {
        success: 0,
        failed: 0,
        errors: []
      };

      for (const row of csvData) {
        try {
          const medicine = mapCSVToMedicine(row);
          
          if (!medicine.medicine_name) {
            result.failed++;
            result.errors.push(`Row ${result.success + result.failed + 1}: Medicine name is required`);
            continue;
          }

          const { error } = await supabase
            .from('medicine_entries')
            .insert(medicine);

          if (error) {
            result.failed++;
            result.errors.push(`Row ${result.success + result.failed + 1}: ${error.message}`);
          } else {
            result.success++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Row ${result.success + result.failed + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setImportResult(result);

      if (result.success > 0) {
        toast({
          title: "Import completed",
          description: `Successfully imported ${result.success} medicines${result.failed > 0 ? `, ${result.failed} failed` : ''}.`,
        });
      } else {
        toast({
          title: "Import failed",
          description: "No medicines were imported successfully.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
      return;
    }

    importFromCSV(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Import Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Import CSV File</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a CSV file with your medicine data. Supported columns: Medicine Name, Category, 
            Manufacturer, Use Case, Daily Dosage, Price, Expiry Date, Additional Notes.
          </p>
          
          <Button 
            onClick={triggerFileUpload}
            disabled={isImporting}
            className="mb-2"
          >
            {isImporting ? 'Importing...' : 'Choose CSV File'}
          </Button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            className="hidden"
          />
        </div>

        {importResult && (
          <div className="space-y-2">
            {importResult.success > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Successfully imported {importResult.success} medicines.
                </AlertDescription>
              </Alert>
            )}
            
            {importResult.failed > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Failed to import {importResult.failed} medicines.
                  {importResult.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">View errors</summary>
                      <ul className="mt-1 text-xs space-y-1">
                        {importResult.errors.slice(0, 10).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                        {importResult.errors.length > 10 && (
                          <li>... and {importResult.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </details>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>CSV Format Requirements:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>First row should contain column headers</li>
            <li>Medicine Name column is required</li>
            <li>Date format: YYYY-MM-DD for expiry dates</li>
            <li>Price should be numeric (currency symbols will be removed)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImportData;