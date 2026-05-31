'use client';

import { useRouter, Route } from '@/hooks/use-router';
import { useAuthStore, useDataCache } from '@/lib/store';
import { useEffect, useState } from 'react';
import FrontendLayout from '@/components/frontend/FrontendLayout';
import HomePage from '@/components/frontend/HomePage';
import PropertyListPage from '@/components/frontend/PropertyListPage';
import PropertyDetailPage from '@/components/frontend/PropertyDetailPage';
import ArticleListPage from '@/components/frontend/ArticleListPage';
import ArticleDetailPage from '@/components/frontend/ArticleDetailPage';
import AgentListPage from '@/components/frontend/AgentListPage';
import AgentDetailPage from '@/components/frontend/AgentDetailPage';
import ContactPage from '@/components/frontend/ContactPage';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminPropertyList from '@/components/admin/AdminPropertyList';
import AdminPropertyForm from '@/components/admin/AdminPropertyForm';
import AdminLeadList from '@/components/admin/AdminLeadList';
import AdminLeadDetail from '@/components/admin/AdminLeadDetail';
import AdminArticleList from '@/components/admin/AdminArticleList';
import AdminArticleForm from '@/components/admin/AdminArticleForm';
import AdminAgentList from '@/components/admin/AdminAgentList';
import AdminAgentForm from '@/components/admin/AdminAgentForm';
import AdminLocationManager from '@/components/admin/AdminLocationManager';
import AdminPropertyTypeManager from '@/components/admin/AdminPropertyTypeManager';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminMediaManager from '@/components/admin/AdminMediaManager';

function FrontendRouter() {
  const { route } = useRouter();
  const { setSettings } = useDataCache();

  // Load settings on mount
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setSettings(Array.isArray(data) ? data : data.data || []);
      })
      .catch(() => {});
  }, [setSettings]);

  switch (route.page) {
    case 'home':
      return <HomePage />;
    case 'properties':
      return <PropertyListPage />;
    case 'property-detail':
      return <PropertyDetailPage />;
    case 'articles':
      return <ArticleListPage />;
    case 'article-detail':
      return <ArticleDetailPage />;
    case 'agents':
      return <AgentListPage />;
    case 'agent-detail':
      return <AgentDetailPage />;
    case 'contact':
      return <ContactPage />;
    default:
      return <HomePage />;
  }
}

function AdminRouter() {
  const { route } = useRouter();

  switch (route.page) {
    case 'admin-login':
      return <AdminLogin />;
    case 'admin-dashboard':
      return <AdminDashboard />;
    case 'admin-properties':
      return <AdminPropertyList />;
    case 'admin-property-edit':
      return <AdminPropertyForm />;
    case 'admin-leads':
      return <AdminLeadList />;
    case 'admin-lead-detail':
      return <AdminLeadDetail />;
    case 'admin-articles':
      return <AdminArticleList />;
    case 'admin-article-edit':
      return <AdminArticleForm />;
    case 'admin-agents':
      return <AdminAgentList />;
    case 'admin-agent-edit':
      return <AdminAgentForm />;
    case 'admin-locations':
      return <AdminLocationManager />;
    case 'admin-property-types':
      return <AdminPropertyTypeManager />;
    case 'admin-settings':
      return <AdminSettings />;
    case 'admin-media':
      return <AdminMediaManager />;
    case 'admin-trash':
      return <div className="p-6"><h2 className="text-lg font-semibold">Tempat Sampah</h2><p className="text-muted-foreground">Coming soon</p></div>;
    default:
      return <AdminDashboard />;
  }
}

export default function Home() {
  const { route } = useRouter();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const isAdminRoute = route.page.startsWith('admin');

  if (isAdminRoute) {
    // Admin login is standalone (no layout)
    if (route.page === 'admin-login') {
      return <AdminLogin />;
    }
    // All other admin pages use AdminLayout
    return (
      <AdminLayout>
        <AdminRouter />
      </AdminLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <FrontendLayout>
        <FrontendRouter />
      </FrontendLayout>
    </div>
  );
}
