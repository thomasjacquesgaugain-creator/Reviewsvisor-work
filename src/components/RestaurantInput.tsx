import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin } from "lucide-react";

interface RestaurantInputProps {
  onAnalyze: (restaurantData: { name: string; url: string }) => void;
}

export const RestaurantInput = ({ onAnalyze }: RestaurantInputProps) => {
  const [restaurantName, setRestaurantName] = useState("");
  const [googleUrl, setGoogleUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantName.trim()) return;

    setIsLoading(true);
    
    // Simulation d'un délai d'analyse
    setTimeout(() => {
      onAnalyze({
        name: restaurantName,
        url: googleUrl || `https://maps.google.com/search/${encodeURIComponent(restaurantName)}`
      });
      setIsLoading(false);
    }, 2000);
  };

  return (
    <section className="py-20 px-4 bg-background">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Analysez votre restaurant
          </h2>
          <p className="text-lg text-muted-foreground">
            Entrez le nom de votre restaurant ou l'URL de votre page Google Maps
          </p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Informations du restaurant
            </CardTitle>
            <CardDescription>
              Nous analyserons automatiquement tous les commentaires disponibles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="restaurant-name" className="text-sm font-medium">
                  Nom du restaurant *
                </label>
                <Input
                  id="restaurant-name"
                  type="text"
                  placeholder="Ex: Le Bistrot de Paris"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="google-url" className="text-sm font-medium">
                  URL Google Maps (optionnel)
                </label>
                <Input
                  id="google-url"
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={googleUrl}
                  onChange={(e) => setGoogleUrl(e.target.value)}
                />
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                disabled={isLoading || !restaurantName.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Analyser les commentaires
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};