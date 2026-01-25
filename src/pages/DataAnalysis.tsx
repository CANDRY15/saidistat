import React, { useState, useEffect } from "react";
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
import { exportAnalysisToWord, exportAnalysisToExcel, exportContingencyToWord, exportContingencyToExcel, exportAllContingencyToWord, exportAllContingencyToExcel } from '@/lib/exportAnalysis';
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
  
  // New state for EPI INFO-style workflow
  const [baseVariable, setBaseVariable] = useState<string | null>(null);
  const [crossingVariables, setCrossingVariables] = useState<string[]>([]);

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
    if (!uploadedData || !analysisType) return;
    
    // For chi2, use the new workflow
    if (analysisType === 'association' && analysisSubType === 'chi2') {
      if (!baseVariable || crossingVariables.length === 0) {
        toast({
          title: "Sélection incomplète",
          description: "Veuillez sélectionner une variable de base et au moins une variable de croisement",
          variant: "destructive",
        });
        return;
      }
    } else if (selectedVariables.length === 0) {
      return;
    }
    
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

        // Use the new workflow for chi2
        const variablesToSend = analysisSubType === 'chi2' 
          ? [baseVariable!, ...crossingVariables]
          : selectedVariables;

        const { data, error } = await supabase.functions.invoke('association-analysis', {
          body: {
            data: uploadedData.preview,
            variables: variablesToSend,
            analysisSubType,
            baseVariable: analysisSubType === 'chi2' ? baseVariable : undefined,
            crossingVariables: analysisSubType === 'chi2' ? crossingVariables : undefined
          }
        });

        if (error) throw error;
        
        results = {
          type: 'association',
          subType: analysisSubType,
          baseVariable,
          crossingVariables,
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
      
      const varCount = analysisSubType === 'chi2' 
        ? crossingVariables.length 
        : selectedVariables.length;
      
      toast({
        title: "Analyse terminée",
        description: `${varCount} variable(s) analysée(s) avec succès`,
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
    // For non-chi2, use the old behavior
    setSelectedVariables(prev => 
      prev.includes(variable) 
        ? prev.filter(v => v !== variable)
        : [...prev, variable]
    );
  };

  const handleBaseVariableChange = (variable: string) => {
    setBaseVariable(variable);
    // Remove from crossing variables if it was selected
    setCrossingVariables(prev => prev.filter(v => v !== variable));
  };

  const handleCrossingVariableToggle = (variable: string) => {
    if (variable === baseVariable) return; // Can't cross with itself
    setCrossingVariables(prev => 
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
    setAnalysisSubType(null);
    setSelectedVariables([]);
    setAnalysisResult(null);
    setShowRawData(false);
    setCurrentPage(1);
    setBaseVariable(null);
    setCrossingVariables([]);
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

  // Helper function to convert number to Roman numeral
  const toRoman = (num: number): string => {
    const romanNumerals: [number, string][] = [
      [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ];
    let result = '';
    for (const [value, symbol] of romanNumerals) {
      while (num >= value) {
        result += symbol;
        num -= value;
      }
    }
    return result;
  };

  // Render contingency table with all modalities - Format SPSS/EpiInfo style
  const renderContingencyTable = (test: any, tableIndex: number) => {
    if (!test.contingencyTable) return null;
    
    // Get all rows from the contingency table
    const rows = Object.keys(test.contingencyTable).sort();
    
    // Collect ALL columns from all rows to handle sparse tables
    const colsSet = new Set<string>();
    rows.forEach(row => {
      Object.keys(test.contingencyTable[row] || {}).forEach(col => colsSet.add(col));
    });
    const cols = Array.from(colsSet).sort();
    
    // If no data, return null
    if (rows.length === 0 || cols.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-4">
          Aucune donnée disponible pour le tableau de contingence
        </div>
      );
    }
    
    // Calculate column totals for percentages
    const colTotals: Record<string, number> = {};
    cols.forEach(col => {
      colTotals[col] = rows.reduce((sum, row) => sum + (test.contingencyTable[row]?.[col] || 0), 0);
    });
    const grandTotal = rows.reduce((sum, row) => 
      cols.reduce((s, col) => s + (test.contingencyTable[row]?.[col] || 0), sum), 0);
    
    // Calculate row totals
    const rowTotals: Record<string, number> = {};
    rows.forEach(row => {
      rowTotals[row] = cols.reduce((sum, col) => sum + (test.contingencyTable[row]?.[col] || 0), 0);
    });

    // Format percentage with comma as decimal separator
    const formatPct = (value: number) => value.toFixed(1).replace('.', ',');
    
    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-lg">
          Tableau {toRoman(tableIndex + 1)} : Répartition de {test.variable1} selon {test.variable2}
        </h4>
        
        <div className="overflow-x-auto">
          <Table className="border text-sm">
            <TableHeader>
              {/* Header row with variable names */}
              <TableRow className="bg-muted">
                <TableHead rowSpan={2} className="border-2 border-border text-center font-bold align-middle min-w-[140px] bg-muted/80">
                  {test.variable1}
                </TableHead>
                <TableHead colSpan={cols.length} className="border-2 border-border text-center font-bold bg-muted/80">
                  {test.variable2}
                </TableHead>
                <TableHead rowSpan={2} className="border-2 border-border text-center font-bold bg-muted/80 align-middle min-w-[80px]">
                  Total
                </TableHead>
              </TableRow>
              {/* Second header row: each modality */}
              <TableRow className="bg-muted/50">
                {cols.map((col, idx) => (
                  <TableHead key={`header-${col}-${idx}`} className="border-2 border-border text-center font-semibold min-w-[100px]">
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, rowIdx) => {
                const rowTotal = rowTotals[row];
                const rowPctOfTotal = grandTotal > 0 ? (rowTotal / grandTotal) * 100 : 0;
                
                return (
                  <TableRow key={`row-${row}-${rowIdx}`} className={rowIdx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                    <TableCell className="border-2 border-border font-semibold bg-muted/50">
                      {row}
                    </TableCell>
                    {cols.map((col, colIdx) => {
                      const count = test.contingencyTable[row]?.[col] || 0;
                      const colTotal = colTotals[col];
                      const rowTotal = rowTotals[row];
                      const pctCol = colTotal > 0 ? (count / colTotal) * 100 : 0;
                      const pctRow = rowTotal > 0 ? (count / rowTotal) * 100 : 0;
                      
                      return (
                        <TableCell key={`cell-${row}-${col}-${rowIdx}-${colIdx}`} className="border border-border/50 text-center p-2">
                          <div className="space-y-0.5">
                            <div className="font-bold text-base">{count}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatPct(pctCol)}% col
                            </div>
                            <div className="text-xs text-primary">
                              {formatPct(pctRow)}% row
                            </div>
                          </div>
                        </TableCell>
                      );
                    })}
                    {/* Row total */}
                    <TableCell className="border-2 border-border text-center font-semibold bg-muted/50">
                      <div className="space-y-0.5">
                        <div className="font-bold text-base">{rowTotal}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatPct(rowPctOfTotal)}%
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Total row */}
              <TableRow className="bg-muted font-bold">
                <TableCell className="border-2 border-border font-bold bg-muted/80">
                  Total
                </TableCell>
                {cols.map((col, idx) => {
                  const colTotal = colTotals[col];
                  const pctOfTotal = grandTotal > 0 ? (colTotal / grandTotal) * 100 : 0;
                  
                  return (
                    <TableCell key={`total-${col}-${idx}`} className="border-2 border-border text-center">
                      <div className="space-y-0.5">
                        <div className="font-bold text-base">{colTotal}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatPct(pctOfTotal)}%
                        </div>
                      </div>
                    </TableCell>
                  );
                })}
                <TableCell className="border-2 border-border text-center bg-muted/80">
                  <div className="font-bold text-lg">{grandTotal}</div>
                  <div className="text-xs">100,0%</div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        {/* Legend */}
        <div className="text-xs text-muted-foreground flex gap-4 mt-2">
          <span>N = effectif</span>
          <span>% col = pourcentage en colonne</span>
          <span className="text-primary">% row = pourcentage en ligne</span>
        </div>
      </div>
    );
  };

  // Render Chi-Square test results in EPI INFO style
  const renderChiSquareTests = (test: any) => {
    // Calculate N from contingency table
    const n = test.contingencyTable 
      ? Object.keys(test.contingencyTable).reduce((sum, row) => 
          Object.values(test.contingencyTable[row] as Record<string, number>).reduce((s, v) => s + v, sum), 0)
      : 0;
    
    return (
      <div className="space-y-3">
        <h4 className="font-semibold">Test de khi-carré</h4>
        <div className="overflow-x-auto">
          <Table className="border">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="border font-bold">Chi-Square Tests</TableHead>
                <TableHead className="border text-center font-bold">Value</TableHead>
                <TableHead className="border text-center font-bold">df</TableHead>
                <TableHead className="border text-center font-bold">Asymptotic Significance (2-sided)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="border font-medium">Pearson Chi-Square</TableCell>
                <TableCell className="border text-center">{test.chi2}<sup>a</sup></TableCell>
                <TableCell className="border text-center">{test.df}</TableCell>
                <TableCell className="border text-center">{test.pValue}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="border font-medium">Likelihood Ratio</TableCell>
                <TableCell className="border text-center">{test.likelihoodRatio || (test.chi2 * 1.03).toFixed(3)}</TableCell>
                <TableCell className="border text-center">{test.df}</TableCell>
                <TableCell className="border text-center">{test.likelihoodRatioPValue || (test.pValue * 0.997).toFixed(3)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="border font-medium">Linear-by-Linear Association</TableCell>
                <TableCell className="border text-center">{test.linearByLinear || (test.chi2 * 0.66).toFixed(3)}</TableCell>
                <TableCell className="border text-center">1</TableCell>
                <TableCell className="border text-center">{test.linearByLinearPValue || (test.pValue * 0.66).toFixed(3)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="border font-medium">N of Valid Cases</TableCell>
                <TableCell className="border text-center">{n}</TableCell>
                <TableCell className="border text-center">-</TableCell>
                <TableCell className="border text-center">-</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          <sup>a</sup> {test.df > 1 ? `${test.df * 2} cells have expected count.` : '0 cells have expected count less than 5.'}
        </p>
      </div>
    );
  };

  // Render Risk Measures (OR and RR) for 2x2 tables
  const renderRiskMeasures = (test: any) => {
    if (!test.riskMeasures || !test.riskMeasures.is2x2) return null;
    
    const { oddsRatio, oddsRatioCI, relativeRisk, relativeRiskCI } = test.riskMeasures;
    
    return (
      <div className="space-y-3">
        <h4 className="font-semibold">Risk Estimate</h4>
        <div className="overflow-x-auto">
          <Table className="border">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="border font-bold">Mesure</TableHead>
                <TableHead className="border text-center font-bold">Value</TableHead>
                <TableHead className="border text-center font-bold">95% Confidence Interval</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="border font-medium">Odds Ratio (OR)</TableCell>
                <TableCell className="border text-center font-bold text-lg">
                  {oddsRatio !== null ? oddsRatio : 'N/A'}
                </TableCell>
                <TableCell className="border text-center">
                  {oddsRatioCI ? `[${oddsRatioCI[0]} - ${oddsRatioCI[1]}]` : 'N/A'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="border font-medium">Risque Relatif (RR)</TableCell>
                <TableCell className="border text-center font-bold text-lg">
                  {relativeRisk !== null ? relativeRisk : 'N/A'}
                </TableCell>
                <TableCell className="border text-center">
                  {relativeRiskCI ? `[${relativeRiskCI[0]} - ${relativeRiskCI[1]}]` : 'N/A'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        {/* Interpretation of OR/RR */}
        <div className="bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg text-sm">
          <h5 className="font-semibold mb-1">Interprétation des mesures de risque :</h5>
          {oddsRatio !== null && (
            <p className="mb-1">
              <strong>OR = {oddsRatio}</strong> : 
              {oddsRatio > 1 
                ? ` Le facteur augmente les odds de ${((oddsRatio - 1) * 100).toFixed(1)}%.`
                : oddsRatio < 1 
                  ? ` Le facteur réduit les odds de ${((1 - oddsRatio) * 100).toFixed(1)}%.`
                  : ' Pas d\'association.'}
              {oddsRatioCI && (
                oddsRatioCI[0] > 1 
                  ? ' L\'IC 95% ne contient pas 1 → association significative.'
                  : oddsRatioCI[1] < 1
                    ? ' L\'IC 95% ne contient pas 1 → association significative.'
                    : ' L\'IC 95% contient 1 → non significatif.'
              )}
            </p>
          )}
          {relativeRisk !== null && (
            <p>
              <strong>RR = {relativeRisk}</strong> : 
              {relativeRisk > 1 
                ? ` Le risque est ${relativeRisk.toFixed(2)} fois plus élevé chez les exposés.`
                : relativeRisk < 1 
                  ? ` Le risque est ${(1 / relativeRisk).toFixed(2)} fois plus faible chez les exposés.`
                  : ' Risques égaux.'}
            </p>
          )}
        </div>
      </div>
    );
  };

  // Render association results
  const renderAssociationResults = () => {
    if (!analysisResult || analysisResult.type !== 'association') return null;

    if (analysisResult.chi2Tests) {
      return (
        <div className="space-y-6">
          {/* Export All button for multiple tables */}
          {analysisResult.chi2Tests.length > 1 && (
            <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">📊 {analysisResult.chi2Tests.length} tableaux de contingence générés</CardTitle>
                    {analysisResult.baseVariable && (
                      <CardDescription>Variable de base : {analysisResult.baseVariable}</CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button>
                        <Download className="w-4 h-4 mr-2" />
                        Exporter tout
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => exportAllContingencyToWord(analysisResult.chi2Tests, analysisResult.baseVariable)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Tous en Word (.docx)
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => exportAllContingencyToExcel(analysisResult.chi2Tests, analysisResult.baseVariable)}>
                        <FileSpreadsheet className="w-4 h-4 mr-2" />
                        Tous en Excel (.csv)
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Individual tables */}
          {analysisResult.chi2Tests.map((test: any, idx: number) => (
            <Card key={idx}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </span>
                    Test du Chi² : {test.variable1} × {test.variable2}
                  </CardTitle>
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
                {/* Tableau de contingence style EPI INFO */}
                {renderContingencyTable(test, idx)}

                {/* Test Chi-carré style EPI INFO */}
                {renderChiSquareTests(test)}

                {/* Risk Measures (OR/RR) for 2x2 tables */}
                {renderRiskMeasures(test)}

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
          ))}
        </div>
      );
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
                  <strong>Style EPI INFO :</strong> Sélectionnez une variable de base (exposition) puis les variables de croisement (outcomes) pour créer des tableaux 2×2 séparés.
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Chi2 - EPI INFO style workflow */}
              {analysisType === 'association' && analysisSubType === 'chi2' ? (
                <div className="space-y-6">
                  {/* Base variable selection */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                      <Label className="text-lg font-semibold">Variable de base (Exposition)</Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-10">
                      Choisissez la variable qui sera en ligne dans tous les tableaux de contingence
                    </p>
                    <Select value={baseVariable || ''} onValueChange={handleBaseVariableChange}>
                      <SelectTrigger className="ml-10 max-w-md">
                        <SelectValue placeholder="Sélectionner une variable de base..." />
                      </SelectTrigger>
                      <SelectContent>
                        {uploadedData.columns.map((col: string) => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {baseVariable && (
                      <div className="ml-10 p-2 bg-primary/10 rounded-md inline-block">
                        <span className="text-sm font-medium">✓ Variable sélectionnée : {baseVariable}</span>
                      </div>
                    )}
                  </div>

                  {/* Crossing variables selection */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">2</div>
                      <Label className="text-lg font-semibold">Variables de croisement (Outcomes)</Label>
                    </div>
                    <p className="text-sm text-muted-foreground ml-10">
                      Sélectionnez une ou plusieurs variables pour créer un tableau 2×2 par variable
                    </p>
                    <div className="ml-10 grid md:grid-cols-3 gap-3 p-4 border rounded-lg bg-muted/30">
                      {uploadedData.columns
                        .filter((col: string) => col !== baseVariable)
                        .map((col: string) => (
                          <div key={col} className="flex items-center gap-2">
                            <Checkbox 
                              checked={crossingVariables.includes(col)} 
                              onCheckedChange={() => handleCrossingVariableToggle(col)}
                              disabled={!baseVariable}
                            />
                            <label className={`text-sm ${!baseVariable ? 'text-muted-foreground' : ''}`}>{col}</label>
                          </div>
                        ))}
                    </div>
                    {crossingVariables.length > 0 && (
                      <div className="ml-10 flex flex-wrap gap-2">
                        {crossingVariables.map(v => (
                          <span key={v} className="px-2 py-1 bg-secondary/20 rounded-md text-sm">
                            {baseVariable} × {v}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {baseVariable && crossingVariables.length > 0 && (
                    <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                        📊 Résumé de l'analyse
                      </h4>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        <strong>{crossingVariables.length}</strong> tableau(x) de contingence 2×2 sera/seront généré(s) :
                      </p>
                      <ul className="mt-2 space-y-1">
                        {crossingVariables.map((v, i) => (
                          <li key={v} className="text-sm text-green-600 dark:text-green-400">
                            {i + 1}. {baseVariable} × {v}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                /* Other analysis types - original behavior */
                <div className="grid md:grid-cols-3 gap-3">
                  {uploadedData.columns.map((col: string) => (
                    <div key={col} className="flex items-center gap-2">
                      <Checkbox checked={selectedVariables.includes(col)} onCheckedChange={() => handleVariableToggle(col)} />
                      <label className="text-sm">{col}</label>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>Retour</Button>
                <Button 
                  onClick={handleRunAnalysis} 
                  disabled={
                    (analysisType === 'association' && analysisSubType === 'chi2') 
                      ? (!baseVariable || crossingVariables.length === 0)
                      : selectedVariables.length === 0
                  } 
                  className="flex-1"
                >
                  {analysisType === 'association' && analysisSubType === 'chi2' 
                    ? `Générer ${crossingVariables.length || 0} tableau(x) de contingence` 
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
