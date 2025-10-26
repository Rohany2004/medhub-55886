import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import Navigation from '@/components/Navigation';
import { Pill, Upload, Sparkles, CalendarIcon, Camera, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import CameraCapture from '@/components/CameraCapture';
import TrialLimitWrapper from '@/components/TrialLimitWrapper';
import { useTrialLimit } from '@/hooks/useTrialLimit';

const medicineSchema = z.object({
  medicine_name: z.string().min(1, 'Medicine name is required'),
  use_case: z.string().optional(),
  daily_dosage: z.string().optional(),
  expiry_date: z.date().optional(),
  price: z.string().optional(),
  manufacturer: z.string().optional(),
  additional_notes: z.string().optional(),
});

type MedicineFormData = z.infer<typeof medicineSchema>;

const ManualMedicineEntry = () => {
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canUseFeature, incrementTrialUsage, remainingTries, isAuthenticated } = useTrialLimit();

  const handleHome = () => {
    navigate('/');
  };

  const handleNewUpload = () => {
    navigate('/');
  };

  const form = useForm<MedicineFormData>({
    resolver: zodResolver(medicineSchema),
    defaultValues: {
      medicine_name: '',
      use_case: '',
      daily_dosage: '',
      price: '',
      manufacturer: '',
      additional_notes: '',
    },
  });

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = (file: File) => {
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setShowCamera(false);
  };

  const generateDetailsWithAI = async () => {
    if (!form.getValues('medicine_name') && !photo) {
      toast({
        title: "Missing Information",
        description: "Please enter a medicine name or upload a photo to generate details.",
        variant: "destructive",
      });
      return;
    }

    // Check trial limit for unregistered users
    if (!canUseFeature()) {
      return;
    }

    if (!incrementTrialUsage()) {
      return; // Trial limit reached, modal will show
    }

    setIsGeneratingDetails(true);
    try {
      let imageBase64 = '';
      if (photo) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = (e) => {
            const base64 = e.target?.result as string;
            resolve(base64.split(',')[1]);
          };
        });
        reader.readAsDataURL(photo);
        imageBase64 = await base64Promise;
      }

      // Build payload conditionally to satisfy backend validation
      const payload: Record<string, any> = {};
      const name = (form.getValues('medicine_name') || '').trim();
      if (name) payload.medicineName = name;
      if (imageBase64) payload.imageBase64 = imageBase64;

      const { data, error } = await supabase.functions.invoke('generate-medicine-details', {
        body: payload
      });

      if (error) throw error;

      const details = data.medicineDetails;
      
      form.setValue('medicine_name', details.medicine_name || form.getValues('medicine_name'));
      form.setValue('use_case', details.use_case || '');
      form.setValue('daily_dosage', details.daily_dosage || '');
      form.setValue('manufacturer', details.manufacturer || '');
      form.setValue('additional_notes', details.additional_notes || '');

      toast({
        title: "Details Generated",
        description: "Medicine details have been generated using AI. You can edit them before saving.",
      });
    } catch (error) {
      console.error('Error generating details:', error);
      const msg = (error as any)?.message || 'Unable to generate medicine details. Please try again.';
      let description = msg;
      if (msg.includes('Rate limit') || msg.includes('429')) {
        description = 'AI rate limit exceeded. Please wait a moment and try again.';
      } else if (msg.includes('Payment required') || msg.includes('402')) {
        description = 'AI credits exhausted. Please add credits to your workspace.';
      } else if (msg.includes('Invalid input')) {
        description = 'Please enter a valid name or upload a clear photo and try again.';
      }
      toast({
        title: 'Generation Failed',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingDetails(false);
    }
  };

  const onSubmit = async (data: MedicineFormData) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save medicine entries.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      let photoUrl = '';

      // Upload photo if provided
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('medicine-photos')
          .upload(fileName, photo);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('medicine-photos')
          .getPublicUrl(uploadData.path);

        photoUrl = urlData.publicUrl;
      }

      // Save medicine entry
      const { error } = await supabase
        .from('medicine_entries')
        .insert({
          user_id: user.id,
          photo_url: photoUrl,
          medicine_name: data.medicine_name,
          use_case: data.use_case || null,
          daily_dosage: data.daily_dosage || null,
          expiry_date: data.expiry_date ? data.expiry_date.toISOString().split('T')[0] : null,
          price: data.price ? parseFloat(data.price) : null,
          manufacturer: data.manufacturer || null,
          additional_notes: data.additional_notes || null,
        });

      if (error) throw error;

      toast({
        title: "Medicine Saved",
        description: "Your medicine entry has been saved successfully.",
      });

      // Reset form
      form.reset();
      setPhoto(null);
      setPhotoPreview('');
    } catch (error) {
      console.error('Error saving medicine:', error);
      toast({
        title: "Save Failed",
        description: "Unable to save medicine entry. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <TrialLimitWrapper featureName="Manual Medicine Entry">
      <div className="min-h-screen">
        <Navigation 
          onHome={handleHome}
          onNewUpload={handleNewUpload}
          showBackButton={true} 
        />
        
        <div className="pt-16 px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
            <div className="mx-auto mb-8 w-24 h-24 rounded-full glass-card flex items-center justify-center">
              <Pill className="w-12 h-12 text-primary" />
            </div>
            
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Add Medicine Manually
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Upload a photo and manually enter your medicine details. Use AI to auto-fill information or enter everything yourself.
              {!isAuthenticated && remainingTries !== null && (
                <span className="block mt-4 text-lg font-medium text-primary">
                  {remainingTries > 0 ? `${remainingTries} free AI generations remaining` : 'Sign up to continue using AI features'}
                </span>
              )}
            </p>
          </div>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Camera className="w-6 h-6" />
                Medicine Entry Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <div className="space-y-4">
                    <label className="block text-sm font-medium">Medicine Photo</label>
                    <div className="flex items-center justify-center w-full">
                      <label 
                        htmlFor="photo-upload"
                        className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer glass-card hover-lift"
                      >
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Medicine preview"
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> medicine photo
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, or JPEG</p>
                          </div>
                        )}
                        <input
                          id="photo-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                        />
                      </label>
                    </div>
                    
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Take Photo
                      </Button>
                    </div>
                  </div>

                  {/* AI Generate Button */}
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      onClick={generateDetailsWithAI}
                      disabled={isGeneratingDetails}
                      className="btn-accent"
                    >
                      <Sparkles className="w-5 h-5 mr-2" />
                      {isGeneratingDetails ? 'Generating...' : 'Generate Details with AI'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Medicine Name */}
                    <FormField
                      control={form.control}
                      name="medicine_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medicine Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter medicine name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Use Case */}
                    <FormField
                      control={form.control}
                      name="use_case"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Use Case / Purpose</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Pain relief, Antibiotic" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Daily Dosage */}
                    <FormField
                      control={form.control}
                      name="daily_dosage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Dosage</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 1 tablet twice daily" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Expiry Date */}
                    <FormField
                      control={form.control}
                      name="expiry_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Expiry Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick expiry date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date()}
                                initialFocus
                                className={cn("p-3 pointer-events-auto")}
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Price */}
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="0.00" className="pl-10" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Manufacturer */}
                    <FormField
                      control={form.control}
                      name="manufacturer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manufacturer</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter manufacturer name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Additional Notes */}
                  <FormField
                    control={form.control}
                    name="additional_notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Side effects, doctor's advice, storage instructions..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="flex justify-center pt-6">
                    <Button
                      type="submit"
                      disabled={isUploading}
                      className="btn-medical px-12 py-3 text-lg"
                    >
                      {isUploading ? 'Saving...' : 'Save Medicine Entry'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
            </Card>
            
            <CameraCapture
              isOpen={showCamera}
              onCapture={handleCameraCapture}
              onClose={() => setShowCamera(false)}
            />
          </div>
        </div>
      </div>
    </TrialLimitWrapper>
  );
};

export default ManualMedicineEntry;