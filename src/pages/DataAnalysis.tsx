import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Database, ArrowLeft, TrendingUp, FileText, FileSpreadsheet, Check, Link2, Save, FolderOpen, ChevronLeft, ChevronRight, Eye, Download } from "lucide-react";
import saidistatLogo from "@/assets/saidistat-logo.jpg";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import html2canvas from 'html2canvas';
import { exportAnalysisToWord, exportAnalysisToExcel, exportContingencyToWord, exportContingencyToExcel } from '@/lib/exportAnalysis';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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

type AnalysisType = 'frequency' | 'association' | 'advanced' | null;
type AnalysisSubType = 'chi2' | 'correlation' | 'ttest' | 'anova' | 'regression' | null;

const DataAnalysis = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>(null);
  const [analysisSubType, setAnalysisSubType] = useState<AnalysisSubType>(null);
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [analysisName, setAnalysisName] = useState("");
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const rowsPerPage = 10;

  useEffect(() => {
    if (user) {
      loadSavedAnalyses();
    }
  }, [user]);

  const loadSavedAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_analyses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSavedAnalyses(data || []);
    } catch (error: any) {
      console.error('Error loading saved analyses:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['.csv', '.xlsx', '.xls', '.sav'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (validTypes.includes(fileExtension)) {
        setSelectedFile(file);
        
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
      let results: any = {};

      if (analysisType === 'frequency') {
        const filteredStats = uploadedData.statistics.filter((stat: ColumnStats) => 
          selectedVariables.includes(stat.name)
        );
        
        results = {
          type: 'frequency',
          statistics: filteredStats
        };
      } else if (analysisType === 'association') {
        if (!analysisSubType) {
          throw new Error('Veuillez sélectionner un type d\'analyse d\'association');
        }

        const { data, error } = await supabase.functions.invoke('association-analysis', {
          body: {
            data: uploadedData.preview,
            variables: selectedVariables,
            analysisSubType
          }
        });

        if (error) throw error;
        
        results = {
          type: 'association',
          subType: analysisSubType,
          ...data
        };
      } else if (analysisType === 'advanced') {
        if (!analysisSubType) {
          throw new Error('Veuillez sélectionner un type d\'analyse avancée');
        }

        const { data, error } = await supabase.functions.invoke('advanced-analysis', {
          body: {
            data: uploadedData.preview,
            variables: selectedVariables,
            analysisSubType
          }
        });

        if (error) throw error;
        
        results = {
          type: 'advanced',
          subType: analysisSubType,
          ...data
        };
      }
      
      setAnalysisResult(results);
      
      toast({
        title: "Analyse terminée",
        description: `${selectedVariables.length} variable(s) analysée(s) avec succès`,
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Erreur d'analyse",
        description: error.message,
        variant: "destructive",
      });
      setStep(3);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysisName.trim() || !analysisResult || !user) return;

    try {
      const { error } = await supabase
        .from('saved_analyses')
        .insert({
          user_id: user.id,
          analysis_name: analysisName.trim(),
          analysis_type: analysisType!,
          file_name: selectedFile?.name || 'Unknown',
          selected_variables: selectedVariables,
          results: analysisResult
        });

      if (error) throw error;

      toast({
        title: "Analyse sauvegardée",
        description: `"${analysisName}" a été sauvegardée avec succès`,
      });

      setShowSaveDialog(false);
      setAnalysisName("");
      loadSavedAnalyses();
    } catch (error: any) {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLoadAnalysis = (analysis: any) => {
    setAnalysisResult(analysis.results);
    setAnalysisType(analysis.analysis_type);
    setSelectedVariables(analysis.selected_variables);
    setStep(4);
    setShowLoadDialog(false);
    
    toast({
      title: "Analyse chargée",
      description: `"${analysis.analysis_name}" a été chargée`,
    });
  };

  const handleVariableToggle = (variable: string) => {
    // Pour l'analyse d'association chi2, limiter à 2 variables
    if (analysisType === 'association' && analysisSubType === 'chi2') {
      setSelectedVariables(prev => {
        if (prev.includes(variable)) {
          return prev.filter(v => v !== variable);
        }
        // Si déjà 2 variables sélectionnées, remplacer la dernière
        if (prev.length >= 2) {
          return [prev[0], variable];
        }
        return [...prev, variable];
      });
    } else {
      setSelectedVariables(prev => 
        prev.includes(variable) 
          ? prev.filter(v => v !== variable)
          : [...prev, variable]
      );
    }
  };

  const resetAnalysis = () => {
    setStep(1);
    setSelectedFile(null);
    setUploadedData(null);
    setAnalysisType(null);
    setAnalysisSubType(null);
    setSelectedVariables([]);
    setAnalysisResult(null);
    setShowRawData(false);
    setCurrentPage(1);
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

  // Render raw data table with pagination
  const renderRawDataTable = () => {
    if (!uploadedData?.preview) return null;

    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = startIdx + rowsPerPage;
    const paginatedData = uploadedData.preview.slice(startIdx, endIdx);
    const totalPages = Math.ceil(uploadedData.preview.length / rowsPerPage);

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Données brutes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {uploadedData.columns.map((col: string) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row: any, idx: number) => (
                  <TableRow key={idx}>
                    {uploadedData.columns.map((col: string) => (
                      <TableCell key={col}>{row[col]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render frequency results
  const renderFrequencyResults = () => {
    if (!analysisResult || analysisResult.type !== 'frequency') return null;

    return analysisResult.statistics.map((stat: ColumnStats) => (
      <Card key={stat.name} className="mb-6">
        <CardHeader>
          <CardTitle>Tableau de fréquence: {stat.name}</CardTitle>
          <CardDescription>
            Type: {stat.type === 'numeric' ? 'Numérique' : 'Catégorielle'} | 
            Total: {stat.count} | Valeurs manquantes: {stat.missing}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tableau de fréquence */}
          {stat.frequencies && (
            <div>
              <h4 className="font-semibold mb-3">Distribution des fréquences</h4>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Valeur</TableHead>
                      <TableHead className="text-right">Effectif</TableHead>
                      <TableHead className="text-right">Pourcentage</TableHead>
                      <TableHead>Visualisation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stat.frequencies.map((freq: FrequencyItem, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{freq.value}</TableCell>
                        <TableCell className="text-right">{freq.count}</TableCell>
                        <TableCell className="text-right">{freq.percentage.toFixed(2)}%</TableCell>
                        <TableCell>
                          <div className="w-full bg-muted rounded-full h-4">
                            <div 
                              className="bg-primary h-4 rounded-full" 
                              style={{ width: `${freq.percentage}%` }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Statistiques descriptives pour variables numériques */}
          {stat.type === 'numeric' && (
            <div>
              <h4 className="font-semibold mb-3">Statistiques descriptives</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stat.mean !== undefined && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Moyenne</p>
                    <p className="text-lg font-bold">{stat.mean.toFixed(2)}</p>
                  </div>
                )}
                {stat.median !== undefined && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Médiane</p>
                    <p className="text-lg font-bold">{stat.median.toFixed(2)}</p>
                  </div>
                )}
                {stat.std !== undefined && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Écart-type</p>
                    <p className="text-lg font-bold">{stat.std.toFixed(2)}</p>
                  </div>
                )}
                {stat.min !== undefined && stat.max !== undefined && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground">Min - Max</p>
                    <p className="text-lg font-bold">{stat.min.toFixed(2)} - {stat.max.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Graphique */}
          {stat.frequencies && (
            <div>
              <h4 className="font-semibold mb-3">Graphique</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stat.frequencies}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="value" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="hsl(var(--primary))" name="Effectif" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    ));
  };

  // Render 2x2 contingency table for association results
  const render2x2ContingencyTable = (test: any) => {
    if (!test.contingencyTable) return null;
    
    const rows = Object.keys(test.contingencyTable);
    const cols = Object.keys(test.contingencyTable[rows[0]] || {});
    
    // Get the 2x2 values
    const a = test.contingencyTable[rows[0]]?.[cols[0]] || 0;
    const b = test.contingencyTable[rows[0]]?.[cols[1]] || 0;
    const c = test.contingencyTable[rows[1]]?.[cols[0]] || 0;
    const d = test.contingencyTable[rows[1]]?.[cols[1]] || 0;
    
    const n1 = a + b; // Total row 1
    const n0 = c + d; // Total row 2
    const m1 = a + c; // Total col 1
    const m0 = b + d; // Total col 2
    const n = a + b + c + d; // Grand total
    
    return (
      <div className="space-y-4">
        <h4 className="font-semibold">Table de contingence 2×2</h4>
        <div className="overflow-x-auto">
          <Table className="border">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="border text-center font-bold">{test.variable1} \ {test.variable2}</TableHead>
                <TableHead className="border text-center font-bold">{cols[0] || '+'}</TableHead>
                <TableHead className="border text-center font-bold">{cols[1] || '-'}</TableHead>
                <TableHead className="border text-center font-bold bg-primary/10">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="border font-medium bg-muted/30">{rows[0] || 'Exposé'}</TableCell>
                <TableCell className="border text-center text-lg font-bold text-primary">a = {a}</TableCell>
                <TableCell className="border text-center text-lg font-bold text-secondary">b = {b}</TableCell>
                <TableCell className="border text-center font-bold bg-primary/10">n₁ = {n1}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="border font-medium bg-muted/30">{rows[1] || 'Non exposé'}</TableCell>
                <TableCell className="border text-center text-lg font-bold text-primary">c = {c}</TableCell>
                <TableCell className="border text-center text-lg font-bold text-secondary">d = {d}</TableCell>
                <TableCell className="border text-center font-bold bg-primary/10">n₀ = {n0}</TableCell>
              </TableRow>
              <TableRow className="bg-primary/10">
                <TableCell className="border font-bold">Total</TableCell>
                <TableCell className="border text-center font-bold">m₁ = {m1}</TableCell>
                <TableCell className="border text-center font-bold">m₀ = {m0}</TableCell>
                <TableCell className="border text-center font-bold">N = {n}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        {/* Légende */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
          <div><span className="font-bold text-primary">a</span> = Exposés malades</div>
          <div><span className="font-bold text-secondary">b</span> = Exposés non malades</div>
          <div><span className="font-bold text-primary">c</span> = Non exposés malades</div>
          <div><span className="font-bold text-secondary">d</span> = Non exposés non malades</div>
        </div>
      </div>
    );
  };

  // Render association results
  const renderAssociationResults = () => {
    if (!analysisResult || analysisResult.type !== 'association') return null;

    if (analysisResult.chi2Tests) {
      return analysisResult.chi2Tests.map((test: any, idx: number) => (
        <Card key={idx} className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Test du Chi² : {test.variable1} × {test.variable2}</CardTitle>
              <CardDescription>
                Test d'indépendance entre deux variables catégorielles
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => exportContingencyToWord(test)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportContingencyToExcel(test)}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel (.csv)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Table de contingence 2x2 */}
            {render2x2ContingencyTable(test)}

            {/* Résultats du test */}
            <div>
              <h4 className="font-semibold mb-3">Résultats du test</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">χ² calculé</p>
                  <p className="text-xl font-bold">{test.chi2}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Degrés de liberté</p>
                  <p className="text-xl font-bold">{test.df}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">p-value</p>
                  <p className="text-xl font-bold">{test.pValue}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Significatif (α=0.05)</p>
                  <p className={`text-xl font-bold ${test.pValue < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
                    {test.pValue < 0.05 ? 'Oui' : 'Non'}
                  </p>
                </div>
              </div>
            </div>

            {/* Interprétation */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Interprétation</h4>
              <p className="text-sm">
                {test.pValue < 0.05 
                  ? `Il existe une association statistiquement significative entre ${test.variable1} et ${test.variable2} (p = ${test.pValue} < 0.05). Les deux variables ne sont pas indépendantes.`
                  : `Il n'y a pas d'association statistiquement significative entre ${test.variable1} et ${test.variable2} (p = ${test.pValue} ≥ 0.05). Les deux variables peuvent être considérées comme indépendantes.`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ));
    }

    if (analysisResult.correlations) {
      return analysisResult.correlations.map((corr: any, idx: number) => (
        <Card key={idx} className="mb-6">
          <CardHeader>
            <CardTitle>Corrélation de Pearson : {corr.variable1} × {corr.variable2}</CardTitle>
            <CardDescription>
              Test de corrélation entre deux variables numériques
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Résultats */}
            <div>
              <h4 className="font-semibold mb-3">Résultats du test</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Coefficient r</p>
                  <p className="text-xl font-bold">{corr.correlation}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">p-value</p>
                  <p className="text-xl font-bold">{corr.pValue}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Significatif (α=0.05)</p>
                  <p className={`text-xl font-bold ${corr.pValue < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
                    {corr.pValue < 0.05 ? 'Oui' : 'Non'}
                  </p>
                </div>
              </div>
            </div>

            {/* Interprétation */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Interprétation</h4>
              <p className="text-sm">
                {corr.pValue < 0.05 
                  ? `Il existe une corrélation ${Math.abs(parseFloat(corr.correlation)) > 0.7 ? 'forte' : Math.abs(parseFloat(corr.correlation)) > 0.4 ? 'modérée' : 'faible'} 
                     ${parseFloat(corr.correlation) > 0 ? 'positive' : 'négative'} statistiquement significative entre ${corr.variable1} et ${corr.variable2} 
                     (r = ${corr.correlation}, p = ${corr.pValue} < 0.05).`
                  : `Il n'y a pas de corrélation statistiquement significative entre ${corr.variable1} et ${corr.variable2} 
                     (r = ${corr.correlation}, p = ${corr.pValue} ≥ 0.05).`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ));
    }
  };

  // Render advanced results
  const renderAdvancedResults = () => {
    if (!analysisResult || analysisResult.type !== 'advanced') return null;

    if (analysisResult.tTests) {
      return analysisResult.tTests.map((test: any, idx: number) => (
        <Card key={idx} className="mb-6">
          <CardHeader>
            <CardTitle>Test t de Student : {test.numericVariable}</CardTitle>
            <CardDescription>
              Comparaison entre {test.group1} et {test.group2}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Statistiques descriptives */}
            <div>
              <h4 className="font-semibold mb-3">Statistiques descriptives</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Groupe</TableHead>
                    <TableHead className="text-right">N</TableHead>
                    <TableHead className="text-right">Moyenne</TableHead>
                    <TableHead className="text-right">Écart-type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">{test.group1}</TableCell>
                    <TableCell className="text-right">{test.n1}</TableCell>
                    <TableCell className="text-right">{test.mean1}</TableCell>
                    <TableCell className="text-right">{test.std1}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">{test.group2}</TableCell>
                    <TableCell className="text-right">{test.n2}</TableCell>
                    <TableCell className="text-right">{test.mean2}</TableCell>
                    <TableCell className="text-right">{test.std2}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Résultats du test */}
            <div>
              <h4 className="font-semibold mb-3">Résultats du test</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Statistique t</p>
                  <p className="text-xl font-bold">{test.t}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">p-value</p>
                  <p className="text-xl font-bold">{test.pValue}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Significatif (α=0.05)</p>
                  <p className={`text-xl font-bold ${test.pValue < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
                    {test.pValue < 0.05 ? 'Oui' : 'Non'}
                  </p>
                </div>
              </div>
            </div>

            {/* Interprétation */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Interprétation</h4>
              <p className="text-sm">
                {test.pValue < 0.05 
                  ? `Il existe une différence statistiquement significative entre les groupes ${test.group1} et ${test.group2} 
                     (t = ${test.t}, p = ${test.pValue} < 0.05). Les moyennes sont significativement différentes.`
                  : `Il n'y a pas de différence statistiquement significative entre les groupes ${test.group1} et ${test.group2} 
                     (t = ${test.t}, p = ${test.pValue} ≥ 0.05). Les moyennes ne sont pas significativement différentes.`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ));
    }

    if (analysisResult.anovaTests) {
      return analysisResult.anovaTests.map((test: any, idx: number) => (
        <Card key={idx} className="mb-6">
          <CardHeader>
            <CardTitle>ANOVA : {test.dependentVariable} par {test.independentVariable}</CardTitle>
            <CardDescription>
              Analyse de variance pour comparer plusieurs groupes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Résultats du test */}
            <div>
              <h4 className="font-semibold mb-3">Résultats du test</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Statistique F</p>
                  <p className="text-xl font-bold">{test.fStatistic}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">ddl entre</p>
                  <p className="text-xl font-bold">{test.dfBetween}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">p-value</p>
                  <p className="text-xl font-bold">{test.pValue}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">Significatif (α=0.05)</p>
                  <p className={`text-xl font-bold ${test.pValue < 0.05 ? 'text-green-600' : 'text-red-600'}`}>
                    {test.pValue < 0.05 ? 'Oui' : 'Non'}
                  </p>
                </div>
              </div>
            </div>

            {/* Interprétation */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Interprétation</h4>
              <p className="text-sm">
                {test.pValue < 0.05 
                  ? `Il existe des différences statistiquement significatives entre les groupes de ${test.independentVariable} 
                     pour la variable ${test.dependentVariable} (F = ${test.fStatistic}, p = ${test.pValue} < 0.05).`
                  : `Il n'y a pas de différence statistiquement significative entre les groupes de ${test.independentVariable} 
                     pour la variable ${test.dependentVariable} (F = ${test.fStatistic}, p = ${test.pValue} ≥ 0.05).`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ));
    }

    if (analysisResult.regressions) {
      return analysisResult.regressions.map((reg: any, idx: number) => (
        <Card key={idx} className="mb-6">
          <CardHeader>
            <CardTitle>Régression linéaire : {reg.dependentVariable}</CardTitle>
            <CardDescription>
              Variables indépendantes : {reg.independentVariables?.join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Résultats du modèle */}
            <div>
              <h4 className="font-semibold mb-3">Qualité du modèle</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">R²</p>
                  <p className="text-xl font-bold">{reg.rSquared}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">R² ajusté</p>
                  <p className="text-xl font-bold">{reg.adjustedRSquared}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">p-value</p>
                  <p className="text-xl font-bold">{reg.pValue}</p>
                </div>
              </div>
            </div>

            {/* Coefficients */}
            {reg.coefficients && (
              <div>
                <h4 className="font-semibold mb-3">Coefficients</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Variable</TableHead>
                      <TableHead className="text-right">Coefficient</TableHead>
                      <TableHead className="text-right">Erreur std</TableHead>
                      <TableHead className="text-right">p-value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reg.coefficients.map((coef: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{coef.variable}</TableCell>
                        <TableCell className="text-right">{coef.value}</TableCell>
                        <TableCell className="text-right">{coef.stdError}</TableCell>
                        <TableCell className="text-right">{coef.pValue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Interprétation */}
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Interprétation</h4>
              <p className="text-sm">
                {reg.pValue < 0.05 
                  ? `Le modèle de régression est statistiquement significatif (p = ${reg.pValue} < 0.05). 
                     Le R² de ${reg.rSquared} indique que ${(parseFloat(reg.rSquared) * 100).toFixed(1)}% de la variance 
                     de ${reg.dependentVariable} est expliquée par le modèle.`
                  : `Le modèle de régression n'est pas statistiquement significatif (p = ${reg.pValue} ≥ 0.05).`
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg">
                <img src={saidistatLogo} alt="SaidiStat Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">SaidiStat</span>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Analyse de données</h1>

        {/* Step indicator */}
        <div className="mb-8 flex justify-center gap-4">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {s}
              </div>
              {s < 4 && <div className={`h-1 w-16 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Étape 1 : Télécharger les données</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input type="file" accept=".csv,.xlsx,.xls,.sav" onChange={handleFileChange} />
              
              {uploadedData && (
                <div className="p-4 bg-muted rounded">
                  <p className="font-semibold">{uploadedData.fileName}</p>
                  <p className="text-sm">{uploadedData.rowCount} × {uploadedData.columnCount}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} disabled={!uploadedData} className="flex-1">
                  Continuer
                </Button>
                <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Charger
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Analyses sauvegardées</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {savedAnalyses.map(a => (
                        <Button key={a.id} variant="outline" className="w-full" onClick={() => handleLoadAnalysis(a)}>
                          {a.analysis_name}
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Analysis Type */}
        {step === 2 && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Étape 2 : Type d'analyse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className={`cursor-pointer ${analysisType === 'frequency' ? 'ring-2 ring-primary' : ''}`} onClick={() => setAnalysisType('frequency')}>
                  <CardHeader>
                    <FileSpreadsheet className="w-12 h-12 mb-2" />
                    <CardTitle>Fréquence</CardTitle>
                  </CardHeader>
                </Card>
                <Card className={`cursor-pointer ${analysisType === 'association' ? 'ring-2 ring-primary' : ''}`} onClick={() => setAnalysisType('association')}>
                  <CardHeader>
                    <Link2 className="w-12 h-12 mb-2" />
                    <CardTitle>Associations</CardTitle>
                  </CardHeader>
                </Card>
                <Card className={`cursor-pointer ${analysisType === 'advanced' ? 'ring-2 ring-primary' : ''}`} onClick={() => setAnalysisType('advanced')}>
                  <CardHeader>
                    <TrendingUp className="w-12 h-12 mb-2" />
                    <CardTitle>Avancées</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {analysisType === 'association' && (
                <Select value={analysisSubType || ''} onValueChange={(v) => setAnalysisSubType(v as AnalysisSubType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chi2">Test χ²</SelectItem>
                    <SelectItem value="correlation">Corrélation</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {analysisType === 'advanced' && (
                <Select value={analysisSubType || ''} onValueChange={(v) => setAnalysisSubType(v as AnalysisSubType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ttest">Test t</SelectItem>
                    <SelectItem value="anova">ANOVA</SelectItem>
                    <SelectItem value="regression">Régression</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>Retour</Button>
                <Button onClick={() => setStep(3)} disabled={!analysisType} className="flex-1">Continuer</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Variables */}
        {step === 3 && uploadedData && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Étape 3 : Sélection des variables</CardTitle>
              {analysisType === 'association' && analysisSubType === 'chi2' && (
                <CardDescription>
                  Sélectionnez exactement 2 variables pour construire la table de contingence 2×2
                  {selectedVariables.length > 0 && (
                    <span className="ml-2 text-primary font-medium">
                      ({selectedVariables.length}/2 sélectionnées)
                    </span>
                  )}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                {uploadedData.columns.map((col: string) => (
                  <div key={col} className="flex items-center gap-2">
                    <Checkbox checked={selectedVariables.includes(col)} onCheckedChange={() => handleVariableToggle(col)} />
                    <label className="text-sm">{col}</label>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>Retour</Button>
                <Button 
                  onClick={handleRunAnalysis} 
                  disabled={
                    selectedVariables.length === 0 || 
                    (analysisType === 'association' && analysisSubType === 'chi2' && selectedVariables.length !== 2)
                  } 
                  className="flex-1"
                >
                  {analysisType === 'association' && analysisSubType === 'chi2' 
                    ? 'Construire la table de contingence' 
                    : 'Analyser'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Results */}
        {step === 4 && analysisResult && (
          <div className="space-y-6">
            <div className="flex justify-between">
              <h2 className="text-2xl font-bold">Résultats</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRawData(!showRawData)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Données brutes
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Exporter
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => exportAnalysisToWord(analysisResult, `analyse_${new Date().toISOString().split('T')[0]}`)}>
                      <FileText className="w-4 h-4 mr-2" />
                      Exporter en Word (.docx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportAnalysisToExcel(analysisResult, `analyse_${new Date().toISOString().split('T')[0]}`)}>
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Exporter en Excel (.csv)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sauvegarder l'analyse</DialogTitle>
                    </DialogHeader>
                    <Input value={analysisName} onChange={(e) => setAnalysisName(e.target.value)} placeholder="Nom" />
                    <DialogFooter>
                      <Button onClick={handleSaveAnalysis}>Sauvegarder</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button onClick={resetAnalysis}>Nouvelle</Button>
              </div>
            </div>

            {showRawData && renderRawDataTable()}
            {renderFrequencyResults()}
            {renderAssociationResults()}
            {renderAdvancedResults()}
          </div>
        )}
      </main>
    </div>
  );
};

export default DataAnalysis;
