'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { usersApi, filesApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Upload, Plus, X, FileText, CheckCircle } from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
});

type ProfileData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { toast } = useToast();
  const [skills, setSkills] = useState<string[]>(['JavaScript', 'Python', 'Data Analysis']);
  const [newSkill, setNewSkill] = useState('');
  const [achievements, setAchievements] = useState<string[]>(['Dean\'s List 2023', 'Hackathon Winner']);
  const [newAchievement, setNewAchievement] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: user?.full_name ?? '', email: user?.email ?? '' },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileData) => usersApi.update(user!.id, data),
    onSuccess: (updated) => {
      updateUser(updated);
      toast({ title: 'Profile updated successfully' });
    },
    onError: () => toast({ title: 'Failed to update profile', variant: 'destructive' }),
  });

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await filesApi.upload(file, 'resumes');
      setResumeUrl(result.url);
      toast({ title: 'Resume uploaded successfully' });
    } catch {
      toast({ title: 'Failed to upload resume', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  if (!user) return <LoadingSpinner />;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold">My Profile</h2>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Personal Information</h3>
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={user.role} disabled className="capitalize" />
          </div>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Resume</h3>
        {resumeUrl ? (
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-md">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-700">Resume uploaded</p>
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">
                View resume
              </a>
            </div>
            <Button variant="outline" size="sm" onClick={() => setResumeUrl('')}>Replace</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Upload your resume (PDF, DOC, DOCX)</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <Button variant="outline" size="sm" asChild>
                <span>
                  {uploading ? (
                    <><div className="h-4 w-4 animate-spin rounded-full border-2 border-muted border-t-primary mr-2" /> Uploading...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> Upload Resume</>
                  )}
                </span>
              </Button>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} disabled={uploading} />
            </label>
          </div>
        )}
      </div>

      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Skills</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary" className="flex items-center gap-1">
              {skill}
              <button onClick={() => setSkills(skills.filter((s) => s !== skill))} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add a skill..."
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (newSkill.trim() && !skills.includes(newSkill.trim())) {
                  setSkills([...skills, newSkill.trim()]);
                  setNewSkill('');
                }
              }
            }}
            className="max-w-xs"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (newSkill.trim() && !skills.includes(newSkill.trim())) {
                setSkills([...skills, newSkill.trim()]);
                setNewSkill('');
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <h3 className="font-semibold mb-4">Achievements</h3>
        <ul className="space-y-2 mb-3">
          {achievements.map((a) => (
            <li key={a} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
              <span>{a}</span>
              <button onClick={() => setAchievements(achievements.filter((x) => x !== a))} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            placeholder="Add an achievement..."
            value={newAchievement}
            onChange={(e) => setNewAchievement(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (newAchievement.trim()) {
                  setAchievements([...achievements, newAchievement.trim()]);
                  setNewAchievement('');
                }
              }
            }}
            className="max-w-xs"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (newAchievement.trim()) {
                setAchievements([...achievements, newAchievement.trim()]);
                setNewAchievement('');
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
