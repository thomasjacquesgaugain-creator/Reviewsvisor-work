import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteEstablishment } from "@/hooks/useDeleteEstablishment";
import { EstablishmentData } from "@/services/establishments";

interface DeleteEstablishmentButtonProps {
  establishment: Pick<EstablishmentData, "id" | "place_id" | "name"> &
    Partial<
      Pick<
        EstablishmentData,
        "formatted_address" | "lat" | "lng" | "phone" | "website" | "rating"
      >
    >;

  /**
   * If the deleted establishment is active, the store will switch to this one.
   * Pass the first remaining establishment from your local list.
   */
  fallbackForActivePlace?: EstablishmentData | null;

  /** Called after a successful deletion. Refresh your list here. */
  onSuccess?: (deletedId: string) => void;

  /** Customise the trigger button. Defaults to a ghost icon button. */
  trigger?: React.ReactNode;

  /** Extra classes forwarded to the default icon button. */
  className?: string;
}

/**
 * Drop-in delete button that handles the confirmation dialog and all deletion logic.
 *
 * @example
 * // Minimal usage
 * <DeleteEstablishmentButton
 *   establishment={est}
 *   onSuccess={() => refetchList()}
 * />
 *
 * @example
 * // Custom trigger
 * <DeleteEstablishmentButton
 *   establishment={est}
 *   fallbackForActivePlace={remainingEstablishments[0]}
 *   onSuccess={handleDeleted}
 *   trigger={<Button variant="destructive">Remove</Button>}
 * />
 */
export function DeleteEstablishmentButton({
  establishment,
  fallbackForActivePlace,
  onSuccess,
  trigger,
  className,
}: DeleteEstablishmentButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { deleteEstablishment, deletingId } = useDeleteEstablishment({
    onSuccess: (id) => {
      setOpen(false);
      onSuccess?.(id);
    },
  });

  const deletingKey = establishment.id ?? establishment.place_id;
  const isDeleting = deletingId === deletingKey;

  const handleConfirm = () => {
    deleteEstablishment(
      establishment.id!,
      establishment.place_id,
      fallbackForActivePlace
        ? {
            place_id: fallbackForActivePlace.place_id,
            name: fallbackForActivePlace.name,
            formatted_address: fallbackForActivePlace.formatted_address ?? "",
            lat: fallbackForActivePlace.lat ?? 0,
            lng: fallbackForActivePlace.lng ?? 0,
            phone: fallbackForActivePlace.phone,
            website: fallbackForActivePlace.website,
            rating: fallbackForActivePlace.rating,
          }
        : null
    );
  };

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)}>{trigger}</span>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          className={
            className ??
            "shrink-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40"
          }
          aria-label="Supprimer cet établissement"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => !isDeleting && setOpen(v)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("settings.establishmentAndAccess.deleteEstablishment")}
            </DialogTitle>
            <DialogDescription>
              {t("settings.establishmentAndAccess.deleteConfirmation")}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              {t("settings.establishmentAndAccess.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t("settings.establishmentAndAccess.delete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}