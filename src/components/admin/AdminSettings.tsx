'use client';

import { useEffect, useState, useCallback } from 'react';
import type { WebsiteSetting } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Save, Settings, Phone, Share2, Search, BarChart3, CheckCircle2,
  Globe, FileText, Download, Eye, Copy, RefreshCw, MapPin, FileArchive, Bot,
  Database, Code2, Terminal, Key, Shield, HardDrive, Zap, AlertTriangle, ChevronDown,
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';
import { toast } from 'sonner';

interface SitemapStats {
  totalUrls: number;
  staticPages: number;
  publishedProperties: number;
  featuredProperties: number;
  publishedArticles: number;
  activeAgents: number;
}

type SqlTab = 'ddl' | 'seed' | 'schema' | 'env';

export default function AdminSettings() {
  const [settings, setSettings] = useState<WebsiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedSettings, setEditedSettings] = useState<Record<string, string>>({});
  const [lastSavedGroup, setLastSavedGroup] = useState<string | null>(null);

  // Sitemap states
  const [sitemapStats, setSitemapStats] = useState<SitemapStats | null>(null);
  const [sitemapLoading, setSitemapLoading] = useState(false);
  const [sitemapPreview, setSitemapPreview] = useState<string | null>(null);
  const [robotsPreview, setRobotsPreview] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Database SQL states
  const [sqlTab, setSqlTab] = useState<SqlTab>('ddl');
  const [sqlContent, setSqlContent] = useState<Record<SqlTab, string>>({ ddl: '', seed: '', schema: '', env: '' });
  const [sqlLoading, setSqlLoading] = useState(false);
  const [sqlLoaded, setSqlLoaded] = useState(false);

  // Supabase config local state (not saved to DB for security)
  const [dbHost, setDbHost] = useState('');
  const [dbPort, setDbPort] = useState('5432');
  const [dbName, setDbName] = useState('postgres');
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [dbPoolSize, setDbPoolSize] = useState('10');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchWithAuth('/api/settings')
      .then((r) => r.json())
      .then((data: { data?: WebsiteSetting[] } | WebsiteSetting[]) => {
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setSettings(list);
        const initial: Record<string, string> = {};
        list.forEach((s: WebsiteSetting) => { initial[s.key] = s.value; });
        setEditedSettings(initial);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadSitemapStats = useCallback(async () => {
    setSitemapLoading(true);
    try {
      const res = await fetchWithAuth('/api/sitemap/stats');
      const json = await res.json();
      if (json.data) {
        setSitemapStats(json.data);
      }
    } catch {
      // ignore
    } finally {
      setSitemapLoading(false);
    }
  }, []);

  const loadSql = useCallback(async (tab?: SqlTab) => {
    setSqlLoading(true);
    try {
      if (tab && tab === 'env') {
        // Generate env from local state
        const connStr = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?pgbouncer=true&connect_timeout=15`;
        const directUrl = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?connect_timeout=15`;
        const envStr = [
          `# PropNusa - Supabase Environment Variables`,
          `# ============================================`,
          ``,
          `# Database Connection (via Supabase Pooler)`,
          `DATABASE_URL="${connStr}"`,
          ``,
          `# Direct Connection (untuk migration/DDL)`,
          `DIRECT_URL="${directUrl}"`,
          ``,
          `# App Config`,
          `NEXT_PUBLIC_APP_URL="https://www.propnusa.com"`,
          `NEXTAUTH_SECRET="generate-a-secure-random-string-32chars"`,
          `NEXTAUTH_URL="https://www.propnusa.com"`,
          ``,
          `# Connection Pool Size`,
          `DATABASE_POOL_SIZE=${dbPoolSize}`,
        ].join('\n');
        setSqlContent((prev) => ({ ...prev, env: envStr }));
      } else {
        const format = tab || 'all';
        const res = await fetchWithAuth('/api/database/sql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format }),
        });
        const json = await res.json();
        if (json.data) {
          if (format === 'all') {
            setSqlContent({
              ddl: json.data.ddl || '',
              seed: json.data.seed || '',
              schema: json.data.schema || '',
              env: json.data.env || '',
            });
          } else if (json.data.sql) {
            setSqlContent((prev) => ({ ...prev, [format]: json.data.sql }));
          }
        }
      }
      setSqlLoaded(true);
    } catch {
      toast.error('Gagal generate SQL');
    } finally {
      setSqlLoading(false);
    }
  }, [dbHost, dbPort, dbName, dbUser, dbPassword, dbPoolSize]);

  const updateValue = (key: string, value: string) => {
    setEditedSettings((prev) => ({ ...prev, [key]: value }));
  };

  const getValue = (key: string) => editedSettings[key] || '';

  const getGroupSettings = (group: string) => settings.filter((s) => s.group === group);

  const groupKeyMap: Record<string, { key: string; defaultGroup: string }[]> = {
    general: [
      { key: 'site_name', defaultGroup: 'general' },
      { key: 'site_tagline', defaultGroup: 'general' },
      { key: 'site_logo', defaultGroup: 'general' },
      { key: 'site_favicon', defaultGroup: 'general' },
      { key: 'site_description', defaultGroup: 'general' },
    ],
    contact: [
      { key: 'contact_phone', defaultGroup: 'contact' },
      { key: 'contact_whatsapp', defaultGroup: 'contact' },
      { key: 'contact_email', defaultGroup: 'contact' },
      { key: 'contact_address', defaultGroup: 'contact' },
      { key: 'contact_map_embed', defaultGroup: 'contact' },
      { key: 'contact_working_hours', defaultGroup: 'contact' },
    ],
    social: [
      { key: 'social_facebook', defaultGroup: 'social' },
      { key: 'social_instagram', defaultGroup: 'social' },
      { key: 'social_youtube', defaultGroup: 'social' },
      { key: 'social_tiktok', defaultGroup: 'social' },
      { key: 'social_linkedin', defaultGroup: 'social' },
    ],
    seo: [
      { key: 'seo_meta_title', defaultGroup: 'seo' },
      { key: 'seo_canonical_url', defaultGroup: 'seo' },
      { key: 'seo_meta_description', defaultGroup: 'seo' },
      { key: 'seo_meta_keywords', defaultGroup: 'seo' },
      { key: 'seo_robots', defaultGroup: 'seo' },
      { key: 'seo_og_image', defaultGroup: 'seo' },
      { key: 'seo_sitemap_changefreq', defaultGroup: 'seo' },
      { key: 'seo_sitemap_priority', defaultGroup: 'seo' },
    ],
    analytics: [
      { key: 'analytics_ga_id', defaultGroup: 'analytics' },
      { key: 'analytics_gtm_id', defaultGroup: 'analytics' },
      { key: 'analytics_fb_pixel', defaultGroup: 'analytics' },
      { key: 'analytics_head_scripts', defaultGroup: 'analytics' },
      { key: 'analytics_body_scripts', defaultGroup: 'analytics' },
    ],
  };

  const handleSave = async (group: string) => {
    setSaving(true);
    try {
      const knownKeys = groupKeyMap[group] || [];
      const existingKeys = new Set(getGroupSettings(group).map((s) => s.key));
      const bulkPayload: { key: string; value: string; group: string }[] = [];

      for (const entry of knownKeys) {
        const val = editedSettings[entry.key] ?? '';
        if (existingKeys.has(entry.key)) {
          const setting = settings.find((s) => s.key === entry.key);
          if (setting) {
            const res = await fetchWithAuth(`/api/settings/${setting.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ value: val }),
            });
            if (!res.ok) { toast.error(`Gagal menyimpan ${entry.key}`); return; }
          }
        } else {
          bulkPayload.push({ key: entry.key, value: val, group: entry.defaultGroup });
        }
      }

      if (bulkPayload.length > 0) {
        const res = await fetchWithAuth('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ settings: bulkPayload }),
        });
        if (!res.ok) { toast.error('Gagal menyimpan beberapa pengaturan baru'); return; }
        const reloadRes = await fetchWithAuth('/api/settings');
        const reloadData = await reloadRes.json();
        const list = Array.isArray(reloadData?.data) ? reloadData.data : [];
        setSettings(list);
      }

      toast.success(`Pengaturan ${group} berhasil disimpan`);
      setLastSavedGroup(group);
      setTimeout(() => setLastSavedGroup(null), 2000);
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const allPayload: { key: string; value: string; group: string }[] = [];
      for (const [, entries] of Object.entries(groupKeyMap)) {
        for (const entry of entries) {
          allPayload.push({ key: entry.key, value: editedSettings[entry.key] || '', group: entry.defaultGroup });
        }
      }
      const res = await fetchWithAuth('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: allPayload }),
      });
      if (res.ok) {
        const reloadRes = await fetchWithAuth('/api/settings');
        const reloadData = await reloadRes.json();
        setSettings(Array.isArray(reloadData?.data) ? reloadData.data : []);
        toast.success('Semua pengaturan berhasil disimpan');
      } else { toast.error('Gagal menyimpan beberapa pengaturan'); }
    } catch { toast.error('Terjadi kesalahan saat menyimpan'); }
    finally { setSaving(false); }
  };

  // Sitemap actions
  const handlePreviewSitemap = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/sitemap');
      if (res.ok) { setSitemapPreview(await res.text()); } else { toast.error('Gagal memuat sitemap'); }
    } catch { toast.error('Gagal memuat sitemap'); }
    finally { setPreviewLoading(false); }
  };
  const handlePreviewRobots = async () => {
    setPreviewLoading(true);
    try {
      const res = await fetch('/api/robots');
      if (res.ok) { setRobotsPreview(await res.text()); } else { toast.error('Gagal memuat robots.txt'); }
    } catch { toast.error('Gagal memuat robots.txt'); }
    finally { setPreviewLoading(false); }
  };
  const handleDownloadFile = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        toast.success(`${filename} berhasil didownload`);
      }
    } catch { toast.error('Gagal download'); }
  };
  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} berhasil disalin`));
  };
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => toast.success('URL berhasil disalin'));
  };

  const SettingField = ({ settingKey, label, type = 'text', placeholder = '' }: { settingKey: string; label: string; type?: string; placeholder?: string }) => (
    <div className="space-y-2">
      <Label htmlFor={settingKey} className="text-sm font-medium">{label}</Label>
      {type === 'textarea' ? (
        <Textarea id={settingKey} value={getValue(settingKey)} onChange={(e) => updateValue(settingKey, e.target.value)} placeholder={placeholder} rows={3} className="min-h-[80px]" />
      ) : (
        <Input id={settingKey} type={type} value={getValue(settingKey)} onChange={(e) => updateValue(settingKey, e.target.value)} placeholder={placeholder} className="h-10" />
      )}
    </div>
  );

  const SaveGroupButton = ({ group }: { group: string }) => (
    <Button onClick={() => handleSave(group)} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
      {saving && lastSavedGroup === group ? <Loader2 className="h-3 w-3 animate-spin" /> : lastSavedGroup === group ? <CheckCircle2 className="h-3 w-3" /> : <Save className="h-3 w-3" />}
      {lastSavedGroup === group ? 'Tersimpan' : 'Simpan'}
    </Button>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const canonicalUrl = getValue('seo_canonical_url') || 'https://www.propnusa.com';

  const sqlTabMeta: Record<SqlTab, { label: string; icon: typeof Code2; desc: string; filename: string }> = {
    ddl: { label: 'DDL (Create Table)', icon: Database, desc: 'SQL untuk membuat tabel', filename: 'propnusa-schema.sql' },
    seed: { label: 'Seed Data', icon: HardDrive, desc: 'Data awal untuk database', filename: 'propnusa-seed.sql' },
    schema: { label: 'Prisma Schema', icon: Code2, desc: 'schema.prisma untuk PostgreSQL', filename: 'schema.prisma' },
    env: { label: 'Environment (.env)', icon: Terminal, desc: 'Konfigurasi environment', filename: '.env' },
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Pengaturan Website</h2>
          <p className="text-sm text-muted-foreground">Kelola pengaturan website PropNusa</p>
        </div>
        <Button onClick={handleSaveAll} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 self-start">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Simpan Semua
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="general" className="text-sm">Umum</TabsTrigger>
          <TabsTrigger value="contact" className="text-sm">Kontak</TabsTrigger>
          <TabsTrigger value="social" className="text-sm">Sosial Media</TabsTrigger>
          <TabsTrigger value="seo" className="text-sm">SEO</TabsTrigger>
          <TabsTrigger value="analytics" className="text-sm">Analytics</TabsTrigger>
          <TabsTrigger value="database" className="text-sm gap-1">
            <Database className="h-3.5 w-3.5" />
            Database
          </TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><Settings className="h-4 w-4 text-emerald-600" /> Pengaturan Umum</CardTitle>
                  <CardDescription>Nama, logo, dan informasi dasar website</CardDescription>
                </div>
                <SaveGroupButton group="general" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <SettingField settingKey="site_name" label="Nama Website" placeholder="PropNusa" />
              <SettingField settingKey="site_tagline" label="Tagline" placeholder="Jual Beli Properti Terpercaya" />
              <SettingField settingKey="site_logo" label="Logo URL" placeholder="https://example.com/logo.png" />
              <SettingField settingKey="site_favicon" label="Favicon URL" placeholder="https://example.com/favicon.ico" />
              <SettingField settingKey="site_description" label="Deskripsi Website" type="textarea" placeholder="Deskripsi singkat website" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact */}
        <TabsContent value="contact">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-600" /> Kontak</CardTitle>
                  <CardDescription>Informasi kontak yang ditampilkan di website</CardDescription>
                </div>
                <SaveGroupButton group="contact" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <SettingField settingKey="contact_phone" label="Telepon" placeholder="+62 xxx" />
              <SettingField settingKey="contact_whatsapp" label="WhatsApp" placeholder="+62 xxx" />
              <SettingField settingKey="contact_email" label="Email" placeholder="info@propnusa.com" type="email" />
              <SettingField settingKey="contact_address" label="Alamat" placeholder="Alamat kantor" />
              <SettingField settingKey="contact_map_embed" label="Google Maps Embed URL" placeholder="https://maps.google.com/..." />
              <SettingField settingKey="contact_working_hours" label="Jam Operasional" placeholder="Sen-Sab 09:00-17:00" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><Share2 className="h-4 w-4 text-emerald-600" /> Sosial Media</CardTitle>
                  <CardDescription>Link sosial media website</CardDescription>
                </div>
                <SaveGroupButton group="social" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <SettingField settingKey="social_facebook" label="Facebook URL" placeholder="https://facebook.com/..." />
              <SettingField settingKey="social_instagram" label="Instagram URL" placeholder="https://instagram.com/..." />
              <SettingField settingKey="social_youtube" label="YouTube URL" placeholder="https://youtube.com/..." />
              <SettingField settingKey="social_tiktok" label="TikTok URL" placeholder="https://tiktok.com/..." />
              <SettingField settingKey="social_linkedin" label="LinkedIn URL" placeholder="https://linkedin.com/..." />
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4 text-emerald-600" /> SEO Meta</CardTitle>
                    <CardDescription>Pengaturan SEO global website</CardDescription>
                  </div>
                  <SaveGroupButton group="seo" />
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                <SettingField settingKey="seo_meta_title" label="Default Meta Title" placeholder="PropNusa - Jual Beli Properti" />
                <SettingField settingKey="seo_canonical_url" label="Canonical URL" placeholder="https://www.propnusa.com" />
                <SettingField settingKey="seo_meta_description" label="Default Meta Description" type="textarea" placeholder="Deskripsi default untuk SEO" />
                <SettingField settingKey="seo_meta_keywords" label="Default Meta Keywords" placeholder="properti, jual, beli, rumah" />
                <SettingField settingKey="seo_robots" label="Robots Meta" placeholder="index, follow" />
                <SettingField settingKey="seo_og_image" label="Default OG Image URL" placeholder="https://example.com/og.jpg" />
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              {/* Sitemap Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center"><FileArchive className="h-4 w-4 text-amber-700" /></div>
                    <div>
                      <CardTitle className="text-base">Sitemap</CardTitle>
                      <CardDescription>Generate & kelola XML sitemap</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sitemap URL</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono truncate">{canonicalUrl}/api/sitemap</div>
                      <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={() => handleCopyUrl(`${canonicalUrl}/api/sitemap`)}><Copy className="h-3.5 w-3.5" /></Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Submit URL ini ke Google Search Console</p>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Statistik URL</Label>
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={loadSitemapStats} disabled={sitemapLoading}>
                        <RefreshCw className={`h-3 w-3 ${sitemapLoading ? 'animate-spin' : ''}`} /> Refresh
                      </Button>
                    </div>
                    {sitemapStats ? (
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Total URL', value: sitemapStats.totalUrls, color: 'text-emerald-600' },
                          { label: 'Halaman Statis', value: sitemapStats.staticPages, color: '' },
                          { label: 'Properti Terbit', value: sitemapStats.publishedProperties, color: '' },
                          { label: 'Properti Unggulan', value: sitemapStats.featuredProperties, color: '' },
                          { label: 'Artikel Terbit', value: sitemapStats.publishedArticles, color: '' },
                          { label: 'Agent Aktif', value: sitemapStats.activeAgents, color: '' },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-muted/50 rounded-lg p-3">
                            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                            <div className="text-xs text-muted-foreground">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="w-full" onClick={loadSitemapStats} disabled={sitemapLoading}>
                        {sitemapLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null} Muat Statistik
                      </Button>
                    )}
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Konfigurasi Default</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Frekuensi Update</Label>
                        <Select value={getValue('seo_sitemap_changefreq') || 'weekly'} onValueChange={(v) => updateValue('seo_sitemap_changefreq', v)}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {['always','hourly','daily','weekly','monthly','yearly','never'].map((v) => (
                              <SelectItem key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Priority Default</Label>
                        <Select value={getValue('seo_sitemap_priority') || '0.8'} onValueChange={(v) => updateValue('seo_sitemap_priority', v)}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[1.0,0.9,0.8,0.7,0.6,0.5,0.4,0.3,0.2,0.1].map((v) => (
                              <SelectItem key={v} value={String(v)}>{v.toFixed(1)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePreviewSitemap} disabled={previewLoading}><Eye className="h-3.5 w-3.5" /> Preview XML</Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDownloadFile('/api/sitemap', 'sitemap.xml')}><Download className="h-3.5 w-3.5" /> Download XML</Button>
                  </div>
                </CardContent>
              </Card>

              {/* Robots.txt Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center"><Bot className="h-4 w-4 text-purple-700" /></div>
                    <div>
                      <CardTitle className="text-base">Robots.txt</CardTitle>
                      <CardDescription>Kontrol crawling search engine</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Robots.txt URL</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted px-3 py-2 rounded-md text-sm font-mono truncate">{canonicalUrl}/api/robots</div>
                      <Button variant="outline" size="icon" className="shrink-0 h-9 w-9" onClick={() => handleCopyUrl(`${canonicalUrl}/api/robots`)}><Copy className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Halaman dalam Sitemap</Label>
                    <div className="space-y-1.5">
                      {[{ path: '/', label: 'Beranda', p: '1.0', f: 'daily' },{ path: '/properties', label: 'Properti', p: '0.9', f: 'daily' },{ path: '/articles', label: 'Artikel', p: '0.8', f: 'weekly' },{ path: '/agents', label: 'Agent', p: '0.7', f: 'weekly' },{ path: '/contact', label: 'Kontak', p: '0.5', f: 'monthly' }].map((pg) => (
                        <div key={pg.path} className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{pg.path}</span>
                          <span className="flex-1 truncate">{pg.label}</span>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">P:{pg.p}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePreviewRobots} disabled={previewLoading}><Eye className="h-3.5 w-3.5" /> Preview</Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleDownloadFile('/api/robots', 'robots.txt')}><Download className="h-3.5 w-3.5" /> Download</Button>
                  </div>
                  <Separator />
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1.5 text-xs text-emerald-800">
                    <p className="font-semibold flex items-center gap-1"><Globe className="h-3 w-3" /> Langkah Submit ke Search Engine:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-1">
                      <li>Download sitemap.xml dan robots.txt</li>
                      <li>Upload ke root domain website</li>
                      <li>Submit ke Google Search Console</li>
                      <li>Submit ke Bing Webmaster Tools</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sitemap XML Preview */}
            {sitemapPreview && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-emerald-600" /><CardTitle className="text-base">Preview Sitemap XML</CardTitle></div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{sitemapPreview.split('<url>').length - 1} URLs</Badge>
                      <Button variant="ghost" size="sm" onClick={() => setSitemapPreview(null)}>Tutup</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent><pre className="bg-gray-950 text-green-400 rounded-lg p-4 text-xs font-mono overflow-auto max-h-96 leading-relaxed"><code>{sitemapPreview}</code></pre></CardContent>
              </Card>
            )}
            {robotsPreview && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Bot className="h-4 w-4 text-purple-600" /><CardTitle className="text-base">Preview robots.txt</CardTitle></div>
                    <Button variant="ghost" size="sm" onClick={() => setRobotsPreview(null)}>Tutup</Button>
                  </div>
                </CardHeader>
                <CardContent><pre className="bg-gray-950 text-gray-300 rounded-lg p-4 text-xs font-mono overflow-auto max-h-64 leading-relaxed"><code>{robotsPreview}</code></pre></CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-emerald-600" /> Analytics</CardTitle>
                  <CardDescription>Kode tracking dan analytics</CardDescription>
                </div>
                <SaveGroupButton group="analytics" />
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              <SettingField settingKey="analytics_ga_id" label="Google Analytics ID" placeholder="G-XXXXXXXXXX" />
              <SettingField settingKey="analytics_gtm_id" label="Google Tag Manager ID" placeholder="GTM-XXXXXXX" />
              <SettingField settingKey="analytics_fb_pixel" label="Facebook Pixel ID" placeholder="XXXXXXXXXXXXXXX" />
              <SettingField settingKey="analytics_head_scripts" label="Custom Head Scripts" type="textarea" placeholder="Kode JavaScript yang di-inject di head" />
              <SettingField settingKey="analytics_body_scripts" label="Custom Body Scripts" type="textarea" placeholder="Kode JavaScript yang di-inject di body" />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== DATABASE TAB ======== */}
        <TabsContent value="database">
          <div className="space-y-6">
            {/* Warning */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold">Penting: Kredensial Database</p>
                <p className="mt-1 text-xs opacity-80">
                  Informasi koneksi database bersifat sensitif. Jangan bagikan kredensial ini ke pihak yang tidak berwenang. 
                  Data ini hanya ditampilkan di panel admin dan tidak disimpan ke database lokal.
                </p>
              </div>
            </div>

            {/* Supabase Connection Config */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Zap className="h-4 w-4 text-emerald-700" /></div>
                  <div>
                    <CardTitle className="text-base">Koneksi Supabase</CardTitle>
                    <CardDescription>Konfigurasi koneksi database Supabase (PostgreSQL)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="db-host" className="text-sm font-medium flex items-center gap-1.5"><HardDrive className="h-3.5 w-3.5 text-muted-foreground" /> Host</Label>
                    <Input id="db-host" value={dbHost} onChange={(e) => setDbHost(e.target.value)} placeholder="db.xxxxx.supabase.co" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="db-port" className="text-sm font-medium flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-muted-foreground" /> Port</Label>
                    <Input id="db-port" value={dbPort} onChange={(e) => setDbPort(e.target.value)} placeholder="5432" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="db-name" className="text-sm font-medium flex items-center gap-1.5"><Database className="h-3.5 w-3.5 text-muted-foreground" /> Database Name</Label>
                    <Input id="db-name" value={dbName} onChange={(e) => setDbName(e.target.value)} placeholder="postgres" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="db-user" className="text-sm font-medium flex items-center gap-1.5"><Key className="h-3.5 w-3.5 text-muted-foreground" /> Username / User</Label>
                    <Input id="db-user" value={dbUser} onChange={(e) => setDbUser(e.target.value)} placeholder="postgres.xxxxx" className="h-10" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="db-password" className="text-sm font-medium flex items-center gap-1.5"><Key className="h-3.5 w-3.5 text-muted-foreground" /> Password</Label>
                    <div className="relative">
                      <Input id="db-password" type={showPassword ? 'text' : 'password'} value={dbPassword} onChange={(e) => setDbPassword(e.target.value)} placeholder="Masukkan password database" className="h-10 pr-10" />
                      <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-10 w-10" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <Eye className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 opacity-40" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="db-pool" className="text-sm font-medium">Pool Size</Label>
                    <Input id="db-pool" value={dbPoolSize} onChange={(e) => setDbPoolSize(e.target.value)} placeholder="10" className="h-10" />
                  </div>
                </div>

                <Separator />

                {/* Connection String Preview */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Connection String (Preview)</Label>
                  <div className="bg-gray-950 text-gray-300 rounded-lg p-3 text-xs font-mono overflow-auto">
                    <code>
                      {dbHost ? (
                        <>
                          <span className="text-blue-400">postgresql</span>
                          <span className="text-gray-500">://</span>
                          <span className="text-yellow-400">{dbUser || '[user]'}</span>
                          <span className="text-gray-500">:</span>
                          <span className="text-yellow-400">{dbPassword ? '••••••••' : '[password]'}</span>
                          <span className="text-gray-500">@</span>
                          <span className="text-green-400">{dbHost}</span>
                          <span className="text-gray-500">:</span>
                          <span className="text-purple-400">{dbPort}</span>
                          <span className="text-gray-500">/</span>
                          <span className="text-green-400">{dbName}</span>
                          <span className="text-gray-500">?pgbouncer=true</span>
                        </>
                      ) : (
                        <span className="text-gray-500">Isi kolom di atas untuk melihat connection string...</span>
                      )}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SQL Generation */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center"><Code2 className="h-4 w-4 text-blue-700" /></div>
                    <div>
                      <CardTitle className="text-base">Generate SQL untuk Supabase</CardTitle>
                      <CardDescription>Generate DDL, Seed Data, Prisma Schema, dan file .env</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => loadSql()} disabled={sqlLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-sm">
                      {sqlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                      Generate Semua SQL
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* SQL Type Tabs */}
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(sqlTabMeta) as SqlTab[]).map((tab) => {
                    const meta = sqlTabMeta[tab];
                    const Icon = meta.icon;
                    return (
                      <Button
                        key={tab}
                        variant={sqlTab === tab ? 'default' : 'outline'}
                        size="sm"
                        className={`gap-1.5 text-xs ${sqlTab === tab ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        onClick={() => {
                          setSqlTab(tab);
                          if (!sqlLoaded || !sqlContent[tab]) loadSql(tab);
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </Button>
                    );
                  })}
                </div>

                {/* SQL Content */}
                {sqlContent[sqlTab] ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {sqlContent[sqlTab].split('\n').length} baris
                      </Badge>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => handleCopyToClipboard(sqlContent[sqlTab], sqlTabMeta[sqlTab].label)}>
                          <Copy className="h-3.5 w-3.5" /> Copy
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => {
                          const blob = new Blob([sqlContent[sqlTab]], { type: 'text/plain' });
                          const a = document.createElement('a');
                          a.href = URL.createObjectURL(blob);
                          a.download = sqlTabMeta[sqlTab].filename;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(a.href);
                          toast.success(`${sqlTabMeta[sqlTab].filename} berhasil didownload`);
                        }}>
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                      </div>
                    </div>
                    <pre className={`rounded-lg p-4 text-xs font-mono overflow-auto leading-relaxed ${
                      sqlTab === 'env' ? 'bg-gray-950 text-yellow-300' :
                      sqlTab === 'schema' ? 'bg-gray-950 text-sky-300' :
                      sqlTab === 'seed' ? 'bg-gray-950 text-amber-300' :
                      'bg-gray-950 text-green-400'
                    }`} style={{ maxHeight: '500px' }}>
                      <code>{sqlContent[sqlTab]}</code>
                    </pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                      <Code2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Belum ada SQL yang digenerate</p>
                      <p className="text-sm text-muted-foreground mt-1">Klik tombol &quot;Generate Semua SQL&quot; di atas untuk membuat kode SQL</p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Table Info */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Informasi Schema</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { label: 'Total Tabel', value: '15', icon: Database },
                      { label: 'Foreign Keys', value: '20', icon: Key },
                      { label: 'Indexes', value: '24', icon: Zap },
                      { label: 'Trigger', value: '15', icon: Terminal },
                    ].map((info) => (
                      <div key={info.label} className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
                        <info.icon className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div>
                          <div className="text-lg font-bold">{info.value}</div>
                          <div className="text-[10px] text-muted-foreground leading-tight">{info.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Migration Steps */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Langkah Migrasi ke Supabase</Label>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-3 text-sm text-emerald-800">
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">1</div>
                      <div>
                        <p className="font-medium">Isi Koneksi Supabase</p>
                        <p className="text-xs opacity-80 mt-0.5">Masukkan host, port, database, user, dan password dari dashboard Supabase</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">2</div>
                      <div>
                        <p className="font-medium">Generate .env File</p>
                        <p className="text-xs opacity-80 mt-0.5">Klik tab &quot;Environment&quot; lalu download .env. Simpan di root project.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">3</div>
                      <div>
                        <p className="font-medium">Download Prisma Schema</p>
                        <p className="text-xs opacity-80 mt-0.5">Klik tab &quot;Prisma Schema&quot;, download, lalu replace file prisma/schema.prisma</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">4</div>
                      <div>
                        <p className="font-medium">Generate Prisma Client</p>
                        <p className="text-xs opacity-80 mt-0.5">Jalankan: <code className="bg-emerald-200 px-1.5 py-0.5 rounded text-xs font-mono">npx prisma generate</code></p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">5</div>
                      <div>
                        <p className="font-medium">Push Schema ke Supabase</p>
                        <p className="text-xs opacity-80 mt-0.5">Jalankan: <code className="bg-emerald-200 px-1.5 py-0.5 rounded text-xs font-mono">npx prisma db push</code></p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 text-xs font-bold">6</div>
                      <div>
                        <p className="font-medium">Seed Data (Opsional)</p>
                        <p className="text-xs opacity-80 mt-0.5">Download SQL Seed, lalu jalankan di Supabase SQL Editor</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
