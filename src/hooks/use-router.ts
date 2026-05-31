'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';

// Simple hash-based router for SPA within single route

type Route = 
  | { page: 'home' }
  | { page: 'properties'; params?: Record<string, string> }
  | { page: 'property-detail'; slug: string }
  | { page: 'articles' }
  | { page: 'article-detail'; slug: string }
  | { page: 'agents' }
  | { page: 'agent-detail'; id: string }
  | { page: 'contact' }
  | { page: 'admin-login' }
  | { page: 'admin-dashboard' }
  | { page: 'admin-properties' }
  | { page: 'admin-property-edit'; id?: string }
  | { page: 'admin-leads' }
  | { page: 'admin-lead-detail'; id: string }
  | { page: 'admin-articles' }
  | { page: 'admin-article-edit'; id?: string }
  | { page: 'admin-agents' }
  | { page: 'admin-agent-edit'; id?: string }
  | { page: 'admin-locations' }
  | { page: 'admin-property-types' }
  | { page: 'admin-settings' }
  | { page: 'admin-media' }
  | { page: 'admin-trash' };

function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  
  if (!clean || clean === 'home') return { page: 'home' };
  
  if (clean.startsWith('properties/')) {
    const slug = clean.replace('properties/', '');
    return { page: 'property-detail', slug };
  }
  if (clean === 'properties') return { page: 'properties' };
  
  if (clean.startsWith('articles/')) {
    const slug = clean.replace('articles/', '');
    return { page: 'article-detail', slug };
  }
  if (clean === 'articles') return { page: 'articles' };
  
  if (clean.startsWith('agents/')) {
    const id = clean.replace('agents/', '');
    return { page: 'agent-detail', id };
  }
  if (clean === 'agents') return { page: 'agents' };
  
  if (clean === 'contact') return { page: 'contact' };
  
  // Admin routes
  if (clean === 'admin') return { page: 'admin-dashboard' };
  if (clean === 'admin/login') return { page: 'admin-login' };
  if (clean === 'admin/properties') return { page: 'admin-properties' };
  if (clean.startsWith('admin/properties/edit/')) {
    const id = clean.replace('admin/properties/edit/', '');
    return { page: 'admin-property-edit', id };
  }
  if (clean === 'admin/properties/new') return { page: 'admin-property-edit' };
  if (clean === 'admin/leads') return { page: 'admin-leads' };
  if (clean.startsWith('admin/leads/')) {
    const id = clean.replace('admin/leads/', '');
    return { page: 'admin-lead-detail', id };
  }
  if (clean === 'admin/articles') return { page: 'admin-articles' };
  if (clean.startsWith('admin/articles/edit/')) {
    const id = clean.replace('admin/articles/edit/', '');
    return { page: 'admin-article-edit', id };
  }
  if (clean === 'admin/articles/new') return { page: 'admin-article-edit' };
  if (clean === 'admin/agents') return { page: 'admin-agents' };
  if (clean.startsWith('admin/agents/edit/')) {
    const id = clean.replace('admin/agents/edit/', '');
    return { page: 'admin-agent-edit', id };
  }
  if (clean === 'admin/agents/new') return { page: 'admin-agent-edit' };
  if (clean === 'admin/locations') return { page: 'admin-locations' };
  if (clean === 'admin/property-types') return { page: 'admin-property-types' };
  if (clean === 'admin/settings') return { page: 'admin-settings' };
  if (clean === 'admin/media') return { page: 'admin-media' };
  if (clean === 'admin/trash') return { page: 'admin-trash' };
  
  return { page: 'home' };
}

function routeToHash(route: Route): string {
  switch (route.page) {
    case 'home': return '#/';
    case 'properties': return '#/properties';
    case 'property-detail': return `#/properties/${route.slug}`;
    case 'articles': return '#/articles';
    case 'article-detail': return `#/articles/${route.slug}`;
    case 'agents': return '#/agents';
    case 'agent-detail': return `#/agents/${route.id}`;
    case 'contact': return '#/contact';
    case 'admin-login': return '#/admin/login';
    case 'admin-dashboard': return '#/admin';
    case 'admin-properties': return '#/admin/properties';
    case 'admin-property-edit': return route.id ? `#/admin/properties/edit/${route.id}` : '#/admin/properties/new';
    case 'admin-leads': return '#/admin/leads';
    case 'admin-lead-detail': return `#/admin/leads/${route.id}`;
    case 'admin-articles': return '#/admin/articles';
    case 'admin-article-edit': return route.id ? `#/admin/articles/edit/${route.id}` : '#/admin/articles/new';
    case 'admin-agents': return '#/admin/agents';
    case 'admin-agent-edit': return route.id ? `#/admin/agents/edit/${route.id}` : '#/admin/agents/new';
    case 'admin-locations': return '#/admin/locations';
    case 'admin-property-types': return '#/admin/property-types';
    case 'admin-settings': return '#/admin/settings';
    case 'admin-media': return '#/admin/media';
    case 'admin-trash': return '#/admin/trash';
    default: return '#/';
  }
}

// Subscribe to hashchange events (and scroll to top on navigation)
let hashListeners: (() => void)[] = [];
let hashChangeRegistered = false;

function registerHashListener(callback: () => void) {
  hashListeners.push(callback);
  if (!hashChangeRegistered) {
    hashChangeRegistered = true;
    window.addEventListener('hashchange', () => {
      window.scrollTo(0, 0);
      hashListeners.forEach((cb) => cb());
    });
  }
  return () => {
    hashListeners = hashListeners.filter((cb) => cb !== callback);
  };
}

// Snapshot functions return the hash STRING — strings are compared by value,
// so Object.is('#/', '#/') is true. This avoids infinite re-render.
function getHashSnapshot(): string {
  return window.location.hash;
}

// Server snapshot: empty hash → parseHash('') → { page: 'home' }
function getServerHashSnapshot(): string {
  return '';
}

export function useRouter() {
  // Subscribe to hash as a STRING (stable by value comparison)
  const hash = useSyncExternalStore(registerHashListener, getHashSnapshot, getServerHashSnapshot);

  // Parse the hash string into a Route object only when it changes
  const route = useMemo(() => parseHash(hash), [hash]);

  const navigate = useCallback((newRoute: Route) => {
    const hash = routeToHash(newRoute);
    // Only update if different to avoid unnecessary history entries
    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  }, []);

  const goBack = useCallback(() => {
    window.history.back();
  }, []);

  return { route, navigate, goBack };
}

export { routeToHash };
export type { Route };
