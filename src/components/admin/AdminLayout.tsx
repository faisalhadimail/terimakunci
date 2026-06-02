'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter, type Route } from '@/hooks/use-router';
import { useAuthStore, useUIStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building,
  Users,
  FileText,
  UserCog,
  MapPin,
  Home,
  Settings,
  Globe,
  LogOut,
  Menu,
  ChevronDown,
  Plus,
  List,
  Image as ImageIcon,
  Building2,
} from 'lucide-react';

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  route: Route;
  children?: { label: string; icon: React.ComponentType<{ className?: string }>; route: Route }[];
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, route: { page: 'admin-dashboard' } },
  {
    label: 'Properti',
    icon: Building,
    route: { page: 'admin-properties' },
    children: [
      { label: 'Semua Properti', icon: List, route: { page: 'admin-properties' } },
      { label: 'Tambah Baru', icon: Plus, route: { page: 'admin-property-edit' } },
    ],
  },
  { label: 'Leads', icon: Users, route: { page: 'admin-leads' } },
  {
    label: 'Artikel',
    icon: FileText,
    route: { page: 'admin-articles' },
    children: [
      { label: 'Semua Artikel', icon: List, route: { page: 'admin-articles' } },
      { label: 'Tambah Baru', icon: Plus, route: { page: 'admin-article-edit' } },
    ],
  },
  { label: 'Agen', icon: UserCog, route: { page: 'admin-agents' } },
  { label: 'Lokasi', icon: MapPin, route: { page: 'admin-locations' } },
  { label: 'Jenis Properti', icon: Home, route: { page: 'admin-property-types' } },
  { label: 'Pengaturan', icon: Settings, route: { page: 'admin-settings' } },
  { label: 'Media', icon: ImageIcon, route: { page: 'admin-media' } },
];

function isActive(route: Route, currentPage: Route): boolean {
  if (route.page === currentPage.page) return true;
  if (route.page === 'admin-properties' && currentPage.page === 'admin-property-edit') return true;
  if (route.page === 'admin-leads' && currentPage.page === 'admin-lead-detail') return true;
  if (route.page === 'admin-articles' && currentPage.page === 'admin-article-edit') return true;
  if (route.page === 'admin-agents' && currentPage.page === 'admin-agent-edit') return true;
  return false;
}

function SidebarNav({ items, currentRoute, onNavigate, className }: {
  items: MenuItem[];
  currentRoute: Route;
  onNavigate: (r: Route) => void;
  className?: string;
}) {
  return (
    <nav className={cn('flex flex-col gap-1 p-3', className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.route, currentRoute);

        if (item.children) {
          const childActive = item.children.some((c) => isActive(c.route, currentRoute));
          return (
            <DropdownMenu key={item.label}>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    childActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="start" className="w-48">
                {item.children.map((child) => {
                  const ChildIcon = child.icon;
                  const cActive = isActive(child.route, currentRoute);
                  return (
                    <DropdownMenuItem
                      key={child.label}
                      onClick={() => onNavigate(child.route)}
                      className={cn(
                        'cursor-pointer',
                        cActive && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                      )}
                    >
                      <ChildIcon className="mr-2 h-4 w-4" />
                      {child.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        }

        return (
          <button
            key={item.label}
            onClick={() => onNavigate(item.route)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function MobileSidebar({ currentRoute, onNavigate }: {
  currentRoute: Route;
  onNavigate: (r: Route) => void;
}) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);

  return (
    <Sheet open={sidebarOpen} onOpenChange={toggleSidebar}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-600" />
            <span className="font-bold">TerimaKunci</span>
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-80px)]">
          <SidebarNav
            items={menuItems}
            currentRoute={currentRoute}
            onNavigate={(r) => {
              onNavigate(r);
              toggleSidebar();
            }}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { route, navigate } = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const logout = useAuthStore((s) => s.logout);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAdmin) {
    navigate({ page: 'admin-login' });
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate({ page: 'home' });
  };

  const getPageTitle = (): string => {
    const titles: Record<string, string> = {
      'admin-dashboard': 'Dashboard',
      'admin-properties': 'Properti',
      'admin-property-edit': route.page === 'admin-property-edit' && route.id ? 'Edit Properti' : 'Tambah Properti',
      'admin-leads': 'Leads',
      'admin-lead-detail': 'Detail Lead',
      'admin-articles': 'Artikel',
      'admin-article-edit': route.page === 'admin-article-edit' && route.id ? 'Edit Artikel' : 'Tambah Artikel',
      'admin-agents': 'Agen',
      'admin-agent-edit': route.page === 'admin-agent-edit' && route.id ? 'Edit Agen' : 'Tambah Agen',
      'admin-locations': 'Lokasi',
      'admin-property-types': 'Jenis Properti',
      'admin-settings': 'Pengaturan',
      'admin-media': 'Media',
      'admin-trash': 'Tempat Sampah',
    };
    return titles[route.page] || 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:bg-white lg:dark:bg-gray-900">
        <div className="flex items-center gap-2 px-4 py-4 border-b">
          <Building2 className="h-6 w-6 text-emerald-600" />
          <span className="font-bold text-lg">TerimaKunci</span>
        </div>
        <ScrollArea className="flex-1">
          <SidebarNav items={menuItems} currentRoute={route} onNavigate={navigate} />
          <Separator className="mx-3" />
          <div className="p-3">
            <button
              onClick={() => navigate({ page: 'home' })}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
              <Globe className="h-4 w-4" />
              Kembali ke Website
            </button>
          </div>
        </ScrollArea>
      </aside>

      {/* Mobile Sidebar */}
      <MobileSidebar currentRoute={route} onNavigate={navigate} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 items-center gap-4 border-b bg-white px-4 lg:px-6 dark:bg-gray-900">
          {/* Mobile Menu Toggle */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-emerald-600" />
                  <span className="font-bold">TerimaKunci</span>
                </SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-80px)]">
                <SidebarNav
                  items={menuItems}
                  currentRoute={route}
                  onNavigate={(r) => {
                    navigate(r);
                  }}
                />
                <Separator className="mx-3" />
                <div className="p-3">
                  <button
                    onClick={() => navigate({ page: 'home' })}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    Kembali ke Website
                  </button>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <h1 className="text-lg font-semibold">{getPageTitle()}</h1>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden sm:block text-sm text-muted-foreground">
              {user?.name || 'Admin'}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
