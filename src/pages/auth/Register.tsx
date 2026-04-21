import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    age: '',
    height_cm: '',
    weight_kg: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading, register } = useAuth();
  const { toast } = useToast();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handler for numeric-only fields (age, height)
  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: string,
    maxValue?: number
  ) => {
    const numbersOnly = e.target.value.replace(/\D/g, '');
    let value = numbersOnly;
    
    if (maxValue && numbersOnly !== '') {
      const numValue = parseInt(numbersOnly, 10);
      value = Math.min(numValue, maxValue).toString();
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handler for weight field (accepts comma for decimals)
  const handleWeightInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^0-9,]/g, '');
    // Allow only one comma
    const parts = sanitized.split(',');
    const formatted = parts.length > 2 
      ? parts[0] + ',' + parts.slice(1).join('')
      : sanitized;
    setFormData(prev => ({ ...prev, weight_kg: formatted }));
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ variant: 'destructive', title: 'Email inválido' });
      return false;
    }
    if (formData.password.length < 6) {
      toast({ variant: 'destructive', title: 'Senha deve ter pelo menos 6 caracteres' });
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast({ variant: 'destructive', title: 'As senhas não coincidem' });
      return false;
    }
    if (Number(formData.age) <= 0) {
      toast({ variant: 'destructive', title: 'Idade inválida' });
      return false;
    }
    if (Number(formData.height_cm) <= 0) {
      toast({ variant: 'destructive', title: 'Altura inválida' });
      return false;
    }
    const weightValue = parseFloat(formData.weight_kg.replace(',', '.'));
    if (isNaN(weightValue) || weightValue <= 0) {
      toast({ variant: 'destructive', title: 'Peso inválido' });
      return false;
    }
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const weightValue = parseFloat(formData.weight_kg.replace(',', '.'));
      await register({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        age: Number(formData.age),
        height_cm: Number(formData.height_cm),
        weight_kg: weightValue,
        password: formData.password,
      });
      toast({
        title: 'Conta criada com sucesso!',
        description: 'Bem-vindo(a)!',
      });
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
    <div className="min-h-screen bg-background flex flex-col p-6">
      <div className="w-full max-w-sm mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold">Criar Conta</h1>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-accent rounded-full flex items-center justify-center mb-2">
            <Heart className="w-8 h-8 text-accent-foreground" />
          </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              name="full_name"
              placeholder="Seu nome"
              value={formData.full_name}
              onChange={handleChange}
              required
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="bg-input border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={handleChange}
              className="bg-input border-border"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                name="age"
                type="text"
                inputMode="numeric"
                maxLength={3}
                placeholder="25"
                value={formData.age}
                onChange={(e) => handleNumericInput(e, 'age', 150)}
                required
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height_cm">Altura (cm)</Label>
              <Input
                id="height_cm"
                name="height_cm"
                type="text"
                inputMode="numeric"
                maxLength={3}
                placeholder="170"
                value={formData.height_cm}
                onChange={(e) => handleNumericInput(e, 'height_cm', 300)}
                required
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight_kg">Peso (kg)</Label>
              <Input
                id="weight_kg"
                name="weight_kg"
                type="text"
                inputMode="decimal"
                maxLength={6}
                placeholder="70,5"
                value={formData.weight_kg}
                onChange={handleWeightInput}
                required
                className="bg-input border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="bg-input border-border pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="bg-input border-border"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar conta'}
          </Button>
        </form>

        <p className="text-center text-muted-foreground text-sm">
          Já tem conta?{' '}
          <Link to="/login" className="text-accent hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
