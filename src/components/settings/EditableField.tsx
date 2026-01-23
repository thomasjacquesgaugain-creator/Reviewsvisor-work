import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        {type === "textarea" ? (
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={saving}
          />
        ) : (
          <input
            type={type === "tel" ? "tel" : type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={saving}
          />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            <Check className="h-4 w-4" />
            <span>Enregistrer</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={saving}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            <span>Annuler</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-start justify-between py-4 border-b border-gray-100 last:border-0", className)}>
      <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
        <div className="text-sm text-gray-900">
          {value || <span className="text-gray-400">{emptyLabel}</span>}
        </div>
      </div>
      {onSave && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="ml-4 flex-shrink-0"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Modifier</span>
        </Button>
      )}
    </div>
  );
}
