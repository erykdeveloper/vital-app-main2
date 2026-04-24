import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Crown, Check, CreditCard, QrCode } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const benefits = [
  {
    title: 'Progresso Corporal Avançado',
    description: 'Acompanhe sua evolução com gráficos, histórico detalhado e comparativos.',
  },
  {
    title: 'Monitoramento de Injetáveis',
    description: 'Registre e acompanhe suas aplicações com lembretes inteligentes.',
  },
  {
    title: 'Comunidade Vital Prime',
    description: 'Suporte exclusivo, conteúdos especiais e interação com a equipe Vital.',
  },
  {
    title: 'Desafios Semanais com Selos de Conquista',
    description: 'Participe de desafios e ganhe selos ao completar suas metas.',
  },
  {
    title: 'Alertas Inteligentes',
    description: 'Receba insights automáticos sobre sua evolução e mantenha a consistência.',
  },
  {
    title: 'Suporte Prioritário',
    description: 'Tenha atendimento preferencial e respostas rápidas.',
  },
  {
    title: 'Lives Exclusivas',
    description: 'Acesso a transmissões especiais com especialistas e convidados.',
  },
  {
    title: 'Descontos em Consultas',
    description: 'Economize em consultas online ou presenciais.',
  },
  {
    title: 'Histórico Ilimitado',
    description: 'Acesso total e sem restrições às suas métricas e evoluções.',
  },
];

interface PaymentProduct {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  billing_cycle: string;
}

interface CheckoutResponse {
  checkout: {
    checkout_url: string | null;
    pix_qr_code: string | null;
    pix_copy_paste: string | null;
  };
}

const formatCurrency = (priceCents: number, currency: string) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(priceCents / 100);

export default function Premium() {
  const { toast } = useToast();
  const location = useLocation();
  const [product, setProduct] = useState<PaymentProduct | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const autoCheckoutTriggeredRef = useRef(false);
  const registerFlowState = location.state as
    | { autostartCheckout?: boolean; paymentMethod?: 'pix' | 'credit_card'; fromRegister?: boolean }
    | null;

  useEffect(() => {
    if (registerFlowState?.paymentMethod) {
      setPaymentMethod(registerFlowState.paymentMethod);
    }
  }, [registerFlowState?.paymentMethod]);

  useEffect(() => {
    const paymentStatus = new URLSearchParams(window.location.search).get('payment');

    if (paymentStatus === 'success') {
      toast({
        title: 'Pagamento recebido',
        description: 'Seu acesso Premium sera atualizado apos a confirmacao do gateway.',
      });
    }

    if (paymentStatus === 'pending') {
      toast({
        title: 'Checkout criado',
        description: 'Conecte o gateway escolhido para finalizar pagamentos reais.',
      });
    }

    if (paymentStatus === 'cancelled') {
      toast({
        title: 'Pagamento cancelado',
        description: 'Voce pode tentar novamente quando quiser.',
      });
    }
  }, [toast]);

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      setIsLoading(true);

      try {
        const response = await api.get<{ products: PaymentProduct[] }>('/payments/products');
        const premiumProduct = response.products.find((item) => item.billing_cycle === 'monthly') ?? response.products[0];

        if (isMounted) {
          setProduct(premiumProduct ?? null);
        }
      } catch (error) {
        if (isMounted) {
          toast({
            title: 'Nao foi possivel carregar o plano',
            description: error instanceof Error ? error.message : 'Tente novamente em instantes.',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProduct();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  async function handleCheckout() {
    if (!product) {
      toast({
        title: 'Plano indisponivel',
        description: 'Nenhum plano ativo foi encontrado para compra.',
        variant: 'destructive',
      });
      return;
    }

    setIsCheckoutLoading(true);

    try {
      const response = await api.post<CheckoutResponse>('/payments/checkout', {
        product_id: product.id,
        payment_method: paymentMethod,
      });

      if (response.checkout.checkout_url) {
        window.location.href = response.checkout.checkout_url;
        return;
      }

      toast({
        title: 'Pedido criado',
        description: 'O gateway ainda precisa ser conectado para concluir o pagamento.',
      });
    } catch (error) {
      toast({
        title: 'Nao foi possivel iniciar o pagamento',
        description: error instanceof Error ? error.message : 'Revise os dados e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsCheckoutLoading(false);
    }
  }

  useEffect(() => {
    if (!registerFlowState?.autostartCheckout) return;
    if (autoCheckoutTriggeredRef.current) return;
    if (isLoading || !product || isCheckoutLoading) return;

    autoCheckoutTriggeredRef.current = true;
    toast({
      title: 'Conta criada',
      description: 'Estamos iniciando seu checkout premium.',
    });
    void handleCheckout();
  }, [isCheckoutLoading, isLoading, product, registerFlowState?.autostartCheckout, toast]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Seja Premium</h1>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-br from-accent/30 to-accent/10 rounded-2xl p-6 text-center space-y-4 border border-accent/30">
        <div className="w-20 h-20 mx-auto bg-accent rounded-full flex items-center justify-center">
          <Crown className="w-10 h-10 text-accent-foreground" />
        </div>
        <h2 className="text-2xl font-bold">Seja Premium</h2>
        <p className="text-muted-foreground">
          Desbloqueie todo o seu potencial com recursos exclusivos
        </p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-accent">
            {isLoading ? '...' : product ? formatCurrency(product.price_cents, product.currency) : 'Indisponivel'}
          </span>
          <span className="text-muted-foreground">/mês</span>
        </div>
        {registerFlowState?.fromRegister && (
          <p className="text-sm text-accent">
            Sua conta já foi criada. Falta só concluir o pagamento para liberar o Premium.
          </p>
        )}
      </div>

      {/* Benefits */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">O que você terá acesso:</h3>
        <div className="space-y-3">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3 bg-card rounded-xl p-4">
              <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-accent" />
              </div>
              <div>
                <span className="font-medium">{benefit.title}</span>
                <p className="text-sm text-muted-foreground mt-0.5">{benefit.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 space-y-4 border">
        <div>
          <h3 className="font-semibold">Forma de pagamento</h3>
          <p className="text-sm text-muted-foreground">
            O pagamento sera finalizado em ambiente seguro do gateway. Nao salvamos dados de cartao.
          </p>
        </div>

        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as 'pix' | 'credit_card')}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <Label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-accent/10">
            <RadioGroupItem value="pix" />
            <QrCode className="w-5 h-5 text-accent" />
            <span>PIX</span>
          </Label>
          <Label className="flex items-center gap-3 rounded-xl border p-4 cursor-pointer hover:bg-accent/10">
            <RadioGroupItem value="credit_card" />
            <CreditCard className="w-5 h-5 text-accent" />
            <span>Cartao de credito</span>
          </Label>
        </RadioGroup>
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={handleCheckout}
          disabled={!product || isLoading || isCheckoutLoading}
          className="w-full max-w-md bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6 rounded-xl"
        >
          {isCheckoutLoading ? 'Iniciando pagamento...' : 'Assinar agora'}
        </Button>
      </div>
    </div>
  );
}
