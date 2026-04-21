import { useState, useEffect, useRef } from 'react';
import { User, Edit, LogOut, Save, X, Trophy, BarChart3, Scale, ArrowLeft, Camera } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useAchievements } from '@/hooks/useAchievements';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { handleIntegerKeyDown, handleDecimalKeyDown, sanitizeInteger, sanitizeDecimal } from '@/lib/inputValidation';

export default function Profile() {
  const { signOut } = useAuth();
  const { profile, loading, uploading, updateProfile, uploadAvatar } = useProfile();
  const { achievements, userAchievements } = useAchievements();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [highlightBMI, setHighlightBMI] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const bmiFieldsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setSearchParams({});
      setTimeout(() => {
        bmiFieldsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
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
    setAvatarPreview(null);
    setSelectedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Tipo inválido',
        description: 'Use JPG, PNG, WebP ou GIF.',
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Arquivo muito grande',
        description: 'Máximo 5MB.',
      });
      return;
    }

    setSelectedFile(file);
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    
    if (!editing) {
      startEditing();
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload avatar if a new file was selected
      if (selectedFile) {
        const { error: avatarError } = await uploadAvatar(selectedFile);
        if (avatarError) {
          toast({
            variant: 'destructive',
            title: 'Erro ao enviar foto',
            description: avatarError,
          });
        }
      }

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
      setAvatarPreview(null);
      setSelectedFile(null);
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
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-card rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="relative cursor-pointer group"
              onClick={handleAvatarClick}
            >
              <Avatar className="w-16 h-16 border-2 border-accent/30">
                <AvatarImage 
                  src={avatarPreview || profile?.avatar_url || undefined} 
                  alt={profile?.full_name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-accent/20 text-accent text-xl">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || <User className="w-8 h-8" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileSelect}
            />
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

      {/* Meu Progresso Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Meu Progresso</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/workouts/dashboard" className="h-full">
            <div className="bg-card rounded-xl p-4 h-full min-h-[80px] flex items-center gap-3 hover:bg-secondary transition-colors">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
                <BarChart3 className="w-6 h-6 text-accent" />
              </div>
              <div className="min-w-0">
                <span className="font-medium block truncate">Desempenho</span>
                <span className="text-xs text-muted-foreground">Estatísticas</span>
              </div>
            </div>
          </Link>
          <Link to="/body-progress" className="h-full">
            <div className="bg-card rounded-xl p-4 h-full min-h-[80px] flex items-center gap-3 hover:bg-secondary transition-colors">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center shrink-0">
                <Scale className="w-6 h-6 text-accent" />
              </div>
              <div className="min-w-0">
                <span className="font-medium block truncate">Corpo</span>
                <span className="text-xs text-muted-foreground">Peso e medidas</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Conquistas Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent" />
          Conquistas
        </h2>
        <div className="bg-card rounded-xl p-4">
          {achievements && achievements.length > 0 ? (
            <div className="grid grid-cols-4 gap-4">
              {achievements.map((achievement) => {
                const isUnlocked = userAchievements?.some(
                  (ua) => ua.achievement_id === achievement.id
                );
                return (
                  <div
                    key={achievement.id}
                    className={cn(
                      "flex flex-col items-center gap-2 text-center",
                      !isUnlocked && "opacity-40"
                    )}
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center text-2xl",
                      isUnlocked ? "bg-accent/20" : "bg-muted"
                    )}>
                      {achievement.icon || '🏆'}
                    </div>
                    <span className="text-xs font-medium leading-tight">
                      {achievement.name}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-4">
              <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Suas conquistas aparecerão aqui</p>
            </div>
          )}
        </div>
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
