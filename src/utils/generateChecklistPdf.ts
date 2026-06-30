// src/utils/generateChecklistPdf.ts
import jsPDF from "jspdf";
import type { SmartAction } from "@/types/smart";

interface GenerateChecklistPdfParams {
  establishmentName: string;
  objectiveName: string;
  actions: SmartAction[];
  lang: string;
  t: (key: string, opts?: Record<string, unknown>) => string;
}

const getLocalizedText = (value: any, lang: string): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.en || "";
};

const SCHEDULE_LABELS: Record<string, Record<string, string>> = {
  en: {
    start_of_day: "Start of day",
    during_activity: "During activity",
    end_of_day: "End of day",
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
    start_of_month: "Start of month",
    mid_month: "Mid-month",
    end_of_month: "End of month",
  },
  fr: {
    start_of_day: "Début de journée",
    during_activity: "Pendant l'activité",
    end_of_day: "Fin de journée",
    monday: "Lundi",
    tuesday: "Mardi",
    wednesday: "Mercredi",
    thursday: "Jeudi",
    friday: "Vendredi",
    saturday: "Samedi",
    sunday: "Dimanche",
    start_of_month: "Début de mois",
    mid_month: "Mi-mois",
    end_of_month: "Fin de mois",
  },
};

function scheduleLabel(action: SmartAction, lang: string): string {
  if (!action.schedule) return "";
  const isCustom =
    action.schedule === "custom_time" || action.schedule === "custom_date";
  if (isCustom && action.schedule_value) return action.schedule_value;
  return (
    SCHEDULE_LABELS[lang]?.[action.schedule] ??
    SCHEDULE_LABELS.en[action.schedule] ??
    action.schedule
  );
}

export function generateChecklistPdf({
  establishmentName,
  objectiveName,
  actions,
  lang,
  t,
}: GenerateChecklistPdfParams) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 48;
  let y = 50;

  const violet: [number, number, number] = [124, 58, 237];
  const black: [number, number, number] = [15, 23, 42];
  const gray: [number, number, number] = [100, 116, 139];
  const green: [number, number, number] = [22, 163, 74];
  const lightBorder: [number, number, number] = [226, 232, 240];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...violet);
  doc.text(
    `${t("smartCard.pdca.title", { defaultValue: "ACTION PLAN" })} — ${establishmentName.toUpperCase()}`,
    marginX,
    y,
  );
  y += 26;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...black);
  doc.text(
    t("recommendations.smart.checklistTitle", {
      defaultValue: "Operational checklist",
    }),
    marginX,
    y,
  );
  y += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...gray);
  doc.text(
    t("dashboard.routineToFollow", {
      defaultValue: "Routine to follow in the field",
    }),
    marginX,
    y,
  );
  y += 8;

  if (objectiveName) {
    y += 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...violet);
    doc.text(objectiveName, marginX, y);
  }
  y += 14;

  doc.setDrawColor(...violet);
  doc.setLineWidth(2);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 28;

  const normalize = (f?: string) => {
    const v = String(f ?? "").toLowerCase();
    if (v === "weekly") return "weekly";
    if (v === "monthly" || v === "once") return "monthly";
    return "daily";
  };

  const sections = [
    { key: "daily", title: t("dashboard.daily", { defaultValue: "DAILY" }) },
    { key: "weekly", title: t("dashboard.weekly", { defaultValue: "WEEKLY" }) },
    {
      key: "monthly",
      title: t("dashboard.monthly", { defaultValue: "MONTHLY" }),
    },
  ];

  const checkSize = 12;

  sections.forEach((section) => {
    const items = actions
      .map((a, i) => ({ action: a, index: i }))
      .filter(({ action }) => normalize(action.frequency) === section.key);

    if (!items.length) return;

    // page break check
    if (y > 720) {
      doc.addPage();
      y = 50;
    }

    // Section header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...green);
    doc.text(section.title, marginX, y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(String(items.length), pageWidth - marginX, y, { align: "right" });

    y += 6;
    doc.setDrawColor(...green);
    doc.setLineWidth(1);
    doc.line(marginX, y, pageWidth - marginX, y);
    y += 18;

    items.forEach(({ action }) => {
      if (y > 760) {
        doc.addPage();
        y = 50;
      }

      const boxSize = checkSize;
      const boxX = marginX;
      const boxY = y - boxSize + 3;
      const rowCenterY = boxY + boxSize / 2;
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(1);

      if (action.completed) {
        doc.setFillColor(34, 197, 94);
        doc.roundedRect(boxX, boxY, boxSize, boxSize, 2, 2, "FD");

        const cx = boxX + boxSize / 2;
        const cy = rowCenterY;
        doc.setDrawColor(255, 255, 255);
        doc.setLineWidth(1.6);
        doc.line(
          boxX + boxSize * 0.22,
          cy,
          cx - boxSize * 0.02,
          boxY + boxSize * 0.72,
        );
        doc.line(
          cx - boxSize * 0.02,
          boxY + boxSize * 0.72,
          boxX + boxSize * 0.82,
          boxY + boxSize * 0.22,
        );
      } else {
        doc.roundedRect(boxX, boxY, boxSize, boxSize, 2, 2, "S");
      }

      const textX = marginX + checkSize + 12;
      const maxWidth = pageWidth - marginX - 90 - textX;
      doc.setFont("helvetica", action.completed ? "italic" : "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...(action.completed ? gray : black));
      const lines = doc.splitTextToSize(
        getLocalizedText(action.text, lang),
        maxWidth,
      );
      const textBaselineY =
        lines.length > 1
          ? rowCenterY - ((lines.length - 1) * 13) / 2 + 3.5
          : rowCenterY + 3.5;

      doc.text(lines, textX, textBaselineY);

      const badgeText = scheduleLabel(action, lang);
      if (badgeText) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const badgeH = 16;
        const badgeW = doc.getTextWidth(badgeText) + 16;
        const badgeX = pageWidth - marginX - badgeW;
        const badgeY = rowCenterY - badgeH / 2;

        doc.setDrawColor(...lightBorder);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 8, 8, "FD");
        doc.setTextColor(...gray);
        doc.text(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 3, {
          align: "center",
        });
      }

      const rowHeight = Math.max(lines.length * 13, 24);
      y += rowHeight + 6;
    });

    y += 14;
  });

  const pageCount = doc.internal.pages.length - 1;
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const footerY = doc.internal.pageSize.getHeight() - 40;
    doc.setDrawColor(...lightBorder);
    doc.setLineWidth(0.5);
    doc.line(marginX, footerY - 12, pageWidth - marginX, footerY - 12);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(...gray);
    const formattedDate = new Date().toLocaleDateString(
      lang === "fr" ? "fr-FR" : "en-US",
      { year: "numeric", month: "long", day: "numeric" },
    );

    const generatedLabel = t(
      "recommendations.smart.checklist.configure.generatedOn",
      {
        date: formattedDate,
        defaultValue: `Document generated ${formattedDate}`,
      },
    );

    const footerBrand = t(
      "recommendations.smart.checklist.configure.footerBrand",
      {
        defaultValue: "Reviewsvisor — Quality Advisor",
      },
    );

    doc.text(`${generatedLabel} · ${footerBrand}`, pageWidth / 2, footerY, {
      align: "center",
    });
  }

  const fileName = `checklist-${objectiveName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40)}.pdf`;
  doc.save(fileName);
}
