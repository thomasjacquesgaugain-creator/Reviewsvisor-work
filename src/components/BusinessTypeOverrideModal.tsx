/**
 * Modal discret pour override manuel du businessType
 * Non bloquant, accessible depuis les paramètres ou un bouton discret
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BusinessType } from "@/config/industry";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BusinessTypeOverrideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeId: string;
  currentType?: BusinessType | null;
  onSuccess?: () => void;
}

const BUSINESS_TYPE_OPTIONS: Array<{ value: BusinessType; label: string }> = [
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'salon_coiffure', label: 'Salon de coiffure' },
  { value: 'salle_sport', label: 'Salle de sport' },
  { value: 'serrurier', label: 'Serrurier' },
  { value: 'retail_chaussures', label: 'Magasin de chaussures' },
  { value: 'institut_beaute', label: 'Institut de beauté' },
  { value: 'autre', label: 'Autre' }
];

export function BusinessTypeOverrideModal({
  open,
  onOpenChange,
  placeId,
  currentType,
  onSuccess
}: BusinessTypeOverrideModalProps) {
  const [selectedType, setSelectedType] = useState<BusinessType>(currentType || 'autre');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Vous devez être connecté');
        return;
      }

      // Appeler l'endpoint Edge Function pour l'override
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        toast.error('Vous devez être connecté');
        return;
      }

      const { data, error } = await supabase.functions.invoke('update-business-type', {
        body: {
          place_id: placeId,
          business_type: selectedType
        },
        headers: {
          Authorization: `Bearer ${session.session.access_token}`
        }
      });

      if (error || !data?.ok) {
        throw new Error(error?.message || 'Erreur lors de la mise à jour');
      }

      toast.success('Type de commerce mis à jour');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('[BusinessTypeOverrideModal] Erreur:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Corriger le type de commerce</DialogTitle>
          <DialogDescription>
            Sélectionnez le type de commerce correct pour améliorer la précision de l'analyse.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Type de commerce</label>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as BusinessType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
