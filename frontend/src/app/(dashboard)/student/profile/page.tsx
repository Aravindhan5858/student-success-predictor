'use client';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Github, Linkedin, Globe, Upload, Plus, X, FileText } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface Skill { id?: number; name: string; level: string }
interface ProfileForm {
  full_name: string;
  headline: string;
  bio: string;
  github_url: string;
  linkedin_url: string;
  portfolio_url: string;
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resumeUrl, setResumeUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [allSkills, setAllSkills] = useState<{ id: number; name: string }[]>([]);
  const [skillDialog, setSkillDialog] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillLevel, setSkillLevel] = useState('Beginner');
  const [selectedSkill, setSelectedSkill] = useState('');

  const { register, handleSubmit, reset } = useForm<ProfileForm>();

  useEffect(() => {
    Promise.all([
      api.get('/profile').then((r) => r.data),
      api.get('/skills').then((r) => r.data),
    ]).then(([profile, skillsData]) => {
      reset({
        full_name: profile.full_name ?? '',
        headline: profile.headline ?? '',
        bio: profile.bio ?? '',
        github_url: profile.github_url ?? '',
        linkedin_url: profile.linkedin_url ?? '',
        portfolio_url: profile.portfolio_url ?? '',
      });
      setResumeUrl(profile.resume_url ?? '');
      setSkills(profile.skills ?? []);
      setAllSkills(skillsData);
    }).catch(() => toast({ title: 'Failed to load profile', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [reset, toast]);

  const onSave = handleSubmit(async (data) => {
    setSaving(true);
    try {
      await api.put('/profile', { ...data, skills });
      toast({ title: 'Profile saved' });
    } catch {
      toast({ title: 'Failed to save profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  });

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/profile/resume', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResumeUrl(data.resume_url);
      toast({ title: 'Resume uploaded' });
    } catch {
      toast({ title: 'Failed to upload resume', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const addSkill = () => {
    const name = selectedSkill || skillSearch.trim();
    if (!name || skills.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    setSkills([...skills, { name, level: skillLevel }]);
    setSkillDialog(false);
    setSkillSearch('');
    setSelectedSkill('');
    setSkillLevel('Beginner');
  };

  const filtered = allSkills.filter((s) =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
    !skills.some((sk) => sk.name.toLowerCase() === s.name.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">My Profile</h2>
        <p className="text-muted-foreground">Manage your profile information</p>
      </div>

      <form onSubmit={onSave} className="space-y-6">
        {/* Header */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{user?.full_name?.[0] ?? 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <div className="space-y-1">
                <Label>Full Name</Label>
                <Input {...register('full_name')} placeholder="Your name" />
              </div>
              <div className="space-y-1">
                <Label>Headline</Label>
                <Input {...register('headline')} placeholder="e.g. Computer Science Student" />
              </div>
              <div className="space-y-1">
                <Label>Bio</Label>
                <textarea
                  {...register('bio')}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="bg-card border rounded-lg p-6 space-y-3">
          <h3 className="font-semibold">Links</h3>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Github className="h-4 w-4" /> GitHub</Label>
            <Input {...register('github_url')} placeholder="https://github.com/username" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</Label>
            <Input {...register('linkedin_url')} placeholder="https://linkedin.com/in/username" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Portfolio</Label>
            <Input {...register('portfolio_url')} placeholder="https://yourportfolio.com" />
          </div>
        </div>

        {/* Resume */}
        <div className="bg-card border rounded-lg p-6 space-y-3">
          <h3 className="font-semibold">Resume</h3>
          {resumeUrl ? (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-md">
              <FileText className="h-5 w-5 text-primary" />
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex-1">
                View current resume
              </a>
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                Replace
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </Button>
          )}
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
        </div>

        {/* Skills */}
        <div className="bg-card border rounded-lg p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Skills</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => setSkillDialog(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Skill
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.length === 0 && <p className="text-sm text-muted-foreground">No skills added yet</p>}
            {skills.map((skill) => (
              <div key={skill.name} className="flex items-center gap-1 rounded-full border bg-muted/50 px-3 py-1 text-sm">
                <span>{skill.name}</span>
                <Badge variant="secondary" className="text-xs px-1.5 py-0">{skill.level}</Badge>
                <button type="button" onClick={() => setSkills(skills.filter((s) => s.name !== skill.name))} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </Button>
      </form>

      {/* Add Skill Dialog */}
      <Dialog open={skillDialog} onOpenChange={setSkillDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Skill</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Search or enter skill</Label>
              <Input
                placeholder="e.g. React, Python..."
                value={skillSearch}
                onChange={(e) => { setSkillSearch(e.target.value); setSelectedSkill(''); }}
              />
              {skillSearch && filtered.length > 0 && (
                <div className="border rounded-md max-h-36 overflow-y-auto">
                  {filtered.slice(0, 8).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                      onClick={() => { setSelectedSkill(s.name); setSkillSearch(s.name); }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={skillLevel} onValueChange={setSkillLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSkillDialog(false)}>Cancel</Button>
            <Button onClick={addSkill} disabled={!skillSearch.trim() && !selectedSkill}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
