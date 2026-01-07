import { useState } from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface ManualReview {
  firstName: string;
  lastName: string;
  rating: number;
  comment: string;
}

interface ManualReviewPanelProps {
  onSubmit: (review: ManualReview) => void;
}

export default function ManualReviewPanel({ onSubmit }: ManualReviewPanelProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    rating: 0,
    comment: "",
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hoveredRating, setHoveredRating] = useState(0);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = t("import.firstNameRequired");
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = t("import.lastNameRequired");
    }
    
    if (formData.rating === 0) {
      newErrors.rating = t("import.ratingRequired");
    }
    
    if (!formData.comment.trim()) {
      newErrors.comment = t("import.commentRequired");
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        rating: formData.rating,
        comment: formData.comment.trim(),
      });
      handleReset();
    }
  };

  const handleReset = () => {
    setFormData({
      firstName: "",
      lastName: "",
      rating: 0,
      comment: "",
    });
    setErrors({});
    setHoveredRating(0);
  };

  const handleRatingClick = (rating: number) => {
    setFormData({ ...formData, rating });
    if (errors.rating) {
      const newErrors = { ...errors };
      delete newErrors.rating;
      setErrors(newErrors);
    }
  };

  const handleInputChange = (field: keyof ManualReview, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Prénom et Nom */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium">
                {t("import.firstName")} *
              </Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder={t("import.enterFirstName")}
                className={cn(
                  "w-full",
                  errors.firstName && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors.firstName && (
                <p className="text-xs text-destructive">{errors.firstName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium">
                {t("import.lastName")} *
              </Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder={t("import.enterLastName")}
                className={cn(
                  "w-full",
                  errors.lastName && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {errors.lastName && (
                <p className="text-xs text-destructive">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Note avec étoiles */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t("import.rating")} *</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-colors hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  aria-label={star === 1 ? t("import.rateStars", { count: star }) : t("import.rateStarsPlural", { count: star })}
                >
                  <Star
                    className={cn(
                      "w-6 h-6 transition-colors",
                      (hoveredRating >= star || formData.rating >= star)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-400"
                    )}
                  />
                </button>
              ))}
              {formData.rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {formData.rating}/5
                </span>
              )}
            </div>
            {errors.rating && (
              <p className="text-xs text-destructive">{errors.rating}</p>
            )}
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium">
              {t("import.comment")} *
            </Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => handleInputChange("comment", e.target.value)}
              placeholder={t("import.writeReviewComment")}
              className={cn(
                "min-h-[100px] resize-none",
                errors.comment && "border-destructive focus-visible:ring-destructive"
              )}
            />
            {errors.comment && (
              <p className="text-xs text-destructive">{errors.comment}</p>
            )}
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1 h-12 text-base font-semibold"
            >
              {t("import.addThisReview")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="px-6 h-12"
            >
              {t("import.reset")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}