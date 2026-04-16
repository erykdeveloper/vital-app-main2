import { useState, useEffect, useRef } from 'react';
import { User, Edit, LogOut, Save, X } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { handleIntegerKeyDown, handleDecimalKeyDown, sanitizeInteger, sanitizeDecimal } from '@/lib/inputValidation';

export default function Settings() {
  const { signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [highlightBMI, setHighlightBMI] = useState(false);
  const bmiFieldsRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    age: '',
    height_cm: '',
    weight_kg: '',
  });

  // Auto-edit when coming from BMI card
  useEffect(() => {
    if (searchParams.get('edit') === 'bmi' && profile && !loading) {
      setFormData({
        full_name: profile.full_name,
        phone: profile.phone || '',
        age: String(profile.age),
        height_cm: String(profile.height_cm),
        weight_kg: String(profile.weight_kg),
      });
      setEditing(true);
      setHighlightBMI(true);
      // Clear the query param
      setSearchParams({});
      // Scroll to BMI fields after a short delay
      setTimeout(() => {
        bmiFieldsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      // Remove highlight after animation
      setTimeout(() => setHighlightBMI(false), 2000);
    }
  }, [searchParams, profile, loading, setSearchParams]);

  const startEditing = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        phone: profile.phone || '',
        age: String(profile.age),
        height_cm: String(profile.height_cm),
        weight_kg: String(profile.weight_kg),
      });
    }
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await updateProfile({
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null,
        age: Number(formData.age),
        height_cm: Number(formData.height_cm),
        weight_kg: Number(formData.weight_kg),
      });

      if (error) throw new Error(error);

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas.',
      });
      setEditing(false);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{profile?.full_name}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>
          {!editing && (
            <Button variant="ghost" size="icon" onClick={startEditing}>
              <Edit className="w-5 h-5" />
            </Button>
          )}
        </div>

        {editing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                className="bg-input border-border"
              />
            </div>
            <div 
              ref={bmiFieldsRef}
              className={cn(
                "grid grid-cols-3 gap-3 p-2 -m-2 rounded-xl transition-all duration-500",
                highlightBMI && "ring-2 ring-accent bg-accent/10"
              )}
            >
              <div className="space-y-2">
                <Label htmlFor="age">Idade</Label>
                <Input
                  id="age"
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={formData.age}
                  onKeyDown={handleIntegerKeyDown}
                  onChange={(e) => setFormData((prev) => ({ ...prev, age: sanitizeInteger(e.target.value) }))}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height_cm">Altura (cm)</Label>
                <Input
                  id="height_cm"
                  type="text"
                  inputMode="numeric"
                  maxLength={3}
                  value={formData.height_cm}
                  onKeyDown={handleIntegerKeyDown}
                  onChange={(e) => setFormData((prev) => ({ ...prev, height_cm: sanitizeInteger(e.target.value) }))}
                  className="bg-input border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight_kg">Peso (kg)</Label>
                <Input
                  id="weight_kg"
                  type="text"
                  inputMode="decimal"
                  maxLength={6}
                  value={formData.weight_kg}
                  onKeyDown={handleDecimalKeyDown}
                  onChange={(e) => setFormData((prev) => ({ ...prev, weight_kg: sanitizeDecimal(e.target.value) }))}
                  className="bg-input border-border"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={cancelEditing}
                className="flex-1 border-border"
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={saving}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-2xl font-bold text-accent">{profile?.age}</p>
              <p className="text-xs text-muted-foreground">anos</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-2xl font-bold text-accent">{profile?.height_cm}</p>
              <p className="text-xs text-muted-foreground">cm</p>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <p className="text-2xl font-bold text-accent">{profile?.weight_kg}</p>
              <p className="text-xs text-muted-foreground">kg</p>
            </div>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <Button
        variant="outline"
        onClick={handleLogout}
        className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Sair da conta
      </Button>

      {/* App Info */}
      <div className="text-center text-sm text-muted-foreground pt-4">
        <p>Dra. Gabriela Zinhani Issy</p>
        <p>Saúde & Performance</p>
        <p className="mt-2">v1.0.0</p>
      </div>
    </div>
  );
}
