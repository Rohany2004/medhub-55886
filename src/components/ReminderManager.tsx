import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, Clock, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Reminder {
  id: string;
  title: string;
  message: string | null;
  reminder_type: string;
  reminder_time: string | null;
  frequency: string | null;
  days_of_week: number[] | null;
  is_active: boolean;
  medicine_id: string;
  medicine_name?: string;
  next_trigger_at: string | null;
}

interface Medicine {
  id: string;
  medicine_name: string;
}

const ReminderManager: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    reminder_type: 'dosage',
    medicine_id: '',
    reminder_time: '08:00',
    frequency: 'daily',
    days_of_week: [] as number[],
    is_active: true
  });

  const { user } = useAuth();
  const { toast } = useToast();

  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  useEffect(() => {
    if (user) {
      fetchReminders();
      fetchMedicines();
    }
  }, [user]);

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          medicine_entries(medicine_name)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReminders = data.map(reminder => ({
        ...reminder,
        medicine_name: reminder.medicine_entries?.medicine_name
      }));

      setReminders(formattedReminders);
    } catch (error) {
      toast({
        title: "Error fetching reminders",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('medicine_entries')
        .select('id, medicine_name')
        .eq('user_id', user?.id)
        .order('medicine_name');

      if (error) throw error;
      setMedicines(data || []);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      reminder_type: 'dosage',
      medicine_id: '',
      reminder_time: '08:00',
      frequency: 'daily',
      days_of_week: [],
      is_active: true
    });
    setEditingReminder(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const reminderData = {
        ...formData,
        user_id: user?.id,
        days_of_week: formData.frequency === 'weekly' ? formData.days_of_week : null
      };

      if (editingReminder) {
        const { error } = await supabase
          .from('reminders')
          .update(reminderData)
          .eq('id', editingReminder.id);

        if (error) throw error;

        toast({
          title: "Reminder updated",
          description: "Your reminder has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('reminders')
          .insert(reminderData);

        if (error) throw error;

        toast({
          title: "Reminder created",
          description: "Your new reminder has been created successfully.",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchReminders();
    } catch (error) {
      toast({
        title: "Error saving reminder",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setFormData({
      title: reminder.title,
      message: reminder.message || '',
      reminder_type: reminder.reminder_type || 'dosage',
      medicine_id: reminder.medicine_id,
      reminder_time: reminder.reminder_time || '08:00',
      frequency: reminder.frequency || 'daily',
      days_of_week: reminder.days_of_week || [],
      is_active: reminder.is_active
    });
    setEditingReminder(reminder);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Reminder deleted",
        description: "The reminder has been deleted successfully.",
      });

      fetchReminders();
    } catch (error) {
      toast({
        title: "Error deleting reminder",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const toggleReminder = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      setReminders(prev => prev.map(r => 
        r.id === id ? { ...r, is_active: isActive } : r
      ));

      toast({
        title: isActive ? "Reminder enabled" : "Reminder disabled",
        description: `The reminder has been ${isActive ? 'enabled' : 'disabled'}.`,
      });
    } catch (error) {
      toast({
        title: "Error updating reminder",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const getReminderTypeColor = (type: string) => {
    switch (type) {
      case 'dosage': return 'bg-blue-100 text-blue-800';
      case 'expiry': return 'bg-red-100 text-red-800';
      case 'refill': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading reminders...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Medicine Reminders
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Take morning medication"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="medicine">Medicine</Label>
                  <Select
                    value={formData.medicine_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, medicine_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select medicine" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines.map(medicine => (
                        <SelectItem key={medicine.id} value={medicine.id}>
                          {medicine.medicine_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Reminder Type</Label>
                  <Select
                    value={formData.reminder_type}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, reminder_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dosage">Dosage</SelectItem>
                      <SelectItem value="expiry">Expiry Alert</SelectItem>
                      <SelectItem value="refill">Refill Reminder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.reminder_time}
                    onChange={(e) => setFormData(prev => ({ ...prev, reminder_time: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.frequency === 'weekly' && (
                  <div>
                    <Label>Days of Week</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {daysOfWeek.map(day => (
                        <label key={day.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.days_of_week.includes(day.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  days_of_week: [...prev.days_of_week, day.value]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  days_of_week: prev.days_of_week.filter(d => d !== day.value)
                                }));
                              }
                            }}
                          />
                          <span className="text-sm">{day.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Take with food"
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="active">Active</Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingReminder ? 'Update' : 'Create'} Reminder
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No reminders set up yet.</p>
            <p className="text-sm">Create your first reminder to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map(reminder => (
              <div
                key={reminder.id}
                className={`border rounded-lg p-4 ${reminder.is_active ? 'bg-card' : 'bg-muted/50'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`font-semibold ${!reminder.is_active ? 'text-muted-foreground' : ''}`}>
                        {reminder.title}
                      </h3>
                      <Badge className={getReminderTypeColor(reminder.reminder_type)}>
                        {reminder.reminder_type}
                      </Badge>
                      {!reminder.is_active && (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </div>
                    
                    {reminder.medicine_name && (
                      <p className="text-sm text-muted-foreground mb-1">
                        Medicine: {reminder.medicine_name}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {reminder.reminder_time}
                      </span>
                      <span>{reminder.frequency}</span>
                      {reminder.frequency === 'weekly' && reminder.days_of_week?.length > 0 && (
                        <span>
                          ({reminder.days_of_week.map(d => daysOfWeek.find(day => day.value === d)?.label.slice(0, 3)).join(', ')})
                        </span>
                      )}
                    </div>
                    
                    {reminder.message && (
                      <p className="text-sm mt-2">{reminder.message}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={reminder.is_active}
                      onCheckedChange={(checked) => toggleReminder(reminder.id, checked)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(reminder)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(reminder.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReminderManager;