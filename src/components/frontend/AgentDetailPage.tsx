'use client';

import { useEffect, useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from '@/hooks/use-router';
import { AgentProfile, Property } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import PropertyCard from './PropertyCard';

export default function AgentDetailPage() {
  const { route, navigate, goBack } = useRouter();
  const id = route.page === 'agent-detail' ? route.id : '';

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  const [contactName, setContactName] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setFormSuccess(false);

    fetch(`/api/agents/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(async (data) => {
        const a = data?.data || data;
        if (a) {
          setAgent(a);
          const propRes = await fetch(`/api/properties?agentId=${a.id}&limit=6`);
          if (propRes.ok) {
            const propData = await propRes.json();
            setProperties(propData.data || propData || []);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent || !contactName || !contactWhatsapp) return;
    setFormSubmitting(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          whatsapp: contactWhatsapp,
          message: contactMessage,
          agentId: agent.id,
          needType: 'survei',
          source: 'website',
        }),
      });
      setFormSuccess(true);
    } catch {}
    finally {
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="bg-white rounded-xl border p-4 flex flex-col items-center">
          <Skeleton className="w-20 h-20 rounded-full mb-3" />
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="px-4 py-16 text-center">
        <h2 className="text-lg font-bold text-gray-900 mb-2">Agen Tidak Ditemukan</h2>
        <p className="text-sm text-gray-500 mb-4">Agen yang Anda cari tidak tersedia.</p>
        <Button onClick={() => navigate({ page: 'agents' })} className="bg-emerald-600 hover:bg-emerald-700">
          Lihat Semua Agen
        </Button>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      {/* Back button */}
      <div className="flex items-center gap-3 mb-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 -ml-1 text-gray-600" onClick={goBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <span className="text-sm font-medium text-gray-700">Profil Agen</span>
      </div>

      {/* Agent Profile Card */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {/* Photo */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden">
              {agent.photo ? (
                <img src={agent.photo} alt={agent.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-emerald-700 font-bold text-2xl">{agent.name.charAt(0)}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-gray-900">{agent.name}</h1>
              {agent.title && (
                <p className="text-xs text-gray-500">{agent.title}</p>
              )}
              {agent.areaSpec && (
                <p className="text-[11px] text-emerald-600 flex items-center gap-0.5 mt-0.5">
                  <MapPin className="size-3" />
                  Spesialis: {agent.areaSpec}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                <span>{agent._count?.properties || 0} Properti</span>
                <span>{agent._count?.leads || 0} Klien</span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {agent.bio && (
            <>
              <Separator className="my-3" />
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                {agent.bio}
              </p>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            <a
              href={`https://wa.me/${agent.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <MessageCircle className="size-4" />
              WhatsApp
            </a>
            {agent.email && (
              <a
                href={`mailto:${agent.email}`}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Mail className="size-4" />
                Email
              </a>
            )}
          </div>

          {/* Contact Form */}
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={() => setShowContactForm(!showContactForm)}
            >
              {showContactForm ? 'Tutup Form' : 'Kirim Pesan'}
            </Button>
            {showContactForm && (
              <form onSubmit={handleSubmitContact} className="mt-3 space-y-2">
                {formSuccess ? (
                  <div className="bg-emerald-50 text-emerald-700 text-xs rounded-lg p-3 text-center">
                    Pesan berhasil dikirim!
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Nama Anda"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                      className="h-9 text-sm"
                    />
                    <Input
                      placeholder="Nomor WhatsApp"
                      value={contactWhatsapp}
                      onChange={(e) => setContactWhatsapp(e.target.value)}
                      required
                      className="h-9 text-sm"
                    />
                    <Textarea
                      placeholder="Pesan Anda..."
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      rows={2}
                      className="text-sm"
                    />
                    <Button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 h-9 text-sm"
                      disabled={formSubmitting}
                    >
                      {formSubmitting ? 'Mengirim...' : 'Kirim'}
                    </Button>
                  </>
                )}
              </form>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Agent's Properties */}
      {properties.length > 0 && (
        <section className="mb-4">
          <h2 className="text-base font-bold text-gray-900 mb-3">
            Listing {agent.name}
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
