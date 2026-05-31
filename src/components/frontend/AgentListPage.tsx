'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageCircle, MapPin, Search } from 'lucide-react';
import { useRouter } from '@/hooks/use-router';
import { AgentProfile } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function AgentListPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.data || [];
        setAgents(list.filter((a: AgentProfile) => a.isActive));
      }
    } catch {}
    finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900">Agen Properti</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Tim profesional kami siap membantu Anda
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-28 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border">
          <MessageCircle className="size-10 text-gray-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-900 mb-1">Belum Ada Agen</h3>
          <p className="text-xs text-gray-500">Agen properti akan segera tersedia.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.navigate({ page: 'agent-detail', id: agent.id })}
            >
              <CardContent className="p-4 flex items-center gap-3">
                {/* Photo */}
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden">
                  {agent.photo ? (
                    <img
                      src={agent.photo}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-emerald-700 font-bold text-xl">
                      {agent.name.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900">{agent.name}</h3>
                  {agent.title && (
                    <p className="text-xs text-gray-500">{agent.title}</p>
                  )}
                  {agent.areaSpec && (
                    <p className="text-[11px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                      <MapPin className="size-3" />
                      {agent.areaSpec}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-500">
                    <span>{agent._count?.properties || 0} Properti</span>
                    <span>{agent._count?.leads || 0} Klien</span>
                  </div>
                </div>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/${agent.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <MessageCircle className="size-3.5" />
                  Hubungi
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
