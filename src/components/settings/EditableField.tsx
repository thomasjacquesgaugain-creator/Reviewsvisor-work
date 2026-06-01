import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface EditableFieldProps {
  label: string;
  value: string | ReactNode;
  onSave?: (value: string) => Promise<void> | void;
  editMode?: "inline" | "modal";
  type?: "text" | "email" | "textarea" | "tel";
  placeholder?: string;
  loading?: boolean;
  error?: string;
  className?: string;
  emptyLabel?: string; // Label à afficher si vide (par défaut "Non renseigné")
}

export function EditableField({
  label,
  value,
  onSave,
  editMode = "inline",
  type = "text",
  placeholder,
  loading = false,
  error,
  className,
  emptyLabel = "Information non fournie",
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(typeof value === "string" ? value : "");
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  const handleSave = async () => {
    if (!onSave) return;
    
    try {
      setSaving(true);
      await onSave(editValue);
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(typeof value === "string" ? value : "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={cn("space-y-2", className)}>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
        {type === "textarea" ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
            rows={3}
            disabled={saving}
          />
        ) : (
          <input
            type={type === "tel" ? "tel" : type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"
            disabled={saving}
          />
        )}
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            <span>{t("common.save")}</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            <span>{t("common.cancel")}</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start justify-between py-4 border-b border-slate-200 dark:border-slate-800 last:border-0", className)}>
      <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
        <div className="text-sm text-gray-900 dark:text-slate-100">
          {value || <span className="text-slate-400 dark:text-slate-500">{emptyLabel}</span>}
        </div>
      </div>
      {onSave && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="ml-4 flex-shrink-0 text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Modifier</span>
        </Button>
      )}
    </div>
  );
}
