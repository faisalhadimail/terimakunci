'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/hooks/use-router';
import type { AgentProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

const agentSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  title: z.string().optional(),
  whatsapp: z.string().min(8, 'Nomor WhatsApp minimal 8 digit'),
  email: z.string().email('Email tidak valid').optional().or(z.literal('')),
  bio: z.string().optional(),
  areaSpec: z.string().optional(),
  photo: z.string().optional(),
  isActive: z.boolean(),
});

type AgentFormData = z.infer<typeof agentSchema>;

export default function AdminAgentForm() {
  const { route, navigate, goBack } = useRouter();
  const agentId = route.page === 'admin-agent-edit' ? route.id : undefined;
  const isEdit = !!agentId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: '', whatsapp: '', isActive: true,
    },
  });

  useEffect(() => {
    if (!isEdit || !agentId) return;
    setLoading(true);
    fetchWithAuth(`/api/agents/${agentId}`)
      .then((r) => r.json())
      .then((agent: AgentProfile) => {
        form.reset({
          name: agent.name || '',
          title: agent.title || '',
          whatsapp: agent.whatsapp || '',
          email: agent.email || '',
          bio: agent.bio || '',
          areaSpec: agent.areaSpec || '',
          photo: agent.photo || '',
          isActive: agent.isActive,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isEdit, agentId, form]);

  const onSubmit = async (data: AgentFormData) => {
    setSaving(true);
    try {
      const url = isEdit ? `/api/agents/${agentId}` : '/api/agents';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetchWithAuth(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        navigate({ page: 'admin-agents' });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Agen' : 'Tambah Agen Baru'}</h2>
        </div>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          {saving ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>

      <Form {...form}>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {/* Profile Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Profil Agen</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl><Input {...field} placeholder="Nama lengkap agen" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Jabatan / Title</FormLabel>
                  <FormControl><Input {...field} placeholder="Senior Property Consultant" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="whatsapp" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor WhatsApp</FormLabel>
                  <FormControl><Input {...field} placeholder="08xxxxxxxxxx" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" {...field} placeholder="agen@propnusa.com" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="photo" render={({ field }) => (
                <FormItem>
                  <FormLabel>URL Foto</FormLabel>
                  <FormControl><Input {...field} placeholder="https://example.com/photo.jpg" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="areaSpec" render={({ field }) => (
                <FormItem>
                  <FormLabel>Spesialisasi Area</FormLabel>
                  <FormControl><Input {...field} placeholder="Jakarta Selatan, Tangerang, dll" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="bio" render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Bio</FormLabel>
                  <FormControl><Textarea {...field} placeholder="Bio singkat agen..." rows={4} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField name="isActive" render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Status Aktif</FormLabel>
                    <p className="text-sm text-muted-foreground">Agen akan ditampilkan di website</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 justify-end pb-6">
            <Button type="button" variant="outline" onClick={() => navigate({ page: 'admin-agents' })}>Batal</Button>
            <Button type="button" onClick={form.handleSubmit(onSubmit)} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Menyimpan...' : 'Simpan Agen'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
