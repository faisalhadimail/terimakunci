'use client';

import { type ReactNode } from 'react';
import {
  Home,
  Building2,
  FileText,
  Users,
  MessageCircle,
  Shield,
} from 'lucide-react';
import { useRouter, Route } from '@/hooks/use-router';
import { useDataCache } from '@/lib/store';
import { cn } from '@/lib/utils';
import { useSearchPopup } from './PropertySearchPopup';
import PropertySearchPopup from './PropertySearchPopup';

interface FrontendLayoutProps {
  children: ReactNode;
}

const TAB_ITEMS = [
  { label: 'Home', page: 'home' as const, icon: Home },
  { label: 'Properti', page: 'properties' as const, icon: Building2 },
  { label: 'Artikel', page: 'articles' as const, icon: FileText },
  { label: 'Agen', page: 'agents' as const, icon: Users },
  { label: 'Kontak', page: 'contact' as const, icon: MessageCircle },
];

export default function FrontendLayout({ children }: FrontendLayoutProps) {
  const { route, navigate } = useRouter();
  const { settings, propertyTypes, cities } = useDataCache();
  const { showPopup, closePopup } = useSearchPopup();

  const getSetting = (key: string, fallback: string = ''): string => {
    const s = settings.find((s) => s.key === key);
    return s?.value || fallback;
  };

  const companyName = getSetting('site_name', 'TerimaKunci');
  const whatsappNumber = getSetting('contact_whatsapp', '6281234567890');
  const currentPage = route.page;

  const getActiveTab = (): string => {
    if (currentPage === 'home') return 'home';
    if (currentPage === 'properties' || currentPage === 'property-detail') return 'properties';
    if (currentPage === 'articles' || currentPage === 'article-detail') return 'articles';
    if (currentPage === 'agents' || currentPage === 'agent-detail') return 'agents';
    if (currentPage === 'contact') return 'contact';
    return 'home';
  };

  const handleTabClick = (page: Route['page']) => {
    navigate({ page } as Route);
  };

  const activeTab = getActiveTab();

  return (
    <div className="max-w-[430px] mx-auto h-screen flex flex-col bg-gray-50 relative overflow-hidden">
      {/* ===== TOP BAR ===== */}
      <header className="shrink-0 z-40 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between h-12 px-4">
          {/* Logo */}
          <button
            onClick={() => handleTabClick('home')}
            className="flex items-center gap-2 min-w-0 flex-1"
          >
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              <Building2 className="size-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 truncate">
              {companyName}
            </span>
          </button>

          {/* Right side buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Admin Login */}
            <button
              onClick={() => navigate({ page: 'admin-login' })}
              className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
              title="Login Admin"
            >
              <Shield className="size-4" />
            </button>
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${whatsappNumber}?text=Halo, saya tertarik dengan properti di ${companyName}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-full transition-colors"
            >
              <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Chat
            </a>
          </div>
        </div>
      </header>

      {/* ===== SCROLLABLE CONTENT ===== */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* ===== BOTTOM TAB BAR ===== */}
      <nav className="absolute bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200">
        <div className="flex items-center justify-around h-[56px] px-2">
          {TAB_ITEMS.map((tab) => {
            const isActive = activeTab === tab.page;
            return (
              <button
                key={tab.page}
                onClick={() => handleTabClick(tab.page)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-xl transition-all',
                  isActive
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-400 active:text-gray-600 active:bg-gray-50'
                )}
              >
                <tab.icon
                  className={cn(
                    'size-[22px] transition-all',
                    isActive && 'scale-110'
                  )}
                  fill={isActive ? 'currentColor' : 'none'}
                  strokeWidth={isActive ? 2 : 1.8}
                />
                <span className={cn(
                  'text-[10px] font-semibold leading-tight',
                  isActive ? 'text-emerald-600' : 'text-gray-400'
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ===== SEARCH POPUP (first visit only) ===== */}
      <PropertySearchPopup
        propertyTypes={propertyTypes}
        cities={cities}
        open={showPopup}
        onClose={closePopup}
      />
    </div>
  );
}
