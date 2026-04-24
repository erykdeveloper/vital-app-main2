import { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
    cref: '',
    cref_state: '',
    specialties: '',
    experience_years: '',
    instagram_handle: '',
    proof_notes: '',
  });
  const [accountType, setAccountType] = useState<'client' | 'personal'>('client');
  const [selectedPlan, setSelectedPlan] = useState<'essential' | 'premium'>('premium');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, loading: authLoading, register } = useAuth();
  const { toast } = useToast();

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-accent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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

    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleWeightInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/[^0-9,]/g, '');
    const parts = sanitized.split(',');
    const formatted = parts.length > 2 ? parts[0] + ',' + parts.slice(1).join('') : sanitized;
    setFormData((prev) => ({ ...prev, weight_kg: formatted }));
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
    if (accountType === 'personal') {
      if (!formData.cref.trim() || !formData.cref_state.trim()) {
        toast({ variant: 'destructive', title: 'Informe CREF e UF para solicitar acesso de personal' });
        return false;
      }
      if (!formData.proof_notes.trim()) {
        toast({ variant: 'destructive', title: 'Explique sua comprovação profissional' });
        return false;
      }
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
        account_type: accountType,
        trainer_application:
          accountType === 'personal'
            ? {
                cref: formData.cref.trim(),
                cref_state: formData.cref_state.trim().toUpperCase(),
                specialties: formData.specialties.trim() || null,
                experience_years: formData.experience_years ? Number(formData.experience_years) : null,
                instagram_handle: formData.instagram_handle.trim() || null,
                proof_notes: formData.proof_notes.trim() || null,
              }
            : undefined,
      });

      toast({
        title: accountType === 'personal' ? 'Solicitação enviada!' : 'Conta criada com sucesso!',
        description:
          accountType === 'personal'
            ? 'Seu cadastro de personal ficou pendente de aprovação pela administração.'
            : selectedPlan === 'premium'
              ? 'Agora vamos finalizar seu acesso premium.'
              : 'Bem-vindo(a)!',
      });

      navigate(
        accountType === 'personal' ? '/' : selectedPlan === 'premium' ? '/premium' : '/',
        accountType === 'personal'
          ? undefined
          : selectedPlan === 'premium'
            ? {
                state: {
                  autostartCheckout: true,
                  paymentMethod,
                  fromRegister: true,
                },
              }
            : undefined,
      );
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

          <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
            <div>
              <h2 className="font-semibold">Tipo de cadastro</h2>
              <p className="text-sm text-muted-foreground">
                Escolha se você está entrando como cliente ou solicitando acesso como personal trainer.
              </p>
            </div>

            <RadioGroup
              value={accountType}
              onValueChange={(value) => setAccountType(value as 'client' | 'personal')}
              className="gap-3"
            >
              <Label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 hover:bg-secondary/30">
                <RadioGroupItem value="client" className="mt-1" />
                <div>
                  <p className="font-medium">Sou aluno / cliente</p>
                  <p className="text-sm text-muted-foreground">
                    Fluxo normal de cadastro com opção de plano Essencial ou Premium.
                  </p>
                </div>
              </Label>

              <Label className="flex cursor-pointer items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4 hover:bg-accent/10">
                <RadioGroupItem value="personal" className="mt-1" />
                <div>
                  <p className="font-medium">Sou personal trainer</p>
                  <p className="text-sm text-muted-foreground">
                    O acesso do personal é gratuito após aprovação, para trazer e acompanhar alunos.
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {accountType === 'client' ? (
            <div className="space-y-3 rounded-2xl border border-border bg-card/60 p-4">
              <div>
                <h2 className="font-semibold">Escolha seu plano ao criar a conta</h2>
                <p className="text-sm text-muted-foreground">
                  Você pode entrar no Essencial agora ou já seguir direto para a compra do Premium.
                </p>
              </div>

              <RadioGroup
                value={selectedPlan}
                onValueChange={(value) => setSelectedPlan(value as 'essential' | 'premium')}
                className="gap-3"
              >
                <Label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-4 hover:bg-secondary/30">
                  <RadioGroupItem value="essential" className="mt-1" />
                  <div>
                    <p className="font-medium">Plano Essencial</p>
                    <p className="text-sm text-muted-foreground">Cria a conta e entra no app sem cobrança imediata.</p>
                  </div>
                </Label>

                <Label className="flex cursor-pointer items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 p-4 hover:bg-accent/10">
                  <RadioGroupItem value="premium" className="mt-1" />
                  <div>
                    <p className="font-medium">Quero ser Premium agora</p>
                    <p className="text-sm text-muted-foreground">
                      A conta é criada e você segue direto para finalizar o pagamento.
                    </p>
                  </div>
                </Label>
              </RadioGroup>

              {selectedPlan === 'premium' && (
                <div className="space-y-3 rounded-xl border border-border bg-background/30 p-3">
                  <p className="text-sm font-medium">Forma de pagamento inicial</p>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as 'pix' | 'credit_card')}
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <Label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary/30">
                      <RadioGroupItem value="pix" />
                      <span className="text-sm">PIX</span>
                    </Label>
                    <Label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-secondary/30">
                      <RadioGroupItem value="credit_card" />
                      <span className="text-sm">Cartão de crédito</span>
                    </Label>
                  </RadioGroup>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border border-accent/30 bg-accent/5 p-4">
              <div>
                <h2 className="font-semibold">Validação de personal trainer</h2>
                <p className="text-sm text-muted-foreground">
                  Seu cadastro ficará pendente até validação dos dados. Depois da aprovação, o acesso premium do personal será liberado gratuitamente.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="cref">CREF</Label>
                  <Input
                    id="cref"
                    name="cref"
                    value={formData.cref}
                    onChange={handleChange}
                    placeholder="Ex.: 123456-G/SP"
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cref_state">UF</Label>
                  <Input
                    id="cref_state"
                    name="cref_state"
                    value={formData.cref_state}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cref_state: e.target.value.toUpperCase().slice(0, 2) }))}
                    placeholder="SP"
                    className="bg-input border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="specialties">Especialidades</Label>
                  <Input
                    id="specialties"
                    name="specialties"
                    value={formData.specialties}
                    onChange={handleChange}
                    placeholder="Ex.: hipertrofia, emagrecimento"
                    className="bg-input border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="experience_years">Anos de experiência</Label>
                  <Input
                    id="experience_years"
                    name="experience_years"
                    type="text"
                    inputMode="numeric"
                    value={formData.experience_years}
                    onChange={(e) => handleNumericInput(e, 'experience_years', 80)}
                    placeholder="5"
                    className="bg-input border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_handle">Instagram profissional</Label>
                <Input
                  id="instagram_handle"
                  name="instagram_handle"
                  value={formData.instagram_handle}
                  onChange={handleChange}
                  placeholder="@seuusuario"
                  className="bg-input border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="proof_notes">Comprovação e apresentação</Label>
                <Input
                  id="proof_notes"
                  name="proof_notes"
                  value={formData.proof_notes}
                  onChange={handleChange}
                  placeholder="Explique sua atuação, nicho e dados para validação"
                  className="bg-input border-border"
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
            disabled={loading}
          >
            {loading
              ? 'Criando...'
              : accountType === 'personal'
                ? 'Enviar cadastro para aprovação'
                : selectedPlan === 'premium'
                  ? 'Criar conta e ir para o pagamento'
                  : 'Criar conta'}
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
