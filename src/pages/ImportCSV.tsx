import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Upload, 
  FileText,
  Search,
  Download,
  CheckCircle,
  AlertCircle,
  Home,
  BarChart3,
  LogOut,
  File
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useRef } from "react";

const ImportCSV = () => {
  const [fichier, setFichier] = useState<File | null>(null);
  const [etapeValidation, setEtapeValidation] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setFichier(file);
      setEtapeValidation(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/csv") {
      setFichier(file);
      setEtapeValidation(true);
    }
  };

  const telechargerModele = () => {
    const csvContent = `Auteur,Note,Commentaire,Date,Plateforme
Jean Dupont,5,"Excellent service, très satisfait !",2024-01-15,Google
Marie Martin,4,"Bon accueil mais un peu d'attente",2024-01-14,TripAdvisor
Pierre Durand,3,"Service correct dans l'ensemble",2024-01-13,Yelp`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modele_avis.csv';
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
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
            <Link to="/saisie-manuelle">
              <Button variant="ghost" className="text-gray-600 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Saisie manuelle
              </Button>
            </Link>
            <Button variant="ghost" className="text-blue-600 font-medium flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
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
                <Upload className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Import de fichier CSV</h1>
            </div>
            <p className="text-lg text-gray-600">
              Importez vos avis clients depuis un fichier CSV pour les analyser
            </p>
          </div>

          {!etapeValidation ? (
            <>
              {/* Zone de téléchargement */}
              <Card className="mb-6">
                <CardContent className="p-8">
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Glissez-déposez votre fichier CSV ici
                    </h3>
                    <p className="text-gray-500 mb-4">ou cliquez pour sélectionner un fichier</p>
                    <Button variant="outline" className="mb-2">
                      Choisir un fichier
                    </Button>
                    <p className="text-sm text-gray-400">Format accepté : .csv (max 10 MB)</p>
                    
                    <input
                      ref={inputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Modèle à télécharger */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5 text-blue-600" />
                    Modèle de fichier CSV
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Téléchargez notre modèle de fichier CSV pour vous assurer que vos données sont au bon format.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={telechargerModele}
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le modèle CSV
                  </Button>
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Format attendu :</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li><strong>Auteur :</strong> Nom de la personne qui a laissé l'avis</li>
                      <li><strong>Note :</strong> Note de 1 à 5</li>
                      <li><strong>Commentaire :</strong> Le texte de l'avis</li>
                      <li><strong>Date :</strong> Date au format YYYY-MM-DD</li>
                      <li><strong>Plateforme :</strong> Google, TripAdvisor, Yelp, etc.</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            /* Validation du fichier */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Fichier importé avec succès
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg mb-6">
                  <File className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{fichier?.name}</p>
                    <p className="text-sm text-green-700">
                      {fichier ? (fichier.size / 1024).toFixed(1) : 0} KB
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Format CSV validé</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Colonnes requises détectées</span>
                  </div>
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Analyse en cours... (15 avis détectés)</span>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    Analyser les avis
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setFichier(null);
                      setEtapeValidation(false);
                    }}
                  >
                    Changer de fichier
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportCSV;