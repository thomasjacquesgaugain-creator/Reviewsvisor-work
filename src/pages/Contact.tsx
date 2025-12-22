import { Mail, Headphones, HelpCircle, Handshake } from "lucide-react";
import BackArrow from "@/components/BackArrow";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <BackArrow />
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-12 md:pt-28 md:pb-16 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            {/* Icon */}
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20">
              <Mail className="w-10 h-10 text-primary" />
            </div>
            
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground tracking-tight">
              Nous contacter
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              Vous pouvez nous écrire à cette adresse pour toute demande.
            </p>
          </div>
        </div>
      </section>

      {/* Main Contact Card */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-xl mx-auto">
            <Card className="border border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8 md:p-10 text-center">
                <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                
                <h2 className="text-xl font-semibold mb-4 text-foreground">
                  Email de contact
                </h2>
                
                <a 
                  href="mailto:contact@reviewsvisor.fr"
                  className="inline-flex items-center gap-3 text-2xl md:text-3xl font-semibold text-primary hover:text-primary/80 transition-colors group"
                >
                  <span className="border-b-2 border-primary/30 group-hover:border-primary transition-colors">
                    contact@reviewsvisor.fr
                  </span>
                </a>
                
                <p className="mt-6 text-sm text-muted-foreground">
                  Nous vous répondrons dans les plus brefs délais.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Info Cards Grid */}
      <section className="py-8 md:py-12 pb-16 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Support Card */}
              <Card className="border border-border/40 bg-card/60 hover:bg-card/80 hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Headphones className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Support</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Aide technique
                  </p>
                </CardContent>
              </Card>

              {/* Questions Card */}
              <Card className="border border-border/40 bg-card/60 hover:bg-card/80 hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <HelpCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Questions produit</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Fonctionnalités
                  </p>
                </CardContent>
              </Card>

              {/* Partnerships Card */}
              <Card className="border border-border/40 bg-card/60 hover:bg-card/80 hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="p-6 text-center">
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                    <Handshake className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Partenariats</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Offres Pro
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
