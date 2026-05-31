'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useLeadStore } from '@/lib/store';
import type { Lead, PaginatedResponse } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Search, MoreHorizontal, Eye, Pencil, Trash2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

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
  spam: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export default function AdminLeadList() {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);

  const fetchLeads = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('keyword', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (agentFilter !== 'all') params.set('agentId', agentFilter);

      const res = await fetchWithAuth(`/api/leads?${params}`);
      if (res.ok) {
        const data: PaginatedResponse<Lead> = await res.json();
        setLeads(data.data);
        setPagination(data.pagination);
      }
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sourceFilter, agentFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    fetchWithAuth('/api/agents')
      .then((r) => r.json())
      .then((data) => setAgents(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchWithAuth(`/api/leads/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchLeads(pagination.page);
    } catch {}
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Daftar Leads</h2>
        <p className="text-sm text-muted-foreground">{pagination.total} leads ditemukan</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari leads (nama, whatsapp, email)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLeads(1)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
              <SelectTrigger className="w-full lg:w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="baru">Baru</SelectItem>
                <SelectItem value="dihubungi">Dihubungi</SelectItem>
                <SelectItem value="prospek">Prospek</SelectItem>
                <SelectItem value="survei">Survei</SelectItem>
                <SelectItem value="negosiasi">Negosiasi</SelectItem>
                <SelectItem value="closing">Closing</SelectItem>
                <SelectItem value="gagal">Gagal</SelectItem>
                <SelectItem value="spam">Spam</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v)}>
              <SelectTrigger className="w-full lg:w-[160px]"><SelectValue placeholder="Sumber" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Sumber</SelectItem>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
            <Select value={agentFilter} onValueChange={(v) => setAgentFilter(v)}>
              <SelectTrigger className="w-full lg:w-[180px]"><SelectValue placeholder="Agen" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Agen</SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Properti</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sumber</TableHead>
                <TableHead>Agen</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="w-12">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    Tidak ada leads ditemukan
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={lead.id} className="cursor-pointer" onClick={() => navigate({ page: 'admin-lead-detail', id: lead.id })}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="text-sm">{lead.whatsapp}</TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">{lead.propertyName || lead.locationInterest || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[lead.status] || ''}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{lead.source}</TableCell>
                    <TableCell className="text-sm">{lead.agent?.name || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(lead.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate({ page: 'admin-lead-detail', id: lead.id }); }}>
                            <Eye className="mr-2 h-4 w-4" /> Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(lead); setDeleteDialogOpen(true); }}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Halaman {pagination.page} dari {pagination.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchLeads(pagination.page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchLeads(pagination.page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Lead</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus lead &quot;{deleteTarget?.name}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete}>Hapus</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
