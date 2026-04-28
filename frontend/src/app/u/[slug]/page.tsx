'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Github, Linkedin, Globe, FileText } from 'lucide-react';
import { profileApi } from '@/lib/api';
import type { PublicProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function PublicProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<PublicProfile | null>(null);

  useEffect(() => {
    profileApi.getPublicProfile(slug)
      .then((data) => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <LoadingSpinner />;
  if (!profile) return <div className="max-w-3xl mx-auto py-10 text-muted-foreground">Public profile not found or not visible.</div>;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{profile.full_name}</CardTitle>
          {profile.headline && <p className="text-muted-foreground">{profile.headline}</p>}
        </CardHeader>
        <CardContent className="space-y-3">
          {profile.bio && <p className="text-sm">{profile.bio}</p>}
          <div className="flex flex-wrap gap-2">
            {profile.github && <a href={profile.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary"><Github className="h-4 w-4" /> GitHub</a>}
            {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary"><Linkedin className="h-4 w-4" /> LinkedIn</a>}
            {profile.portfolio && <a href={profile.portfolio} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary"><Globe className="h-4 w-4" /> Portfolio</a>}
            {profile.resume_url && <a href={profile.resume_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary"><FileText className="h-4 w-4" /> Resume</a>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Resume Insights</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline">{profile.resume_analysis_status.replace('_', ' ')}</Badge>
            {profile.resume_score !== null && <Badge>{profile.resume_score.toFixed(0)}/100</Badge>}
          </div>
          {profile.resume_analysis_summary && <p className="text-sm text-muted-foreground">{profile.resume_analysis_summary}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
