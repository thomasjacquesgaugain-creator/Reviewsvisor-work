import { useState, useEffect, useRef } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { toast as sonnerToast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { importGoogleReviews } from '@/lib/importGoogleReviews';
import { Loader2, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { sendReviewImportNotification } from '@/services/importNotificationService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface GoogleImportButtonProps {
  onSuccess?: () => void;
  placeId?: string;
  onOpenVisualPanel?: () => void;
  onClose?: () => void;
  establishmentName?: string;
  establishmentAddress?: string;
}

interface Location {
  name: string;
  locationName: string;
  address?: {
    addressLines?: string[];
  };
}

type ToastPayload = {
  title: string;
  description?: string;
  variant?: 'destructive' | 'default';
  action?: {
    label: string;
    onClick: () => void;
  };
};

const toast = ({ title, description, variant, action }: ToastPayload) => {
  const common = { description, action } as const;

  if (variant === 'destructive') return sonnerToast.error(title, common);
  if (title.trim().startsWith('✅')) return sonnerToast.success(title, common);
  if (title.trim().startsWith('⚠️')) return sonnerToast.warning(title, common);

  return sonnerToast(title, common);
};

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_FUNCTIONS_BASE_URL = `${SUPABASE_URL}/functions/v1`;
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';

async function callEdgeFunction<T = any>(
  name: string,
  body?: unknown,
): Promise<{
  url: string;
  status: number;
  ok: boolean;
  data: T | null;
  rawText: string;
}> {
  const url = `${SUPABASE_FUNCTIONS_BASE_URL}/${name}`;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    apikey: SUPABASE_ANON_KEY,
  };

  if (session?.access_token) {
    headers.authorization = `Bearer ${session.access_token}`;
  }

  const safeHeadersForLog = {
    'content-type': headers['content-type'],
    apikey: '(anon)',
    authorization: headers.authorization ? 'Bearer ***' : undefined,
  };

  console.log('[google-sync] request', {
    url,
    method: 'POST',
    headers: safeHeadersForLog,
    body: body ?? null,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
  });

  const rawText = await res.text();
  let data: T | null = null;
  try {
    data = (rawText ? JSON.parse(rawText) : null) as T | null;
  } catch {
    // Keep rawText for debugging
  }

  console.log('[google-sync] response', {
    url,
    status: res.status,
    ok: res.ok,
    data,
    rawText: data ? undefined : rawText,
  });

  return {
    url,
    status: res.status,
    ok: res.ok,
    data,
    rawText,
  };
}

export default function GoogleImportButton({
  onSuccess,
  placeId,
  onOpenVisualPanel,
  onClose,
  establishmentName,
  establishmentAddress,
}: GoogleImportButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [accountId, setAccountId] = useState<string>('');
  const [hasExistingConnection, setHasExistingConnection] = useState(false);
  const [showApiNotConfiguredDialog, setShowApiNotConfiguredDialog] = useState(false);
  const [isOutscraperImporting, setIsOutscraperImporting] = useState(false);


  // Ref to track if an operation is in progress (prevents double-clicks)
  const operationInProgress = useRef(false);

  // Check for existing Google connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: connection } = await supabase
          .from('google_connections')
          .select('id, token_expires_at')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .maybeSingle();

        if (connection) {
          setHasExistingConnection(true);

          // If we just came back from OAuth (redirect flow), auto-continue
          const params = new URLSearchParams(window.location.search);
          if (params.get('google') === 'connected') {
            params.delete('google');
            const next = params.toString();
            window.history.replaceState(
              {},
              '',
              `${window.location.pathname}${next ? `?${next}` : ''}`,
            );
            await fetchAccountsAndLocations();
          }
        }
      } catch (err) {
        console.error('Error checking Google connection:', err);
      }
    };

    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get dynamic redirect URI based on current environment
  const getRedirectUri = () => {
    const origin = window.location.origin;
    return `${origin}/api/auth/callback/google/index.html`;
  };

  const handleContinueWithOutscraper = async () => {
    if (!placeId) {
      toast({
        title: t('common.error'),
        description: t('import.pleaseAddEstablishmentFirst'),
        variant: 'destructive',
      });
      return;
    }

    const name = establishmentName?.trim() || '';
    const address = establishmentAddress?.trim() || '';
    if (!name || !address) {
      toast({
        title: t('common.error'),
        description: t(
          'googleImport.cannotFallbackWithoutEstablishmentInfo',
          'Missing establishment name or address for Outscraper fallback.',
        ),
        variant: 'destructive',
      });
      return;
    }

    setIsOutscraperImporting(true);

    try {
      const result = await importGoogleReviews(placeId, 5000, {
        name,
        address,
        source: 'google',
      });      

      if (result.success) {
        const inserted = Number(result.inserted ?? 0);
        const skipped = Number(result.skipped ?? 0);
        const updated=Number(result.updated??0)

        setShowApiNotConfiguredDialog(false);
        sonnerToast.success(
          t(
            'googleImport.fallbackImportSuccess',
            'Outscraper import completed successfully',
          ),
          {
            description: t("googleImport.import_summary", { inserted, skipped, updated }),
          },
        );

        void sendReviewImportNotification({
          establishmentName: establishmentName?.trim() || 'Your establishment',
          source: 'outscraper',
          inserted,
          skipped,
          updated,
          total: inserted + updated,
        });

        window.dispatchEvent(new CustomEvent('reviews:imported'));
        onSuccess?.();

        if (onOpenVisualPanel) {
          onOpenVisualPanel();
          setTimeout(() => {
            document.getElementById('reviews-visual-anchor')?.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          }, 100);
        }

        if (onClose) {
          onClose();
        }
        return;
      }

      toast({
        title: `${t('common.error')}: ${t('googleImport.fallbackImportFailed')}`,
        description: result.error || t('googleImport.syncFailure'),
        variant: 'destructive',
      });
    } catch (error: any) {
      console.error('[google-sync] Outscraper fallback failed:', error);
      toast({
        title: `${t('common.error')}: ${t('googleImport.fallbackImportFailed')}`,
        description: error?.message || t('googleImport.syncFailure'),
        variant: 'destructive',
      });
    } finally {
      setIsOutscraperImporting(false);
    }
  };

  const handleImportClick = async () => {
    console.log('[google-sync] click', {
      placeId,
      hasExistingConnection,
      at: new Date().toISOString(),
    });

    // Guard against double-clicks
    if (loading || operationInProgress.current) {
      console.log('[google-sync] ignored: already in progress');
      return;
    }

    // Toast obligatoire avant tout appel API (preuve visible)
    toast({
      title: t('googleImport.syncStarted'),
      description: t('googleImport.fetchingGoogleReviews'),
    });

    if (hasExistingConnection) {
      console.log('[google-sync] connection exists → fetch accounts');
      await fetchAccountsAndLocations();
    } else {
      console.log('[google-sync] no connection → initiate OAuth');
      await initiateGoogleOAuth();
    }
  };

  const initiateGoogleOAuth = async () => {
    if (operationInProgress.current) return;
    operationInProgress.current = true;
    setLoading(true);

    try {
      console.log('🔐 Initiating Google OAuth...');

      // Fetch client ID from edge function
      const { data: configData, error: configError } =
        await supabase.functions.invoke('google-client-config');

      if (configError || !configData?.clientId) {
        toast({
          title: t('googleImport.incompleteOAuthConfig'),
          description: t('googleImport.addGoogleClientIdAndSecret'),
          variant: 'destructive',
        });
        throw new Error(t('googleImport.incompleteOAuthConfig'));
      }

      const clientId = configData.clientId;
      const redirectUri = getRedirectUri();
      const scope = [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/business.manage',
      ].join(' ');

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      console.log('🔗 OAuth redirect URI:', redirectUri);

      // Try popup first. If blocked, fallback to full redirect.
      const popup = window.open(
        authUrl.toString(),
        'googleOAuth',
        'width=600,height=700,left=200,top=100',
      );

      if (!popup) {
        console.log('📲 Popup blocked, redirecting...');
        window.location.href = authUrl.toString();
        return;
      }

      // Reset loading since popup opened (user will interact there)
      setLoading(false);
      operationInProgress.current = false;

      // Listen for OAuth callback messages
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'oauth-success') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          setHasExistingConnection(true);
          toast({
            title: t('googleImport.connectionSuccess'),
            description: t('googleImport.fetchingLocations'),
          });
          await fetchAccountsAndLocations();
        } else if (event.data.type === 'oauth-error') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          toast({
            title: t('errors.oauthError'),
            description: event.data.error || t('errors.connectionFailed'),
            variant: 'destructive',
          });
        }
      };

      window.addEventListener('message', handleMessage);


const checkPopupClosed = setInterval(() => {
  if (!popup || popup.closed) {
    clearInterval(checkPopupClosed);
    window.removeEventListener('message', handleMessage);

    // If popup closed but we never got oauth-success, it means it failed or errored
    // Check if connection was established — if not, show the fallback dialog
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('google_connections')
        .select('id')
        .eq('user_id', user.id)
        .eq('provider', 'google')
        .maybeSingle()
        .then(({ data: connection }) => {
          if (!connection) {
            // Popup closed with no successful connection → show dialog
            setShowApiNotConfiguredDialog(true);
          }
        });
    });
  }
}, 500);
    } catch (error: any) {
      console.error('❌ Error initiating OAuth:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('errors.cannotStartAuthentication'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      operationInProgress.current = false;
    }
  };

  const fetchAccountsAndLocations = async () => {
    if (operationInProgress.current) {
      console.log(
        '[google-sync] fetchAccountsAndLocations ignored: already in progress',
      );
      return;
    }

    operationInProgress.current = true;
    setLoading(true);
    console.log('[google-sync] fetchAccountsAndLocations:start', { placeId });

    try {
      // 1) Accounts
      const accountsRes = await callEdgeFunction<any>(
        'google-business-accounts',
      );
      const accountsPayload = accountsRes.data;

      console.log('[google-sync] accounts details', {
        status: accountsRes.status,
        ok: accountsRes.ok,
        error: accountsPayload?.error,
      });

      if (!accountsRes.ok) {
        const msg = accountsPayload?.error || `HTTP ${accountsRes.status}`;

        if (accountsRes.status === 401 || accountsRes.status === 403) {
          setHasExistingConnection(false);
          toast({
            title: `${t('common.error')}: ${msg}`,
            description: t('googleImport.sessionExpiredOrAccessDenied'),
            variant: 'destructive',
            action: {
              label: t('googleImport.reconnectGoogle'),
              onClick: () => initiateGoogleOAuth(),
            },
          });
          return;
        }

        toast({
          title: `${t('common.error')}: ${msg}`,
          description: t('googleImport.cannotRetrieveGoogleBusinessAccounts'),
          variant: 'destructive',
        });
        return;
      }

      if (accountsPayload?.error) {
        const errorMessage: string = accountsPayload.error;

        // API non activée
        if (
          errorMessage.includes('API_NOT_ENABLED') ||
          errorMessage.includes('API has not been used') ||
          errorMessage.includes('SERVICE_DISABLED') ||
          errorMessage.includes('Enable it by visiting')
        ) {
          toast({
            title: `${t('common.error')}: ${t('googleImport.googleBusinessApiNotEnabled')}`,
            description: t('googleImport.enableMyBusinessApiInGoogleCloud'),
            variant: 'destructive',
          });
          return;
        }

        // Reconnect requis
        if (
          errorMessage.includes('connection not found') ||
          errorMessage.includes('RECONNECT') ||
          errorMessage.includes('expired') ||
          errorMessage.includes('revoked') ||
          errorMessage.includes('Access denied')
        ) {
          setHasExistingConnection(false);
          toast({
            title: `${t('common.error')}: ${errorMessage}`,
            description: t('googleImport.reconnectGoogleBusiness'),
            variant: 'destructive',
            action: {
              label: t('googleImport.reconnectGoogle'),
              onClick: () => initiateGoogleOAuth(),
            },
          });
          return;
        }

        toast({
          title: `${t('common.error')}: ${errorMessage}`,
          description: t('googleImport.errorGoogleBusinessAccounts'),
          variant: 'destructive',
        });
        return;
      }

      const accounts = accountsPayload?.accounts || [];
      if (accounts.length === 0) {
        toast({
          title: `${t('common.error')}: ${t('googleImport.noGoogleBusinessAccount')}`,
          description: t('googleImport.noGoogleBusinessAccountFound'),
          variant: 'destructive',
        });
        return;
      }

      const account = accounts[0];
      setAccountId(account.name);

      // 2) Locations
      const locationsRes = await callEdgeFunction<any>(
        'google-business-locations',
        {
          accountId: account.name,
        },
      );

      const locationsPayload = locationsRes.data;

      console.log('[google-sync] locations details', {
        status: locationsRes.status,
        ok: locationsRes.ok,
        accountId: account.name,
        error: locationsPayload?.error,
      });

      if (!locationsRes.ok) {
        const msg = locationsPayload?.error || `HTTP ${locationsRes.status}`;
        toast({
          title: `${t('common.error')}: ${msg}`,
          description: t('googleImport.cannotRetrieveGoogleBusinessLocations'),
          variant: 'destructive',
        });
        return;
      }

      if (locationsPayload?.error) {
        toast({
          title: `${t('common.error')}: ${locationsPayload.error}`,
          description: t('googleImport.errorGoogleBusinessLocations'),
          variant: 'destructive',
        });
        return;
      }

      const locs = locationsPayload?.locations || [];
      if (locs.length === 0) {
        toast({
          title: `${t('common.error')}: ${t('googleImport.noLocationFound')}`,
          description: t('googleImport.noLocationFoundForAccount'),
          variant: 'destructive',
        });
        return;
      }

      // 3) Import
      if (locs.length === 1) {
        await importReviews(account.name, locs[0].name);
      } else {
        setLocations(locs);
        setShowLocationSelector(true);
        toast({
          title: t('googleImport.selectEstablishment'),
          description: t('googleImport.multipleLocationsDetected'),
        });
      }
    } catch (error: any) {
      console.error('[google-sync] fetchAccountsAndLocations:error', error);
      toast({
        title: `${t('common.error')}: ${error?.message || t('errors.unknownError')}`,
        description: t('googleImport.syncFailure'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      operationInProgress.current = false;
      console.log('[google-sync] fetchAccountsAndLocations:done');
    }
  };

  const importReviews = async (accId: string, locationId: string) => {
    setLoading(true);

    console.log('[google-sync] importReviews:start', {
      accountId: accId,
      locationId,
      place_id: placeId,
    });

    try {
      const importRes = await callEdgeFunction<any>('google-business-reviews', {
        accountId: accId,
        locationId,
        placeId,
      });

      const payload = importRes.data;

      console.log('[google-sync] import response details', {
        status: importRes.status,
        ok: importRes.ok,
        error: payload?.error,
        accountId: accId,
        locationId,
        place_id: placeId,
        reviewsCount: payload?.total ?? payload?.importedCount,
        inserted: payload?.inserted ?? payload?.insertedCount,
        updated: payload?.updated ?? payload?.updatedCount,
      });

      if (!importRes.ok) {
        const msg = payload?.error || `HTTP ${importRes.status}`;

        if (importRes.status === 401 || importRes.status === 403) {
          setHasExistingConnection(false);
          toast({
            title: `${t('common.error')}: ${msg}`,
            description: t('googleImport.googleSessionExpired'),
            variant: 'destructive',
            action: {
              label: t('googleImport.reconnectGoogle'),
              onClick: () => initiateGoogleOAuth(),
            },
          });
          return;
        }

        toast({
          title: `${t('common.error')}: ${msg}`,
          description: t('googleImport.syncRouteError'),
          variant: 'destructive',
        });
        return;
      }

      if (payload?.error) {
        toast({
          title: `${t('common.error')}: ${payload.error}`,
          description: t('googleImport.errorImportingGoogleReviews'),
          variant: 'destructive',
        });
        return;
      }

      const inserted = Number(payload?.inserted ?? payload?.insertedCount ?? 0);
      const updated = Number(payload?.updated ?? payload?.updatedCount ?? 0);
      const total = Number(
        payload?.total ?? payload?.importedCount ?? inserted + updated,
      );

      if (!total || total === 0) {
        toast({
          title: `⚠️ ${t('googleImport.noReviewsFound')}`,
          description: `accountId=${accId} • locationId=${locationId} • place_id=${placeId || '(manquant)'}`,
        });
      } else {
        toast({
          title: `✅ ${t('googleImport.reviewsImportedUpdated', { total })}`,
          description: `${t('googleImport.newReviews', { inserted })} • ${t('googleImport.updatedReviews', { updated })} • place_id=${placeId || '(manquant)'}`,
        });
      }

      void sendReviewImportNotification({
        establishmentName: establishmentName?.trim() || 'Your establishment',
        source: 'google',
        inserted,
        skipped: 0,
        updated,
        total,
      });

      setShowLocationSelector(false);

      // Ouvrir le panneau visuel et scroll
      if (onOpenVisualPanel) {
        onOpenVisualPanel();
        setTimeout(() => {
          document.getElementById('reviews-visual-anchor')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 100);
      }

      // Refresh UI
      window.dispatchEvent(new CustomEvent('reviews:imported'));
      onSuccess?.();

      // Fermer la modale après succès
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('[google-sync] importReviews:error', error);
      toast({
        title: `${t('common.error')}: ${error?.message || t('errors.unknownError')}`,
        description: t('googleImport.googleReviewsSyncFailure'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      operationInProgress.current = false;
      console.log('[google-sync] importReviews:done');
    }
  };

  const handleLocationSelect = (locationId: string) => {
    importReviews(accountId, locationId);
  };

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onPointerDown={() => {
          console.log('SYNC POINTERDOWN', new Date().toISOString());
        }}
        onClick={handleImportClick}
        className={cn(
          buttonVariants({ variant: 'accent', size: 'default' }),
          'w-full pointer-events-auto cursor-pointer relative z-50 h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border border-primary/20',
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {t('googleImport.importingInProgress')}
          </>
        ) : hasExistingConnection ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('googleImport.syncMyGoogleReviews')}
          </>
        ) : (
          t('googleImport.importMyGoogleReviews')
        )}
      </button>

      <Dialog
        open={showLocationSelector}
        onOpenChange={(open) => {
          setShowLocationSelector(open);
          // If dialog is closed without selecting, reset loading state
          if (!open && loading) {
            setLoading(false);
            operationInProgress.current = false;
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('googleImport.selectLocation')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {locations.map((location) => (
              <Button
                key={location.name}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleLocationSelect(location.name)}
                disabled={loading}
              >
                <div>
                  <div className="font-medium">{location.locationName}</div>
                  {location.address?.addressLines && (
                    <div className="text-sm text-muted-foreground">
                      {location.address.addressLines.join(', ')}
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Google APIs Not Configured Dialog */}
      <Dialog
        open={showApiNotConfiguredDialog}
        onOpenChange={setShowApiNotConfiguredDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(
                'googleImport.googleUnavailableTitle',
                'Google import is unavailable',
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 text-sm text-muted-foreground">
            <p>
              {t(
                'googleImport.googleUnavailableMessage',
                'Google Business APIs are not configured. You can continue with Outscraper instead.',
              )}
            </p>
          </div>
          <div className="flex flex-col gap-2 mt-4">
            <Button
              variant="accent"
              className="w-full"
              onClick={handleContinueWithOutscraper}
              disabled={isOutscraperImporting}
            >
              {isOutscraperImporting
                ? t('googleImport.importingInProgress')
                : t(
                    'googleImport.proceedWithOutscraper',
                    'Continue with Outscraper',
                  )}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowApiNotConfiguredDialog(false)}
              disabled={isOutscraperImporting}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
