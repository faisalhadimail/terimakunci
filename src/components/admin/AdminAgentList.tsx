'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useDataCache } from '@/lib/store';
import type { AgentProfile } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus, Pencil, UserCheck, UserX, Building2, Users, Loader2,
} from 'lucide-react';
import { fetchWithAuth } from '@/lib/api';

export default function AdminAgentList() {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [toggleDialogOpen, setToggleDialogOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<AgentProfile | null>(null);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth('/api/agents');
      if (res.ok) {
        const data = await res.json();
        setAgents(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAgents(); }, []);

  const handleToggleActive = async () => {
    if (!toggleTarget) return;
    try {
      await fetchWithAuth(`/api/agents/${toggleTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !toggleTarget.isActive }),
      });
      setToggleDialogOpen(false);
      setToggleTarget(null);
      fetchAgents();
    } catch {}
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Daftar Agen</h2>
          <p className="text-sm text-muted-foreground">{agents.length} agen terdaftar</p>
        </div>
        <Button
          onClick={() => navigate({ page: 'admin-agent-edit' })}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <Plus className="h-4 w-4" />
          Tambah Agen
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Belum ada agen. Klik tombol di atas untuk menambahkan.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="overflow-hidden">
              <div className="h-20 bg-gradient-to-r from-emerald-500 to-emerald-600" />
              <CardContent className="p-4 -mt-8 relative">
                <div className="flex items-end gap-3 mb-4">
                  <Avatar className="h-16 w-16 border-4 border-white dark:border-gray-900 shadow-md">
                    <AvatarImage src={agent.photo} />
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg font-bold">
                      {agent.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{agent.name}</h3>
                    <p className="text-sm text-muted-foreground">{agent.title || 'Agen Properti'}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="font-medium text-emerald-600">{agent._count?.properties || 0}</span> properti
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="font-medium text-emerald-600">{agent._count?.leads || 0}</span> leads
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant={agent.isActive ? 'default' : 'secondary'} className="text-xs">
                    {agent.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate({ page: 'admin-agent-edit', id: agent.id })}
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setToggleTarget(agent); setToggleDialogOpen(true); }}
                    >
                      {agent.isActive ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                      {agent.isActive ? 'Nonaktif' : 'Aktif'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Toggle Active Dialog */}
      <Dialog open={toggleDialogOpen} onOpenChange={setToggleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{toggleTarget?.isActive ? 'Nonaktifkan' : 'Aktifkan'} Agen</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin {toggleTarget?.isActive ? 'menonaktifkan' : 'mengaktifkan'} agen &quot;{toggleTarget?.name}&quot;?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleDialogOpen(false)}>Batal</Button>
            <Button onClick={handleToggleActive}>Ya, Lanjutkan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
