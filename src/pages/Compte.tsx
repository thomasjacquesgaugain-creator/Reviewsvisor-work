import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Mail, Building2 } from "lucide-react";

const Compte = () => {
  const { user, displayName } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-foreground mb-2">Mon compte</h1>
        <p className="text-muted-foreground mb-8">
          Gérez vos informations personnelles et les paramètres de votre établissement.
        </p>

        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-muted-foreground" />
                Nom complet
              </Label>
              <Input
                id="name"
                type="text"
                value={displayName || ""}
                readOnly
                className="bg-muted"
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
                value={user?.email || ""}
                readOnly
                className="bg-muted"
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
                value="Mon établissement"
                readOnly
                className="bg-muted"
              />
            </div>

            <Button className="w-full mt-4">
              Modifier mes informations
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Compte;
