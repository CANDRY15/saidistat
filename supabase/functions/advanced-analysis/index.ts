import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TTestResult {
  variable: string;
  group1: string;
  group2: string;
  mean1: number;
  mean2: number;
  sd1: number;
  sd2: number;
  n1: number;
  n2: number;
  tStatistic: number;
  degreesOfFreedom: number;
  pValue: number;
  significant: boolean;
}

interface ANOVAResult {
  dependentVariable: string;
  independentVariable: string;
  groups: string[];
  fStatistic: number;
  pValue: number;
  significant: boolean;
  groupStats: Array<{
    group: string;
    n: number;
    mean: number;
    sd: number;
  }>;
}

interface RegressionResult {
  dependentVariable: string;
  independentVariables: string[];
  coefficients: Array<{
    variable: string;
    coefficient: number;
    standardError: number;
    tValue: number;
    pValue: number;
  }>;
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  pValue: number;
}

// T-test for two independent samples
function calculateTTest(data: any[], numVar: string, catVar: string): TTestResult | null {
  // Group data by categorical variable
  const groups: Record<string, number[]> = {};
  
  data.forEach(row => {
    const groupKey = String(row[catVar] || '');
    const value = Number(row[numVar]);
    
    if (groupKey && !isNaN(value)) {
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(value);
    }
  });
  
  const groupKeys = Object.keys(groups);
  if (groupKeys.length !== 2) return null;
  
  const [group1Key, group2Key] = groupKeys;
  const group1 = groups[group1Key];
  const group2 = groups[group2Key];
  
  if (group1.length < 2 || group2.length < 2) return null;
  
  // Calculate means
  const mean1 = group1.reduce((a, b) => a + b, 0) / group1.length;
  const mean2 = group2.reduce((a, b) => a + b, 0) / group2.length;
  
  // Calculate standard deviations
  const variance1 = group1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (group1.length - 1);
  const variance2 = group2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (group2.length - 1);
  const sd1 = Math.sqrt(variance1);
  const sd2 = Math.sqrt(variance2);
  
  // Pooled standard deviation
  const pooledVariance = ((group1.length - 1) * variance1 + (group2.length - 1) * variance2) / 
                         (group1.length + group2.length - 2);
  const pooledSD = Math.sqrt(pooledVariance);
  
  // T-statistic
  const tStatistic = (mean1 - mean2) / (pooledSD * Math.sqrt(1/group1.length + 1/group2.length));
  const df = group1.length + group2.length - 2;
  
  // P-value (two-tailed)
  const pValue = 2 * (1 - tDistributionCDF(Math.abs(tStatistic), df));
  
  return {
    variable: numVar,
    group1: group1Key,
    group2: group2Key,
    mean1: Number(mean1.toFixed(3)),
    mean2: Number(mean2.toFixed(3)),
    sd1: Number(sd1.toFixed(3)),
    sd2: Number(sd2.toFixed(3)),
    n1: group1.length,
    n2: group2.length,
    tStatistic: Number(tStatistic.toFixed(4)),
    degreesOfFreedom: df,
    pValue: Number(pValue.toFixed(4)),
    significant: pValue < 0.05
  };
}

// One-way ANOVA
function calculateANOVA(data: any[], depVar: string, indepVar: string): ANOVAResult | null {
  // Group data
  const groups: Record<string, number[]> = {};
  
  data.forEach(row => {
    const groupKey = String(row[indepVar] || '');
    const value = Number(row[depVar]);
    
    if (groupKey && !isNaN(value)) {
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(value);
    }
  });
  
  const groupKeys = Object.keys(groups);
  if (groupKeys.length < 2) return null;
  
  // Calculate group statistics
  const groupStats = groupKeys.map(key => {
    const values = groups[key];
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (values.length - 1);
    
    return {
      group: key,
      n: values.length,
      mean: Number(mean.toFixed(3)),
      sd: Number(Math.sqrt(variance).toFixed(3))
    };
  });
  
  // Calculate grand mean
  const allValues = Object.values(groups).flat();
  const grandMean = allValues.reduce((a, b) => a + b, 0) / allValues.length;
  
  // Calculate sum of squares
  let ssTotal = 0;
  let ssBetween = 0;
  let ssWithin = 0;
  
  allValues.forEach(value => {
    ssTotal += Math.pow(value - grandMean, 2);
  });
  
  groupKeys.forEach(key => {
    const values = groups[key];
    const groupMean = values.reduce((a, b) => a + b, 0) / values.length;
    
    ssBetween += values.length * Math.pow(groupMean - grandMean, 2);
    
    values.forEach(value => {
      ssWithin += Math.pow(value - groupMean, 2);
    });
  });
  
  // Degrees of freedom
  const dfBetween = groupKeys.length - 1;
  const dfWithin = allValues.length - groupKeys.length;
  
  // Mean squares
  const msBetween = ssBetween / dfBetween;
  const msWithin = ssWithin / dfWithin;
  
  // F-statistic
  const fStatistic = msBetween / msWithin;
  
  // P-value (approximate)
  const pValue = fDistributionPValue(fStatistic, dfBetween, dfWithin);
  
  return {
    dependentVariable: depVar,
    independentVariable: indepVar,
    groups: groupKeys,
    fStatistic: Number(fStatistic.toFixed(4)),
    pValue: Number(pValue.toFixed(4)),
    significant: pValue < 0.05,
    groupStats
  };
}

// Simple linear regression
function calculateRegression(data: any[], depVar: string, indepVars: string[]): RegressionResult | null {
  // Filter valid data points
  const validData = data.filter(row => {
    const y = Number(row[depVar]);
    if (isNaN(y)) return false;
    
    return indepVars.every(varName => {
      const x = Number(row[varName]);
      return !isNaN(x);
    });
  });
  
  if (validData.length < indepVars.length + 2) return null;
  
  const n = validData.length;
  const y = validData.map(row => Number(row[depVar]));
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  
  // For simple linear regression (one independent variable)
  if (indepVars.length === 1) {
    const x = validData.map(row => Number(row[indepVars[0]]));
    const xMean = x.reduce((a, b) => a + b, 0) / n;
    
    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += Math.pow(x[i] - xMean, 2);
    }
    
    const slope = numerator / denominator;
    const intercept = yMean - slope * xMean;
    
    // Calculate R-squared
    let ssTotal = 0;
    let ssResidual = 0;
    
    for (let i = 0; i < n; i++) {
      const predicted = intercept + slope * x[i];
      ssTotal += Math.pow(y[i] - yMean, 2);
      ssResidual += Math.pow(y[i] - predicted, 2);
    }
    
    const rSquared = 1 - (ssResidual / ssTotal);
    const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1) / (n - 2));
    
    // Standard error
    const mse = ssResidual / (n - 2);
    const sxx = denominator;
    const seSlope = Math.sqrt(mse / sxx);
    
    // T-statistic for slope
    const tValue = slope / seSlope;
    const pValue = 2 * (1 - tDistributionCDF(Math.abs(tValue), n - 2));
    
    // F-statistic
    const fStatistic = (ssTotal - ssResidual) / (ssResidual / (n - 2));
    const fPValue = fDistributionPValue(fStatistic, 1, n - 2);
    
    return {
      dependentVariable: depVar,
      independentVariables: indepVars,
      coefficients: [
        {
          variable: 'Intercept',
          coefficient: Number(intercept.toFixed(4)),
          standardError: Number((Math.sqrt(mse * (1/n + xMean*xMean/sxx))).toFixed(4)),
          tValue: Number((intercept / Math.sqrt(mse * (1/n + xMean*xMean/sxx))).toFixed(4)),
          pValue: 0.05
        },
        {
          variable: indepVars[0],
          coefficient: Number(slope.toFixed(4)),
          standardError: Number(seSlope.toFixed(4)),
          tValue: Number(tValue.toFixed(4)),
          pValue: Number(pValue.toFixed(4))
        }
      ],
      rSquared: Number(rSquared.toFixed(4)),
      adjustedRSquared: Number(adjustedRSquared.toFixed(4)),
      fStatistic: Number(fStatistic.toFixed(4)),
      pValue: Number(fPValue.toFixed(4))
    };
  }
  
  return null;
}

// T-distribution CDF approximation
function tDistributionCDF(t: number, df: number): number {
  const x = df / (df + t * t);
  const a = df / 2;
  const b = 0.5;
  
  const mean = a / (a + b);
  const variance = (a * b) / ((a + b) * (a + b) * (a + b + 1));
  const z = (x - mean) / Math.sqrt(variance);
  
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

// F-distribution p-value approximation
function fDistributionPValue(f: number, df1: number, df2: number): number {
  // Very simplified approximation
  if (f < 0) return 1;
  if (f === 0) return 1;
  
  // Wilson-Hilferty approximation
  const z = Math.pow(f * df1 / df2, 1/3) - (1 - 2/(9*df2)) / (1 - 2/(9*df1));
  const sd = Math.sqrt(2/(9*df2) / Math.pow(1 - 2/(9*df1), 2));
  
  const normZ = z / sd;
  return 1 - (0.5 * (1 + erf(normZ / Math.sqrt(2))));
}

// Error function
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
    console.log('Running advanced analysis...');
    
    const { data, variables, analysisSubType } = await req.json();
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error('No data provided');
    }
    
    if (!variables || variables.length === 0) {
      throw new Error('No variables selected');
    }

    let results: any = {};
    
    if (analysisSubType === 'ttest') {
      // T-test: need one numeric and one categorical (2 groups) variable
      const tTestResults: TTestResult[] = [];
      
      for (const numVar of variables) {
        for (const catVar of variables) {
          if (numVar !== catVar) {
            const result = calculateTTest(data, numVar, catVar);
            if (result) tTestResults.push(result);
          }
        }
      }
      
      results = { tTests: tTestResults };
      console.log(`T-tests completed: ${tTestResults.length} tests`);
      
    } else if (analysisSubType === 'anova') {
      // ANOVA: one numeric dependent, one categorical independent
      const anovaResults: ANOVAResult[] = [];
      
      for (const depVar of variables) {
        for (const indepVar of variables) {
          if (depVar !== indepVar) {
            const result = calculateANOVA(data, depVar, indepVar);
            if (result) anovaResults.push(result);
          }
        }
      }
      
      results = { anovaTests: anovaResults };
      console.log(`ANOVA tests completed: ${anovaResults.length} tests`);
      
    } else if (analysisSubType === 'regression') {
      // Simple linear regression
      const regressionResults: RegressionResult[] = [];
      
      for (let i = 0; i < variables.length; i++) {
        for (let j = 0; j < variables.length; j++) {
          if (i !== j) {
            const result = calculateRegression(data, variables[i], [variables[j]]);
            if (result) regressionResults.push(result);
          }
        }
      }
      
      results = { regressions: regressionResults };
      console.log(`Regression analyses completed: ${regressionResults.length} analyses`);
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error: any) {
    console.error('Advanced analysis error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
