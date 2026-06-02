'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useLeadStore, useDataCache } from '@/lib/store';
import type { Lead } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, Phone, Mail, User, MapPin, Building2, DollarSign,
  Tag, Clock, MessageSquare, Save, ChevronRight, ExternalLink,
} from 'lucide-react';

// WhatsApp SVG Icon
function WhatsAppIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}
import { fetchWithAuth } from '@/lib/api';

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

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

const statusTimeline: Record<string, number> = {
  baru: 1, dihubungi: 2, prospek: 3, survei: 4, negosiasi: 5, closing: 6, gagal: 7, spam: 8,
};

export default function AdminLeadDetail() {
  const { route, navigate, goBack } = useRouter();
  const leadId = route.page === 'admin-lead-detail' ? route.id : '';
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [saving, setSaving] = useState(false);

  const agents = useDataCache((s) => s.agents);
  const setAgents = useDataCache((s) => s.setAgents);

  useEffect(() => {
    if (agents.length === 0) {
      fetchWithAuth('/api/agents').then((r) => r.json()).then((data) => {
        setAgents(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      }).catch(() => {});
    }
  }, [agents.length, setAgents]);

  useEffect(() => {
    if (!leadId) return;
    setLoading(true);
    fetchWithAuth(`/api/leads/${leadId}`)
      .then((r) => r.json())
      .then((data) => {
        setLead(data);
        setSelectedStatus(data.status || 'baru');
        setSelectedAgent(data.agentId || 'none');
        setNextFollowUp(data.nextFollowUp?.split('T')[0] || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [leadId]);

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      await fetchWithAuth(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          agentId: selectedAgent === 'none' ? null : selectedAgent,
          nextFollowUp: nextFollowUp || null,
          notes: newNote ? `${lead.notes || ''}\n[${new Date().toLocaleString('id-ID')}]: ${newNote}` : lead.notes,
        }),
      }).then((r) => r.json()).then((data) => {
        setLead(data);
        setNewNote('');
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Lead tidak ditemukan
        <Button variant="link" onClick={goBack}>Kembali</Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{lead.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={statusColors[lead.status] || ''}>
                {lead.status}
              </Badge>
              <span className="text-sm text-muted-foreground">{lead.source}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lead.whatsapp && (
            <a
              href={`https://wa.me/${lead.whatsapp.replace(/^0/, '62')}?text=Halo%20${encodeURIComponent(lead.name)}%2C%20saya%20dari%20TerimaKunci.%20Terima%20kasih%20telah%20menghubungi%20kami.`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:bg-[#1da851] transition-colors"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Follow-up WhatsApp
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Save className="h-4 w-4" />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Lead Info */}
        <div className="space-y-4">
          {/* Contact Info */}
          <Card>
            <CardHeader><CardTitle className="text-base">Informasi Kontak</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Nama</p>
                  <p className="font-medium">{lead.name}</p>
                </div>
              </div>
              {lead.whatsapp ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
                    <div>
                      <p className="text-sm text-muted-foreground">WhatsApp</p>
                      <p className="font-medium">{lead.whatsapp}</p>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${lead.whatsapp.replace(/^0/, '62')}?text=Halo%20${encodeURIComponent(lead.name)}%2C%20saya%20dari%20TerimaKunci.%20Terima%20kasih%20telah%20menghubungi%20kami.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1da851] transition-colors"
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5" />
                    Chat
                  </a>
                </div>
              ) : null}
              {lead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{lead.email}</p>
                  </div>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telepon</p>
                    <p className="font-medium">{lead.phone}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead Details */}
          <Card>
            <CardHeader><CardTitle className="text-base">Detail Lead</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Kebutuhan</p>
                  <p className="font-medium capitalize">{lead.needType?.replace('_', ' ') || '-'}</p>
                </div>
              </div>
              {lead.budget && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Budget</p>
                    <p className="font-medium">{lead.budget}</p>
                  </div>
                </div>
              )}
              {lead.propertyTypeInterest && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Jenis Properti</p>
                    <p className="font-medium">{lead.propertyTypeInterest}</p>
                  </div>
                </div>
              )}
              {(lead.locationInterest || lead.propertyName) && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Lokasi/Properti</p>
                    <p className="font-medium">{lead.propertyName || lead.locationInterest || '-'}</p>
                    {lead.property && (
                      <button
                        onClick={() => navigate({ page: 'admin-property-edit', id: lead.property!.id })}
                        className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        Lihat Properti <ChevronRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Tanggal Masuk</p>
                  <p className="font-medium text-sm">{formatDate(lead.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-base">Pipeline Status</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 flex-wrap">
                {Object.entries(statusTimeline)
                  .filter(([k]) => k !== 'gagal' && k !== 'spam')
                  .sort(([, a], [, b]) => a - b)
                  .map(([status, order]) => {
                    const currentOrder = statusTimeline[lead.status] || 1;
                    const isActive = order <= currentOrder;
                    const isCurrent = status === lead.status;
                    return (
                      <div key={status} className="flex items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                          isCurrent
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : isActive
                              ? 'border-emerald-300 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                              : 'border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-800'
                        }`}>
                          {order}
                        </div>
                        <span className={`text-xs ${isCurrent ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                          {status}
                        </span>
                        {order < 6 && <ChevronRight className="h-3 w-3 text-gray-300" />}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Actions & Notes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Update Status & Agent */}
          <Card>
            <CardHeader><CardTitle className="text-base">Update Lead</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(statusColors).map((s) => (
                      <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Agen</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Pilih agen" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Tidak ada --</SelectItem>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tanggal Follow-up Berikutnya</Label>
                <Input
                  type="date"
                  value={nextFollowUp}
                  onChange={(e) => setNextFollowUp(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Follow-up Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageSquare className="h-4 w-4" />
                Catatan Follow-up
              </CardTitle>
              <CardDescription>Tambahkan catatan baru (akan ditambahkan ke log)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Tulis catatan follow-up..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
              <Button onClick={handleSave} disabled={saving || !newNote} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="h-3 w-3" /> Simpan Catatan
              </Button>

              {/* Existing Notes */}
              {lead.notes && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Log Catatan</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {lead.notes.split('\n').filter(Boolean).map((note, i) => (
                      <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-sm">
                        {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Communication Log */}
          <Card>
            <CardHeader><CardTitle className="text-base">Log Komunikasi</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  Lead dibuat — {formatDate(lead.createdAt)}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  Terakhir diupdate — {formatDate(lead.updatedAt)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
