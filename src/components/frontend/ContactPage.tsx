'use client';

import { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { useRouter } from '@/hooks/use-router';
import { useDataCache } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

export default function ContactPage() {
  const { settings } = useDataCache();
  const { navigate } = useRouter();

  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    email: '',
    interestType: '',
    budget: '',
    message: '',
  });

  const getSetting = (key: string, fallback: string = ''): string => {
    const s = settings.find((s) => s.key === key);
    return s?.value || fallback;
  };

  const companyName = getSetting('site_name', 'TerimaKunci');
  const companyPhone = getSetting('company_phone', '0812-3456-7890');
  const companyEmail = getSetting('company_email', 'info@proprnusa.com');
  const companyAddress = getSetting('company_address', 'Jl. Property No. 1, Bandung');
  const whatsappNumber = getSetting('whatsapp_number', '6281234567890');
  const officeHours = getSetting('office_hours', 'Senin - Jumat, 09:00 - 17:00 WIB');

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp) return;
    setFormSubmitting(true);
    try {
      await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          whatsapp: formData.whatsapp,
          email: formData.email || undefined,
          needType: formData.interestType || 'tanya_harga',
          budget: formData.budget || undefined,
          notes: formData.message || undefined,
          source: 'website',
        }),
      });
      setFormSuccess(true);
      setFormData({ name: '', whatsapp: '', email: '', interestType: '', budget: '', message: '' });
    } catch {}
    finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="px-4 py-4">
      {/* Header */}
      <div className="text-center mb-5">
        <h1 className="text-lg font-bold text-gray-900 mb-1">
          Hubungi Kami
        </h1>
        <p className="text-xs text-gray-500 max-w-lg mx-auto">
          Ada pertanyaan? Tim kami siap membantu Anda.
        </p>
      </div>

      {/* Quick Contact Info */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <a
          href={`tel:${companyPhone}`}
          className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl"
        >
          <Phone className="size-4 text-emerald-600" />
          <div>
            <p className="text-[10px] text-gray-500">Telepon</p>
            <p className="text-xs font-medium text-gray-900">{companyPhone}</p>
          </div>
        </a>
        <a
          href={`https://wa.me/${whatsappNumber}?text=Halo ${companyName}, saya ingin bertanya tentang properti.`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 bg-green-50 rounded-xl"
        >
          <MessageCircle className="size-4 text-green-600" />
          <div>
            <p className="text-[10px] text-gray-500">WhatsApp</p>
            <p className="text-xs font-medium text-gray-900">Chat Sekarang</p>
          </div>
        </a>
        <a
          href={`mailto:${companyEmail}`}
          className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl"
        >
          <Mail className="size-4 text-blue-600" />
          <div>
            <p className="text-[10px] text-gray-500">Email</p>
            <p className="text-xs font-medium text-gray-900">{companyEmail}</p>
          </div>
        </a>
        <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-xl">
          <Clock className="size-4 text-orange-600" />
          <div>
            <p className="text-[10px] text-gray-500">Jam Kerja</p>
            <p className="text-xs font-medium text-gray-900">{officeHours.split(',')[0]}</p>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 mb-5 p-3 bg-gray-50 rounded-xl">
        <MapPin className="size-4 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[10px] text-gray-500">Alamat</p>
          <p className="text-xs text-gray-700">{companyAddress}</p>
        </div>
      </div>

      {/* Contact Form */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm">Kirim Pesan</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {formSuccess ? (
            <div className="text-center py-6">
              <CheckCircle className="size-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-gray-900 mb-1">
                Pesan Terkirim!
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Terima kasih. Tim kami akan segera merespons.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormSuccess(false)}
                className="h-8 text-xs"
              >
                Kirim Lagi
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nama Lengkap *</Label>
                <Input
                  placeholder="Nama Anda"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nomor WhatsApp *</Label>
                <Input
                  placeholder="08xxxxxxxxxx"
                  value={formData.whatsapp}
                  onChange={(e) => updateField('whatsapp', e.target.value)}
                  required
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Email</Label>
                <Input
                  type="email"
                  placeholder="email@contoh.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Kebutuhan</Label>
                  <Select
                    value={formData.interestType}
                    onValueChange={(v) => updateField('interestType', v)}
                  >
                    <SelectTrigger className="w-full h-9 text-sm">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beli">Beli Properti</SelectItem>
                      <SelectItem value="sewa">Sewa Properti</SelectItem>
                      <SelectItem value="investasi">Investasi</SelectItem>
                      <SelectItem value="survei">Survei</SelectItem>
                      <SelectItem value="tanya_harga">Tanya Harga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Budget</Label>
                  <Select
                    value={formData.budget}
                    onValueChange={(v) => updateField('budget', v)}
                  >
                    <SelectTrigger className="w-full h-9 text-sm">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="di bawah 500 Jt">&lt; 500 Jt</SelectItem>
                      <SelectItem value="500 Jt - 1 M">500Jt - 1M</SelectItem>
                      <SelectItem value="1 M - 3 M">1M - 3M</SelectItem>
                      <SelectItem value="3 M - 5 M">3M - 5M</SelectItem>
                      <SelectItem value="di atas 5 M">&gt; 5M</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Pesan</Label>
                <Textarea
                  placeholder="Tulis pesan Anda..."
                  value={formData.message}
                  onChange={(e) => updateField('message', e.target.value)}
                  rows={3}
                  className="text-sm"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-10 text-sm"
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Mengirim...' : (
                  <>
                    <Send className="size-4 mr-1.5" />
                    Kirim Pesan
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
