import { create } from 'zustand';
import { Property, Lead, Article, AgentProfile, PropertyType, Province, City, District, Village, ArticleCategory, User, WebsiteSetting, DashboardStats } from './types';

// ============ AUTH STORE ============
interface AuthState {
  user: User | null;
  token: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAdmin: false,
  
  login: async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, token: data.token, isAdmin: true });
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  
  logout: () => {
    set({ user: null, token: null, isAdmin: false });
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  },
  
  checkAuth: () => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('auth_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAdmin: true });
      } catch {
        set({ user: null, token: null, isAdmin: false });
      }
    }
  },
}));

// ============ PROPERTY STORE ============
interface PropertyState {
  properties: Property[];
  currentProperty: Property | null;
  filters: Record<string, string | number | boolean | undefined>;
  pagination: { page: number; limit: number; total: number; totalPages: number };
  sort: string;
  loading: boolean;
  setProperties: (data: Property[], pagination: any) => void;
  setCurrentProperty: (p: Property | null) => void;
  setFilters: (f: Record<string, any>) => void;
  setSort: (s: string) => void;
  setLoading: (l: boolean) => void;
  setPage: (p: number) => void;
}

export const usePropertyStore = create<PropertyState>((set) => ({
  properties: [],
  currentProperty: null,
  filters: {},
  pagination: { page: 1, limit: 12, total: 0, totalPages: 0 },
  sort: 'newest',
  loading: false,
  setProperties: (data, pagination) => set({ properties: data, pagination }),
  setCurrentProperty: (p) => set({ currentProperty: p }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f }, pagination: { ...s.pagination, page: 1 } })),
  setSort: (s) => set({ sort: s }),
  setLoading: (l) => set({ loading: l }),
  setPage: (p) => set((s) => ({ pagination: { ...s.pagination, page: p } })),
}));

// ============ LEAD STORE ============
interface LeadState {
  leads: Lead[];
  currentLead: Lead | null;
  loading: boolean;
  setLeads: (data: Lead[]) => void;
  setCurrentLead: (l: Lead | null) => void;
  setLoading: (l: boolean) => void;
}

export const useLeadStore = create<LeadState>((set) => ({
  leads: [],
  currentLead: null,
  loading: false,
  setLeads: (data) => set({ leads: data }),
  setCurrentLead: (l) => set({ currentLead: l }),
  setLoading: (l) => set({ loading: l }),
}));

// ============ DATA CACHE STORE ============
interface DataCacheState {
  propertyTypes: PropertyType[];
  provinces: Province[];
  cities: City[];
  districts: District[];
  villages: Village[];
  articleCategories: ArticleCategory[];
  agents: AgentProfile[];
  settings: WebsiteSetting[];
  dashboardStats: DashboardStats | null;
  setPropertyTypes: (data: PropertyType[]) => void;
  setProvinces: (data: Province[]) => void;
  setCities: (data: City[]) => void;
  setDistricts: (data: District[]) => void;
  setVillages: (data: Village[]) => void;
  setArticleCategories: (data: ArticleCategory[]) => void;
  setAgents: (data: AgentProfile[]) => void;
  setSettings: (data: WebsiteSetting[]) => void;
  setDashboardStats: (data: DashboardStats | null) => void;
}

export const useDataCache = create<DataCacheState>((set) => ({
  propertyTypes: [],
  provinces: [],
  cities: [],
  districts: [],
  villages: [],
  articleCategories: [],
  agents: [],
  settings: [],
  dashboardStats: null,
  setPropertyTypes: (data) => set({ propertyTypes: data }),
  setProvinces: (data) => set({ provinces: data }),
  setCities: (data) => set({ cities: data }),
  setDistricts: (data) => set({ districts: data }),
  setVillages: (data) => set({ villages: data }),
  setArticleCategories: (data) => set({ articleCategories: data }),
  setAgents: (data) => set({ agents: data }),
  setSettings: (data) => set({ settings: data }),
  setDashboardStats: (data) => set({ dashboardStats: data }),
}));

// ============ UI STATE STORE ============
interface UIState {
  sidebarOpen: boolean;
  searchQuery: string;
  toggleSidebar: () => void;
  setSearchQuery: (q: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  searchQuery: '',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSearchQuery: (q) => set({ searchQuery: q }),
}));
