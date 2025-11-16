import { Mail } from "lucide-react";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <a href="/" className="text-2xl font-bold text-primary" translate="no">
            Reviewsvisor
          </a>
        </div>
      </nav>
      
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <Mail className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-6 text-foreground">Nous contacter</h1>
          </div>
          
          <div className="bg-card p-8 rounded-lg shadow-lg border border-border">
            <p className="text-lg mb-6 text-muted-foreground">
              Vous pouvez nous écrire à cette adresse pour toute demande.
            </p>
            
            <a 
              href="mailto:contact@reviewsvisor.fr"
              className="inline-flex items-center gap-2 text-2xl font-semibold text-primary hover:underline transition-all"
            >
              <Mail className="w-6 h-6" />
              contact@reviewsvisor.fr
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
