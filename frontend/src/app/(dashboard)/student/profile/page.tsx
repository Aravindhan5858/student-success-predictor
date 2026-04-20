'use client';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Github, Linkedin, Globe, Upload, Plus, X, FileText, ChevronDown, ChevronUp, Pencil, Trash2 } from 'lucide-react';
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
interface Education { institution: string; degree: string; field: string; start_year: string; end_year: string; gpa: string }
interface Experience { company: string; role: string; start_date: string; end_date: string; description: string; is_current: boolean }
interface Project { name: string; description: string; tech_stack: string; url: string }
interface Certification { name: string; issuer: string; date: string; url: string }

interface ProfileForm {
  full_name: string;
  headline: string;
  bio: string;
  github: string;
  linkedin: string;
  portfolio: string;
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const EMPTY_EDU: Education = { institution: '', degree: '', field: '', start_year: '', end_year: '', gpa: '' };
const EMPTY_EXP: Experience = { company: '', role: '', start_date: '', end_date: '', description: '', is_current: false };
const EMPTY_PROJ: Project = { name: '', description: '', tech_stack: '', url: '' };
const EMPTY_CERT: Certification = { name: '', issuer: '', date: '', url: '' };

function SectionCard({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/30 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold">{title} <span className="text-muted-foreground font-normal text-sm">({count})</span></span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="px-6 pb-6 space-y-3">{children}</div>}
    </div>
  );
}

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

  const [education, setEducation] = useState<Education[]>([]);
  const [experience, setExperience] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);

  const [eduForm, setEduForm] = useState<Education | null>(null);
  const [eduEditIdx, setEduEditIdx] = useState<number | null>(null);
  const [expForm, setExpForm] = useState<Experience | null>(null);
  const [expEditIdx, setExpEditIdx] = useState<number | null>(null);
  const [projForm, setProjForm] = useState<Project | null>(null);
  const [projEditIdx, setProjEditIdx] = useState<number | null>(null);
  const [certForm, setCertForm] = useState<Certification | null>(null);
  const [certEditIdx, setCertEditIdx] = useState<number | null>(null);

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
        github: profile.github ?? '',
        linkedin: profile.linkedin ?? '',
        portfolio: profile.portfolio ?? '',
      });
      setResumeUrl(profile.resume_url ?? '');
      setSkills(profile.skills ?? []);
      setAllSkills(skillsData);
      setEducation(profile.education ?? []);
      setExperience(profile.experience ?? []);
      setProjects(profile.projects ?? []);
      setCertifications(profile.certifications ?? []);
    }).catch(() => toast({ title: 'Failed to load profile', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [reset, toast]);

  const onSave = handleSubmit(async (data) => {
    setSaving(true);
    try {
      await api.put('/profile', { ...data, skills, education, experience, projects, certifications });
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
      const { data } = await api.post('/profile/resume', form, { headers: { 'Content-Type': 'multipart/form-data' } });
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

  // Generic list helpers
  function saveItem<T>(list: T[], setList: (v: T[]) => void, item: T, editIdx: number | null, setForm: (v: T | null) => void, setIdx: (v: number | null) => void) {
    if (editIdx !== null) {
      const next = [...list];
      next[editIdx] = item;
      setList(next);
    } else {
      setList([...list, item]);
    }
    setForm(null);
    setIdx(null);
  }

  function removeItem<T>(list: T[], setList: (v: T[]) => void, idx: number) {
    setList(list.filter((_, i) => i !== idx));
  }

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
            <Input {...register('github')} placeholder="https://github.com/username" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</Label>
            <Input {...register('linkedin')} placeholder="https://linkedin.com/in/username" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Portfolio</Label>
            <Input {...register('portfolio')} placeholder="https://yourportfolio.com" />
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
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Replace</Button>
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

        {/* Education */}
        <SectionCard title="Education" count={education.length}>
          {education.map((edu, i) => (
            <div key={i} className="border rounded-md p-3 text-sm space-y-0.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{edu.degree} in {edu.field}</p>
                  <p className="text-muted-foreground">{edu.institution} · {edu.start_year}–{edu.end_year || 'Present'}{edu.gpa ? ` · GPA: ${edu.gpa}` : ''}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => { setEduForm(edu); setEduEditIdx(i); }} className="hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => removeItem(education, setEducation, i)} className="hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {eduForm ? (
            <div className="border rounded-md p-4 space-y-3 bg-muted/20">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Institution</Label><Input value={eduForm.institution} onChange={(e) => setEduForm({ ...eduForm, institution: e.target.value })} /></div>
                <div className="space-y-1"><Label>Degree</Label><Input value={eduForm.degree} onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })} placeholder="B.Tech" /></div>
                <div className="space-y-1"><Label>Field</Label><Input value={eduForm.field} onChange={(e) => setEduForm({ ...eduForm, field: e.target.value })} placeholder="Computer Science" /></div>
                <div className="space-y-1"><Label>Start Year</Label><Input value={eduForm.start_year} onChange={(e) => setEduForm({ ...eduForm, start_year: e.target.value })} placeholder="2020" /></div>
                <div className="space-y-1"><Label>End Year</Label><Input value={eduForm.end_year} onChange={(e) => setEduForm({ ...eduForm, end_year: e.target.value })} placeholder="2024 or leave blank" /></div>
                <div className="space-y-1"><Label>GPA</Label><Input value={eduForm.gpa} onChange={(e) => setEduForm({ ...eduForm, gpa: e.target.value })} placeholder="8.5" /></div>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => saveItem(education, setEducation, eduForm, eduEditIdx, setEduForm, setEduEditIdx)}>Save</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setEduForm(null); setEduEditIdx(null); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setEduForm({ ...EMPTY_EDU })}>
              <Plus className="h-4 w-4 mr-1" /> Add Education
            </Button>
          )}
        </SectionCard>

        {/* Experience */}
        <SectionCard title="Experience" count={experience.length}>
          {experience.map((exp, i) => (
            <div key={i} className="border rounded-md p-3 text-sm space-y-0.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{exp.role} at {exp.company}</p>
                  <p className="text-muted-foreground">{exp.start_date} – {exp.is_current ? 'Present' : exp.end_date}</p>
                  {exp.description && <p className="text-muted-foreground mt-1">{exp.description}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => { setExpForm(exp); setExpEditIdx(i); }} className="hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => removeItem(experience, setExperience, i)} className="hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {expForm ? (
            <div className="border rounded-md p-4 space-y-3 bg-muted/20">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Company</Label><Input value={expForm.company} onChange={(e) => setExpForm({ ...expForm, company: e.target.value })} /></div>
                <div className="space-y-1"><Label>Role</Label><Input value={expForm.role} onChange={(e) => setExpForm({ ...expForm, role: e.target.value })} /></div>
                <div className="space-y-1"><Label>Start Date</Label><Input value={expForm.start_date} onChange={(e) => setExpForm({ ...expForm, start_date: e.target.value })} placeholder="Jan 2023" /></div>
                <div className="space-y-1">
                  <Label>End Date</Label>
                  <Input value={expForm.end_date} onChange={(e) => setExpForm({ ...expForm, end_date: e.target.value })} placeholder="Dec 2023" disabled={expForm.is_current} />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" id="is_current" checked={expForm.is_current} onChange={(e) => setExpForm({ ...expForm, is_current: e.target.checked, end_date: '' })} className="h-4 w-4" />
                  <Label htmlFor="is_current">Currently working here</Label>
                </div>
                <div className="col-span-2 space-y-1"><Label>Description</Label><textarea value={expForm.description} onChange={(e) => setExpForm({ ...expForm, description: e.target.value })} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => saveItem(experience, setExperience, expForm, expEditIdx, setExpForm, setExpEditIdx)}>Save</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setExpForm(null); setExpEditIdx(null); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setExpForm({ ...EMPTY_EXP })}>
              <Plus className="h-4 w-4 mr-1" /> Add Experience
            </Button>
          )}
        </SectionCard>

        {/* Projects */}
        <SectionCard title="Projects" count={projects.length}>
          {projects.map((proj, i) => (
            <div key={i} className="border rounded-md p-3 text-sm space-y-0.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{proj.name}</p>
                  {proj.description && <p className="text-muted-foreground">{proj.description}</p>}
                  {proj.tech_stack && <p className="text-muted-foreground text-xs mt-1">{proj.tech_stack}</p>}
                  {proj.url && <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{proj.url}</a>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => { setProjForm(proj); setProjEditIdx(i); }} className="hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => removeItem(projects, setProjects, i)} className="hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {projForm ? (
            <div className="border rounded-md p-4 space-y-3 bg-muted/20">
              <div className="space-y-3">
                <div className="space-y-1"><Label>Project Name</Label><Input value={projForm.name} onChange={(e) => setProjForm({ ...projForm, name: e.target.value })} /></div>
                <div className="space-y-1"><Label>Description</Label><textarea value={projForm.description} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                <div className="space-y-1"><Label>Tech Stack</Label><Input value={projForm.tech_stack} onChange={(e) => setProjForm({ ...projForm, tech_stack: e.target.value })} placeholder="React, Node.js, PostgreSQL" /></div>
                <div className="space-y-1"><Label>URL</Label><Input value={projForm.url} onChange={(e) => setProjForm({ ...projForm, url: e.target.value })} placeholder="https://github.com/..." /></div>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => saveItem(projects, setProjects, projForm, projEditIdx, setProjForm, setProjEditIdx)}>Save</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setProjForm(null); setProjEditIdx(null); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setProjForm({ ...EMPTY_PROJ })}>
              <Plus className="h-4 w-4 mr-1" /> Add Project
            </Button>
          )}
        </SectionCard>

        {/* Certifications */}
        <SectionCard title="Certifications" count={certifications.length}>
          {certifications.map((cert, i) => (
            <div key={i} className="border rounded-md p-3 text-sm space-y-0.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{cert.name}</p>
                  <p className="text-muted-foreground">{cert.issuer}{cert.date ? ` · ${cert.date}` : ''}</p>
                  {cert.url && <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">View certificate</a>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => { setCertForm(cert); setCertEditIdx(i); }} className="hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={() => removeItem(certifications, setCertifications, i)} className="hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
          {certForm ? (
            <div className="border rounded-md p-4 space-y-3 bg-muted/20">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1"><Label>Certificate Name</Label><Input value={certForm.name} onChange={(e) => setCertForm({ ...certForm, name: e.target.value })} /></div>
                <div className="space-y-1"><Label>Issuer</Label><Input value={certForm.issuer} onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })} placeholder="Coursera, AWS..." /></div>
                <div className="space-y-1"><Label>Date</Label><Input value={certForm.date} onChange={(e) => setCertForm({ ...certForm, date: e.target.value })} placeholder="Mar 2024" /></div>
                <div className="col-span-2 space-y-1"><Label>URL</Label><Input value={certForm.url} onChange={(e) => setCertForm({ ...certForm, url: e.target.value })} placeholder="https://..." /></div>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => saveItem(certifications, setCertifications, certForm, certEditIdx, setCertForm, setCertEditIdx)}>Save</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => { setCertForm(null); setCertEditIdx(null); }}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setCertForm({ ...EMPTY_CERT })}>
              <Plus className="h-4 w-4 mr-1" /> Add Certification
            </Button>
          )}
        </SectionCard>

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
                    <button key={s.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted" onClick={() => { setSelectedSkill(s.name); setSkillSearch(s.name); }}>
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
