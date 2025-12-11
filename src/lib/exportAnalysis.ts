import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, convertInchesToTwip } from 'docx';
import { saveAs } from 'file-saver';

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

const createTableBorders = () => ({
  top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
  right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
});

const createHeaderCell = (text: string) => new TableCell({
  children: [new Paragraph({
    children: [new TextRun({ text, bold: true, font: 'Arial', size: 20 })],
    alignment: AlignmentType.CENTER,
  })],
  borders: createTableBorders(),
  shading: { fill: 'E0E0E0' },
});

const createCell = (text: string, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT) => new TableCell({
  children: [new Paragraph({
    children: [new TextRun({ text, font: 'Arial', size: 20 })],
    alignment: align,
  })],
  borders: createTableBorders(),
});

const createSectionTitle = (text: string) => new Paragraph({
  children: [new TextRun({ text, bold: true, font: 'Arial', size: 28 })],
  spacing: { before: 400, after: 200 },
});

const createSubTitle = (text: string) => new Paragraph({
  children: [new TextRun({ text, bold: true, font: 'Arial', size: 24 })],
  spacing: { before: 200, after: 100 },
});

const createTextParagraph = (text: string) => new Paragraph({
  children: [new TextRun({ text, font: 'Arial', size: 22 })],
  spacing: { before: 100, after: 100 },
});

// Export frequency results
const exportFrequencyToWord = (statistics: ColumnStats[]): Paragraph[] => {
  const paragraphs: Paragraph[] = [];

  statistics.forEach(stat => {
    paragraphs.push(createSectionTitle(`Variable: ${stat.name}`));
    paragraphs.push(createTextParagraph(
      `Type: ${stat.type === 'numeric' ? 'Numérique' : 'Catégorielle'} | Total: ${stat.count} | Valeurs manquantes: ${stat.missing}`
    ));

    // Descriptive statistics for numeric variables
    if (stat.type === 'numeric') {
      paragraphs.push(createSubTitle('Statistiques descriptives'));
      const statsTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createHeaderCell('Statistique'),
              createHeaderCell('Valeur'),
            ],
          }),
          ...(stat.mean !== undefined ? [new TableRow({
            children: [createCell('Moyenne'), createCell(stat.mean.toFixed(2), AlignmentType.RIGHT)],
          })] : []),
          ...(stat.median !== undefined ? [new TableRow({
            children: [createCell('Médiane'), createCell(stat.median.toFixed(2), AlignmentType.RIGHT)],
          })] : []),
          ...(stat.std !== undefined ? [new TableRow({
            children: [createCell('Écart-type'), createCell(stat.std.toFixed(2), AlignmentType.RIGHT)],
          })] : []),
          ...(stat.min !== undefined ? [new TableRow({
            children: [createCell('Minimum'), createCell(stat.min.toFixed(2), AlignmentType.RIGHT)],
          })] : []),
          ...(stat.max !== undefined ? [new TableRow({
            children: [createCell('Maximum'), createCell(stat.max.toFixed(2), AlignmentType.RIGHT)],
          })] : []),
        ],
      });
      paragraphs.push(new Paragraph({ children: [] }));
      paragraphs.push(statsTable as any);
    }

    // Frequency table
    if (stat.frequencies && stat.frequencies.length > 0) {
      paragraphs.push(createSubTitle('Tableau de fréquences'));
      const freqTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createHeaderCell('Valeur'),
              createHeaderCell('Effectif'),
              createHeaderCell('Pourcentage'),
            ],
          }),
          ...stat.frequencies.map(freq => new TableRow({
            children: [
              createCell(freq.value),
              createCell(freq.count.toString(), AlignmentType.RIGHT),
              createCell(`${freq.percentage.toFixed(2)}%`, AlignmentType.RIGHT),
            ],
          })),
        ],
      });
      paragraphs.push(new Paragraph({ children: [] }));
      paragraphs.push(freqTable as any);
    }
  });

  return paragraphs;
};

// Export association results (Chi2, Correlation)
const exportAssociationToWord = (result: any): Paragraph[] => {
  const paragraphs: Paragraph[] = [];

  if (result.chi2Tests) {
    result.chi2Tests.forEach((test: any) => {
      paragraphs.push(createSectionTitle(`Test du Chi² : ${test.variable1} × ${test.variable2}`));

      // Contingency table
      if (test.contingencyTable) {
        paragraphs.push(createSubTitle('Tableau de contingence'));
        const cols = Object.keys(test.contingencyTable[Object.keys(test.contingencyTable)[0]]);
        
        const contTable = new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                createHeaderCell(`${test.variable1} / ${test.variable2}`),
                ...cols.map(col => createHeaderCell(col)),
                createHeaderCell('Total'),
              ],
            }),
            ...Object.entries(test.contingencyTable).map(([row, values]: [string, any]) => {
              const rowTotal = Object.values(values).reduce((sum: number, val: any) => sum + val, 0);
              return new TableRow({
                children: [
                  createCell(row),
                  ...Object.values(values).map((val: any) => createCell(val.toString(), AlignmentType.RIGHT)),
                  createCell(rowTotal.toString(), AlignmentType.RIGHT),
                ],
              });
            }),
          ],
        });
        paragraphs.push(new Paragraph({ children: [] }));
        paragraphs.push(contTable as any);
      }

      // Chi2 statistics
      paragraphs.push(createSubTitle('Résultats du test'));
      paragraphs.push(createTextParagraph(`Chi² = ${test.chiSquare?.toFixed(4) || 'N/A'}`));
      paragraphs.push(createTextParagraph(`Degrés de liberté = ${test.degreesOfFreedom || 'N/A'}`));
      paragraphs.push(createTextParagraph(`Valeur p = ${test.pValue?.toFixed(4) || 'N/A'}`));
      paragraphs.push(createTextParagraph(`V de Cramer = ${test.cramersV?.toFixed(4) || 'N/A'}`));
      paragraphs.push(createTextParagraph(`Interprétation: ${test.interpretation || ''}`));
    });
  }

  if (result.correlations) {
    paragraphs.push(createSectionTitle('Analyse de corrélation'));
    result.correlations.forEach((corr: any) => {
      paragraphs.push(createSubTitle(`${corr.variable1} × ${corr.variable2}`));
      paragraphs.push(createTextParagraph(`Coefficient de Pearson (r) = ${corr.pearsonR?.toFixed(4) || 'N/A'}`));
      paragraphs.push(createTextParagraph(`Valeur p = ${corr.pValue?.toFixed(4) || 'N/A'}`));
      paragraphs.push(createTextParagraph(`Interprétation: ${corr.interpretation || ''}`));
    });
  }

  return paragraphs;
};

// Export advanced results (T-test, ANOVA, Regression)
const exportAdvancedToWord = (result: any): Paragraph[] => {
  const paragraphs: Paragraph[] = [];

  if (result.ttest) {
    paragraphs.push(createSectionTitle('Test t de Student'));
    paragraphs.push(createTextParagraph(`Variable numérique: ${result.ttest.numericVariable}`));
    paragraphs.push(createTextParagraph(`Variable de groupe: ${result.ttest.groupVariable}`));
    
    // Group statistics
    if (result.ttest.groupStats) {
      paragraphs.push(createSubTitle('Statistiques par groupe'));
      const statsTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createHeaderCell('Groupe'),
              createHeaderCell('N'),
              createHeaderCell('Moyenne'),
              createHeaderCell('Écart-type'),
            ],
          }),
          ...Object.entries(result.ttest.groupStats).map(([group, stats]: [string, any]) => new TableRow({
            children: [
              createCell(group),
              createCell(stats.n?.toString() || '0', AlignmentType.RIGHT),
              createCell(stats.mean?.toFixed(2) || 'N/A', AlignmentType.RIGHT),
              createCell(stats.std?.toFixed(2) || 'N/A', AlignmentType.RIGHT),
            ],
          })),
        ],
      });
      paragraphs.push(new Paragraph({ children: [] }));
      paragraphs.push(statsTable as any);
    }

    paragraphs.push(createSubTitle('Résultats du test'));
    paragraphs.push(createTextParagraph(`t = ${result.ttest.tStatistic?.toFixed(4) || 'N/A'}`));
    paragraphs.push(createTextParagraph(`Degrés de liberté = ${result.ttest.degreesOfFreedom?.toFixed(2) || 'N/A'}`));
    paragraphs.push(createTextParagraph(`Valeur p = ${result.ttest.pValue?.toFixed(4) || 'N/A'}`));
    paragraphs.push(createTextParagraph(`Taille d'effet (d de Cohen) = ${result.ttest.cohensD?.toFixed(4) || 'N/A'}`));
    paragraphs.push(createTextParagraph(`Interprétation: ${result.ttest.interpretation || ''}`));
  }

  if (result.anova) {
    paragraphs.push(createSectionTitle('Analyse de variance (ANOVA)'));
    paragraphs.push(createTextParagraph(`Variable dépendante: ${result.anova.dependentVariable}`));
    paragraphs.push(createTextParagraph(`Facteur: ${result.anova.factor}`));

    paragraphs.push(createSubTitle('Résultats'));
    paragraphs.push(createTextParagraph(`F = ${result.anova.fStatistic?.toFixed(4) || 'N/A'}`));
    paragraphs.push(createTextParagraph(`Valeur p = ${result.anova.pValue?.toFixed(4) || 'N/A'}`));
    paragraphs.push(createTextParagraph(`Eta² = ${result.anova.etaSquared?.toFixed(4) || 'N/A'}`));
    paragraphs.push(createTextParagraph(`Interprétation: ${result.anova.interpretation || ''}`));
  }

  if (result.regression) {
    paragraphs.push(createSectionTitle('Régression linéaire'));
    paragraphs.push(createTextParagraph(`Variable dépendante: ${result.regression.dependentVariable}`));
    paragraphs.push(createTextParagraph(`Variables indépendantes: ${result.regression.independentVariables?.join(', ') || ''}`));

    paragraphs.push(createSubTitle('Résultats'));
    paragraphs.push(createTextParagraph(`R² = ${result.regression.rSquared?.toFixed(4) || 'N/A'}`));
    paragraphs.push(createTextParagraph(`R² ajusté = ${result.regression.adjustedRSquared?.toFixed(4) || 'N/A'}`));
    paragraphs.push(createTextParagraph(`F = ${result.regression.fStatistic?.toFixed(4) || 'N/A'}`));
    paragraphs.push(createTextParagraph(`Valeur p = ${result.regression.pValue?.toFixed(4) || 'N/A'}`));

    if (result.regression.coefficients) {
      paragraphs.push(createSubTitle('Coefficients'));
      const coefTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              createHeaderCell('Variable'),
              createHeaderCell('Coefficient'),
              createHeaderCell('Erreur std.'),
              createHeaderCell('t'),
              createHeaderCell('p'),
            ],
          }),
          ...result.regression.coefficients.map((coef: any) => new TableRow({
            children: [
              createCell(coef.variable),
              createCell(coef.coefficient?.toFixed(4) || 'N/A', AlignmentType.RIGHT),
              createCell(coef.stdError?.toFixed(4) || 'N/A', AlignmentType.RIGHT),
              createCell(coef.tStatistic?.toFixed(4) || 'N/A', AlignmentType.RIGHT),
              createCell(coef.pValue?.toFixed(4) || 'N/A', AlignmentType.RIGHT),
            ],
          })),
        ],
      });
      paragraphs.push(new Paragraph({ children: [] }));
      paragraphs.push(coefTable as any);
    }

    paragraphs.push(createTextParagraph(`Interprétation: ${result.regression.interpretation || ''}`));
  }

  return paragraphs;
};

export const exportAnalysisToWord = async (result: any, fileName: string = 'analyse') => {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(new Paragraph({
    children: [new TextRun({
      text: 'Rapport d\'analyse statistique',
      bold: true,
      font: 'Arial',
      size: 36,
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }));

  children.push(new Paragraph({
    children: [new TextRun({
      text: `Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
      font: 'Arial',
      size: 20,
      italics: true,
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }));

  // Add content based on analysis type
  if (result.type === 'frequency' && result.statistics) {
    children.push(...exportFrequencyToWord(result.statistics));
  } else if (result.type === 'association') {
    children.push(...exportAssociationToWord(result));
  } else if (result.type === 'advanced') {
    children.push(...exportAdvancedToWord(result));
  }

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
          },
        },
      },
      children: children as any,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.docx`);
};

// Export to Excel (CSV format for simplicity, works with Excel)
export const exportAnalysisToExcel = (result: any, fileName: string = 'analyse') => {
  let csvContent = '';
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel compatibility

  if (result.type === 'frequency' && result.statistics) {
    result.statistics.forEach((stat: ColumnStats) => {
      csvContent += `Variable: ${stat.name}\n`;
      csvContent += `Type;${stat.type === 'numeric' ? 'Numérique' : 'Catégorielle'}\n`;
      csvContent += `Total;${stat.count}\n`;
      csvContent += `Valeurs manquantes;${stat.missing}\n\n`;

      if (stat.type === 'numeric') {
        csvContent += `Statistiques descriptives\n`;
        if (stat.mean !== undefined) csvContent += `Moyenne;${stat.mean.toFixed(2)}\n`;
        if (stat.median !== undefined) csvContent += `Médiane;${stat.median.toFixed(2)}\n`;
        if (stat.std !== undefined) csvContent += `Écart-type;${stat.std.toFixed(2)}\n`;
        if (stat.min !== undefined) csvContent += `Minimum;${stat.min.toFixed(2)}\n`;
        if (stat.max !== undefined) csvContent += `Maximum;${stat.max.toFixed(2)}\n`;
        csvContent += '\n';
      }

      if (stat.frequencies && stat.frequencies.length > 0) {
        csvContent += `Tableau de fréquences\n`;
        csvContent += `Valeur;Effectif;Pourcentage\n`;
        stat.frequencies.forEach(freq => {
          csvContent += `${freq.value};${freq.count};${freq.percentage.toFixed(2)}%\n`;
        });
        csvContent += '\n';
      }
      csvContent += '\n';
    });
  } else if (result.type === 'association') {
    if (result.chi2Tests) {
      result.chi2Tests.forEach((test: any) => {
        csvContent += `Test du Chi²: ${test.variable1} × ${test.variable2}\n\n`;
        
        if (test.contingencyTable) {
          csvContent += `Tableau de contingence\n`;
          const cols = Object.keys(test.contingencyTable[Object.keys(test.contingencyTable)[0]]);
          csvContent += `;${cols.join(';')};Total\n`;
          
          Object.entries(test.contingencyTable).forEach(([row, values]: [string, any]) => {
            const rowTotal = Object.values(values).reduce((sum: number, val: any) => sum + val, 0);
            csvContent += `${row};${Object.values(values).join(';')};${rowTotal}\n`;
          });
          csvContent += '\n';
        }

        csvContent += `Résultats\n`;
        csvContent += `Chi²;${test.chiSquare?.toFixed(4) || 'N/A'}\n`;
        csvContent += `Degrés de liberté;${test.degreesOfFreedom || 'N/A'}\n`;
        csvContent += `Valeur p;${test.pValue?.toFixed(4) || 'N/A'}\n`;
        csvContent += `V de Cramer;${test.cramersV?.toFixed(4) || 'N/A'}\n`;
        csvContent += `Interprétation;${test.interpretation || ''}\n\n`;
      });
    }

    if (result.correlations) {
      csvContent += `Corrélations\n`;
      csvContent += `Variable 1;Variable 2;Coefficient r;Valeur p;Interprétation\n`;
      result.correlations.forEach((corr: any) => {
        csvContent += `${corr.variable1};${corr.variable2};${corr.pearsonR?.toFixed(4) || 'N/A'};${corr.pValue?.toFixed(4) || 'N/A'};${corr.interpretation || ''}\n`;
      });
      csvContent += '\n';
    }
  } else if (result.type === 'advanced') {
    if (result.ttest) {
      csvContent += `Test t de Student\n`;
      csvContent += `Variable numérique;${result.ttest.numericVariable}\n`;
      csvContent += `Variable de groupe;${result.ttest.groupVariable}\n\n`;

      if (result.ttest.groupStats) {
        csvContent += `Statistiques par groupe\n`;
        csvContent += `Groupe;N;Moyenne;Écart-type\n`;
        Object.entries(result.ttest.groupStats).forEach(([group, stats]: [string, any]) => {
          csvContent += `${group};${stats.n || 0};${stats.mean?.toFixed(2) || 'N/A'};${stats.std?.toFixed(2) || 'N/A'}\n`;
        });
        csvContent += '\n';
      }

      csvContent += `Résultats\n`;
      csvContent += `t;${result.ttest.tStatistic?.toFixed(4) || 'N/A'}\n`;
      csvContent += `Degrés de liberté;${result.ttest.degreesOfFreedom?.toFixed(2) || 'N/A'}\n`;
      csvContent += `Valeur p;${result.ttest.pValue?.toFixed(4) || 'N/A'}\n`;
      csvContent += `d de Cohen;${result.ttest.cohensD?.toFixed(4) || 'N/A'}\n`;
      csvContent += `Interprétation;${result.ttest.interpretation || ''}\n\n`;
    }

    if (result.anova) {
      csvContent += `ANOVA\n`;
      csvContent += `Variable dépendante;${result.anova.dependentVariable}\n`;
      csvContent += `Facteur;${result.anova.factor}\n`;
      csvContent += `F;${result.anova.fStatistic?.toFixed(4) || 'N/A'}\n`;
      csvContent += `Valeur p;${result.anova.pValue?.toFixed(4) || 'N/A'}\n`;
      csvContent += `Eta²;${result.anova.etaSquared?.toFixed(4) || 'N/A'}\n`;
      csvContent += `Interprétation;${result.anova.interpretation || ''}\n\n`;
    }

    if (result.regression) {
      csvContent += `Régression linéaire\n`;
      csvContent += `Variable dépendante;${result.regression.dependentVariable}\n`;
      csvContent += `Variables indépendantes;${result.regression.independentVariables?.join(', ') || ''}\n`;
      csvContent += `R²;${result.regression.rSquared?.toFixed(4) || 'N/A'}\n`;
      csvContent += `R² ajusté;${result.regression.adjustedRSquared?.toFixed(4) || 'N/A'}\n`;
      csvContent += `F;${result.regression.fStatistic?.toFixed(4) || 'N/A'}\n`;
      csvContent += `Valeur p;${result.regression.pValue?.toFixed(4) || 'N/A'}\n\n`;

      if (result.regression.coefficients) {
        csvContent += `Coefficients\n`;
        csvContent += `Variable;Coefficient;Erreur std.;t;p\n`;
        result.regression.coefficients.forEach((coef: any) => {
          csvContent += `${coef.variable};${coef.coefficient?.toFixed(4) || 'N/A'};${coef.stdError?.toFixed(4) || 'N/A'};${coef.tStatistic?.toFixed(4) || 'N/A'};${coef.pValue?.toFixed(4) || 'N/A'}\n`;
        });
        csvContent += '\n';
      }

      csvContent += `Interprétation;${result.regression.interpretation || ''}\n`;
    }
  }

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${fileName.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
};

// Export contingency table to Word
export const exportContingencyToWord = async (test: any) => {
  const rows = Object.keys(test.contingencyTable || {});
  const cols = Object.keys(test.contingencyTable?.[rows[0]] || {});
  
  const a = test.contingencyTable?.[rows[0]]?.[cols[0]] || 0;
  const b = test.contingencyTable?.[rows[0]]?.[cols[1]] || 0;
  const c = test.contingencyTable?.[rows[1]]?.[cols[0]] || 0;
  const d = test.contingencyTable?.[rows[1]]?.[cols[1]] || 0;
  
  const n1 = a + b;
  const n0 = c + d;
  const m1 = a + c;
  const m0 = b + d;
  const n = a + b + c + d;

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(new Paragraph({
    children: [new TextRun({
      text: `Table de contingence 2×2`,
      bold: true,
      font: 'Arial',
      size: 36,
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
  }));

  children.push(new Paragraph({
    children: [new TextRun({
      text: `${test.variable1} × ${test.variable2}`,
      font: 'Arial',
      size: 28,
      bold: true,
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 400 },
  }));

  // Contingency table
  const contingencyTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          createHeaderCell(`${test.variable1} \\ ${test.variable2}`),
          createHeaderCell(cols[0] || '+'),
          createHeaderCell(cols[1] || '-'),
          createHeaderCell('Total'),
        ],
      }),
      new TableRow({
        children: [
          createHeaderCell(rows[0] || 'Exposé'),
          createCell(`a = ${a}`, AlignmentType.CENTER),
          createCell(`b = ${b}`, AlignmentType.CENTER),
          createCell(`n₁ = ${n1}`, AlignmentType.CENTER),
        ],
      }),
      new TableRow({
        children: [
          createHeaderCell(rows[1] || 'Non exposé'),
          createCell(`c = ${c}`, AlignmentType.CENTER),
          createCell(`d = ${d}`, AlignmentType.CENTER),
          createCell(`n₀ = ${n0}`, AlignmentType.CENTER),
        ],
      }),
      new TableRow({
        children: [
          createHeaderCell('Total'),
          createCell(`m₁ = ${m1}`, AlignmentType.CENTER),
          createCell(`m₀ = ${m0}`, AlignmentType.CENTER),
          createCell(`N = ${n}`, AlignmentType.CENTER),
        ],
      }),
    ],
  });

  children.push(contingencyTable as any);
  children.push(new Paragraph({ children: [], spacing: { after: 300 } }));

  // Legend
  children.push(createSubTitle('Légende'));
  children.push(createTextParagraph('a = Exposés malades'));
  children.push(createTextParagraph('b = Exposés non malades'));
  children.push(createTextParagraph('c = Non exposés malades'));
  children.push(createTextParagraph('d = Non exposés non malades'));

  children.push(new Paragraph({ children: [], spacing: { after: 300 } }));

  // Test results
  children.push(createSubTitle('Résultats du test Chi²'));
  children.push(createTextParagraph(`Chi² = ${test.chi2 || 'N/A'}`));
  children.push(createTextParagraph(`Degrés de liberté = ${test.df || 'N/A'}`));
  children.push(createTextParagraph(`p-value = ${test.pValue || 'N/A'}`));
  children.push(createTextParagraph(`Significatif (α=0.05) = ${test.pValue < 0.05 ? 'Oui' : 'Non'}`));

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1),
          },
        },
      },
      children: children as any,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `table_contingence_${test.variable1}_${test.variable2}.docx`.replace(/[^a-zA-Z0-9_\.]/g, '_'));
};

// Export contingency table to Excel (CSV)
export const exportContingencyToExcel = (test: any) => {
  const BOM = '\uFEFF';
  const rows = Object.keys(test.contingencyTable || {});
  const cols = Object.keys(test.contingencyTable?.[rows[0]] || {});
  
  const a = test.contingencyTable?.[rows[0]]?.[cols[0]] || 0;
  const b = test.contingencyTable?.[rows[0]]?.[cols[1]] || 0;
  const c = test.contingencyTable?.[rows[1]]?.[cols[0]] || 0;
  const d = test.contingencyTable?.[rows[1]]?.[cols[1]] || 0;
  
  const n1 = a + b;
  const n0 = c + d;
  const m1 = a + c;
  const m0 = b + d;
  const n = a + b + c + d;

  let csvContent = '';
  
  csvContent += `Table de contingence 2×2: ${test.variable1} × ${test.variable2}\n\n`;
  
  // Header
  csvContent += `;${cols[0] || '+'};${cols[1] || '-'};Total\n`;
  
  // Row 1
  csvContent += `${rows[0] || 'Exposé'};a = ${a};b = ${b};n₁ = ${n1}\n`;
  
  // Row 2  
  csvContent += `${rows[1] || 'Non exposé'};c = ${c};d = ${d};n₀ = ${n0}\n`;
  
  // Totals
  csvContent += `Total;m₁ = ${m1};m₀ = ${m0};N = ${n}\n\n`;
  
  // Legend
  csvContent += `Légende\n`;
  csvContent += `a;Exposés malades\n`;
  csvContent += `b;Exposés non malades\n`;
  csvContent += `c;Non exposés malades\n`;
  csvContent += `d;Non exposés non malades\n\n`;
  
  // Test results
  csvContent += `Résultats du test Chi²\n`;
  csvContent += `Chi²;${test.chi2 || 'N/A'}\n`;
  csvContent += `Degrés de liberté;${test.df || 'N/A'}\n`;
  csvContent += `p-value;${test.pValue || 'N/A'}\n`;
  csvContent += `Significatif (α=0.05);${test.pValue < 0.05 ? 'Oui' : 'Non'}\n`;

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `table_contingence_${test.variable1}_${test.variable2}.csv`.replace(/[^a-zA-Z0-9_\.]/g, '_'));
};
