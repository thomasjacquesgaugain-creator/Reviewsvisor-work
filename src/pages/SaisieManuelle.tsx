import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Upload,
  Search,
  Plus,
  Trash2,
  Home,
  BarChart3,
  LogOut,
  Save
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const SaisieManuelle = () => {
  const [avis, setAvis] = useState([
    {
      id: 1,
      auteur: "",
      note: "",
      commentaire: "",
      date: "",
      plateforme: "google"
    }
  ]);

  const ajouterAvis = () => {
    const nouvelAvis = {
      id: Date.now(),
      auteur: "",
      note: "",
      commentaire: "",
      date: "",
      plateforme: "google"
    };
    setAvis([...avis, nouvelAvis]);
  };

  const supprimerAvis = (id: number) => {
    if (avis.length > 1) {
      setAvis(avis.filter(a => a.id !== id));
    }
  };

  const modifierAvis = (id: number, champ: string, valeur: string) => {
    setAvis(avis.map(a => 
      a.id === id ? { ...a, [champ]: valeur } : a
    ));
  };

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
              <Link to="/" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
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

      {/* Header buttons */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-blue-600 font-medium flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Saisie manuelle
            </Button>
            <Link to="/importer">
              <Button variant="ghost" className="text-gray-600 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import CSV
              </Button>
            </Link>
            <Link to="/importer">
              <Button variant="ghost" className="text-gray-600 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Récupération automatique
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Saisie manuelle des avis</h1>
            </div>
            <p className="text-lg text-gray-600">
              Ajoutez manuellement vos avis clients pour les analyser
            </p>
          </div>

          {/* Formulaire pour chaque avis */}
          <div className="space-y-6">
            {avis.map((avisCourant, index) => (
              <Card key={avisCourant.id} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Avis #{index + 1}</CardTitle>
                    {avis.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => supprimerAvis(avisCourant.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Nom de l'auteur
                      </label>
                      <Input
                        placeholder="Ex: Jean Dupont"
                        value={avisCourant.auteur}
                        onChange={(e) => modifierAvis(avisCourant.id, 'auteur', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Note <span className="text-red-500">*</span>
                      </label>
                      <Select 
                        value={avisCourant.note} 
                        onValueChange={(value) => modifierAvis(avisCourant.id, 'note', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choisir une note" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="1">⭐ 1/5</SelectItem>
                          <SelectItem value="2">⭐⭐ 2/5</SelectItem>
                          <SelectItem value="3">⭐⭐⭐ 3/5</SelectItem>
                          <SelectItem value="4">⭐⭐⭐⭐ 4/5</SelectItem>
                          <SelectItem value="5">⭐⭐⭐⭐⭐ 5/5</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Plateforme
                      </label>
                      <Select 
                        value={avisCourant.plateforme} 
                        onValueChange={(value) => modifierAvis(avisCourant.id, 'plateforme', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="tripadvisor">TripAdvisor</SelectItem>
                          <SelectItem value="yelp">Yelp</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Date de l'avis
                    </label>
                    <Input
                      type="date"
                      value={avisCourant.date}
                      onChange={(e) => modifierAvis(avisCourant.id, 'date', e.target.value)}
                      className="w-full md:w-auto"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Commentaire <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      placeholder="Tapez le commentaire de l'avis client..."
                      value={avisCourant.commentaire}
                      onChange={(e) => modifierAvis(avisCourant.id, 'commentaire', e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between mt-8">
            <Button
              variant="outline"
              onClick={ajouterAvis}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un autre avis
            </Button>

            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              disabled={avis.some(a => !a.note || !a.commentaire)}
            >
              <Save className="w-4 h-4" />
              Enregistrer et analyser ({avis.length} avis)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaisieManuelle;