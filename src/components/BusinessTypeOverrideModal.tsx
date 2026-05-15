/**
 * Modal discret pour override manuel du businessType
 * Non bloquant, accessible depuis les paramètres ou un bouton discret
 */

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BusinessType } from "@/config/industry";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { getEstablishmentTypeTranslationKey } from "@/utils/establishmentTypeMapping";

interface BusinessTypeOverrideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeId: string;
  currentType?: BusinessType | null;
  onSuccess?: () => void;
}

const BUSINESS_TYPE_LABEL_SOURCE: Record<BusinessType, string | null> = {
  restaurant: "Restaurant",
  salon_coiffure: "Salon de coiffure",
  salle_sport: null,
  serrurier: null,
  retail_chaussures: "Commerce de détail",
  institut_beaute: "Spa / Bien-être",
  autre: "Autre",
};

const BUSINESS_TYPE_FALLBACK_LABELS: Record<BusinessType, string> = {
  restaurant: "Restaurant",
  salon_coiffure: "Salon de coiffure",
  salle_sport: "Salle de sport",
  serrurier: "Serrurier",
  retail_chaussures: "Magasin de chaussures",
  institut_beaute: "Institut de beauté",
  autre: "Autre",
};

export function BusinessTypeOverrideModal({
  open,
  onOpenChange,
  placeId,
  currentType,
  onSuccess,
}: BusinessTypeOverrideModalProps) {
  const { t } = useTranslation();
  const [selectedType, setSelectedType] = useState<BusinessType>(
    currentType || "autre",
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedType(currentType || "autre");
    }
  }, [open, currentType]);

  const translatedBusinessTypeOptions = useMemo(
    () =>
      (Object.keys(BUSINESS_TYPE_FALLBACK_LABELS) as BusinessType[]).map(
        (value) => {
          const sourceLabel = BUSINESS_TYPE_LABEL_SOURCE[value];
          if (sourceLabel) {
            const translationKey = getEstablishmentTypeTranslationKey(
              sourceLabel,
            );
            if (translationKey) {
              return {
                value,
                label: t(
                  `settings.establishmentInformation.establishmentTypesOptions.${translationKey}`,
                  { defaultValue: sourceLabel },
                ),
              };
            }
          }

          return {
            value,
            label: t(`businessTypeOverrideModal.types.${value}`, {
              defaultValue: BUSINESS_TYPE_FALLBACK_LABELS[value],
            }),
          };
        },
      ),
    [t],
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t("businessTypeOverrideModal.errors.authRequired"));
        return;
      }

      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        toast.error(t("businessTypeOverrideModal.errors.authRequired"));
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "update-business-type",
        {
          body: {
            place_id: placeId,
            business_type: selectedType,
          },
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        },
      );

      if (error || !data?.ok) {
        throw new Error(
          error?.message || t("businessTypeOverrideModal.errors.updateFailed"),
        );
      }

      toast.success(t("businessTypeOverrideModal.success.updated"));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("[BusinessTypeOverrideModal] Erreur:", error);
      toast.error(t("businessTypeOverrideModal.errors.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("businessTypeOverrideModal.title")}</DialogTitle>
          <DialogDescription>
            {t("businessTypeOverrideModal.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              {t("businessTypeOverrideModal.fieldLabel")}
            </label>
            <Select
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as BusinessType)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("businessTypeOverrideModal.selectPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {translatedBusinessTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t("businessTypeOverrideModal.cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving
                ? t("businessTypeOverrideModal.saving")
                : t("businessTypeOverrideModal.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
