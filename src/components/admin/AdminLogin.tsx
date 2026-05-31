'use client';

import { useState } from 'react';
import { useRouter } from '@/hooks/use-router';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const { navigate } = useRouter();

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100 dark:from-emerald-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-xl bg-emerald-100 dark:bg-emerald-900 mb-2">
            <Building2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Admin Panel</CardTitle>
          <CardDescription>Masuk ke dashboard PropNusa</CardDescription>
        </CardHeader>
        <CardContent>
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
