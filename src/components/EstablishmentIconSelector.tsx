import { useState } from "react";
import { Building2, Coffee, UtensilsCrossed, ShoppingBag, Car, Heart, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const ESTABLISHMENT_ICONS = [
  { name: "Restaurant", icon: UtensilsCrossed, color: "text-red-500" },
  { name: "Café", icon: Coffee, color: "text-amber-600" },
  { name: "Commerce", icon: ShoppingBag, color: "text-blue-500" },
  { name: "Service", icon: Car, color: "text-green-500" },
  { name: "Santé", icon: Heart, color: "text-pink-500" },
  { name: "Hôtel", icon: Building2, color: "text-gray-600" },
];

interface EstablishmentIconSelectorProps {
  selectedIcon: string;
  onIconSelect: (iconName: string) => void;
}

export function EstablishmentIconSelector({ selectedIcon, onIconSelect }: EstablishmentIconSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentIcon = ESTABLISHMENT_ICONS.find(i => i.name === selectedIcon) || ESTABLISHMENT_ICONS[0];
  const CurrentIconComponent = currentIcon.icon;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          <CurrentIconComponent className={`w-4 h-4 ${currentIcon.color}`} />
          {currentIcon.name}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <div className="grid grid-cols-2 gap-1">
          {ESTABLISHMENT_ICONS.map((iconData) => {
            const IconComponent = iconData.icon;
            const isSelected = selectedIcon === iconData.name;
            
            return (
              <Button
                key={iconData.name}
                variant={isSelected ? "secondary" : "ghost"}
                size="sm"
                className="justify-start gap-2 h-auto p-2"
                onClick={() => {
                  onIconSelect(iconData.name);
                  setIsOpen(false);
                }}
              >
                <IconComponent className={`w-4 h-4 ${iconData.color}`} />
                <span className="text-xs">{iconData.name}</span>
                {isSelected && <Check className="w-3 h-3 ml-auto" />}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}