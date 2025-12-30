import { Mail, Headphones, HelpCircle, Handshake } from "lucide-react";
import BackArrow from "@/components/BackArrow";
import { Card, CardContent } from "@/components/ui/card";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <BackArrow />
      
      {/* Hero Section - plus compact */}
      <section className="pt-6 pb-2 md:pt-8 md:pb-3">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            {/* Icon - simple, sans fond */}
            <Mail className="w-14 h-14 text-primary mx-auto mb-3" />
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-1.5 text-foreground tracking-tight">
              Nous contacter
            </h1>
            
            {/* Subtitle */}
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              Vous pouvez nous écrire à cette adresse pour toute demande.
            </p>
          </div>
        </div>
      </section>

      {/* Main Contact Card - plus compact */}
      <section className="py-4 md:py-5">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <Card className="border border-border/50 shadow-md hover:shadow-lg transition-shadow duration-300 bg-card">
              <CardContent className="p-5 md:p-6 text-center">
                <div className="mb-3 inline-flex items-center justify-center w-32 h-16 rounded-full bg-primary/10">
                  <Mail className="w-12 h-10 text-primary" />
                </div>
                
                <h2 className="text-lg font-semibold mb-2 text-foreground">
                  Email de contact
                </h2>
                
                <a 
                  href="mailto:contact@reviewsvisor.fr"
                  className="inline-flex items-center gap-3 text-xl md:text-2xl font-semibold text-primary hover:text-primary/80 transition-colors group"
                >
                  <span className="border-b-2 border-primary/30 group-hover:border-primary transition-colors">
                    contact@reviewsvisor.fr
                  </span>
                </a>
                
                <p className="mt-3 text-sm text-muted-foreground">
                  Nous vous répondrons dans les plus brefs délais.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Info Cards Grid - plus compact */}
      <section className="py-4 md:py-5 pb-8 md:pb-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-3">
              {/* Support Card */}
              <Card className="border border-border/40 bg-card hover:bg-muted/30 hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="p-4 text-center">
                  <div className="mb-2.5 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Headphones className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">Support</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Aide technique
                  </p>
                </CardContent>
              </Card>

              {/* Questions Card */}
              <Card className="border border-border/40 bg-card hover:bg-muted/30 hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="p-4 text-center">
                  <div className="mb-2.5 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <HelpCircle className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">Questions produit</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Fonctionnalités
                  </p>
                </CardContent>
              </Card>

              {/* Partnerships Card */}
              <Card className="border border-border/40 bg-card hover:bg-muted/30 hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="p-4 text-center">
                  <div className="mb-2.5 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Handshake className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">Partenariats</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Offres Pro
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}