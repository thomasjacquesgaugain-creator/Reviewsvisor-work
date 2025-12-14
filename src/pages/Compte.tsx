import { useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Mail, Building2, MapPin, Globe } from "lucide-react";
import { toast } from "sonner";

const Compte = () => {
  const { user, displayName } = useAuth();

  const [fullName, setFullName] = useState(displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [etablissement, setEtablissement] = useState("Mon établissement");
  const [adresse, setAdresse] = useState("12 Rue du Restaurant, 75000 Paris");
  const [language, setLanguage] = useState("fr");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Informations enregistrées avec succès");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-2">Mon compte</h1>
        <p className="text-muted-foreground mb-8">
          Gérez vos informations personnelles et les paramètres de votre établissement.
        </p>

        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Nom complet
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="etablissement" className="flex items-center gap-2 mb-1">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Établissement
                </Label>
                <Input
                  id="etablissement"
                  type="text"
                  value={etablissement}
                  onChange={(e) => setEtablissement(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="adresse" className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Adresse du restaurant
                </Label>
                <Input
                  id="adresse"
                  type="text"
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="language" className="flex items-center gap-2 mb-1">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Langue de l'interface
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                    <SelectItem value="en">🇬🇧 English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full mt-4">
                Modifier mes informations
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Compte;
