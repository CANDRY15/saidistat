import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskMeasures {
  oddsRatio: number | null;
  oddsRatioCI: [number, number] | null;
  relativeRisk: number | null;
  relativeRiskCI: [number, number] | null;
  is2x2: boolean;
}

interface Chi2Result {
  variable1: string;
  variable2: string;
  chi2: number;
  df: number;
  degreesOfFreedom: number;
  pValue: number;
  significant: boolean;
  contingencyTable: Record<string, Record<string, number>>;
  riskMeasures?: RiskMeasures;
  likelihoodRatio?: number;
  likelihoodRatioPValue?: number;
  linearByLinear?: number;
  linearByLinearPValue?: number;
}

interface CorrelationResult {
  variable1: string;
  variable2: string;
  correlation: number;
  pValue: number;
  type: 'pearson' | 'spearman';
  significant: boolean;
}

// Calculate Odds Ratio and Relative Risk for 2x2 tables
function calculateRiskMeasures(contingencyTable: Record<string, Record<string, number>>, rows: string[], cols: string[]): RiskMeasures {
  const is2x2 = rows.length === 2 && cols.length === 2;
  
  if (!is2x2) {
    return {
      oddsRatio: null,
      oddsRatioCI: null,
      relativeRisk: null,
      relativeRiskCI: null,
      is2x2: false
    };
  }
  
  // For 2x2 table:
  //           | Col1 (Disease+) | Col2 (Disease-) |
  // Row1 (Exp+) |       a         |       b         |
  // Row2 (Exp-) |       c         |       d         |
  
  const a = contingencyTable[rows[0]]?.[cols[0]] || 0;
  const b = contingencyTable[rows[0]]?.[cols[1]] || 0;
  const c = contingencyTable[rows[1]]?.[cols[0]] || 0;
  const d = contingencyTable[rows[1]]?.[cols[1]] || 0;
  
  // Odds Ratio = (a*d) / (b*c)
  let oddsRatio: number | null = null;
  let oddsRatioCI: [number, number] | null = null;
  
  if (b * c > 0) {
    oddsRatio = (a * d) / (b * c);
    
    // 95% CI for OR using Woolf's method: ln(OR) ± 1.96 * sqrt(1/a + 1/b + 1/c + 1/d)
    if (a > 0 && b > 0 && c > 0 && d > 0) {
      const lnOR = Math.log(oddsRatio);
      const se = Math.sqrt(1/a + 1/b + 1/c + 1/d);
      const lowerLn = lnOR - 1.96 * se;
      const upperLn = lnOR + 1.96 * se;
      oddsRatioCI = [Number(Math.exp(lowerLn).toFixed(3)), Number(Math.exp(upperLn).toFixed(3))];
    }
    
    oddsRatio = Number(oddsRatio.toFixed(3));
  }
  
  // Relative Risk = [a/(a+b)] / [c/(c+d)]
  let relativeRisk: number | null = null;
  let relativeRiskCI: [number, number] | null = null;
  
  const row1Total = a + b;
  const row2Total = c + d;
  
  if (row1Total > 0 && row2Total > 0 && c > 0) {
    const p1 = a / row1Total; // Risk in exposed
    const p2 = c / row2Total; // Risk in unexposed
    
    if (p2 > 0) {
      relativeRisk = p1 / p2;
      
      // 95% CI for RR using log method
      if (a > 0) {
        const lnRR = Math.log(relativeRisk);
        const se = Math.sqrt((1 - p1) / (a) + (1 - p2) / (c));
        const lowerLn = lnRR - 1.96 * se;
        const upperLn = lnRR + 1.96 * se;
        relativeRiskCI = [Number(Math.exp(lowerLn).toFixed(3)), Number(Math.exp(upperLn).toFixed(3))];
      }
      
      relativeRisk = Number(relativeRisk.toFixed(3));
    }
  }
  
  return {
    oddsRatio,
    oddsRatioCI,
    relativeRisk,
    relativeRiskCI,
    is2x2
  };
}

// Calculate Likelihood Ratio for chi-squared
function calculateLikelihoodRatio(contingencyTable: Record<string, Record<string, number>>, rowTotals: Record<string, number>, colTotals: Record<string, number>, grandTotal: number, rows: string[], cols: string[]): number {
  let G2 = 0;
  
  rows.forEach(r => {
    cols.forEach(c => {
      const observed = contingencyTable[r]?.[c] || 0;
      const expected = (rowTotals[r] * colTotals[c]) / grandTotal;
      
      if (observed > 0 && expected > 0) {
        G2 += 2 * observed * Math.log(observed / expected);
      }
    });
  });
  
  return G2;
}

// Calculate Linear-by-Linear Association
function calculateLinearByLinear(contingencyTable: Record<string, Record<string, number>>, rows: string[], cols: string[], grandTotal: number): number {
  // Assign numeric scores to rows and columns (1, 2, 3, ...)
  const rowScores: Record<string, number> = {};
  const colScores: Record<string, number> = {};
  
  rows.forEach((r, i) => { rowScores[r] = i + 1; });
  cols.forEach((c, i) => { colScores[c] = i + 1; });
  
  // Calculate means
  let sumRowScore = 0;
  let sumColScore = 0;
  let sumRowScoreSq = 0;
  let sumColScoreSq = 0;
  let sumProduct = 0;
  
  rows.forEach(r => {
    cols.forEach(c => {
      const count = contingencyTable[r]?.[c] || 0;
      const rs = rowScores[r];
      const cs = colScores[c];
      
      sumRowScore += count * rs;
      sumColScore += count * cs;
      sumRowScoreSq += count * rs * rs;
      sumColScoreSq += count * cs * cs;
      sumProduct += count * rs * cs;
    });
  });
  
  const meanRow = sumRowScore / grandTotal;
  const meanCol = sumColScore / grandTotal;
  
  const varRow = (sumRowScoreSq / grandTotal) - (meanRow * meanRow);
  const varCol = (sumColScoreSq / grandTotal) - (meanCol * meanCol);
  
  const covariance = (sumProduct / grandTotal) - (meanRow * meanCol);
  
  if (varRow <= 0 || varCol <= 0) return 0;
  
  const r = covariance / Math.sqrt(varRow * varCol);
  const M2 = (grandTotal - 1) * r * r;
  
  return M2;
}

// Chi-squared test
function calculateChi2(data: any[], var1: string, var2: string): Chi2Result {
  // Create contingency table
  const contingencyMap: Record<string, Record<string, number>> = {};
  const var1Values = new Set<string>();
  const var2Values = new Set<string>();
  
  // First pass: collect all unique values for both variables
  data.forEach(row => {
    const val1 = String(row[var1] || '').trim();
    const val2 = String(row[var2] || '').trim();
    
    if (val1 && val2 && val1 !== 'undefined' && val2 !== 'undefined' && 
        val1 !== 'null' && val2 !== 'null' && val1 !== '' && val2 !== '') {
      var1Values.add(val1);
      var2Values.add(val2);
    }
  });
  
  const rows = Array.from(var1Values).sort();
  const cols = Array.from(var2Values).sort();
  
  // Initialize the contingency table with zeros for ALL combinations
  rows.forEach(r => {
    contingencyMap[r] = {};
    cols.forEach(c => {
      contingencyMap[r][c] = 0;
    });
  });
  
  // Second pass: count occurrences
  data.forEach(row => {
    const val1 = String(row[var1] || '').trim();
    const val2 = String(row[var2] || '').trim();
    
    if (val1 && val2 && var1Values.has(val1) && var2Values.has(val2)) {
      contingencyMap[val1][val2] = (contingencyMap[val1][val2] || 0) + 1;
    }
  });
  
  // Calculate row and column totals
  const rowTotals: Record<string, number> = {};
  const colTotals: Record<string, number> = {};
  let grandTotal = 0;
  
  rows.forEach(r => {
    rowTotals[r] = 0;
    cols.forEach(c => {
      const observed = contingencyMap[r]?.[c] || 0;
      rowTotals[r] += observed;
      colTotals[c] = (colTotals[c] || 0) + observed;
      grandTotal += observed;
    });
  });
  
  // Calculate chi-squared
  let chi2 = 0;
  rows.forEach(r => {
    cols.forEach(c => {
      const observed = contingencyMap[r]?.[c] || 0;
      const expected = (rowTotals[r] * colTotals[c]) / grandTotal;
      
      if (expected > 0) {
        chi2 += Math.pow(observed - expected, 2) / expected;
      }
    });
  });
  
  const df = (rows.length - 1) * (cols.length - 1);
  const pValue = chiSquaredPValue(chi2, df);
  
  // Calculate additional statistics
  const riskMeasures = calculateRiskMeasures(contingencyMap, rows, cols);
  const likelihoodRatio = calculateLikelihoodRatio(contingencyMap, rowTotals, colTotals, grandTotal, rows, cols);
  const likelihoodRatioPValue = chiSquaredPValue(likelihoodRatio, df);
  const linearByLinear = calculateLinearByLinear(contingencyMap, rows, cols, grandTotal);
  const linearByLinearPValue = chiSquaredPValue(linearByLinear, 1);
  
  return {
    variable1: var1,
    variable2: var2,
    chi2: Number(chi2.toFixed(3)),
    df: df,
    degreesOfFreedom: df,
    pValue: Number(pValue.toFixed(3)),
    significant: pValue < 0.05,
    contingencyTable: contingencyMap,
    riskMeasures,
    likelihoodRatio: Number(likelihoodRatio.toFixed(3)),
    likelihoodRatioPValue: Number(likelihoodRatioPValue.toFixed(3)),
    linearByLinear: Number(linearByLinear.toFixed(3)),
    linearByLinearPValue: Number(linearByLinearPValue.toFixed(3))
  };
}

// Approximate chi-squared p-value using gamma function
function chiSquaredPValue(chi2: number, df: number): number {
  if (df <= 0) return 1;
  
  // Simplified approximation for chi-squared p-value
  // For more accurate results, would need full gamma function implementation
  const x = chi2 / 2;
  const k = df / 2;
  
  // Using Wilson-Hilferty transformation for approximation
  const z = Math.pow(chi2 / df, 1/3) - (1 - 2/(9*df));
  const normZ = z / Math.sqrt(2/(9*df));
  
  // Approximate standard normal CDF
  const t = 1 / (1 + 0.2316419 * Math.abs(normZ));
  const d = 0.3989423 * Math.exp(-normZ * normZ / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  
  if (normZ > 0) prob = 1 - prob;
  
  return Math.max(0, Math.min(1, prob));
}

// Pearson correlation
function calculatePearsonCorrelation(data: any[], var1: string, var2: string): CorrelationResult {
  const pairs = data
    .map(row => ({ x: Number(row[var1]), y: Number(row[var2]) }))
    .filter(pair => !isNaN(pair.x) && !isNaN(pair.y));
  
  const n = pairs.length;
  if (n < 2) {
    return {
      variable1: var1,
      variable2: var2,
      correlation: 0,
      pValue: 1,
      type: 'pearson',
      significant: false
    };
  }
  
  const sumX = pairs.reduce((sum, p) => sum + p.x, 0);
  const sumY = pairs.reduce((sum, p) => sum + p.y, 0);
  const sumXY = pairs.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = pairs.reduce((sum, p) => sum + p.x * p.x, 0);
  const sumY2 = pairs.reduce((sum, p) => sum + p.y * p.y, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  const r = denominator === 0 ? 0 : numerator / denominator;
  
  // Calculate p-value using t-distribution
  const t = r * Math.sqrt((n - 2) / (1 - r * r));
  const pValue = 2 * (1 - tDistributionCDF(Math.abs(t), n - 2));
  
  return {
    variable1: var1,
    variable2: var2,
    correlation: Number(r.toFixed(4)),
    pValue: Number(pValue.toFixed(4)),
    type: 'pearson',
    significant: pValue < 0.05
  };
}

// Simplified t-distribution CDF approximation
function tDistributionCDF(t: number, df: number): number {
  const x = df / (df + t * t);
  const a = df / 2;
  const b = 0.5;
  
  // Approximate beta distribution using normal approximation
  const mean = a / (a + b);
  const variance = (a * b) / ((a + b) * (a + b) * (a + b + 1));
  const z = (x - mean) / Math.sqrt(variance);
  
  // Standard normal CDF
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

// Error function approximation
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  x = Math.abs(x);
  
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return sign * y;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Running association analysis...');
    
    const { data, variables, analysisSubType, baseVariable, crossingVariables } = await req.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data provided');
    }

    let results: any = {};
    
    if (analysisSubType === 'chi2') {
      // EPI INFO style: base variable crossed with each crossing variable
      const chi2Results: Chi2Result[] = [];
      
      if (baseVariable && crossingVariables && crossingVariables.length > 0) {
        // New workflow: one table per crossing variable
        for (const crossVar of crossingVariables) {
          const result = calculateChi2(data, baseVariable, crossVar);
          chi2Results.push(result);
        }
      } else if (variables && variables.length >= 2) {
        // Legacy: pairs between all variables
        for (let i = 0; i < variables.length; i++) {
          for (let j = i + 1; j < variables.length; j++) {
            const result = calculateChi2(data, variables[i], variables[j]);
            chi2Results.push(result);
          }
        }
      } else {
        throw new Error('Variables insuffisantes pour l\'analyse Chi²');
      }
      
      results = { chi2Tests: chi2Results };
      console.log(`Chi2 tests completed: ${chi2Results.length} tests`);
      
    } else if (analysisSubType === 'correlation') {
      if (!variables || variables.length < 2) {
        throw new Error('At least 2 variables are required for correlation analysis');
      }
      
      // Correlation between all pairs of numeric variables
      const correlations: CorrelationResult[] = [];
      
      for (let i = 0; i < variables.length; i++) {
        for (let j = i + 1; j < variables.length; j++) {
          const result = calculatePearsonCorrelation(data, variables[i], variables[j]);
          correlations.push(result);
        }
      }
      
      results = { correlations };
      console.log(`Correlation tests completed: ${correlations.length} tests`);
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Association analysis error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
