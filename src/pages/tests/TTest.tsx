import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ArrowLeft, Calculator } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TTest = () => {
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
            Test t de Student
          </h1>
          <p className="text-xl text-muted-foreground">
            Comparaison de moyennes entre deux groupes
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
                  <Label>Groupe 1 - Moyenne</Label>
                  <Input type="number" placeholder="Ex: 25.4" />
                </div>
                <div className="space-y-2">
                  <Label>Groupe 1 - Écart-type</Label>
                  <Input type="number" placeholder="Ex: 3.2" />
                </div>
                <div className="space-y-2">
                  <Label>Groupe 1 - Taille</Label>
                  <Input type="number" placeholder="Ex: 30" />
                </div>
                <div className="space-y-2">
                  <Label>Groupe 2 - Moyenne</Label>
                  <Input type="number" placeholder="Ex: 28.6" />
                </div>
                <div className="space-y-2">
                  <Label>Groupe 2 - Écart-type</Label>
                  <Input type="number" placeholder="Ex: 4.1" />
                </div>
                <div className="space-y-2">
                  <Label>Groupe 2 - Taille</Label>
                  <Input type="number" placeholder="Ex: 30" />
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
                  Le test t de Student compare les moyennes de deux groupes indépendants.
                </p>
                <div className="space-y-2">
                  <p className="font-medium">Hypothèses :</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• H₀ : μ₁ = μ₂</li>
                    <li>• H₁ : μ₁ ≠ μ₂</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Conditions :</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Variables quantitatives</li>
                    <li>• Distribution normale</li>
                    <li>• Groupes indépendants</li>
                    <li>• Variances homogènes</li>
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

export default TTest;
