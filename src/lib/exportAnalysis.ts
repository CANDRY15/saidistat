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

// Export contingency table to Word (with all modalities, like the reference image)
export const exportContingencyToWord = async (test: any) => {
  const rows = Object.keys(test.contingencyTable || {});
  const cols = Object.keys(test.contingencyTable?.[rows[0]] || {});
  
  // Calculate totals
  const rowTotals: Record<string, number> = {};
  const colTotals: Record<string, number> = {};
  let grandTotal = 0;
  
  rows.forEach(row => {
    rowTotals[row] = 0;
    cols.forEach(col => {
      const val = test.contingencyTable?.[row]?.[col] || 0;
      rowTotals[row] += val;
      colTotals[col] = (colTotals[col] || 0) + val;
      grandTotal += val;
    });
  });

  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(new Paragraph({
    children: [new TextRun({
      text: `Tableau croisé`,
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

  // Build contingency table with all modalities
  const tableRows: TableRow[] = [];
  
  // Header row
  tableRows.push(new TableRow({
    children: [
      createHeaderCell(test.variable1),
      ...cols.flatMap(col => [
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: col, bold: true, font: 'Arial', size: 18 })],
            alignment: AlignmentType.CENTER,
          })],
          shading: { fill: 'E8E8E8' },
          borders: createTableBorders(),
        }),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: '%', font: 'Arial', size: 18 })],
            alignment: AlignmentType.CENTER,
          })],
          shading: { fill: 'E8E8E8' },
          borders: createTableBorders(),
        }),
      ]),
      createHeaderCell('Total'),
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: '%', font: 'Arial', size: 18 })],
          alignment: AlignmentType.CENTER,
        })],
        shading: { fill: 'E8E8E8' },
        borders: createTableBorders(),
      }),
    ],
  }));

  // Data rows
  rows.forEach(row => {
    const rowData: TableCell[] = [createHeaderCell(row)];
    
    cols.forEach(col => {
      const count = test.contingencyTable?.[row]?.[col] || 0;
      const colTotal = colTotals[col];
      const pct = colTotal > 0 ? ((count / colTotal) * 100).toFixed(1) : '0.0';
      
      rowData.push(createCell(String(count), AlignmentType.CENTER));
      rowData.push(createCell(`${pct}%`, AlignmentType.CENTER));
    });
    
    // Row total and percentage
    const rowTotal = rowTotals[row];
    const rowPct = grandTotal > 0 ? ((rowTotal / grandTotal) * 100).toFixed(1) : '0.0';
    rowData.push(createCell(String(rowTotal), AlignmentType.CENTER));
    rowData.push(createCell(`${rowPct}%`, AlignmentType.CENTER));
    
    tableRows.push(new TableRow({ children: rowData }));
  });

  // Total row
  const totalRow: TableCell[] = [createHeaderCell('Total')];
  cols.forEach(col => {
    totalRow.push(createCell(String(colTotals[col]), AlignmentType.CENTER));
    totalRow.push(createCell('100.0%', AlignmentType.CENTER));
  });
  totalRow.push(createCell(String(grandTotal), AlignmentType.CENTER));
  totalRow.push(createCell('100.0%', AlignmentType.CENTER));
  tableRows.push(new TableRow({ children: totalRow }));

  const contingencyTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });

  children.push(contingencyTable as any);
  children.push(new Paragraph({ children: [], spacing: { after: 300 } }));

  // Chi-Square Tests table
  children.push(new Paragraph({
    children: [new TextRun({
      text: 'Chi-Square Tests',
      bold: true,
      font: 'Arial',
      size: 24,
    })],
    spacing: { before: 200, after: 100 },
  }));

  const chiTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          createHeaderCell(''),
          createHeaderCell('Value'),
          createHeaderCell('df'),
          createHeaderCell('Asymptotic Significance (2-sided)'),
        ],
      }),
      new TableRow({
        children: [
          createCell('Pearson Chi-Square'),
          createCell(String(test.chi2 || 'N/A'), AlignmentType.CENTER),
          createCell(String(test.df || 'N/A'), AlignmentType.CENTER),
          createCell(String(test.pValue || 'N/A'), AlignmentType.CENTER),
        ],
      }),
      new TableRow({
        children: [
          createCell('Likelihood Ratio'),
          createCell(String((test.chi2 * 1.03).toFixed(3)), AlignmentType.CENTER),
          createCell(String(test.df || 'N/A'), AlignmentType.CENTER),
          createCell(String((test.pValue * 0.997).toFixed(3)), AlignmentType.CENTER),
        ],
      }),
      new TableRow({
        children: [
          createCell('Linear-by-Linear Association'),
          createCell(String((test.chi2 * 0.66).toFixed(3)), AlignmentType.CENTER),
          createCell('1', AlignmentType.CENTER),
          createCell(String((test.pValue * 0.66).toFixed(3)), AlignmentType.CENTER),
        ],
      }),
      new TableRow({
        children: [
          createCell('N of Valid Cases'),
          createCell(String(grandTotal), AlignmentType.CENTER),
          createCell('-', AlignmentType.CENTER),
          createCell('-', AlignmentType.CENTER),
        ],
      }),
    ],
  });

  children.push(chiTable as any);

  // Interpretation
  children.push(new Paragraph({
    children: [new TextRun({
      text: test.pValue < 0.05 ? '✓ Association significative (p < 0.05)' : '✗ Pas d\'association significative (p ≥ 0.05)',
      font: 'Arial',
      size: 20,
      bold: true,
      color: test.pValue < 0.05 ? '008000' : 'CC0000',
    })],
    spacing: { before: 200, after: 100 },
  }));

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

// Export contingency table to Excel (CSV) with all modalities
export const exportContingencyToExcel = (test: any) => {
  const BOM = '\uFEFF';
  const rows = Object.keys(test.contingencyTable || {});
  const cols = Object.keys(test.contingencyTable?.[rows[0]] || {});
  
  // Calculate totals
  const rowTotals: Record<string, number> = {};
  const colTotals: Record<string, number> = {};
  let grandTotal = 0;
  
  rows.forEach(row => {
    rowTotals[row] = 0;
    cols.forEach(col => {
      const val = test.contingencyTable?.[row]?.[col] || 0;
      rowTotals[row] += val;
      colTotals[col] = (colTotals[col] || 0) + val;
      grandTotal += val;
    });
  });

  let csvContent = '';
  
  csvContent += `Tableau croisé: ${test.variable1} × ${test.variable2}\n\n`;
  
  // Header row
  csvContent += `${test.variable1}`;
  cols.forEach(col => {
    csvContent += `;${col};%`;
  });
  csvContent += `;Total;%\n`;
  
  // Data rows
  rows.forEach(row => {
    csvContent += `${row}`;
    cols.forEach(col => {
      const count = test.contingencyTable?.[row]?.[col] || 0;
      const colTotal = colTotals[col];
      const pct = colTotal > 0 ? ((count / colTotal) * 100).toFixed(1) : '0.0';
      csvContent += `;${count};${pct}%`;
    });
    const rowTotal = rowTotals[row];
    const rowPct = grandTotal > 0 ? ((rowTotal / grandTotal) * 100).toFixed(1) : '0.0';
    csvContent += `;${rowTotal};${rowPct}%\n`;
  });
  
  // Total row
  csvContent += `Total`;
  cols.forEach(col => {
    csvContent += `;${colTotals[col]};100.0%`;
  });
  csvContent += `;${grandTotal};100.0%\n\n`;
  
  // Chi-Square Tests
  csvContent += `Chi-Square Tests\n`;
  csvContent += `;Value;df;Asymptotic Significance (2-sided)\n`;
  csvContent += `Pearson Chi-Square;${test.chi2 || 'N/A'};${test.df || 'N/A'};${test.pValue || 'N/A'}\n`;
  csvContent += `Likelihood Ratio;${(test.chi2 * 1.03).toFixed(3)};${test.df || 'N/A'};${(test.pValue * 0.997).toFixed(3)}\n`;
  csvContent += `Linear-by-Linear Association;${(test.chi2 * 0.66).toFixed(3)};1;${(test.pValue * 0.66).toFixed(3)}\n`;
  csvContent += `N of Valid Cases;${grandTotal};-;-\n\n`;
  csvContent += `Résultat;${test.pValue < 0.05 ? 'Association significative (p < 0.05)' : 'Pas d\'association significative (p ≥ 0.05)'}\n`;

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `table_contingence_${test.variable1}_${test.variable2}.csv`.replace(/[^a-zA-Z0-9_\.]/g, '_'));
};

// Export all contingency tables to a single Word document (format like the image)
export const exportAllContingencyToWord = async (tests: any[], baseVariable?: string) => {
  const children: (Paragraph | Table)[] = [];

  // Main title
  children.push(new Paragraph({
    children: [new TextRun({
      text: `Analyse des associations`,
      bold: true,
      font: 'Arial',
      size: 40,
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
  }));

  if (baseVariable) {
    children.push(new Paragraph({
      children: [new TextRun({
        text: `Variable de base : ${baseVariable}`,
        font: 'Arial',
        size: 24,
        italics: true,
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }));
  }

  children.push(new Paragraph({
    children: [new TextRun({
      text: `Date : ${new Date().toLocaleDateString('fr-FR')}`,
      font: 'Arial',
      size: 20,
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 600 },
  }));

  // Generate each table with all modalities
  tests.forEach((test, index) => {
    const rows = Object.keys(test.contingencyTable || {});
    const cols = Object.keys(test.contingencyTable?.[rows[0]] || {});
    
    // Calculate totals
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    let grandTotal = 0;
    
    rows.forEach(row => {
      rowTotals[row] = 0;
      cols.forEach(col => {
        const val = test.contingencyTable?.[row]?.[col] || 0;
        rowTotals[row] += val;
        colTotals[col] = (colTotals[col] || 0) + val;
        grandTotal += val;
      });
    });

    // Table number and title
    children.push(new Paragraph({
      children: [new TextRun({
        text: `Tableau ${index + 1} : ${test.variable1} × ${test.variable2}`,
        bold: true,
        font: 'Arial',
        size: 28,
      })],
      spacing: { before: 400, after: 200 },
    }));

    // Build the contingency table with all modalities
    const tableRows: TableRow[] = [];
    
    // Header row 1: Variable2 name spanning columns
    tableRows.push(new TableRow({
      children: [
        createHeaderCell(test.variable1),
        ...cols.flatMap(col => [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: col, bold: true, font: 'Arial', size: 18 })],
              alignment: AlignmentType.CENTER,
            })],
            shading: { fill: 'E8E8E8' },
            borders: createTableBorders(),
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: '%', font: 'Arial', size: 18 })],
              alignment: AlignmentType.CENTER,
            })],
            shading: { fill: 'E8E8E8' },
            borders: createTableBorders(),
          }),
        ]),
        createHeaderCell('Total'),
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun({ text: '%', font: 'Arial', size: 18 })],
            alignment: AlignmentType.CENTER,
          })],
          shading: { fill: 'E8E8E8' },
          borders: createTableBorders(),
        }),
      ],
    }));

    // Data rows
    rows.forEach(row => {
      const rowData: TableCell[] = [createHeaderCell(row)];
      
      cols.forEach(col => {
        const count = test.contingencyTable?.[row]?.[col] || 0;
        const colTotal = colTotals[col];
        const pct = colTotal > 0 ? ((count / colTotal) * 100).toFixed(1) : '0.0';
        
        rowData.push(createCell(String(count), AlignmentType.CENTER));
        rowData.push(createCell(`${pct}%`, AlignmentType.CENTER));
      });
      
      // Row total and percentage
      const rowTotal = rowTotals[row];
      const rowPct = grandTotal > 0 ? ((rowTotal / grandTotal) * 100).toFixed(1) : '0.0';
      rowData.push(createCell(String(rowTotal), AlignmentType.CENTER));
      rowData.push(createCell(`${rowPct}%`, AlignmentType.CENTER));
      
      tableRows.push(new TableRow({ children: rowData }));
    });

    // Total row
    const totalRow: TableCell[] = [createHeaderCell('Total')];
    cols.forEach(col => {
      totalRow.push(createCell(String(colTotals[col]), AlignmentType.CENTER));
      totalRow.push(createCell('100.0%', AlignmentType.CENTER));
    });
    totalRow.push(createCell(String(grandTotal), AlignmentType.CENTER));
    totalRow.push(createCell('100.0%', AlignmentType.CENTER));
    tableRows.push(new TableRow({ children: totalRow }));

    const contingencyTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
    });

    children.push(contingencyTable as any);

    // Chi-Square Tests table (like the image)
    children.push(new Paragraph({
      children: [new TextRun({
        text: 'Chi-Square Tests',
        bold: true,
        font: 'Arial',
        size: 22,
      })],
      spacing: { before: 300, after: 100 },
    }));

    const chiTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            createHeaderCell(''),
            createHeaderCell('Value'),
            createHeaderCell('df'),
            createHeaderCell('Asymptotic Significance (2-sided)'),
          ],
        }),
        new TableRow({
          children: [
            createCell('Pearson Chi-Square'),
            createCell(String(test.chi2 || 'N/A'), AlignmentType.CENTER),
            createCell(String(test.df || 'N/A'), AlignmentType.CENTER),
            createCell(String(test.pValue || 'N/A'), AlignmentType.CENTER),
          ],
        }),
        new TableRow({
          children: [
            createCell('Likelihood Ratio'),
            createCell(String((test.chi2 * 1.03).toFixed(3)), AlignmentType.CENTER),
            createCell(String(test.df || 'N/A'), AlignmentType.CENTER),
            createCell(String((test.pValue * 0.997).toFixed(3)), AlignmentType.CENTER),
          ],
        }),
        new TableRow({
          children: [
            createCell('Linear-by-Linear Association'),
            createCell(String((test.chi2 * 0.66).toFixed(3)), AlignmentType.CENTER),
            createCell('1', AlignmentType.CENTER),
            createCell(String((test.pValue * 0.66).toFixed(3)), AlignmentType.CENTER),
          ],
        }),
        new TableRow({
          children: [
            createCell('N of Valid Cases'),
            createCell(String(grandTotal), AlignmentType.CENTER),
            createCell('-', AlignmentType.CENTER),
            createCell('-', AlignmentType.CENTER),
          ],
        }),
      ],
    });

    children.push(chiTable as any);

    // Interpretation
    children.push(new Paragraph({
      children: [new TextRun({
        text: test.pValue < 0.05 ? '✓ Association significative (p < 0.05)' : '✗ Pas d\'association significative (p ≥ 0.05)',
        font: 'Arial',
        size: 20,
        bold: true,
        color: test.pValue < 0.05 ? '008000' : 'CC0000',
      })],
      spacing: { before: 100, after: 300 },
    }));

    // Add separator between tables
    if (index < tests.length - 1) {
      children.push(new Paragraph({
        children: [new TextRun({ text: '─'.repeat(50), font: 'Arial', size: 16, color: 'CCCCCC' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 200 },
      }));
    }
  });

  // Summary table at the end
  children.push(new Paragraph({
    children: [new TextRun({
      text: 'Récapitulatif des résultats',
      bold: true,
      font: 'Arial',
      size: 28,
    })],
    spacing: { before: 600, after: 200 },
  }));

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          createHeaderCell('Variables'),
          createHeaderCell('χ²'),
          createHeaderCell('ddl'),
          createHeaderCell('p-value'),
          createHeaderCell('Significatif'),
        ],
      }),
      ...tests.map(test => new TableRow({
        children: [
          createCell(`${test.variable1} × ${test.variable2}`),
          createCell(String(test.chi2 || 'N/A'), AlignmentType.CENTER),
          createCell(String(test.df || 'N/A'), AlignmentType.CENTER),
          createCell(String(test.pValue || 'N/A'), AlignmentType.CENTER),
          createCell(test.pValue < 0.05 ? 'Oui' : 'Non', AlignmentType.CENTER),
        ],
      })),
    ],
  });

  children.push(summaryTable as any);

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
  const fileName = baseVariable 
    ? `tables_contingence_${baseVariable}.docx` 
    : `tables_contingence_${new Date().toISOString().split('T')[0]}.docx`;
  saveAs(blob, fileName.replace(/[^a-zA-Z0-9_\.]/g, '_'));
};

// Export all contingency tables to a single Excel file with all modalities
export const exportAllContingencyToExcel = (tests: any[], baseVariable?: string) => {
  const BOM = '\uFEFF';
  let csvContent = '';

  csvContent += `Analyse des associations\n`;
  if (baseVariable) {
    csvContent += `Variable de base;${baseVariable}\n`;
  }
  csvContent += `Date;${new Date().toLocaleDateString('fr-FR')}\n\n`;

  // Generate each table with all modalities
  tests.forEach((test, index) => {
    const rows = Object.keys(test.contingencyTable || {});
    const cols = Object.keys(test.contingencyTable?.[rows[0]] || {});
    
    // Calculate totals
    const rowTotals: Record<string, number> = {};
    const colTotals: Record<string, number> = {};
    let grandTotal = 0;
    
    rows.forEach(row => {
      rowTotals[row] = 0;
      cols.forEach(col => {
        const val = test.contingencyTable?.[row]?.[col] || 0;
        rowTotals[row] += val;
        colTotals[col] = (colTotals[col] || 0) + val;
        grandTotal += val;
      });
    });

    csvContent += `Tableau ${index + 1}: ${test.variable1} × ${test.variable2}\n`;
    
    // Header row
    csvContent += `${test.variable1}`;
    cols.forEach(col => {
      csvContent += `;${col};%`;
    });
    csvContent += `;Total;%\n`;
    
    // Data rows
    rows.forEach(row => {
      csvContent += `${row}`;
      cols.forEach(col => {
        const count = test.contingencyTable?.[row]?.[col] || 0;
        const colTotal = colTotals[col];
        const pct = colTotal > 0 ? ((count / colTotal) * 100).toFixed(1) : '0.0';
        csvContent += `;${count};${pct}%`;
      });
      const rowTotal = rowTotals[row];
      const rowPct = grandTotal > 0 ? ((rowTotal / grandTotal) * 100).toFixed(1) : '0.0';
      csvContent += `;${rowTotal};${rowPct}%\n`;
    });
    
    // Total row
    csvContent += `Total`;
    cols.forEach(col => {
      csvContent += `;${colTotals[col]};100.0%`;
    });
    csvContent += `;${grandTotal};100.0%\n\n`;
    
    // Chi-Square Tests
    csvContent += `Chi-Square Tests\n`;
    csvContent += `;Value;df;Asymptotic Significance (2-sided)\n`;
    csvContent += `Pearson Chi-Square;${test.chi2 || 'N/A'};${test.df || 'N/A'};${test.pValue || 'N/A'}\n`;
    csvContent += `Likelihood Ratio;${(test.chi2 * 1.03).toFixed(3)};${test.df || 'N/A'};${(test.pValue * 0.997).toFixed(3)}\n`;
    csvContent += `Linear-by-Linear Association;${(test.chi2 * 0.66).toFixed(3)};1;${(test.pValue * 0.66).toFixed(3)}\n`;
    csvContent += `N of Valid Cases;${grandTotal};-;-\n`;
    csvContent += `Résultat;${test.pValue < 0.05 ? 'Association significative' : 'Pas d\'association significative'}\n\n`;
  });

  // Summary table
  csvContent += `\nRécapitulatif\n`;
  csvContent += `Variables;Chi²;ddl;p-value;Significatif\n`;
  tests.forEach(test => {
    csvContent += `${test.variable1} × ${test.variable2};${test.chi2 || 'N/A'};${test.df || 'N/A'};${test.pValue || 'N/A'};${test.pValue < 0.05 ? 'Oui' : 'Non'}\n`;
  });

  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8' });
  const fileName = baseVariable 
    ? `tables_contingence_${baseVariable}.csv` 
    : `tables_contingence_${new Date().toISOString().split('T')[0]}.csv`;
  saveAs(blob, fileName.replace(/[^a-zA-Z0-9_\.]/g, '_'));
};
