import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Upload, Database, Download, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DataAnalysis = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['.csv', '.xlsx', '.xls', '.sav'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (validTypes.includes(fileExtension)) {
        setSelectedFile(file);
        toast({
          title: "Fichier sélectionné",
          description: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
        });
      } else {
        toast({
          title: "Format non supporté",
          description: "Veuillez sélectionner un fichier CSV, Excel ou SPSS",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      toast({
        title: "Analyse en cours",
        description: "Vos données sont en cours d'analyse...",
      });
      // TODO: Implement actual file upload and analysis
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BioStasmarT
              </span>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Analyse de données
          </h1>
          <p className="text-xl text-muted-foreground">
            Importez vos datasets et obtenez des analyses statistiques complètes automatiquement
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Importer vos données
                </CardTitle>
                <CardDescription>
                  Formats supportés : CSV, Excel (.xlsx, .xls), SPSS (.sav)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Choisir un fichier</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls,.sav"
                    onChange={handleFileChange}
                  />
                </div>

                {selectedFile && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Database className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium">{selectedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button onClick={handleUpload}>
                        Analyser
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Glissez-déposez votre fichier ici</p>
                  <p className="text-sm text-muted-foreground">
                    ou utilisez le bouton ci-dessus pour sélectionner un fichier
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Fonctionnalités</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Database className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Nettoyage automatique</p>
                    <p className="text-sm text-muted-foreground">
                      Détection et traitement des valeurs manquantes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">Statistiques descriptives</p>
                    <p className="text-sm text-muted-foreground">
                      Moyenne, médiane, écart-type, etc.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Download className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Export des résultats</p>
                    <p className="text-sm text-muted-foreground">
                      PDF, Excel, CSV disponibles
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Besoin d'aide ?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Consultez notre guide pour préparer vos données et obtenir les meilleurs résultats.
                </p>
                <Button variant="outline" className="w-full">
                  Voir le guide
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DataAnalysis;
