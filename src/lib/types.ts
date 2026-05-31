// ============ PROPERTY TYPES ============
export interface PropertyType {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
}

// ============ LOCATION TYPES ============
export interface Province {
  id: string;
  name: string;
  slug: string;
}

export interface City {
  id: string;
  name: string;
  slug: string;
  provinceId: string;
}

export interface District {
  id: string;
  name: string;
  slug: string;
  cityId: string;
}

export interface Village {
  id: string;
  name: string;
  slug: string;
  districtId: string;
}

// ============ PROPERTY ============
export interface PropertyImage {
  id: string;
  propertyId: string;
  url: string;
  altText?: string;
  sortOrder: number;
}

export interface Property {
  id: string;
  code: string;
  title: string;
  slug: string;
  description: string;
  propertyTypeId: string;
  status: 'dijual' | 'disewa' | 'terjual' | 'tersewa' | 'draft';
  isFeatured: boolean;
  isNego: boolean;
  isNew: boolean;
  isPublished: boolean;
  price: number;
  priceDisplay: string;
  provinceId?: string;
  cityId?: string;
  districtId?: string;
  villageId?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  landArea: number;
  buildingArea: number;
  bedrooms: number;
  bathrooms: number;
  garages: number;
  floors: number;
  electricity?: string;
  waterSource?: string;
  certificate?: string;
  buildingCond?: string;
  orientation?: string;
  facilities?: string;
  visibleSpecs?: string;
  mainImage?: string;
  videoUrl?: string;
  virtualTourUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  agentId?: string;
  publishedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Joined
  propertyType?: PropertyType;
  province?: Province;
  city?: City;
  district?: District;
  village?: Village;
  agent?: { id: string; name: string; phone?: string; avatar?: string };
  images?: PropertyImage[];
  _count?: { leads: number };
}

// ============ LEAD ============
export interface Lead {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
  phone?: string;
  propertyId?: string;
  propertyName?: string;
  locationInterest?: string;
  budget?: string;
  propertyTypeInterest?: string;
  needType: 'beli' | 'sewa' | 'investasi' | 'survei' | 'tanya_harga';
  source: string;
  status: 'baru' | 'dihubungi' | 'prospek' | 'survei' | 'negosiasi' | 'closing' | 'gagal' | 'spam';
  notes?: string;
  dpAmount?: string;
  promo?: string;
  agentId?: string;
  nextFollowUp?: string;
  followUpNotes?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  agent?: { id: string; name: string };
  property?: { id: string; title: string; slug: string };
}

// ============ ARTICLE ============
export interface ArticleCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  categoryId?: string;
  tags?: string;
  featuredImage?: string;
  isPublished: boolean;
  publishedAt?: string;
  scheduledAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  authorId?: string;
  viewCount: number;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  category?: ArticleCategory;
  author?: { id: string; name: string };
}

// ============ AGENT ============
export interface AgentProfile {
  id: string;
  userId: string;
  name: string;
  title?: string;
  photo?: string;
  whatsapp: string;
  email?: string;
  bio?: string;
  areaSpec?: string;
  isActive: boolean;
  sortOrder: number;
  _count?: { properties: number; leads: number };
}

// ============ USER ============
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: 'super_admin' | 'admin' | 'editor' | 'agent' | 'viewer' | 'seo_manager';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  agentProfile?: AgentProfile;
}

// ============ WEBSITE SETTINGS ============
export interface WebsiteSetting {
  id: string;
  key: string;
  value: string;
  group: string;
}

// ============ MEDIA ============
export interface Media {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
  altText?: string;
  folder: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ DASHBOARD STATS ============
export interface DashboardStats {
  totalProperties: number;
  activeProperties: number;
  draftProperties: number;
  soldProperties: number;
  rentedProperties: number;
  totalLeads: number;
  newLeadsToday: number;
  newLeadsThisMonth: number;
  leadsByStatus: { status: string; count: number }[];
  leadsBySource: { source: string; count: number }[];
  publishedArticles: number;
  topViewedProperties: Property[];
  topViewedArticles: Article[];
  leadsPerMonth: { month: string; count: number }[];
  listingsPerMonth: { month: string; count: number }[];
}

// ============ ROUTE TYPES ============
export type FrontendRoute =
  | { page: 'home' }
  | { page: 'properties'; filters?: PropertyFilters }
  | { page: 'property-detail'; slug: string }
  | { page: 'articles' }
  | { page: 'article-detail'; slug: string }
  | { page: 'agents' }
  | { page: 'agent-detail'; id: string }
  | { page: 'contact' };

export type AdminRoute =
  | { page: 'dashboard' }
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

// ============ FILTER TYPES ============
export interface PropertyFilters {
  keyword?: string;
  cityId?: string;
  districtId?: string;
  villageId?: string;
  propertyTypeId?: string;
  status?: string;
  priceMin?: number;
  priceMax?: number;
  landAreaMin?: number;
  landAreaMax?: number;
  buildingAreaMin?: number;
  buildingAreaMax?: number;
  bedroomsMin?: number;
  bathroomsMin?: number;
  certificate?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'largest';
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}
