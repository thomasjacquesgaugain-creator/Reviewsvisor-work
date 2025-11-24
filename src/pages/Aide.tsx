import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AiAssistance from "@/components/AiAssistance";

const Aide = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-6 pb-8 px-4">
        <section className="py-5">
          <div className="relative z-1">
            <div className="max-w-[900px] mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center text-foreground">
                Centre d'aide <span className="text-blue">Reviewsvisor</span>
              </h1>
              
              <p className="text-center text-foreground/80 text-lg mb-12 max-w-[700px] mx-auto">
                Trouvez des réponses rapides à vos questions et découvrez comment utiliser <span className="text-blue">Reviewsvisor</span> efficacement.
              </p>

              <AiAssistance />

              <div className="text-center mt-12 pt-8 border-t border-border">
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  Besoin d'aide ?
                </h3>
                <p className="text-foreground/80 mb-6">
                  Notre équipe est là pour vous accompagner dans l'utilisation de <span className="text-blue">Reviewsvisor</span>.
                </p>
                <Link to="/contact">
                  <Button size="lg" className="font-semibold">
                    Contactez-nous
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Aide;
