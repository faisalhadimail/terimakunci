'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2, Loader2, Eye, EyeOff,
  Database, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, RefreshCw, Shield,
} from 'lucide-react';

type DbStatus = {
  status: string;
  message: string;
  hasCredentials: boolean;
  firestoreConnected: boolean;
  userCount: number;
  firebaseProjectId: string;
  howToFix?: string;
  firestoreError?: string;
};

const STATUS_CONFIG: Record<string, {
  icon: typeof CheckCircle2;
  color: string;
  bg: string;
  border: string;
  label: string;
}> = {
  OK: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    label: 'Terhubung',
  },
  NO_ADMIN: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    label: 'Database Kosong',
  },
  NO_CREDENTIALS: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Tidak Terhubung',
  },
  FIRESTORE_ERROR: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Error Koneksi',
  },
  LOADING: {
    icon: Loader2,
    color: 'text-gray-400',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    label: 'Mengecek...',
  },
};

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const login = useAuthStore((s) => s.login);
  const { navigate } = useRouter();

  const checkDbConnection = useCallback(async () => {
    setDbLoading(true);
    try {
      const res = await fetch('/api/setup');
      const json = await res.json();
      if (json.data) {
        setDbStatus(json.data as DbStatus);
      }
    } catch {
      setDbStatus({
        status: 'FIRESTORE_ERROR',
        message: 'Gagal mengecek koneksi database.',
        hasCredentials: false,
        firestoreConnected: false,
        userCount: 0,
        firebaseProjectId: '',
      });
    } finally {
      setDbLoading(false);
    }
  }, []);

  useEffect(() => {
    checkDbConnection();
  }, [checkDbConnection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await login(email, password);
      if (ok) {
        navigate({ page: 'admin-dashboard' });
      } else {
        setError('Email atau password salah. Silakan coba lagi.');
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const statusKey = dbLoading ? 'LOADING' : (dbStatus?.status || 'LOADING');
  const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG.LOADING;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-emerald-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900 mb-2">
            <Building2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Panel</CardTitle>
          <CardDescription>Masuk ke dashboard TerimaKunci</CardDescription>
        </CardHeader>
        <CardContent>
          {/* ─── Database Connection Status ─── */}
          <div
            className={`rounded-lg border p-3 mb-5 ${statusConfig.bg} ${statusConfig.border} transition-all`}
          >
            <button
              type="button"
              className="flex items-center justify-between w-full text-left gap-2"
              onClick={() => setShowDetails(!showDetails)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <StatusIcon
                  className={`h-4 w-4 shrink-0 ${statusConfig.color} ${dbLoading && statusKey === 'LOADING' ? 'animate-spin' : ''}`}
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className={`text-sm font-medium ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {dbLoading ? 'Mengecek koneksi...' : dbStatus?.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); checkDbConnection(); }}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                {showDetails ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {/* Expanded details */}
            {showDetails && !dbLoading && dbStatus && (
              <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <InfoRow
                    label="Firebase Project"
                    value={dbStatus.firebaseProjectId}
                  />
                  <InfoRow
                    label="Credentials"
                    value={dbStatus.hasCredentials ? '✅ Ada' : '❌ Belum ada'}
                    isError={!dbStatus.hasCredentials}
                  />
                  <InfoRow
                    label="Firestore"
                    value={dbStatus.firestoreConnected ? '✅ Terhubung' : '❌ Gagal'}
                    isError={!dbStatus.firestoreConnected}
                  />
                  <InfoRow
                    label="User Count"
                    value={String(dbStatus.userCount)}
                  />
                </div>

                {/* Fix instructions for NO_CREDENTIALS */}
                {dbStatus.status === 'NO_CREDENTIALS' && dbStatus.howToFix && (
                  <div className="mt-3 p-2.5 rounded bg-white/60 dark:bg-black/20 space-y-1.5">
                    <div className="flex items-center gap-1 font-medium text-red-700 dark:text-red-400">
                      <Shield className="h-3.5 w-3.5" />
                      <span>Cara menghubungkan Firebase:</span>
                    </div>
                    <ol className="space-y-1 pl-4 list-decimal text-muted-foreground">
                      <li>Buka <strong>Firebase Console</strong> → Project Settings → <strong>Service Accounts</strong></li>
                      <li>Klik <strong>Generate New Private Key</strong></li>
                      <li>Copy <strong>seluruh isi file JSON</strong></li>
                      <li>Di Vercel: <strong>Settings → Environment Variables</strong></li>
                      <li>Tambah <code className="bg-red-100 dark:bg-red-900/50 px-1 rounded text-[11px] font-mono">FIREBASE_SERVICE_ACCOUNT_KEY</code> dengan isi JSON</li>
                      <li><strong>Redeploy</strong> di Vercel</li>
                    </ol>
                  </div>
                )}

                {/* NO_ADMIN hint */}
                {dbStatus.status === 'NO_ADMIN' && (
                  <div className="mt-2 p-2 rounded bg-amber-100/60 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">
                    💡 Login pertama dengan <strong>admin@properti.com</strong> akan otomatis membuat akun admin.
                  </div>
                )}

                {/* Firestore error detail */}
                {dbStatus.status === 'FIRESTORE_ERROR' && dbStatus.firestoreError && (
                  <div className="mt-2 p-2 rounded bg-red-100/60 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-mono break-all">
                    {dbStatus.firestoreError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── Login Form ─── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/50 p-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@properti.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Button
              variant="link"
              className="text-emerald-600 hover:text-emerald-700"
              onClick={() => navigate({ page: 'home' })}
            >
              &larr; Kembali ke Website
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Small info row component ───
function InfoRow({ label, value, isError }: { label: string; value: string; isError?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${isError ? 'text-red-600 dark:text-red-400' : ''}`}>
        {value}
      </span>
    </div>
  );
}
