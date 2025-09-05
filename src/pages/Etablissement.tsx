import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star,
  Edit,
  Save,
  Home,
  BarChart3,
  LogOut,
  Upload
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const Etablissement = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [etablissementData, setEtablissementData] = useState({
    nom: "Restaurant Le Petit Bistrot",
    adresse: "15 Rue de la Paix, 75001 Paris",
    telephone: "+33 1 42 00 00 00",
    email: "contact@petitbistrot.fr",
    website: "www.petitbistrot.fr",
    description: "Restaurant traditionnel français situé au cœur de Paris"
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">analytique</span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link to="/tableau-de-bord" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
                <Home className="w-4 h-4" />
                Accueil
              </Link>
              <Link to="/importer" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
                <Upload className="w-4 h-4" />
                Importer
              </Link>
              <Link to="/dashboard" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </Link>
              <Button variant="ghost" className="text-blue-600 font-medium flex items-center gap-1">
                <Building className="w-4 h-4" />
                Établissement
              </Button>
              <div className="flex items-center gap-2 text-gray-700">
                <span>Bonjour, Yohan Lopes</span>
              </div>
              <Button variant="ghost" className="text-gray-600 flex items-center gap-1">
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Mon Établissement</h1>
                  <p className="text-gray-600">Gérez les informations de votre établissement</p>
                </div>
              </div>
              <Button 
                onClick={() => setIsEditing(!isEditing)}
                className={isEditing ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}
              >
                {isEditing ? (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Informations principales */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Informations principales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nom de l'établissement</label>
                  {isEditing ? (
                    <Input
                      value={etablissementData.nom}
                      onChange={(e) => setEtablissementData({...etablissementData, nom: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Building className="w-4 h-4 text-gray-500" />
                      <span>{etablissementData.nom}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Adresse</label>
                  {isEditing ? (
                    <Input
                      value={etablissementData.adresse}
                      onChange={(e) => setEtablissementData({...etablissementData, adresse: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{etablissementData.adresse}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Téléphone</label>
                  {isEditing ? (
                    <Input
                      value={etablissementData.telephone}
                      onChange={(e) => setEtablissementData({...etablissementData, telephone: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{etablissementData.telephone}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  {isEditing ? (
                    <Input
                      value={etablissementData.email}
                      onChange={(e) => setEtablissementData({...etablissementData, email: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span>{etablissementData.email}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">Site web</label>
                  {isEditing ? (
                    <Input
                      value={etablissementData.website}
                      onChange={(e) => setEtablissementData({...etablissementData, website: e.target.value})}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <Globe className="w-4 h-4 text-gray-500" />
                      <span>{etablissementData.website}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-2xl font-bold">4.2</span>
                </div>
                <p className="text-sm text-gray-600">Note moyenne</p>
                <p className="text-xs text-gray-500">Basée sur 158 avis</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">326</div>
                <p className="text-sm text-gray-600">Total avis</p>
                <p className="text-xs text-gray-500">Tous plateformes</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <span className="text-2xl font-bold text-green-600">78%</span>
                </div>
                <p className="text-sm text-gray-600">Avis positifs</p>
                <p className="text-xs text-gray-500">Note ≥ 4 étoiles</p>
              </CardContent>
            </Card>
          </div>

          {/* Plateformes connectées */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Plateformes connectées</CardTitle>
              <p className="text-sm text-gray-600">Gérez vos présences sur les différentes plateformes</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <span className="text-red-600 font-bold">G</span>
                    </div>
                    <div>
                      <div className="font-medium">Google My Business</div>
                      <div className="text-sm text-gray-500">142 avis • 4.3 étoiles</div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Connecté</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold">T</span>
                    </div>
                    <div>
                      <div className="font-medium">TripAdvisor</div>
                      <div className="text-sm text-gray-500">89 avis • 4.0 étoiles</div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Connecté</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <span className="text-yellow-600 font-bold">Y</span>
                    </div>
                    <div>
                      <div className="font-medium">Yelp</div>
                      <div className="text-sm text-gray-500">95 avis • 4.1 étoiles</div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Connecté</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Etablissement;