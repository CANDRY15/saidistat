import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Upload, Database, ArrowLeft, TrendingUp, FileText, FileSpreadsheet, Check, Link2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import { Checkbox } from "@/components/ui/checkbox";

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

type AnalysisType = 'frequency' | 'association' | 'advanced' | null;

const DataAnalysis = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>(null);
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['.csv', '.xlsx', '.xls', '.sav'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (validTypes.includes(fileExtension)) {
        setSelectedFile(file);
        
        // Auto-load data for preview
        try {
          const formData = new FormData();
          formData.append('file', file);

          const { data, error } = await supabase.functions.invoke('analyze-data', {
            body: formData,
          });

          if (error) throw error;
          
          setUploadedData(data);
          toast({
            title: "Fichier chargé",
            description: `${file.name} - ${data.rowCount} lignes et ${data.columnCount} colonnes`,
          });
        } catch (error: any) {
          console.error('Error loading data:', error);
          toast({
            title: "Erreur de chargement",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Format non supporté",
          description: "Veuillez sélectionner un fichier CSV, Excel ou SPSS",
          variant: "destructive",
        });
      }
    }
  };

  const handleRunAnalysis = async () => {
    if (!uploadedData || !analysisType || selectedVariables.length === 0) return;
    
    setIsAnalyzing(true);
    setStep(4);
    
    toast({
      title: "Analyse en cours",
      description: "Traitement des données...",
    });

    try {
      // Filter statistics for selected variables only
      const filteredStats = uploadedData.statistics.filter((stat: ColumnStats) => 
        selectedVariables.includes(stat.name)
      );

      setAnalysisResult({
        ...uploadedData,
        statistics: filteredStats
      });

      toast({
        title: "Analyse terminée",
        description: `Analyse ${analysisType === 'frequency' ? 'de fréquence' : analysisType === 'association' ? 'd\'association' : 'avancée'} complétée`,
      });
    } catch (error: any) {
      console.error('Error analyzing data:', error);
      toast({
        title: "Erreur d'analyse",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVariableToggle = (variable: string) => {
    setSelectedVariables(prev => 
      prev.includes(variable) 
        ? prev.filter(v => v !== variable)
        : [...prev, variable]
    );
  };

  const resetAnalysis = () => {
    setStep(1);
    setSelectedFile(null);
    setUploadedData(null);
    setAnalysisType(null);
    setSelectedVariables([]);
    setAnalysisResult(null);
  };

  const handleDownload = async (format: 'excel' | 'pdf' | 'word') => {
    if (!analysisResult) return;

    try {
      toast({
        title: "Génération en cours",
        description: `Capture des graphiques et création du fichier ${format.toUpperCase()}...`,
      });

      // Capture all charts as images
      const chartImages: { [key: string]: string } = {};
      const chartElements = document.querySelectorAll('[data-chart-id]');
      
      for (const element of Array.from(chartElements)) {
        const chartId = element.getAttribute('data-chart-id');
        if (chartId) {
          try {
            const canvas = await html2canvas(element as HTMLElement, {
              backgroundColor: '#ffffff',
              scale: 2
            });
            chartImages[chartId] = canvas.toDataURL('image/png');
          } catch (err) {
            console.error(`Error capturing chart ${chartId}:`, err);
          }
        }
      }

      if (format === 'pdf') {
        const { data, error } = await supabase.functions.invoke('export-analysis', {
          body: { analysisResult, format, chartImages }
        });

        if (error) throw error;

        const printWindow = window.open('', '_blank');
        if (printWindow && data.html) {
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
      } else {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-analysis`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ analysisResult, format, chartImages })
          }
        );

        if (!response.ok) throw new Error('Erreur lors de la génération du fichier');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analyse_${analysisResult.fileName}.${format === 'excel' ? 'csv' : 'doc'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Téléchargement réussi",
          description: `Le fichier ${format.toUpperCase()} a été téléchargé avec succès.`,
        });
      }
    } catch (error: any) {
      console.error('Error downloading:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur s'est produite lors du téléchargement.",
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
            Workflow guidé pour analyser vos données en 4 étapes
          </p>
        </div>

        {/* Step Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {[
              { num: 1, label: "Upload" },
              { num: 2, label: "Type d'analyse" },
              { num: 3, label: "Variables" },
              { num: 4, label: "Résultats" }
            ].map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
                    step >= s.num 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {step > s.num ? <Check className="w-6 h-6" /> : s.num}
                  </div>
                  <p className="text-xs mt-2 font-medium text-center">{s.label}</p>
                </div>
                {i < 3 && (
                  <div className={`h-1 flex-1 mx-2 rounded transition-all ${
                    step > s.num ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Step 1: Upload */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Étape 1 : Importer vos données
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

                {uploadedData && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-3 mb-4">
                        <Database className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-medium">{selectedFile?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {uploadedData.rowCount} lignes × {uploadedData.columnCount} colonnes
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Colonnes détectées :</p>
                        <div className="flex flex-wrap gap-2">
                          {uploadedData.columns.map((col: string) => (
                            <span key={col} className="px-2 py-1 bg-background rounded text-xs">
                              {col}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Button onClick={() => setStep(2)} className="w-full">
                      Continuer vers le choix du type d'analyse
                    </Button>
                  </div>
                )}

                {!uploadedData && (
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-2">Glissez-déposez votre fichier ici</p>
                    <p className="text-sm text-muted-foreground">
                      ou utilisez le bouton ci-dessus pour sélectionner un fichier
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Analysis Type */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Étape 2 : Type d'analyse</CardTitle>
                <CardDescription>Choisissez le type d'analyse à effectuer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setAnalysisType('frequency')}
                    className={`p-6 border-2 rounded-lg transition-all text-left hover:border-primary ${
                      analysisType === 'frequency' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <BarChart3 className="w-8 h-8 mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">Fréquence</h3>
                    <p className="text-sm text-muted-foreground">
                      Tableaux de fréquence, distributions, statistiques descriptives
                    </p>
                  </button>

                  <button
                    onClick={() => setAnalysisType('association')}
                    className={`p-6 border-2 rounded-lg transition-all text-left hover:border-primary ${
                      analysisType === 'association' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <Link2 className="w-8 h-8 mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">Associations</h3>
                    <p className="text-sm text-muted-foreground">
                      Test du Chi², corrélations, tests d'association
                    </p>
                  </button>

                  <button
                    onClick={() => setAnalysisType('advanced')}
                    className={`p-6 border-2 rounded-lg transition-all text-left hover:border-primary ${
                      analysisType === 'advanced' ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <TrendingUp className="w-8 h-8 mb-3 text-primary" />
                    <h3 className="font-semibold mb-2">Analyses avancées</h3>
                    <p className="text-sm text-muted-foreground">
                      Régressions, tests t, ANOVA, analyses multivariées
                    </p>
                  </button>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Retour
                  </Button>
                  <Button 
                    onClick={() => setStep(3)} 
                    disabled={!analysisType}
                    className="flex-1"
                  >
                    Continuer vers la sélection des variables
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Variable Selection */}
          {step === 3 && uploadedData && (
            <Card>
              <CardHeader>
                <CardTitle>Étape 3 : Sélection des variables</CardTitle>
                <CardDescription>
                  Choisissez les variables à inclure dans l'analyse {
                    analysisType === 'frequency' ? 'de fréquence' : 
                    analysisType === 'association' ? 'd\'association' : 
                    'avancée'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {uploadedData.statistics.map((stat: ColumnStats) => (
                    <div 
                      key={stat.name}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={stat.name}
                        checked={selectedVariables.includes(stat.name)}
                        onCheckedChange={() => handleVariableToggle(stat.name)}
                      />
                      <label
                        htmlFor={stat.name}
                        className="flex-1 flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <p className="font-medium">{stat.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {stat.type === 'numeric' ? 'Quantitative' : 
                             stat.type === 'age_groups' ? 'Tranches d\'âge' : 
                             'Qualitative'} • {stat.count} valeurs
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                          {stat.type === 'numeric' ? 'Num.' : 'Cat.'}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>

                {selectedVariables.length > 0 && (
                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium mb-1">
                      {selectedVariables.length} variable{selectedVariables.length > 1 ? 's' : ''} sélectionnée{selectedVariables.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedVariables.join(', ')}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Retour
                  </Button>
                  <Button 
                    onClick={handleRunAnalysis}
                    disabled={selectedVariables.length === 0 || isAnalyzing}
                    className="flex-1"
                  >
                    {isAnalyzing ? "Analyse en cours..." : "Lancer l'analyse"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Results */}
          {step === 4 && analysisResult && (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Résultats de l'analyse
                      </CardTitle>
                      <CardDescription>
                        {analysisType === 'frequency' && 'Analyse de fréquence'}
                        {analysisType === 'association' && 'Analyse d\'association'}
                        {analysisType === 'advanced' && 'Analyse avancée'}
                        {' • '}{selectedVariables.length} variable{selectedVariables.length > 1 ? 's' : ''}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={resetAnalysis}>
                        Nouvelle analyse
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload('excel')}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Excel
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDownload('pdf')}>
                        <FileText className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Variables analysées</p>
                      <p className="text-2xl font-bold">{selectedVariables.length}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Observations</p>
                      <p className="text-2xl font-bold">{analysisResult.rowCount}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="text-lg font-bold">
                        {analysisType === 'frequency' ? 'Fréquence' : analysisType === 'association' ? 'Association' : 'Avancée'}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Fichier</p>
                      <p className="text-sm font-medium truncate">{analysisResult.fileName}</p>
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
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Statistique</TableHead>
                                  <TableHead>Valeur</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                <TableRow>
                                  <TableCell>Effectif</TableCell>
                                  <TableCell>{stat.count}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Moyenne</TableCell>
                                  <TableCell>{stat.mean?.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Médiane</TableCell>
                                  <TableCell>{stat.median?.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Écart-type</TableCell>
                                  <TableCell>{stat.std?.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Minimum</TableCell>
                                  <TableCell>{stat.min?.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Maximum</TableCell>
                                  <TableCell>{stat.max?.toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell>Valeurs manquantes</TableCell>
                                  <TableCell>{stat.missing}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                            
                            <div data-chart-id={`bar-${stat.name}`}>
                              <h4 className="text-sm font-semibold mb-3 text-center">Statistiques résumées</h4>
                              <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={[
                                  { name: 'Min', value: stat.min || 0 },
                                  { name: 'Moyenne', value: stat.mean || 0 },
                                  { name: 'Médiane', value: stat.median || 0 },
                                  { name: 'Max', value: stat.max || 0 }
                                ]}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip />
                                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Modalité</TableHead>
                                  <TableHead>Effectif</TableHead>
                                  <TableHead>Pourcentage</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {stat.frequencies?.map((freq, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="font-medium">{freq.value}</TableCell>
                                    <TableCell>{freq.count}</TableCell>
                                    <TableCell>{freq.percentage}%</TableCell>
                                  </TableRow>
                                ))}
                                {stat.missing > 0 && (
                                  <TableRow>
                                    <TableCell className="font-medium text-muted-foreground">Manquantes</TableCell>
                                    <TableCell className="text-muted-foreground">{stat.missing}</TableCell>
                                    <TableCell></TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div data-chart-id={`bar-${stat.name}`}>
                                <h4 className="text-sm font-semibold mb-3 text-center">Diagramme en barres</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                  <BarChart data={stat.frequencies}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="value" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                              
                              <div data-chart-id={`pie-${stat.name}`}>
                                <h4 className="text-sm font-semibold mb-3 text-center">Diagramme circulaire</h4>
                                <ResponsiveContainer width="100%" height={300}>
                                  <PieChart>
                                    <Pie
                                      data={stat.frequencies}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ value, percentage }) => `${percentage}%`}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="count"
                                    >
                                      {stat.frequencies?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DataAnalysis;