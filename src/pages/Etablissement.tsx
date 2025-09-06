import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  Users, 
  FileText, 
  Home, 
  BarChart3, 
  Upload, 
  LogOut,
  Search,
  Info,
  Locate
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

const Etablissement = () => {
  const { toast } = useToast();
  const [modeActuel, setModeActuel] = useState<'recuperation' | 'saisie'>('recuperation');
  const [ville, setVille] = useState("");
  const [etablissement, setEtablissement] = useState("");
  const [periode, setPeriode] = useState("1-mois");
  const [etablissements, setEtablissements] = useState<string[]>([]);
  const [villes, setVilles] = useState<string[]>([]);
  const [rechercheEnCours, setRechercheEnCours] = useState(false);
  const [rechercheVillesEnCours, setRechercheVillesEnCours] = useState(false);
  const [etablissementSelectionne, setEtablissementSelectionne] = useState("");
  const [villeSelectionnee, setVilleSelectionnee] = useState("");
  const [villeBBox, setVilleBBox] = useState<{s:number;n:number;w:number;e:number;name:string} | null>(null);
  const [bboxEnCours, setBboxEnCours] = useState(false);
  const [positionUtilisateur, setPositionUtilisateur] = useState<{lat: number, lng: number} | null>(null);
  const [geolocalisationEnCours, setGeolocalisationEnCours] = useState(false);
  
  // États pour la saisie manuelle
  const [avisManuel, setAvisManuel] = useState({
    nomClient: '',
    note: '',
    commentaire: '',
    date: new Date().toISOString().split('T')[0],
    source: "Recherche manuelle"
  });
  const [avisListe, setAvisListe] = useState<any[]>([]);
  const [saisieEnCours, setSaisieEnCours] = useState(false);

  // Fonctions pour la saisie manuelle
  const gererChangementAvis = (champ: string, valeur: string) => {
    setAvisManuel(prev => ({
      ...prev,
      [champ]: valeur
    }));
  };

  const ajouterAvis = () => {
    if (!avisManuel.nomClient || !avisManuel.note || !avisManuel.commentaire) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (parseFloat(avisManuel.note) < 1 || parseFloat(avisManuel.note) > 5) {
      toast({
        title: "Erreur",
        description: "La note doit être comprise entre 1 et 5",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setSaisieEnCours(true);
    
    // Simuler un délai de traitement
    setTimeout(() => {
      const nouvelAvis = {
        ...avisManuel,
        id: Date.now(),
        note: parseFloat(avisManuel.note)
      };
      
      setAvisListe(prev => [...prev, nouvelAvis]);
      
      // Réinitialiser le formulaire
      setAvisManuel({
        nomClient: '',
        note: '',
        commentaire: '',
        date: new Date().toISOString().split('T')[0],
        source: "Recherche manuelle"
      });
      
      setSaisieEnCours(false);
      
      toast({
        title: "Avis ajouté",
        description: "L'avis a été ajouté avec succès",
        duration: 3000,
      });
    }, 500);
  };

  // Obtenir la géolocalisation de l'utilisateur
  const obtenirGeolocalisation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Géolocalisation non supportée",
        description: "Votre navigateur ne supporte pas la géolocalisation",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setGeolocalisationEnCours(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setPositionUtilisateur(coords);
        setGeolocalisationEnCours(false);
        
        toast({
          title: "Position trouvée",
          description: "Recherche d'établissements à proximité...",
          duration: 3000,
        });
      },
      (error) => {
        setGeolocalisationEnCours(false);
        let message = "Erreur de géolocalisation";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message = "Autorisation de géolocalisation refusée";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Position non disponible";
            break;
          case error.TIMEOUT:
            message = "Délai de géolocalisation dépassé";
            break;
        }
        toast({
          title: "Erreur",
          description: message,
          variant: "destructive",
          duration: 3000,
        });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/lovable-uploads/08f62503-65d7-4681-8ddf-00f4efb00ffa.png" alt="Analytique logo" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">analytique</span>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/tableau-de-bord">
                <Button variant="ghost" className="text-gray-700 flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  Accueil
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button variant="ghost" className="text-gray-700 flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
              <Link to="/etablissement">
                <Button variant="ghost" className="text-blue-600 font-medium flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  Établissement
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-gray-700">
                <span>Bonjour, Yohan Lopes</span>
              </div>
              <Button variant="ghost" className="text-gray-700 flex items-center gap-1">
                <LogOut className="w-4 h-4" />
                Déconnexion
              </Button>
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

        {/* Import section */}
        <div className="mb-8">
          {/* Header buttons */}
          <div className="bg-white border border-gray-200 rounded-lg mb-6">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between w-full">
                <div className="flex-1">
                  <Button 
                    variant="ghost" 
                    className={`w-full flex items-center gap-2 ${modeActuel === 'saisie' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                    onClick={() => setModeActuel('saisie')}
                  >
                    <FileText className="w-4 h-4" />
                    Recherche manuelle
                  </Button>
                </div>
                <div className="flex-1">
                  <Button 
                    variant="ghost" 
                    className={`w-full flex items-center gap-2 ${modeActuel === 'recuperation' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
                    onClick={() => setModeActuel('recuperation')}
                  >
                    <Search className="w-4 h-4" />
                    Recherche automatique
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Header dynamique */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                {modeActuel === 'saisie' && <FileText className="w-6 h-6 text-blue-600" />}
                {modeActuel === 'recuperation' && <Search className="w-6 h-6 text-blue-600" />}
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                {modeActuel === 'saisie' && "Recherche manuelle d'avis"}
                {modeActuel === 'recuperation' && "Recherche automatique d'avis"}
              </h2>
            </div>
            <p className="text-lg text-gray-600">
              {modeActuel === 'saisie' && "Saisissez vos avis manuellement dans le système"}
              {modeActuel === 'recuperation' && "Récupérez automatiquement les avis Google, Tripadvisor et Yelp de votre établissement"}
            </p>
          </div>

          {/* Contenu conditionnel */}
          {modeActuel === 'recuperation' && (
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Ville <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="Tapez le nom de votre ville..."
                        value={ville}
                        onChange={(e) => setVille(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Établissement <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Nom de votre établissement..."
                      value={etablissement}
                      onChange={(e) => setEtablissement(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Période d'analyse
                    </label>
                    <Select value={periode} onValueChange={setPeriode}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-mois">1 mois</SelectItem>
                        <SelectItem value="3-mois">3 mois</SelectItem>
                        <SelectItem value="6-mois">6 mois</SelectItem>
                        <SelectItem value="1-an">1 an</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button className="w-full">
                    Analyser les avis
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {modeActuel === 'saisie' && (
            <Card className="mb-8">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Nom du client <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Ex: Marie Dupont"
                      value={avisManuel.nomClient}
                      onChange={(e) => gererChangementAvis('nomClient', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Note <span className="text-red-500">*</span>
                    </label>
                    <Select value={avisManuel.note} onValueChange={(value) => gererChangementAvis('note', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choisir une note" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">⭐ 1/5</SelectItem>
                        <SelectItem value="2">⭐⭐ 2/5</SelectItem>
                        <SelectItem value="3">⭐⭐⭐ 3/5</SelectItem>
                        <SelectItem value="4">⭐⭐⭐⭐ 4/5</SelectItem>
                        <SelectItem value="5">⭐⭐⭐⭐⭐ 5/5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <label className="text-sm font-medium text-gray-700">
                    Commentaire <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Commentaire du client..."
                    value={avisManuel.commentaire}
                    onChange={(e) => gererChangementAvis('commentaire', e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md resize-none"
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={avisManuel.date}
                      onChange={(e) => gererChangementAvis('date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Source
                    </label>
                    <Input
                      value={avisManuel.source}
                      onChange={(e) => gererChangementAvis('source', e.target.value)}
                      placeholder="Ex: Google, TripAdvisor..."
                    />
                  </div>
                </div>

                <Button 
                  onClick={ajouterAvis}
                  disabled={saisieEnCours}
                  className="w-full"
                >
                  {saisieEnCours ? 'Ajout en cours...' : 'Ajouter l\'avis'}
                </Button>

                {avisListe.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Avis ajoutés ({avisListe.length})</h3>
                    <div className="space-y-3">
                      {avisListe.map((avis) => (
                        <div key={avis.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium">{avis.nomClient}</span>
                            <span className="text-yellow-500">{'★'.repeat(avis.note)}</span>
                          </div>
                          <p className="text-gray-600 text-sm">{avis.commentaire}</p>
                          <div className="text-xs text-gray-500 mt-2">
                            {avis.date} • {avis.source}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star key={star} className={`w-4 h-4 ${star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                    ))}
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
    </div>
  );
};

export default Etablissement;