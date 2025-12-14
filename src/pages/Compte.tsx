import { useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mail,
  MapPin,
  Building2,
  User,
  Globe,
  FileText,
  Bell,
  CalendarClock,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

const Compte = () => {
  const { user, displayName } = useAuth();

  const [fullName, setFullName] = useState(displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [etablissement, setEtablissement] = useState("Mon établissement");
  const [adresse, setAdresse] = useState("12 Rue du Restaurant, 75000 Paris");
  const [language, setLanguage] = useState("fr");

  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0]?.toUpperCase())
    .slice(0, 2)
    .join("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Informations enregistrées avec succès");
  };

  return (
    <div className="p-6 md:p-10 flex justify-center bg-background min-h-screen">
      <div className="w-full max-w-6xl flex flex-col md:flex-row gap-8">
        {/* MENU LATERAL STYLE SKELLO */}
        <aside className="w-full md:w-64 rounded-xl p-4 bg-muted/50 flex-shrink-0">
          <h3 className="text-sm font-semibold mb-3 text-primary">Profil</h3>
          <nav className="space-y-1 text-sm">
            <button className="flex items-center w-full px-3 py-2 rounded-lg bg-primary/10 text-primary font-medium">
              <User className="h-4 w-4 mr-2" />
              Informations personnelles
            </button>
            <button className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground">
              <FileText className="h-4 w-4 mr-2" />
              Dossier RH
            </button>
            <button className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </button>
            <button className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground">
              <CalendarClock className="h-4 w-4 mr-2" />
              Synchroniser le calendrier
            </button>
            <button className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-muted text-muted-foreground">
              <KeyRound className="h-4 w-4 mr-2" />
              Mon mot de passe
            </button>
          </nav>
        </aside>

        {/* CONTENU PRINCIPAL */}
        <div className="flex-1">
          <h1 className="text-3xl font-semibold mb-8 text-foreground">
            Informations personnelles
          </h1>

          {/* AVATAR + NOM */}
          <div className="flex items-center mb-8">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-semibold bg-primary/10 text-primary mr-6">
              {initials || "??"}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Compte</p>
              <p className="text-xl font-semibold text-foreground">{fullName || "Utilisateur"}</p>
              <p className="text-muted-foreground">{etablissement}</p>
            </div>
          </div>

          {/* FORMULAIRE 2 COLONNES AVEC ICÔNES LARGES */}
          <form onSubmit={handleSubmit} className="bg-card shadow rounded-xl p-6 border border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nom complet */}
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 md:h-7 md:w-7 text-primary flex-shrink-0" />
                <div className="w-full">
                  <Label className="text-xs uppercase text-muted-foreground">Nom complet</Label>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 md:h-7 md:w-7 text-primary flex-shrink-0" />
                <div className="w-full">
                  <Label className="text-xs uppercase text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Établissement */}
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 md:h-7 md:w-7 text-primary flex-shrink-0" />
                <div className="w-full">
                  <Label className="text-xs uppercase text-muted-foreground">Établissement</Label>
                  <Input
                    type="text"
                    value={etablissement}
                    onChange={(e) => setEtablissement(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Adresse resto */}
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 md:h-7 md:w-7 text-primary flex-shrink-0" />
                <div className="w-full">
                  <Label className="text-xs uppercase text-muted-foreground">Adresse du restaurant</Label>
                  <Input
                    type="text"
                    value={adresse}
                    onChange={(e) => setAdresse(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Langue */}
              <div className="flex items-center gap-3">
                <Globe className="h-6 w-6 md:h-7 md:w-7 text-primary flex-shrink-0" />
                <div className="w-full">
                  <Label className="text-xs uppercase text-muted-foreground">Langue de l'interface</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">🇫🇷 Français</SelectItem>
                      <SelectItem value="en">🇬🇧 English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button type="submit">
                Modifier mes informations
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Compte;
