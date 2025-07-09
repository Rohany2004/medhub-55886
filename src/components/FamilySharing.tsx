import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Plus, Share, Copy, Trash2, Crown, Shield, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FamilyGroup {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  invite_code: string;
  created_at: string;
  member_count?: number;
}

interface FamilyMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile?: {
    name: string;
  };
}

interface SharedMedicine {
  id: string;
  medicine_name: string;
  category: string;
  shared_by: string;
  shared_at: string;
  can_edit: boolean;
  sharer_name?: string;
}

const FamilySharing: React.FC = () => {
  const [familyGroups, setFamilyGroups] = useState<FamilyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [sharedMedicines, setSharedMedicines] = useState<SharedMedicine[]>([]);
  const [userMedicines, setUserMedicines] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [selectedMedicineIds, setSelectedMedicineIds] = useState<string[]>([]);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchFamilyGroups();
      fetchUserMedicines();
    }
  }, [user]);

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupDetails();
    }
  }, [selectedGroup]);

  const fetchFamilyGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('family_groups')
        .select(`
          *,
          family_members(count)
        `)
        .or(`owner_id.eq.${user?.id},family_members.user_id.eq.${user?.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const groupsWithCounts = data?.map(group => ({
        ...group,
        member_count: group.family_members?.length || 0
      })) || [];

      setFamilyGroups(groupsWithCounts);
      
      if (groupsWithCounts.length > 0 && !selectedGroup) {
        setSelectedGroup(groupsWithCounts[0]);
      }
    } catch (error) {
      toast({
        title: "Error fetching family groups",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupDetails = async () => {
    if (!selectedGroup) return;

    try {
      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_group_id', selectedGroup.id);

      if (membersError) throw membersError;

      const formattedMembers = membersData?.map(member => ({
        ...member,
        profile: { name: 'Family Member' } // Simplified for now
      })) || [];

      setMembers(formattedMembers);

      // Fetch shared medicines
      const { data: sharedData, error: sharedError } = await supabase
        .from('shared_medicines')
        .select(`
          *,
          medicine_entries(medicine_name, category)
        `)
        .eq('family_group_id', selectedGroup.id);

      if (sharedError) throw sharedError;

      const formattedShared = sharedData?.map(shared => ({
        id: shared.id,
        medicine_name: shared.medicine_entries?.medicine_name || '',
        category: shared.medicine_entries?.category || '',
        shared_by: shared.shared_by,
        shared_at: shared.shared_at,
        can_edit: shared.can_edit,
        sharer_name: 'Family Member' // Simplified for now
      })) || [];

      setSharedMedicines(formattedShared);
    } catch (error) {
      console.error('Error fetching group details:', error);
    }
  };

  const fetchUserMedicines = async () => {
    try {
      const { data, error } = await supabase
        .from('medicine_entries')
        .select('id, medicine_name, category')
        .eq('user_id', user?.id)
        .order('medicine_name');

      if (error) throw error;
      setUserMedicines(data || []);
    } catch (error) {
      console.error('Error fetching user medicines:', error);
    }
  };

  const createFamilyGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('family_groups')
        .insert({
          name: createForm.name,
          description: createForm.description,
          owner_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner member
      await supabase
        .from('family_members')
        .insert({
          family_group_id: data.id,
          user_id: user?.id,
          role: 'owner'
        });

      toast({
        title: "Family group created",
        description: "Your family group has been created successfully.",
      });

      setIsCreateDialogOpen(false);
      setCreateForm({ name: '', description: '' });
      fetchFamilyGroups();
    } catch (error) {
      toast({
        title: "Error creating family group",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const joinFamilyGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Find group by invite code
      const { data: groupData, error: groupError } = await supabase
        .from('family_groups')
        .select('id')
        .eq('invite_code', joinCode)
        .single();

      if (groupError) throw new Error('Invalid invite code');

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('family_group_id', groupData.id)
        .eq('user_id', user?.id)
        .single();

      if (existingMember) {
        throw new Error('You are already a member of this group');
      }

      // Join the group
      const { error: joinError } = await supabase
        .from('family_members')
        .insert({
          family_group_id: groupData.id,
          user_id: user?.id,
          role: 'member'
        });

      if (joinError) throw joinError;

      toast({
        title: "Successfully joined",
        description: "You have joined the family group successfully.",
      });

      setIsJoinDialogOpen(false);
      setJoinCode('');
      fetchFamilyGroups();
    } catch (error) {
      toast({
        title: "Error joining family group",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const shareMedicines = async () => {
    if (!selectedGroup || selectedMedicineIds.length === 0) return;

    try {
      const shareData = selectedMedicineIds.map(medicineId => ({
        medicine_id: medicineId,
        family_group_id: selectedGroup.id,
        shared_by: user?.id,
        can_edit: false
      }));

      const { error } = await supabase
        .from('shared_medicines')
        .insert(shareData);

      if (error) throw error;

      toast({
        title: "Medicines shared",
        description: `Successfully shared ${selectedMedicineIds.length} medicines with your family.`,
      });

      setIsShareDialogOpen(false);
      setSelectedMedicineIds([]);
      fetchGroupDetails();
    } catch (error) {
      toast({
        title: "Error sharing medicines",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Invite code copied",
        description: "The invite code has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error copying invite code",
        description: "Could not copy invite code to clipboard.",
        variant: "destructive",
      });
    }
  };

  const leaveGroup = async (groupId: string) => {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('family_group_id', groupId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Left family group",
        description: "You have left the family group.",
      });

      fetchFamilyGroups();
      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }
    } catch (error) {
      toast({
        title: "Error leaving group",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading family groups...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Family Medicine Sharing
        </h2>
        <div className="flex gap-2">
          <Dialog open={isJoinDialogOpen} onOpenChange={setIsJoinDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">Join Group</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Family Group</DialogTitle>
              </DialogHeader>
              <form onSubmit={joinFamilyGroup} className="space-y-4">
                <div>
                  <Label htmlFor="invite-code">Invite Code</Label>
                  <Input
                    id="invite-code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Enter invite code"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Join Group</Button>
                  <Button type="button" variant="outline" onClick={() => setIsJoinDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Family Group</DialogTitle>
              </DialogHeader>
              <form onSubmit={createFamilyGroup} className="space-y-4">
                <div>
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="My Family"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="group-description">Description (Optional)</Label>
                  <Textarea
                    id="group-description"
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Share medicines with family members"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Create Group</Button>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {familyGroups.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Family Groups</h3>
            <p className="text-muted-foreground mb-4">
              Create or join a family group to start sharing medicines with your loved ones.
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setIsCreateDialogOpen(true)}>Create Group</Button>
              <Button variant="outline" onClick={() => setIsJoinDialogOpen(true)}>Join Group</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Family Groups List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Family Groups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {familyGroups.map(group => (
                <div
                  key={group.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedGroup?.id === group.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium">{group.name}</h3>
                    {group.owner_id === user?.id && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {group.member_count} members
                  </p>
                  {group.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {group.description}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Group Details */}
          {selectedGroup && (
            <>
              {/* Members */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Group Members</CardTitle>
                    {selectedGroup.owner_id === user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyInviteCode(selectedGroup.invite_code)}
                        className="flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Invite
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedGroup.owner_id === user?.id && (
                    <Alert>
                      <AlertDescription>
                        <strong>Invite Code:</strong> {selectedGroup.invite_code}
                        <br />
                        <span className="text-xs">Share this code with family members to invite them.</span>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(member.role)}
                        <div>
                          <p className="font-medium">{member.profile?.name || 'Unknown User'}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                      </div>
                      {member.user_id === user?.id && member.role !== 'owner' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => leaveGroup(selectedGroup.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Shared Medicines */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Shared Medicines</CardTitle>
                    <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="flex items-center gap-1">
                          <Share className="w-3 h-3" />
                          Share
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Share Medicines</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Select medicines to share with {selectedGroup.name}:
                          </p>
                          <div className="max-h-60 overflow-y-auto space-y-2">
                            {userMedicines.map(medicine => (
                              <label key={medicine.id} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={selectedMedicineIds.includes(medicine.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedMedicineIds(prev => [...prev, medicine.id]);
                                    } else {
                                      setSelectedMedicineIds(prev => prev.filter(id => id !== medicine.id));
                                    }
                                  }}
                                />
                                <span className="text-sm">{medicine.medicine_name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {medicine.category}
                                </Badge>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={shareMedicines}
                              disabled={selectedMedicineIds.length === 0}
                              className="flex-1"
                            >
                              Share {selectedMedicineIds.length} Medicine{selectedMedicineIds.length !== 1 ? 's' : ''}
                            </Button>
                            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sharedMedicines.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <Share className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No medicines shared yet</p>
                    </div>
                  ) : (
                    sharedMedicines.map(medicine => (
                      <div key={medicine.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{medicine.medicine_name}</h4>
                          <Badge variant="secondary">{medicine.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Shared by {medicine.sharer_name} • {new Date(medicine.shared_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FamilySharing;