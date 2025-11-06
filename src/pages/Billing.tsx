import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

interface Subscription {
  id: string;
  plan_code: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  provider: string | null;
}

const PLAN_NAMES: Record<string, string> = {
  TRIAL: 'Essai gratuit',
  FREE: 'Gratuit',
  BASIC: 'Basique',
  PRO: 'Professionnel',
  ENTERPRISE: 'Entreprise'
};

const PLAN_PRICES: Record<string, string> = {
  FREE: '0€',
  BASIC: '29€',
  PRO: '79€',
  ENTERPRISE: 'Sur mesure'
};

export default function BillingPage() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      loadSubscription();
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Erreur chargement abonnement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (newPlan: string) => {
    setIsUpdating(true);
    try {
      // TODO: Intégrer avec Stripe ou autre provider
      toast.info("Fonctionnalité de paiement à implémenter (Stripe, etc.)");
    } catch (error) {
      console.error('Erreur upgrade:', error);
      toast.error("Erreur lors de la mise à niveau");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelAtPeriodEnd = async () => {
    if (!subscription) return;

    if (!confirm("Êtes-vous sûr de vouloir annuler votre abonnement à la fin de la période en cours ?")) {
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: true })
        .eq('id', subscription.id);

      if (error) throw error;

      toast.success("Abonnement programmé pour annulation");
      loadSubscription();
    } catch (error) {
      console.error('Erreur annulation:', error);
      toast.error("Erreur lors de l'annulation");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReactivate = async () => {
    if (!subscription) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ cancel_at_period_end: false })
        .eq('id', subscription.id);

      if (error) throw error;

      toast.success("Abonnement réactivé");
      loadSubscription();
    } catch (error) {
      console.error('Erreur réactivation:', error);
      toast.error("Erreur lors de la réactivation");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const isTrialing = subscription?.status === 'trialing';
  const isExpired = subscription?.status === 'expired';
  const willCancel = subscription?.cancel_at_period_end;

  return (
    <div className="container max-w-5xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Facturation et Abonnement</h1>
        <p className="text-muted-foreground">
          Gérez votre plan et vos paiements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Abonnement actuel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Abonnement actuel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">
                      {PLAN_NAMES[subscription.plan_code] || subscription.plan_code}
                    </h3>
                    <p className="text-muted-foreground">
                      {PLAN_PRICES[subscription.plan_code] || 'Variable'}/mois
                    </p>
                  </div>
                  <Badge variant={
                    isTrialing ? 'secondary' :
                    isExpired ? 'destructive' :
                    'default'
                  }>
                    {isTrialing ? 'Essai' :
                     isExpired ? 'Expiré' :
                     subscription.status === 'active' ? 'Actif' :
                     subscription.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Début de période</p>
                    <p className="font-medium">
                      {format(new Date(subscription.current_period_start), "d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Fin de période</p>
                    <p className="font-medium">
                      {format(new Date(subscription.current_period_end), "d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                </div>

                {willCancel && (
                  <div className="flex items-start gap-2 p-3 border border-destructive/50 rounded-lg bg-destructive/10">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-destructive">
                        Annulation programmée
                      </p>
                      <p className="text-muted-foreground">
                        Votre abonnement prendra fin le {format(new Date(subscription.current_period_end), "d MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {!willCancel && !isExpired && (
                    <Button
                      variant="destructive"
                      onClick={handleCancelAtPeriodEnd}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        'Annuler à la fin de période'
                      )}
                    </Button>
                  )}

                  {willCancel && (
                    <Button
                      variant="default"
                      onClick={handleReactivate}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Traitement...
                        </>
                      ) : (
                        'Réactiver l\'abonnement'
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}

            {!subscription && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Aucun abonnement actif
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Méthode de paiement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Méthode de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6">
              <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Aucune carte enregistrée
              </p>
              <Button variant="outline" size="sm" disabled>
                Ajouter une carte
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plans disponibles */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Plans disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['BASIC', 'PRO', 'ENTERPRISE'].map((plan) => (
            <Card key={plan} className={subscription?.plan_code === plan ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle>{PLAN_NAMES[plan]}</CardTitle>
                <p className="text-3xl font-bold">{PLAN_PRICES[plan]}</p>
                <p className="text-sm text-muted-foreground">/mois</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm mb-6">
                  {plan === 'BASIC' && (
                    <>
                      <li>✓ 1 établissement</li>
                      <li>✓ Import avis Google</li>
                      <li>✓ Analyses de base</li>
                      <li>✓ Support email</li>
                    </>
                  )}
                  {plan === 'PRO' && (
                    <>
                      <li>✓ 5 établissements</li>
                      <li>✓ Import multi-sources</li>
                      <li>✓ Analyses avancées</li>
                      <li>✓ Support prioritaire</li>
                      <li>✓ API access</li>
                    </>
                  )}
                  {plan === 'ENTERPRISE' && (
                    <>
                      <li>✓ Établissements illimités</li>
                      <li>✓ Toutes les fonctionnalités</li>
                      <li>✓ Support dédié 24/7</li>
                      <li>✓ SLA garanti</li>
                      <li>✓ Personnalisation</li>
                    </>
                  )}
                </ul>
                <Button
                  className="w-full"
                  variant={subscription?.plan_code === plan ? 'secondary' : 'default'}
                  onClick={() => handleUpgrade(plan)}
                  disabled={subscription?.plan_code === plan || isUpdating}
                >
                  {subscription?.plan_code === plan ? 'Plan actuel' : 'Choisir ce plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}