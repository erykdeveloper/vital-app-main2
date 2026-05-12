import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Apple, Eye, EyeOff, Heart, Lock, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading, signIn } = useAuth();
  const { toast } = useToast();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      navigate('/');
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: err instanceof Error ? err.message : 'Ocorreu um erro inesperado.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-6 pb-7 pt-10">
        <header className="flex h-14 items-center justify-between">
          <Link
            to="/onboarding"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Voltar"
          >
            <X className="h-5 w-5" />
          </Link>

          <div className="flex items-center gap-2 rounded-full border border-white/5 bg-card/80 px-3 py-2 shadow-elegant">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow">
              <Heart className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">Vitalissy</span>
          </div>
        </header>

        <main className="flex flex-1 flex-col pt-12">
          <div className="space-y-2">
            <h1 className="text-[2rem] font-bold leading-tight tracking-normal">Entrar</h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Acesse sua rotina de saúde e performance.
            </p>
          </div>

          <div className="mt-7 grid gap-3">
            <button
              type="button"
              onClick={() =>
                toast({
                  title: 'Login social indisponível',
                  description: 'Entre com email e senha para acessar sua conta.',
                })
              }
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-card/70 px-4 text-base font-semibold shadow-elegant transition-colors hover:bg-secondary"
            >
              <Apple className="h-5 w-5" />
              Entrar com Apple
            </button>
            <button
              type="button"
              onClick={() =>
                toast({
                  title: 'Login social indisponível',
                  description: 'Entre com email e senha para acessar sua conta.',
                })
              }
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-card/70 px-4 text-base font-semibold shadow-elegant transition-colors hover:bg-secondary"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                G
              </span>
              Entrar com Google
            </button>
          </div>

          <div className="my-7 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            <span>Ou entre com email</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="grid gap-3">
              <div className="relative">
                <Label htmlFor="email" className="sr-only">
                  Email
                </Label>
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 rounded-xl border-white/5 bg-secondary/70 pl-12 pr-4 text-base placeholder:text-muted-foreground focus-visible:ring-offset-0"
                />
              </div>

              <div className="relative">
                <Label htmlFor="password" className="sr-only">
                  Senha
                </Label>
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-14 rounded-xl border-white/5 bg-secondary/70 pl-12 pr-12 text-base placeholder:text-muted-foreground focus-visible:ring-offset-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-14 w-full rounded-xl bg-gradient-primary text-base font-bold text-primary-foreground shadow-glow hover:opacity-95"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <button
            type="button"
            onClick={() =>
              toast({
                title: 'Recuperação de senha em breve',
                description: 'Por enquanto, fale com o suporte para redefinir seu acesso.',
              })
            }
            className="mt-7 block text-center text-base font-semibold text-primary transition-colors hover:text-primary/85"
          >
            Esqueci minha senha
          </button>

          <div className="mt-auto space-y-3 pb-3 pt-12 text-center">
            <p className="text-xs leading-relaxed text-muted-foreground/75">
              Saúde & Performance<br />
              Dra. Gabriela Zinhani Issy<br />
              CRM GO 33159 / SP 254121
            </p>
            <p className="text-base text-foreground">
              Não tem conta?{' '}
              <Link to="/registro" className="font-semibold text-primary hover:underline">
                Criar conta
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
