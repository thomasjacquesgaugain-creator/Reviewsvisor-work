import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, MapPin, Phone, Mail, Globe, Star, Users, FileText } from "lucide-react";
import { Link } from "react-router-dom";
const Etablissement = () => {
  return <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/lovable-uploads/08f62503-65d7-4681-8ddf-00f4efb00ffa.png" alt="Analytique logo" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">analytique</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/tableau-de-bord" className="text-gray-700 hover:text-blue-600">
                Accueil
              </Link>
              <Link to="/dashboard" className="text-gray-700 hover:text-blue-600">
                Dashboard
              </Link>
              <Link to="/importer" className="text-gray-700 hover:text-blue-600">
                Importer
              </Link>
              <Link to="/etablissement" className="text-blue-600 font-medium flex items-center gap-2">
                <Building className="w-4 h-4" />
                Établissement
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Building className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mon Établissement</h1>
            <p className="text-gray-600">Gérez les informations de votre établissement</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              
              
            </Card>

          </div>

          {/* Statistiques */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Note moyenne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">4.2</div>
                  <div className="flex justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(star => <Star key={star} className={`w-4 h-4 ${star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />)}
                  </div>
                  <p className="text-sm text-gray-600">Basé sur 247 avis</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Activité récente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">23</div>
                  <p className="text-sm text-gray-600">Nouveaux avis ce mois</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">89%</div>
                  <p className="text-sm text-gray-600">Avis positifs</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Button className="w-full mb-3">
                  Modifier les informations
                </Button>
                <Button variant="outline" className="w-full">
                  Voir les avis
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>;
};
export default Etablissement;