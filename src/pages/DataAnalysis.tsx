import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Upload, Database, Download, ArrowLeft, TrendingUp, FileText, FileSpreadsheet } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FrequencyItem {
  value: string;
  count: number;
  percentage: number;
}

interface ColumnStats {
  name: string;
  type: 'numeric' | 'text' | 'age_groups';
  count: number;
  missing: number;
  unique?: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  mode?: string;
  frequencies?: FrequencyItem[];
}

interface AnalysisResult {
  fileName: string;
  rowCount: number;
  columnCount: number;
  columns: string[];
  statistics: ColumnStats[];
  preview: any[];
}

const DataAnalysis = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

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

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    toast({
      title: "Analyse en cours",
      description: "Vos données sont en cours d'analyse...",
    });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const { data, error } = await supabase.functions.invoke('analyze-data', {
        body: formData,
      });

      if (error) throw error;

      setAnalysisResult(data);
      toast({
        title: "Analyse terminée",
        description: `${data.rowCount} lignes et ${data.columnCount} colonnes analysées`,
      });
    } catch (error: any) {
      console.error('Error analyzing data:', error);
      toast({
        title: "Erreur d'analyse",
        description: error.message || "Une erreur s'est produite lors de l'analyse",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadAsExcel = async () => {
    if (!analysisResult) return;

    try {
      toast({
        title: "Génération en cours",
        description: "Création du fichier CSV...",
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ analysisResult, format: 'excel' }),
        }
      );

      if (!response.ok) throw new Error('Erreur lors de la génération du fichier');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analyse_${analysisResult.fileName}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Téléchargement réussi",
        description: "Le fichier CSV a été téléchargé",
      });
    } catch (error: any) {
      console.error('Error downloading Excel:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer le fichier",
        variant: "destructive",
      });
    }
  };

  const downloadAsPDF = async () => {
    if (!analysisResult) return;

    try {
      toast({
        title: "Génération en cours",
        description: "Création du fichier PDF...",
      });

      const { data, error } = await supabase.functions.invoke('export-analysis', {
        body: { analysisResult, format: 'pdf' },
      });

      if (error) throw error;

      // Open print dialog with the HTML content
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 250);
      }

      toast({
        title: "PDF prêt",
        description: "Utilisez la boîte de dialogue d'impression pour sauvegarder en PDF",
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer le PDF",
        variant: "destructive",
      });
    }
  };

  const downloadAsWord = async () => {
    if (!analysisResult) return;

    try {
      toast({
        title: "Génération en cours",
        description: "Création du document Word...",
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-analysis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ analysisResult, format: 'word' }),
        }
      );

      if (!response.ok) throw new Error('Erreur lors de la génération du fichier');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analyse_${analysisResult.fileName}.doc`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Téléchargement réussi",
        description: "Le document Word a été téléchargé",
      });
    } catch (error: any) {
      console.error('Error downloading Word:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer le document Word",
        variant: "destructive",
      });
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28'];

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
                      <Button onClick={handleUpload} disabled={isAnalyzing}>
                        {isAnalyzing ? "Analyse..." : "Analyser"}
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

            {analysisResult && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Résumé de l'analyse
                        </CardTitle>
                        <CardDescription>{analysisResult.fileName}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={downloadAsExcel}>
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={downloadAsPDF}>
                          <FileText className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                        <Button variant="outline" size="sm" onClick={downloadAsWord}>
                          <FileText className="w-4 h-4 mr-2" />
                          Word
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Lignes</p>
                        <p className="text-2xl font-bold">{analysisResult.rowCount}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Colonnes</p>
                        <p className="text-2xl font-bold">{analysisResult.columnCount}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Variables numériques</p>
                        <p className="text-2xl font-bold">
                          {analysisResult.statistics.filter(s => s.type === 'numeric').length}
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Variables qualitatives</p>
                        <p className="text-2xl font-bold">
                          {analysisResult.statistics.filter(s => s.type === 'text' || s.type === 'age_groups').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Statistiques descriptives</CardTitle>
                    <CardDescription>Analyse détaillée par variable</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {analysisResult.statistics.map((stat, index) => (
                        <div key={index} className="border rounded-lg p-6 space-y-4">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg">{stat.name}</h3>
                            <span className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-medium">
                              {stat.type === 'numeric' ? 'Quantitative' : stat.type === 'age_groups' ? 'Tranches d\'âge' : 'Qualitative'}
                            </span>
                          </div>
                          
                          {stat.type === 'numeric' ? (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-muted/50 rounded-lg">
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground mb-1">Effectif</p>
                                  <p className="font-semibold text-lg">{stat.count}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground mb-1">Moyenne</p>
                                  <p className="font-semibold text-lg">{stat.mean}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground mb-1">Médiane</p>
                                  <p className="font-semibold text-lg">{stat.median}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground mb-1">Écart-type</p>
                                  <p className="font-semibold text-lg">{stat.std}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground mb-1">Minimum</p>
                                  <p className="font-semibold text-lg">{stat.min}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground mb-1">Maximum</p>
                                  <p className="font-semibold text-lg">{stat.max}</p>
                                </div>
                              </div>
                              {stat.missing > 0 && (
                                <p className="text-sm text-muted-foreground">
                                  Valeurs manquantes : {stat.missing}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="grid md:grid-cols-2 gap-6">
                              <div className="overflow-x-auto border rounded-lg">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/50">
                                      <TableHead className="font-semibold">{stat.type === 'age_groups' ? 'Tranche d\'âge' : stat.name}</TableHead>
                                      <TableHead className="font-semibold text-center">Effectif</TableHead>
                                      <TableHead className="font-semibold text-center">Pourcentage</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {stat.frequencies?.map((freq, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell className="font-medium">{freq.value}</TableCell>
                                        <TableCell className="text-center">{freq.count}</TableCell>
                                        <TableCell className="text-center">{freq.percentage}</TableCell>
                                      </TableRow>
                                    ))}
                                    <TableRow className="font-bold bg-muted/30 border-t-2">
                                      <TableCell>Total</TableCell>
                                      <TableCell className="text-center">{stat.count}</TableCell>
                                      <TableCell className="text-center">100,0</TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                                {stat.missing > 0 && (
                                  <div className="p-2 text-sm text-muted-foreground border-t">
                                    Valeurs manquantes : {stat.missing}
                                  </div>
                                )}
                              </div>
                              
                              {stat.frequencies && stat.frequencies.length <= 10 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-3 text-center">Répartition graphique</h4>
                                  <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                      <Pie
                                        data={stat.frequencies.map(f => ({ name: f.value, value: f.count }))}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                      >
                                        {stat.frequencies.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                      </Pie>
                                      <Tooltip />
                                    </PieChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                              
                              {stat.frequencies && stat.frequencies.length > 10 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-3 text-center">Répartition (Top 10)</h4>
                                  <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={stat.frequencies.slice(0, 10).map(f => ({ name: f.value, effectif: f.count }))}>
                                      <CartesianGrid strokeDasharray="3 3" />
                                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                      <YAxis />
                                      <Tooltip />
                                      <Bar dataKey="effectif" fill="hsl(var(--primary))" />
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Aperçu des données</CardTitle>
                    <CardDescription>Premières lignes du fichier</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {analysisResult.columns.map((col, index) => (
                              <TableHead key={index}>{col}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analysisResult.preview.map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {analysisResult.columns.map((col, colIndex) => (
                                <TableCell key={colIndex}>{row[col]}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
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
