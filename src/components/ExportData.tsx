import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText, Table } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ExportDataProps {
  medicines?: any[];
}

const ExportData: React.FC<ExportDataProps> = ({ medicines }) => {
  const [isExporting, setIsExporting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAllMedicines = async () => {
    if (medicines) return medicines;
    
    const { data, error } = await supabase
      .from('medicine_entries')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  };

  const exportToCSV = async () => {
    try {
      setIsExporting(true);
      const data = await fetchAllMedicines();
      
      if (!data || data.length === 0) {
        toast({
          title: "No data to export",
          description: "You don't have any medicines to export.",
        });
        return;
      }

      // Create CSV headers
      const headers = [
        'Medicine Name',
        'Category', 
        'Manufacturer',
        'Use Case',
        'Daily Dosage',
        'Price',
        'Expiry Date',
        'Additional Notes',
        'Created Date'
      ];

      // Create CSV rows
      const csvRows = [headers.join(',')];
      data.forEach(medicine => {
        const row = [
          `"${medicine.medicine_name || ''}"`,
          `"${medicine.category || ''}"`,
          `"${medicine.manufacturer || ''}"`,
          `"${medicine.use_case || ''}"`,
          `"${medicine.daily_dosage || ''}"`,
          medicine.price || '',
          medicine.expiry_date || '',
          `"${medicine.additional_notes || ''}"`,
          new Date(medicine.created_at).toLocaleDateString()
        ];
        csvRows.push(row.join(','));
      });

      // Download CSV
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `medicines-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export successful",
        description: "Your medicines have been exported to CSV.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      const data = await fetchAllMedicines();
      
      if (!data || data.length === 0) {
        toast({
          title: "No data to export",
          description: "You don't have any medicines to export.",
        });
        return;
      }

      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Medicine Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2563eb; text-align: center; }
            .medicine { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
            .medicine-name { font-size: 18px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
            .detail { margin: 5px 0; }
            .label { font-weight: bold; color: #374151; }
            .expiry-warning { color: #dc2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Medicine Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <p>Total Medicines: ${data.length}</p>
          
          ${data.map(medicine => {
            const isExpiringSoon = medicine.expiry_date && 
              new Date(medicine.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            
            return `
              <div class="medicine">
                <div class="medicine-name">${medicine.medicine_name}</div>
                <div class="detail"><span class="label">Category:</span> ${medicine.category || 'N/A'}</div>
                <div class="detail"><span class="label">Manufacturer:</span> ${medicine.manufacturer || 'N/A'}</div>
                <div class="detail"><span class="label">Use Case:</span> ${medicine.use_case || 'N/A'}</div>
                <div class="detail"><span class="label">Daily Dosage:</span> ${medicine.daily_dosage || 'N/A'}</div>
                <div class="detail"><span class="label">Price:</span> ${medicine.price ? `$${medicine.price}` : 'N/A'}</div>
                <div class="detail ${isExpiringSoon ? 'expiry-warning' : ''}">
                  <span class="label">Expiry Date:</span> ${medicine.expiry_date || 'N/A'}
                  ${isExpiringSoon ? ' (⚠️ Expiring Soon)' : ''}
                </div>
                ${medicine.additional_notes ? `<div class="detail"><span class="label">Notes:</span> ${medicine.additional_notes}</div>` : ''}
              </div>
            `;
          }).join('')}
        </body>
        </html>
      `;

      // Create and download PDF using print
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }

      toast({
        title: "PDF export initiated",
        description: "Please use your browser's print dialog to save as PDF.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={exportToCSV}
            disabled={isExporting}
            className="flex items-center gap-2 w-full"
            variant="outline"
          >
            <Table className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export to CSV'}
          </Button>
          
          <Button
            onClick={exportToPDF}
            disabled={isExporting}
            className="flex items-center gap-2 w-full"
            variant="outline"
          >
            <FileText className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export to PDF'}
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Export your medicine data to CSV for spreadsheet analysis or PDF for printing and sharing.
        </p>
      </CardContent>
    </Card>
  );
};

export default ExportData;