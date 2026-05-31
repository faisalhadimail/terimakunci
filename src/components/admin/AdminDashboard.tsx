'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useDataCache, usePropertyStore, useLeadStore } from '@/lib/store';
import { fetchWithAuth } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import type { Property, Lead, DashboardStats } from '@/lib/types';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import {
  Building2, Building, Users, UserPlus, FileText, TrendingUp, AlertTriangle, Clock,
} from 'lucide-react';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const statusColors: Record<string, string> = {
  baru: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
  dihubungi: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400',
  prospek: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
  survei: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400',
  negosiasi: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400',
  closing: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400',
  gagal: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
  spam: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const leadsChartConfig = {
  leads: { label: 'Leads', color: '#10b981' },
};

const listingsChartConfig = {
  listings: { label: 'Listings', color: '#059669' },
};

const pieStatusConfig = {
  baru: { label: 'Baru', color: '#f59e0b' },
  dihubungi: { label: 'Dihubungi', color: '#06b6d4' },
  prospek: { label: 'Prospek', color: '#10b981' },
  survei: { label: 'Survei', color: '#a855f7' },
  negosiasi: { label: 'Negosiasi', color: '#f97316' },
  closing: { label: 'Closing', color: '#22c55e' },
  gagal: { label: 'Gagal', color: '#ef4444' },
  spam: { label: 'Spam', color: '#6b7280' },
};

const pieSourceConfig = {
  website: { label: 'Website', color: '#10b981' },
  whatsapp: { label: 'WhatsApp', color: '#059669' },
  instagram: { label: 'Instagram', color: '#ec4899' },
  referral: { label: 'Referral', color: '#f59e0b' },
  other: { label: 'Lainnya', color: '#6b7280' },
};

const PIE_COLORS = ['#10b981', '#059669', '#f59e0b', '#06b6d4', '#a855f7', '#f97316', '#22c55e', '#ef4444', '#6b7280', '#ec4899'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [recentProperties, setRecentProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const setDashboardStats = useDataCache((s) => s.setDashboardStats);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, leadsRes, propsRes] = await Promise.allSettled([
          fetchWithAuth('/api/dashboard').then((r) => r.json()),
          fetchWithAuth('/api/leads?limit=5').then((r) => r.json()),
          fetchWithAuth('/api/properties?limit=5').then((r) => r.json()),
        ]);

        if (statsRes.status === 'fulfilled' && statsRes.value) {
          setStats(statsRes.value);
          setDashboardStats(statsRes.value);
        } else {
          // Fallback mock data
          setStats({
            totalProperties: 0,
            activeProperties: 0,
            draftProperties: 0,
            soldProperties: 0,
            rentedProperties: 0,
            totalLeads: 0,
            newLeadsToday: 0,
            newLeadsThisMonth: 0,
            leadsByStatus: [],
            leadsBySource: [],
            publishedArticles: 0,
            topViewedProperties: [],
            topViewedArticles: [],
            leadsPerMonth: [],
            listingsPerMonth: [],
          });
        }

        if (leadsRes.status === 'fulfilled' && leadsRes.value?.data) {
          setRecentLeads(leadsRes.value.data);
        }
        if (propsRes.status === 'fulfilled' && propsRes.value?.data) {
          setRecentProperties(propsRes.value.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setDashboardStats]);

  const statCards = [
    { title: 'Total Properti', value: stats?.totalProperties ?? 0, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
    { title: 'Properti Aktif', value: stats?.activeProperties ?? 0, icon: Building, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/50' },
    { title: 'Total Leads', value: stats?.totalLeads ?? 0, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/50' },
    { title: 'Leads Baru Hari Ini', value: stats?.newLeadsToday ?? 0, icon: UserPlus, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950/50' },
    { title: 'Artikel Terpublish', value: stats?.publishedArticles ?? 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/50' },
  ];

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`rounded-lg p-3 ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value.toLocaleString('id-ID')}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leads Per Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Leads Per Bulan
            </CardTitle>
            <CardDescription>Jumlah leads masuk setiap bulan</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.leadsPerMonth && stats.leadsPerMonth.length > 0 ? (
              <ChartContainer config={leadsChartConfig} className="h-[280px] w-full">
                <BarChart data={stats.leadsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-leads)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                Belum ada data leads
              </div>
            )}
          </CardContent>
        </Card>

        {/* Listings Per Month */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building className="h-4 w-4 text-emerald-600" />
              Listing Per Bulan
            </CardTitle>
            <CardDescription>Jumlah properti terlisting setiap bulan</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.listingsPerMonth && stats.listingsPerMonth.length > 0 ? (
              <ChartContainer config={listingsChartConfig} className="h-[280px] w-full">
                <LineChart data={stats.listingsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="count" stroke="var(--color-listings)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                Belum ada data listing
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pie Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribusi Status Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.leadsByStatus && stats.leadsByStatus.length > 0 ? (
              <ChartContainer config={pieStatusConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={stats.leadsByStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ status, count }: { status: string; count: number }) =>
                      `${status}: ${count}`
                    }
                    labelLine={false}
                  >
                    {stats.leadsByStatus.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="status" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                Belum ada data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lead Source Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribusi Sumber Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.leadsBySource && stats.leadsBySource.length > 0 ? (
              <ChartContainer config={pieSourceConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={stats.leadsBySource}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ source, count }: { source: string; count: number }) =>
                      `${source}: ${count}`
                    }
                    labelLine={false}
                  >
                    {stats.leadsBySource.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="source" />} />
                </PieChart>
              </ChartContainer>
            ) : (
              <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
                Belum ada data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Data Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads Terbaru</CardTitle>
            <CardDescription>5 leads terbaru yang masuk</CardDescription>
          </CardHeader>
          <CardContent>
            {recentLeads.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell className="text-sm">{lead.whatsapp}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[lead.status] || ''}>
                          {lead.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(lead.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada leads</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Properties */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Properti Terbaru</CardTitle>
            <CardDescription>5 properti terakhir ditambahkan</CardDescription>
          </CardHeader>
          <CardContent>
            {recentProperties.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentProperties.map((prop) => (
                    <TableRow key={prop.id}>
                      <TableCell className="font-medium max-w-[180px] truncate">{prop.title}</TableCell>
                      <TableCell className="text-sm">{formatCurrency(prop.price)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {prop.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(prop.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Belum ada properti</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notifications / Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Notifikasi & Pengingat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.newLeadsToday && stats.newLeadsToday > 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50 p-3">
                <UserPlus className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{stats.newLeadsToday} leads baru hari ini</p>
                  <p className="text-xs text-muted-foreground">Segera follow up leads yang baru masuk</p>
                </div>
              </div>
            ) : null}
            {stats?.draftProperties && stats.draftProperties > 0 ? (
              <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 p-3">
                <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{stats.draftProperties} properti masih draft</p>
                  <p className="text-xs text-muted-foreground">Lengkapi dan publish listing yang belum selesai</p>
                </div>
              </div>
            ) : null}
            {(!stats?.newLeadsToday || stats.newLeadsToday === 0) && (!stats?.draftProperties || stats.draftProperties === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tidak ada notifikasi baru. Semua berjalan baik! 🎉
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
