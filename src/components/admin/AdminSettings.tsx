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
  Database, AlertTriangle,
  Upload, Trash2, ArchiveRestore, HardDriveDownload,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
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

  // Backup/Restore/Delete states
  const [tableCounts, setTableCounts] = useState<Record<string, number>>({});
  const [tableLabels, setTableLabels] = useState<Record<string, string>>({});
  const [tableTotal, setTableTotal] = useState(0);
  const [countsLoading, setCountsLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupSelectedTables, setBackupSelectedTables] = useState<string[]>([]);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreMode, setRestoreMode] = useState('merge');
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{ message: string; totalRestored: number; totalSkipped: number; details: { table: string; restored: number; skipped: number; error?: string }[] } | null>(null);
  const [deleteTables, setDeleteTables] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ message: string; totalDeleted: number; details: { table: string; label: string; deleted: number }[] } | null>(null);

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
  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => toast.success('URL berhasil disalin'));
  };

  // Backup/Restore/Delete handlers
  const loadTableCounts = useCallback(async () => {
    setCountsLoading(true);
    try {
      const res = await fetchWithAuth('/api/database/table-counts');
      const json = await res.json();
      if (json.data) {
        setTableCounts(json.data.counts);
        setTableLabels(json.data.labels);
        setTableTotal(json.data.total);
      }
    } catch { toast.error('Gagal memuat statistik tabel'); }
    finally { setCountsLoading(false); }
  }, []);

  const toggleBackupTable = (table: string) => {
    setBackupSelectedTables((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]
    );
  };

  const toggleDeleteTable = (table: string) => {
    setDeleteTables((prev) =>
      prev.includes(table) ? prev.filter((t) => t !== table) : [...prev, table]
    );
  };

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      const tables = backupSelectedTables.length > 0 ? backupSelectedTables.join(',') : '';
      const url = `/api/database/backup${tables ? `?tables=${tables}` : ''}`;
      const res = await fetchWithAuth(url);
      if (!res.ok) { toast.error('Gagal backup database'); return; }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      a.download = `terimakunci-backup-${timestamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast.success('Backup berhasil didownload!');
    } catch { toast.error('Gagal backup database'); }
    finally { setBackupLoading(false); }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    setRestoreLoading(true);
    setRestoreResult(null);
    try {
      const formData = new FormData();
      formData.append('file', restoreFile);
      formData.append('mode', restoreMode);
      const res = await fetchWithAuth('/api/database/restore', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.data) {
        setRestoreResult(json.data);
        toast.success(`Restore selesai! ${json.data.totalRestored} data berhasil diimport`);
      } else if (json.error) {
        toast.error(json.error);
      }
    } catch { toast.error('Gagal restore database'); }
    finally { setRestoreLoading(false); }
  };

  const handleDeleteTables = async () => {
    setDeleteLoading(true);
    setDeleteResult(null);
    try {
      const res = await fetchWithAuth('/api/database/delete-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables: deleteTables }),
      });
      const json = await res.json();
      if (json.data) {
        setDeleteResult(json.data);
        toast.success(`${json.data.totalDeleted} data berhasil dihapus`);
        setDeleteDialogOpen(false);
        setDeleteTables([]);
        loadTableCounts();
      } else if (json.error) {
        toast.error(json.error);
      }
    } catch { toast.error('Gagal menghapus data'); }
    finally { setDeleteLoading(false); }
  };

  const renderField = ({ settingKey, label, type = 'text', placeholder = '' }: { settingKey: string; label: string; type?: string; placeholder?: string }) => (
    <div className="space-y-2" key={settingKey}>
      <Label htmlFor={settingKey} className="text-sm font-medium">{label}</Label>
      {type === 'textarea' ? (
        <Textarea
          id={settingKey}
          value={getValue(settingKey)}
          onChange={(e) => updateValue(settingKey, e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="resize-y min-h-[80px]"
        />
      ) : (
        <Input id={settingKey} type={type} value={getValue(settingKey)} onChange={(e) => updateValue(settingKey, e.target.value)} placeholder={placeholder} className="h-10" />
      )}
    </div>
  );

  const renderSaveBtn = (group: string) => (
    <Button key={`save-${group}`} onClick={() => handleSave(group)} disabled={saving} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
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

  const canonicalUrl = getValue('seo_canonical_url') || 'https://www.terimakunci.com';

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Pengaturan Website</h2>
          <p className="text-sm text-muted-foreground">Kelola pengaturan website TerimaKunci</p>
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
                {renderSaveBtn('general')}
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              {renderField({ settingKey: 'site_name', label: 'Nama Website', placeholder: 'TerimaKunci' })}
              {renderField({ settingKey: 'site_tagline', label: 'Tagline', placeholder: 'Jual Beli Properti Terpercaya' })}
              {renderField({ settingKey: 'site_logo', label: 'Logo URL', placeholder: 'https://example.com/logo.png' })}
              {renderField({ settingKey: 'site_favicon', label: 'Favicon URL', placeholder: 'https://example.com/favicon.ico' })}
              {renderField({ settingKey: 'site_description', label: 'Deskripsi Website', type: 'textarea', placeholder: 'Deskripsi singkat website' })}
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
                {renderSaveBtn('contact')}
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              {renderField({ settingKey: 'contact_phone', label: 'Telepon', placeholder: '+62 xxx' })}
              {renderField({ settingKey: 'contact_whatsapp', label: 'WhatsApp', placeholder: '+62 xxx' })}
              {renderField({ settingKey: 'contact_email', label: 'Email', placeholder: 'info@terimakunci.com', type: 'email' })}
              {renderField({ settingKey: 'contact_address', label: 'Alamat', placeholder: 'Alamat kantor' })}
              {renderField({ settingKey: 'contact_map_embed', label: 'Google Maps Embed URL', placeholder: 'https://maps.google.com/...' })}
              {renderField({ settingKey: 'contact_working_hours', label: 'Jam Operasional', placeholder: 'Sen-Sab 09:00-17:00' })}
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
                {renderSaveBtn('social')}
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              {renderField({ settingKey: 'social_facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/...' })}
              {renderField({ settingKey: 'social_instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/...' })}
              {renderField({ settingKey: 'social_youtube', label: 'YouTube URL', placeholder: 'https://youtube.com/...' })}
              {renderField({ settingKey: 'social_tiktok', label: 'TikTok URL', placeholder: 'https://tiktok.com/...' })}
              {renderField({ settingKey: 'social_linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/...' })}
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
                  {renderSaveBtn('seo')}
                </div>
              </CardHeader>
              <CardContent className="grid gap-5 sm:grid-cols-2">
                {renderField({ settingKey: 'seo_meta_title', label: 'Default Meta Title', placeholder: 'TerimaKunci - Jual Beli Properti' })}
                {renderField({ settingKey: 'seo_canonical_url', label: 'Canonical URL', placeholder: 'https://www.terimakunci.com' })}
                {renderField({ settingKey: 'seo_meta_description', label: 'Default Meta Description', type: 'textarea', placeholder: 'Deskripsi default untuk SEO' })}
                {renderField({ settingKey: 'seo_meta_keywords', label: 'Default Meta Keywords', placeholder: 'properti, jual, beli, rumah' })}
                {renderField({ settingKey: 'seo_robots', label: 'Robots Meta', placeholder: 'index, follow' })}
                {renderField({ settingKey: 'seo_og_image', label: 'Default OG Image URL', placeholder: 'https://example.com/og.jpg' })}
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
                {renderSaveBtn('analytics')}
              </div>
            </CardHeader>
            <CardContent className="grid gap-5 sm:grid-cols-2">
              {renderField({ settingKey: 'analytics_ga_id', label: 'Google Analytics ID', placeholder: 'G-XXXXXXXXXX' })}
              {renderField({ settingKey: 'analytics_gtm_id', label: 'Google Tag Manager ID', placeholder: 'GTM-XXXXXXX' })}
              {renderField({ settingKey: 'analytics_fb_pixel', label: 'Facebook Pixel ID', placeholder: 'XXXXXXXXXXXXXXX' })}
              {renderField({ settingKey: 'analytics_head_scripts', label: 'Custom Head Scripts', type: 'textarea', placeholder: 'Kode JavaScript yang di-inject di head' })}
              {renderField({ settingKey: 'analytics_body_scripts', label: 'Custom Body Scripts', type: 'textarea', placeholder: 'Kode JavaScript yang di-inject di body' })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== DATABASE TAB ======== */}
        <TabsContent value="database">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Database className="h-5 w-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Firebase Firestore</h3>
                <p className="text-xs text-muted-foreground">Project: terimakunci-7bf84 — Backup, restore, dan hapus data koleksi Firestore</p>
              </div>
            </div>

            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-600 flex items-center justify-center"><HardDriveDownload className="h-4 w-4 text-white" /></div>
                    <div>
                      <CardTitle className="text-base">Backup, Restore & Hapus Data</CardTitle>
                      <CardDescription>Kelola backup database, restore data, atau hapus data per tabel</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={loadTableCounts} disabled={countsLoading}>
                    <RefreshCw className={`h-3 w-3 ${countsLoading ? 'animate-spin' : ''}`} /> Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Table counts summary */}
                {tableTotal > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-emerald-700">{tableTotal}</div>
                      <div className="text-[10px] text-emerald-600">Total Data</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-blue-700">{tableCounts.Property || 0}</div>
                      <div className="text-[10px] text-blue-600">Properti</div>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-purple-700">{tableCounts.Lead || 0}</div>
                      <div className="text-[10px] text-purple-600">Leads</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-amber-700">{tableCounts.Article || 0}</div>
                      <div className="text-[10px] text-amber-600">Artikel</div>
                    </div>
                    <div className="bg-sky-50 border border-sky-200 rounded-lg p-2.5 text-center">
                      <div className="text-lg font-bold text-sky-700">{tableCounts.User || 0}</div>
                      <div className="text-[10px] text-sky-600">User</div>
                    </div>
                  </div>
                )}
                {tableTotal === 0 && !countsLoading && (
                  <Button variant="outline" size="sm" className="w-full" onClick={loadTableCounts} disabled={countsLoading}>
                    {countsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Database className="h-3.5 w-3.5 mr-1.5" />}
                    Muat Statistik Tabel
                  </Button>
                )}

                <div className="grid gap-4 lg:grid-cols-3">
                  {/* BACKUP CARD */}
                  <Card className="border-emerald-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center"><Download className="h-3.5 w-3.5 text-emerald-700" /></div>
                        <CardTitle className="text-sm">Backup Database</CardTitle>
                      </div>
                      <CardDescription className="text-xs">Export seluruh data ke file JSON</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Pilih Tabel</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant={backupSelectedTables.length === 0 ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setBackupSelectedTables([])}
                          >
                            Semua ({tableTotal})
                          </Button>
                          {Object.entries(tableLabels).map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => toggleBackupTable(key)}
                              className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                                backupSelectedTables.length === 0 || backupSelectedTables.includes(key)
                                  ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                  : 'bg-gray-50 border-gray-200 text-gray-400 line-through'
                              }`}
                              title={`${label}: ${tableCounts[key] || 0} data`}
                            >
                              {tableCounts[key] || 0}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Button
                        onClick={handleBackup}
                        disabled={backupLoading || tableTotal === 0}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-9 text-sm"
                      >
                        {backupLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                        {backupLoading ? 'Mengexport...' : 'Download Backup JSON'}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* RESTORE CARD */}
                  <Card className="border-blue-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center"><Upload className="h-3.5 w-3.5 text-blue-700" /></div>
                        <CardTitle className="text-sm">Restore Database</CardTitle>
                      </div>
                      <CardDescription className="text-xs">Import data dari file backup JSON</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div
                        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors"
                        onClick={() => document.getElementById('restore-file-input')?.click()}
                      >
                        <input
                          id="restore-file-input"
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
                        />
                        {restoreFile ? (
                          <div className="space-y-1">
                            <FileArchive className="h-6 w-6 text-blue-600 mx-auto" />
                            <p className="text-xs font-medium text-blue-700 truncate">{restoreFile.name}</p>
                            <p className="text-[10px] text-muted-foreground">{(restoreFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
                            <p className="text-xs text-muted-foreground">Klik atau drag file .json</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Mode Restore</Label>
                        <Select value={restoreMode} onValueChange={setRestoreMode}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="merge">Merge (update jika ada, buat baru)</SelectItem>
                            <SelectItem value="replace">Replace (hapus lalu import)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        onClick={handleRestore}
                        disabled={restoreLoading || !restoreFile}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-1.5 h-9 text-sm"
                      >
                        {restoreLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArchiveRestore className="h-3.5 w-3.5" />}
                        {restoreLoading ? 'Merestore...' : 'Restore Data'}
                      </Button>
                      {/* Restore result */}
                      {restoreResult && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1.5 text-xs">
                          <p className="font-semibold text-blue-800">{restoreResult.message}</p>
                          <div className="space-y-1">
                            {restoreResult.details.filter(d => d.restored > 0).map((d) => (
                              <div key={d.table} className="flex justify-between text-blue-700">
                                <span>{tableLabels[d.table] || d.table}</span>
                                <span className="font-medium">+{d.restored} data</span>
                              </div>
                            ))}
                            {restoreResult.details.filter(d => d.skipped > 0).map((d) => (
                              <div key={d.table} className="flex justify-between text-amber-700">
                                <span>{tableLabels[d.table] || d.table}</span>
                                <span className="font-medium">{d.skipped} skip</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* DELETE CARD */}
                  <Card className="border-red-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-red-100 flex items-center justify-center"><Trash2 className="h-3.5 w-3.5 text-red-700" /></div>
                        <CardTitle className="text-sm">Hapus Data Tabel</CardTitle>
                      </div>
                      <CardDescription className="text-xs">Hapus semua data dari tabel tertentu</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium">Pilih Tabel yang Akan Dihapus</Label>
                        <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                          {Object.entries(tableLabels).map(([key, label]) => (
                            <button
                              key={key}
                              onClick={() => toggleDeleteTable(key)}
                              className={`flex items-center justify-between text-[11px] px-2 py-1.5 rounded border transition-colors ${
                                deleteTables.includes(key)
                                  ? 'bg-red-100 border-red-300 text-red-700'
                                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-red-200'
                              }`}
                            >
                              <span className="truncate">{label}</span>
                              <Badge variant="secondary" className="text-[9px] px-1 py-0 ml-1">{tableCounts[key] || 0}</Badge>
                            </button>
                          ))}
                        </div>
                      </div>
                      {deleteTables.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700">
                          <p className="font-semibold">⚠ Peringatan!</p>
                          <p className="mt-0.5">{deleteTables.length} tabel akan dihapus secara permanen. Pastikan Anda sudah backup data.</p>
                        </div>
                      )}
                      <Button
                        onClick={() => setDeleteDialogOpen(true)}
                        disabled={deleteTables.length === 0}
                        variant="destructive"
                        className="w-full gap-1.5 h-9 text-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Hapus {deleteTables.length} Tabel
                      </Button>
                      {/* Delete result */}
                      {deleteResult && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1.5 text-xs">
                          <p className="font-semibold text-red-800">{deleteResult.message}</p>
                          <div className="space-y-1">
                            {deleteResult.details.map((d) => (
                              <div key={d.table} className="flex justify-between text-red-700">
                                <span>{d.label}</span>
                                <span className="font-medium">-{d.deleted} data</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-1.5 text-xs text-amber-800">
                  <p className="font-semibold flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Tips Backup & Restore:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-1">
                    <li>Selalu backup sebelum restore atau menghapus data</li>
                    <li>File backup berformat JSON dengan semua data tabel</li>
                    <li>Mode <strong>Merge</strong> aman untuk update data tanpa menghapus yang lain</li>
                    <li>Mode <strong>Replace</strong> akan menghapus data lama terlebih dahulu</li>
                    <li>Penghapusan data bersifat permanen dan tidak bisa di-undo</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600"><AlertTriangle className="h-5 w-5" /> Konfirmasi Hapus Data</DialogTitle>
                  <DialogDescription>
                    Anda akan menghapus <strong>SEMUA data</strong> dari {deleteTables.length} tabel berikut:
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  {deleteTables.map((t) => (
                    <div key={t} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2 text-sm">
                      <span className="font-medium">{tableLabels[t] || t}</span>
                      <Badge variant="destructive" className="text-xs">{tableCounts[t] || 0} data</Badge>
                    </div>
                  ))}
                </div>
                <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-800">
                  <p className="font-semibold">⚠ Tindakan ini tidak dapat dibatalkan!</p>
                  <p className="mt-1">Pastikan Anda sudah membuat backup sebelum melanjutkan.</p>
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
                  <Button variant="destructive" onClick={handleDeleteTables} disabled={deleteLoading}>
                    {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
                    {deleteLoading ? 'Menghapus...' : 'Ya, Hapus Data'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}
