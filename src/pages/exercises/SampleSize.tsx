import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator } from "lucide-react";
import saidistatLogo from "@/assets/saidistat-logo.jpg";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SampleSizeResult {
  n: number;
  inputValues: {
    zAlpha?: number;
    zBeta?: number;
    p?: number;
    d?: number;
    sd?: number;
    e?: number;
  };
  formula: string;
  explanation: string;
}

const SampleSize = () => {
  const [calculationType, setCalculationType] = useState<"proportion" | "mean">("proportion");
  
  // Pour proportion
  const [p, setP] = useState("");
  const [e, setE] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState("95");
  
  // Pour moyenne
  const [sd, setSd] = useState("");
  const [d, setD] = useState("");
  const [alpha, setAlpha] = useState("0.05");
  const [beta, setBeta] = useState("0.20");
  
  const [result, setResult] = useState<SampleSizeResult | null>(null);

  const getZValue = (confidence: string): number => {
    const values: { [key: string]: number } = {
      "90": 1.645,
      "95": 1.96,
      "99": 2.576
    };
    return values[confidence] || 1.96;
  };

  const calculateProportion = () => {
    const pVal = parseFloat(p) / 100;
    const eVal = parseFloat(e) / 100;
    const zAlpha = getZValue(confidenceLevel);

    if (isNaN(pVal) || isNaN(eVal) || pVal <= 0 || pVal >= 1 || eVal <= 0) {
      toast.error("Veuillez entrer des valeurs valides");
      return;
    }

    const q = 1 - pVal;
    const n = Math.ceil((zAlpha * zAlpha * pVal * q) / (eVal * eVal));

    setResult({
      n: n,
      inputValues: {
        zAlpha: zAlpha,
        p: pVal,
        e: eVal
      },
      formula: "n = (Z²α × p × q) / e²",
      explanation: `Pour une proportion estimée de ${(pVal * 100).toFixed(1)}% avec une marge d'erreur de ±${(eVal * 100).toFixed(1)}% et un niveau de confiance de ${confidenceLevel}%`
    });

    toast.success("Taille d'échantillon calculée!");
  };

  const calculateMean = () => {
    const sdVal = parseFloat(sd);
    const dVal = parseFloat(d);
    const alphaVal = parseFloat(alpha);
    const betaVal = parseFloat(beta);

    if (isNaN(sdVal) || isNaN(dVal) || isNaN(alphaVal) || isNaN(betaVal)) {
      toast.error("Veuillez entrer des valeurs valides");
      return;
    }

    // Z values for alpha and beta (two-tailed test)
    const zAlpha = alphaVal === 0.05 ? 1.96 : alphaVal === 0.01 ? 2.576 : 1.645;
    const zBeta = betaVal === 0.20 ? 0.84 : betaVal === 0.10 ? 1.28 : 0.84;

    const n = Math.ceil(2 * Math.pow((zAlpha + zBeta) * sdVal / dVal, 2));

    setResult({
      n: n,
      inputValues: {
        zAlpha: zAlpha,
        zBeta: zBeta,
        sd: sdVal,
        d: dVal
      },
      formula: "n = 2 × [(Zα + Zβ) × σ / d]²",
      explanation: `Pour détecter une différence de ${dVal} avec un écart-type de ${sdVal}, α=${alphaVal} et β=${betaVal} (puissance=${(1-betaVal)*100}%)`
    });

    toast.success("Taille d'échantillon calculée!");
  };

  const calculate = () => {
    if (calculationType === "proportion") {
      calculateProportion();
    } else {
      calculateMean();
    }
  };

  const reset = () => {
    setP("");
    setE("");
    setSd("");
    setD("");
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
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg">
                <img src={saidistatLogo} alt="SaidiStat Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SaidiStat
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
              Calcul de la Taille d'Échantillon
            </h1>
            <p className="text-lg text-muted-foreground">
              Déterminez la taille d'échantillon nécessaire pour votre étude
            </p>
          </div>

          {!result ? (
            <Card>
              <CardHeader>
                <CardTitle>Type de calcul</CardTitle>
                <CardDescription>
                  Choisissez le type d'estimation pour votre étude
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={calculationType} onValueChange={(v) => setCalculationType(v as "proportion" | "mean")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="proportion">Proportion</TabsTrigger>
                    <TabsTrigger value="mean">Moyenne</TabsTrigger>
                  </TabsList>

                  <TabsContent value="proportion" className="space-y-6 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="p">Proportion estimée (p) en %</Label>
                      <Input
                        id="p"
                        type="number"
                        step="0.1"
                        placeholder="ex: 50"
                        value={p}
                        onChange={(e) => setP(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Si inconnue, utilisez 50% pour maximiser la taille
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="e">Marge d'erreur (e) en %</Label>
                      <Input
                        id="e"
                        type="number"
                        step="0.1"
                        placeholder="ex: 5"
                        value={e}
                        onChange={(e) => setE(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Précision souhaitée (généralement 5%)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confidence">Niveau de confiance</Label>
                      <select
                        id="confidence"
                        className="w-full p-2 border rounded-md bg-background"
                        value={confidenceLevel}
                        onChange={(e) => setConfidenceLevel(e.target.value)}
                      >
                        <option value="90">90% (Z = 1.645)</option>
                        <option value="95">95% (Z = 1.96)</option>
                        <option value="99">99% (Z = 2.576)</option>
                      </select>
                    </div>
                  </TabsContent>

                  <TabsContent value="mean" className="space-y-6 mt-6">
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
                      <p className="text-xs text-muted-foreground">
                        Écart-type de la population ou d'une étude pilote
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="d">Différence minimale à détecter (d)</Label>
                      <Input
                        id="d"
                        type="number"
                        step="any"
                        placeholder="ex: 5"
                        value={d}
                        onChange={(e) => setD(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Plus petite différence cliniquement significative
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alpha">Risque d'erreur α (alpha)</Label>
                      <select
                        id="alpha"
                        className="w-full p-2 border rounded-md bg-background"
                        value={alpha}
                        onChange={(e) => setAlpha(e.target.value)}
                      >
                        <option value="0.05">0.05 (5%)</option>
                        <option value="0.01">0.01 (1%)</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Probabilité d'erreur de type I
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="beta">Risque d'erreur β (beta)</Label>
                      <select
                        id="beta"
                        className="w-full p-2 border rounded-md bg-background"
                        value={beta}
                        onChange={(e) => setBeta(e.target.value)}
                      >
                        <option value="0.20">0.20 (puissance 80%)</option>
                        <option value="0.10">0.10 (puissance 90%)</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Probabilité d'erreur de type II
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button onClick={calculate} className="w-full mt-6">
                  Calculer la Taille d'Échantillon
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Formule utilisée</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-lg text-center text-xl font-mono">
                    {result.formula}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    {result.explanation}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calcul détaillé</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="font-semibold">Valeurs utilisées :</p>
                    <div className="bg-muted p-4 rounded-lg space-y-2">
                      {result.inputValues.zAlpha && (
                        <p>• Zα = {result.inputValues.zAlpha}</p>
                      )}
                      {result.inputValues.zBeta && (
                        <p>• Zβ = {result.inputValues.zBeta}</p>
                      )}
                      {result.inputValues.p !== undefined && (
                        <>
                          <p>• p = {result.inputValues.p.toFixed(4)}</p>
                          <p>• q = {(1 - result.inputValues.p).toFixed(4)}</p>
                        </>
                      )}
                      {result.inputValues.e && (
                        <p>• e = {result.inputValues.e.toFixed(4)}</p>
                      )}
                      {result.inputValues.sd && (
                        <p>• σ = {result.inputValues.sd}</p>
                      )}
                      {result.inputValues.d && (
                        <p>• d = {result.inputValues.d}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle>Résultat</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Taille d'échantillon requise</p>
                    <p className="text-5xl font-bold text-primary">{result.n}</p>
                    <p className="text-sm text-muted-foreground mt-2">participants</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold mb-2">Recommandation :</p>
                    <p>Vous devez recruter au minimum <span className="font-bold text-primary">{result.n} participants</span> pour votre étude.</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Considérez d'augmenter ce nombre de 10-20% pour compenser les pertes de suivi potentielles.
                    </p>
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

export default SampleSize;
