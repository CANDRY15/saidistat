import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { read, utils } from "https://deno.land/x/sheetjs/xlsx.mjs";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ColumnStats {
  name: string;
  type: 'numeric' | 'text';
  count: number;
  missing: number;
  unique?: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  mode?: string;
}

function calculateStats(data: any[], columnName: string): ColumnStats {
  const values = data.map(row => row[columnName]).filter(v => v !== null && v !== undefined && v !== '');
  const totalCount = data.length;
  const missingCount = totalCount - values.length;
  
  // Déterminer le type de données
  const numericValues = values.filter(v => !isNaN(Number(v))).map(Number);
  const isNumeric = numericValues.length > values.length * 0.5; // Si plus de 50% sont numériques
  
  if (isNumeric && numericValues.length > 0) {
    const sorted = numericValues.sort((a, b) => a - b);
    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const mean = sum / sorted.length;
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    // Écart-type
    const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sorted.length;
    const std = Math.sqrt(variance);
    
    return {
      name: columnName,
      type: 'numeric',
      count: values.length,
      missing: missingCount,
      unique: new Set(values).size,
      mean: Number(mean.toFixed(2)),
      median: Number(median.toFixed(2)),
      std: Number(std.toFixed(2)),
      min: Number(sorted[0].toFixed(2)),
      max: Number(sorted[sorted.length - 1].toFixed(2)),
    };
  } else {
    // Variables textuelles
    const frequency: Record<string, number> = {};
    values.forEach(v => {
      const key = String(v);
      frequency[key] = (frequency[key] || 0) + 1;
    });
    
    const mode = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    
    return {
      name: columnName,
      type: 'text',
      count: values.length,
      missing: missingCount,
      unique: new Set(values).size,
      mode,
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Analyzing data file...');
    
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`File received: ${file.name}, size: ${file.size}`);
    
    // Lire le fichier
    const arrayBuffer = await file.arrayBuffer();
    const workbook = read(arrayBuffer);
    
    // Prendre la première feuille
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir en JSON
    const data = utils.sheet_to_json(worksheet);
    
    console.log(`Data loaded: ${data.length} rows`);
    
    if (data.length === 0) {
      throw new Error('No data found in file');
    }
    
    // Obtenir les colonnes
    const columns = Object.keys(data[0] as object);
    console.log(`Columns found: ${columns.join(', ')}`);
    
    // Calculer les statistiques pour chaque colonne
    const statistics = columns.map(col => calculateStats(data, col));
    
    const result = {
      fileName: file.name,
      rowCount: data.length,
      columnCount: columns.length,
      columns: columns,
      statistics: statistics,
      preview: data.slice(0, 5), // Aperçu des 5 premières lignes
    };
    
    console.log('Analysis completed successfully');
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error analyzing data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
