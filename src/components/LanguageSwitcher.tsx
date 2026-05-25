import { Check, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import {
  LANGUAGE_FLAGS,
  LANGUAGE_LABELS,
  type SupportedLanguage,
} from "@/i18n/config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
}

const LANGUAGE_OPTIONS = [
  { value: "fr", labelKey: "languageSwitcher.french" },
  { value: "en", labelKey: "languageSwitcher.english" },
] as const;

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const { lang, setLang } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("languageSwitcher.ariaLabel")}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors duration-150 ease-in-out hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:text-slate-300 dark:focus:ring-offset-slate-950",
            className
          )}
        >
          <Globe className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-foreground shadow-xl dark:shadow-black/40"
        sideOffset={8}
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => void setLang(option.value as SupportedLanguage)}
            className={cn(
              "cursor-pointer px-3 py-2.5",
              lang === option.value && "bg-primary/10 text-primary"
            )}
          >
            <span className="flex flex-1 items-center gap-2">
              <span aria-hidden="true">{LANGUAGE_FLAGS[option.value as SupportedLanguage]}</span>
              <span>{t(option.labelKey) || LANGUAGE_LABELS[option.value as SupportedLanguage]}</span>
            </span>
            {lang === option.value && <Check className="ml-2 h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
