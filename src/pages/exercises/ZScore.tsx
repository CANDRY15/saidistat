import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator } from "lucide-react";
import { toast } from "sonner";

interface ZScoreResult {
  x: number;
  mean: number;
  sd: number;
  zScore: number;
  interpretation: string;
}

const ZScore = () => {
  const [x, setX] = useState("");
  const [mean, setMean] = useState("");
  const [sd, setSd] = useState("");
  const [result, setResult] = useState<ZScoreResult | null>(null);

  const calculateZScore = () => {
    const xVal = parseFloat(x);
    const meanVal = parseFloat(mean);
    const sdVal = parseFloat(sd);

    if (isNaN(xVal) || isNaN(meanVal) || isNaN(sdVal)) {
      toast.error("Veuillez entrer des valeurs numériques valides");
      return;
    }

    if (sdVal <= 0) {
      toast.error("L'écart-type doit être supérieur à 0");
      return;
    }

    const zScore = (xVal - meanVal) / sdVal;
    
    let interpretation = "";
    if (Math.abs(zScore) < 1) {
      interpretation = "Cette valeur est proche de la moyenne (moins d'un écart-type)";
    } else if (Math.abs(zScore) < 2) {
      interpretation = "Cette valeur est modérément éloignée de la moyenne (1-2 écarts-types)";
    } else if (Math.abs(zScore) < 3) {
      interpretation = "Cette valeur est assez éloignée de la moyenne (2-3 écarts-types)";
    } else {
      interpretation = "Cette valeur est très éloignée de la moyenne (plus de 3 écarts-types) - peut être une valeur aberrante";
    }

    if (zScore > 0) {
      interpretation += ". La valeur est au-dessus de la moyenne.";
    } else if (zScore < 0) {
      interpretation += ". La valeur est en-dessous de la moyenne.";
    } else {
      interpretation = "Cette valeur est exactement égale à la moyenne.";
    }

    setResult({
      x: xVal,
      mean: meanVal,
      sd: sdVal,
      zScore: zScore,
      interpretation: interpretation
    });

    toast.success("Z-score calculé avec succès!");
  };

  const reset = () => {
    setX("");
    setMean("");
    setSd("");
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/exercises" className="flex items-center gap-2 group">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exercices
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Calculator className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BioStasmarT
              </span>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Calcul du Z-Score
            </h1>
            <p className="text-lg text-muted-foreground">
              Calculez le z-score pour standardiser vos données
            </p>
          </div>

          {!result ? (
            <Card>
              <CardHeader>
                <CardTitle>Entrez les valeurs</CardTitle>
                <CardDescription>
                  Le z-score indique à combien d'écarts-types une valeur se situe de la moyenne
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="x">Valeur observée (X)</Label>
                  <Input
                    id="x"
                    type="number"
                    step="any"
                    placeholder="ex: 85"
                    value={x}
                    onChange={(e) => setX(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mean">Moyenne (μ)</Label>
                  <Input
                    id="mean"
                    type="number"
                    step="any"
                    placeholder="ex: 75"
                    value={mean}
                    onChange={(e) => setMean(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sd">Écart-type (σ)</Label>
                  <Input
                    id="sd"
                    type="number"
                    step="any"
                    placeholder="ex: 10"
                    value={sd}
                    onChange={(e) => setSd(e.target.value)}
                  />
                </div>

                <Button onClick={calculateZScore} className="w-full">
                  Calculer le Z-Score
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Formule du Z-Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg text-center text-xl font-mono">
                    Z = (X - μ) / σ
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Où : X = valeur observée, μ = moyenne, σ = écart-type
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calcul détaillé</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">X</p>
                      <p className="text-2xl font-bold">{result.x}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">μ</p>
                      <p className="text-2xl font-bold">{result.mean}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">σ</p>
                      <p className="text-2xl font-bold">{result.sd}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold">Étape 1 : Calculer la différence (X - μ)</p>
                    <p className="bg-muted p-3 rounded font-mono">
                      {result.x} - {result.mean} = {(result.x - result.mean).toFixed(4)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="font-semibold">Étape 2 : Diviser par l'écart-type</p>
                    <p className="bg-muted p-3 rounded font-mono">
                      {(result.x - result.mean).toFixed(4)} / {result.sd} = {result.zScore.toFixed(4)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle>Résultat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Z-Score</p>
                    <p className="text-5xl font-bold text-primary">{result.zScore.toFixed(4)}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold mb-2">Interprétation :</p>
                    <p>{result.interpretation}</p>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={reset} variant="outline" className="w-full">
                Nouveau calcul
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ZScore;
