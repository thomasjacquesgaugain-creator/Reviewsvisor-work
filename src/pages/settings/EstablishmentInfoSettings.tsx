import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { getUserEstablishments, updateEstablishment, EstablishmentData } from "@/services/establishments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { EditableField } from "@/components/settings/EditableField";
import { Loader2, Building2, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { validatePhoneNumber, formatPhoneNumber } from "@/utils/phoneValidation";
import { ESTABLISHMENT_TYPE_OPTIONS } from "@/utils/establishmentTypeMapping";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Check, X } from "lucide-react";

export function EstablishmentInfoSettings() {
  const { t } = useTranslation();
  const { activePlaceId } = useEstablishmentStore();
  const [establishments, setEstablishments] = useState<EstablishmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const loadEstablishments = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await getUserEstablishments();
      setEstablishments(data);
    } catch {
      setEstablishments([]);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEstablishments();
  }, [loadEstablishments]);

  const activeEstablishment = useMemo(
    () => establishments.find((e) => e.place_id === activePlaceId) ?? null,
    [establishments, activePlaceId]
  );

  const displayedPlaceId = selectedPlaceId ?? activePlaceId ?? null;
  const displayedEstablishment = useMemo(
    () => establishments.find((e) => e.place_id === displayedPlaceId) ?? null,
    [establishments, displayedPlaceId]
  );

  useEffect(() => {
    if (!displayedPlaceId || !establishments.some((e) => e.place_id === displayedPlaceId)) {
      setSelectedPlaceId(activePlaceId);
    }
  }, [activePlaceId, establishments, displayedPlaceId]);

  useEffect(() => {
    setEditingTypeEtablissement(false);
  }, [displayedEstablishment?.id]);

  const handleSaveName = useCallback(
    async (value: string) => {
      if (!displayedEstablishment?.id) return;
      await updateEstablishment(displayedEstablishment.id, { name: value.trim() });
      await loadEstablishments(false);
      toast.success("Nom de l'établissement mis à jour");
    },
    [displayedEstablishment?.id, loadEstablishments]
  );

  const handleSaveAddress = useCallback(
    async (value: string) => {
      if (!displayedEstablishment?.id) return;
      await updateEstablishment(displayedEstablishment.id, { formatted_address: value.trim() || undefined });
      await loadEstablishments(false);
      toast.success("Adresse mise à jour");
    },
    [displayedEstablishment?.id, loadEstablishments]
  );

  const handleSavePhone = useCallback(
    async (value: string) => {
      if (!displayedEstablishment?.id) return;
      const validation = validatePhoneNumber(value);
      if (!validation.valid) {
        toast.error(validation.error ?? "Format de numéro invalide");
        throw new Error(validation.error);
      }
      await updateEstablishment(displayedEstablishment.id, { phone: value.trim() || undefined });
      await loadEstablishments(false);
      toast.success("Numéro de téléphone mis à jour");
    },
    [displayedEstablishment?.id, loadEstablishments]
  );

  const handleSaveWebsite = useCallback(
    async (value: string) => {
      if (!displayedEstablishment?.id) return;
      await updateEstablishment(displayedEstablishment.id, { website: value.trim() || undefined });
      await loadEstablishments(false);
      toast.success("Site web mis à jour");
    },
    [displayedEstablishment?.id, loadEstablishments]
  );

  const handleSaveTypeEtablissement = useCallback(
    async (value: string) => {
      if (!displayedEstablishment?.id) return;
      await updateEstablishment(displayedEstablishment.id, { type_etablissement: value.trim() || null });
      await loadEstablishments(false);
      toast.success("Type d'établissement mis à jour");
    },
    [displayedEstablishment?.id, loadEstablishments]
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Titre et sélecteur sur la même ligne (comme profil : titre à gauche, rien à droite ; ici sélecteur à droite) */}
      <div className="flex items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Infos d&apos;établissement</h1>
        {establishments.length > 0 && (
          <Card className="min-w-[350px] w-[420px] max-w-full border-blue-200 flex-shrink-0">
            <CardContent className="p-4">
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-1 -right-1 text-gray-400 hover:text-gray-600 p-0.5 h-auto w-auto bg-white border border-gray-200 rounded-full shadow-sm"
                          title={t("establishment.chooseAnotherEstablishment")}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[420px] min-w-[400px] p-2 bg-white z-50 shadow-lg border" align="start">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-700 px-3 py-2">
                            {t("establishment.myEstablishments")}
                          </div>
                          {establishments.map((est) => {
                            const isActive = est.place_id === activePlaceId;
                            const isSelected = est.place_id === displayedPlaceId;
                            return (
                              <button
                                key={est.id ?? est.place_id}
                                type="button"
                                className={`w-full flex items-center gap-3 p-3 text-left rounded-lg cursor-pointer transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  isSelected ? "bg-blue-50" : ""
                                }`}
                                onClick={() => {
                                  setSelectedPlaceId(est.place_id);
                                  setPopoverOpen(false);
                                }}
                              >
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Building2 className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900 truncate">{est.name}</span>
                                    {isActive && (
                                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                        {t("establishment.active")}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500 truncate">{est.formatted_address ?? ""}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {displayedEstablishment?.name ?? t("establishment.select")}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {displayedEstablishment?.formatted_address ?? ""}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Champs directement en dessous, sans carte (comme page Informations personnelles) */}
      {displayedEstablishment ? (
        <div className="space-y-0">
          <EditableField
            label="Nom de l'établissement"
            value={displayedEstablishment.name}
            onSave={handleSaveName}
            placeholder="Nom de l'établissement"
          />
          <EditableField
            label="Adresse"
            value={displayedEstablishment.formatted_address ?? ""}
            onSave={handleSaveAddress}
            placeholder="1 Cr de la Bôve, 56100 Lorient"
            type="textarea"
            emptyLabel="Information non fournie"
          />
          <div className="flex items-start justify-between py-4 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-500 mb-1">Note Google</label>
              <div className="text-sm text-gray-900">
                {displayedEstablishment.rating != null
                  ? `${Number(displayedEstablishment.rating).toFixed(1)} (Google)`
                  : "—"}
              </div>
            </div>
          </div>
          <div className="flex items-start justify-between py-4 border-b border-gray-100">
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-500 mb-1">Place ID</label>
              <div className="text-sm text-gray-900 font-mono break-all">{displayedEstablishment.place_id}</div>
            </div>
          </div>
          <EditableField
            label="Numéro de téléphone"
            value={displayedEstablishment.phone ? formatPhoneNumber(displayedEstablishment.phone) : ""}
            onSave={handleSavePhone}
            placeholder="+33123456789"
            type="tel"
            emptyLabel="Information non fournie"
          />
          <EditableField
            label="Site web"
            value={displayedEstablishment.website ?? ""}
            onSave={handleSaveWebsite}
            placeholder="https://example.com"
            emptyLabel="Information non fournie"
          />
          {/* Type d'établissement : éditable via Select */}
          {editingTypeEtablissement ? (
            <div className="space-y-2 py-4 border-b border-gray-100">
              <label className="block text-sm font-medium text-gray-700">Type d&apos;établissement</label>
              <Select
                value={typeEtablissementEditValue || ""}
                onValueChange={setTypeEtablissementEditValue}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez le type" />
                </SelectTrigger>
                <SelectContent>
                  {ESTABLISHMENT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={async () => {
                    setSavingTypeEtablissement(true);
                    try {
                      await handleSaveTypeEtablissement(typeEtablissementEditValue);
                      setEditingTypeEtablissement(false);
                    } finally {
                      setSavingTypeEtablissement(false);
                    }
                  }}
                  disabled={savingTypeEtablissement}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Enregistrer
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setTypeEtablissementEditValue(displayedEstablishment.type_etablissement ?? "");
                    setEditingTypeEtablissement(false);
                  }}
                  disabled={savingTypeEtablissement}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Annuler
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between py-4 border-b border-gray-100">
              <div className="flex-1 min-w-0">
                <label className="block text-sm font-medium text-gray-500 mb-1">Type d&apos;établissement</label>
                <div className="text-sm text-gray-900">
                  {displayedEstablishment.type_etablissement || "Information non fournie"}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTypeEtablissementEditValue(displayedEstablishment.type_etablissement ?? "");
                  setEditingTypeEtablissement(true);
                }}
                className="ml-4 flex-shrink-0"
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Modifier</span>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">
          Aucun établissement. Ajoutez un établissement depuis la page{" "}
          <Link to="/settings/establishments" className="text-primary hover:underline">
            Établissements & accès
          </Link>{" "}
          pour afficher ses informations ici.
        </p>
      )}
    </div>
  );
}
