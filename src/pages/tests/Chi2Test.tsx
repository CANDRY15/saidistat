import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ArrowLeft, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Chi2Test = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
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
            <Link to="/statistical-tests">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux tests
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Test du Khi² (χ²)
          </h1>
          <p className="text-xl text-muted-foreground">
            Test d'indépendance entre deux variables qualitatives
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres du test</CardTitle>
                <CardDescription>Entrez vos données pour effectuer le test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Variable 1 (Ligne)</Label>
                  <Input placeholder="Ex: Genre (Homme, Femme)" />
                </div>
                <div className="space-y-2">
                  <Label>Variable 2 (Colonne)</Label>
                  <Input placeholder="Ex: Préférence (Oui, Non)" />
                </div>
                <div className="space-y-2">
                  <Label>Niveau de significativité (α)</Label>
                  <Input type="number" defaultValue="0.05" step="0.01" />
                </div>
                <Button className="w-full" size="lg">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculer le test
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Résultats</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center py-8">
                  Les résultats s'afficheront ici après le calcul
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>À propos du test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  Le test du Khi² permet de tester l'indépendance entre deux variables qualitatives.
                </p>
                <div className="space-y-2">
                  <p className="font-medium">Hypothèses :</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• H₀ : Les variables sont indépendantes</li>
                    <li>• H₁ : Les variables sont liées</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Conditions d'application :</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Variables qualitatives</li>
                    <li>• Effectifs théoriques {'>'} 5</li>
                    <li>• Observations indépendantes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chi2Test;
