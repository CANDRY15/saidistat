import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisResult, format } = await req.json();
    console.log(`Generating ${format} export...`);

    if (format === 'excel') {
      // Generate CSV content (Excel will open it)
      let csvContent = 'RÉSUMÉ DE L\'ANALYSE\n\n';
      csvContent += `Fichier,${analysisResult.fileName}\n`;
      csvContent += `Nombre de lignes,${analysisResult.rowCount}\n`;
      csvContent += `Nombre de colonnes,${analysisResult.columnCount}\n`;
      csvContent += `Variables numériques,${analysisResult.statistics.filter((s: any) => s.type === 'numeric').length}\n`;
      csvContent += `Variables qualitatives,${analysisResult.statistics.filter((s: any) => s.type === 'text' || s.type === 'age_groups').length}\n`;
      csvContent += '\n\nSTATISTIQUES DESCRIPTIVES\n\n';

      for (const stat of analysisResult.statistics) {
        csvContent += `\n${stat.name} (${stat.type === 'numeric' ? 'Quantitative' : stat.type === 'age_groups' ? 'Tranches d\'âge' : 'Qualitative'})\n`;
        
        if (stat.type === 'numeric') {
          csvContent += 'Statistique,Valeur\n';
          csvContent += `Effectif,${stat.count}\n`;
          csvContent += `Moyenne,${stat.mean}\n`;
          csvContent += `Médiane,${stat.median}\n`;
          csvContent += `Écart-type,${stat.std}\n`;
          csvContent += `Minimum,${stat.min}\n`;
          csvContent += `Maximum,${stat.max}\n`;
          csvContent += `Valeurs manquantes,${stat.missing}\n`;
        } else {
          csvContent += `${stat.type === 'age_groups' ? 'Tranche d\'âge' : 'Valeur'},Effectif,Pourcentage\n`;
          if (stat.frequencies) {
            for (const freq of stat.frequencies) {
              csvContent += `${freq.value},${freq.count},${freq.percentage}\n`;
            }
          }
          csvContent += `Total,${stat.count},100.0\n`;
          if (stat.missing > 0) {
            csvContent += `Valeurs manquantes,${stat.missing}\n`;
          }
        }
        csvContent += '\n';
      }

      csvContent += '\nAPERÇU DES DONNÉES\n';
      csvContent += analysisResult.columns.join(',') + '\n';
      for (const row of analysisResult.preview) {
        const rowData = analysisResult.columns.map((col: string) => {
          const value = row[col];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csvContent += rowData.join(',') + '\n';
      }

      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="analyse_${analysisResult.fileName}.csv"`,
        },
      });
    } else if (format === 'pdf' || format === 'word') {
      // Generate HTML content
      let html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #333; border-bottom: 2px solid #666; padding-bottom: 10px; }
            h2 { color: #555; margin-top: 30px; }
            table { border-collapse: collapse; width: 100%; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary { background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .stat-section { margin: 30px 0; page-break-inside: avoid; }
            .badge { display: inline-block; padding: 3px 10px; background-color: #e0e0e0; border-radius: 12px; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Rapport d'Analyse des Données</h1>
          
          <div class="summary">
            <h2>Résumé de l'analyse</h2>
            <p><strong>Fichier:</strong> ${analysisResult.fileName}</p>
            <p><strong>Nombre de lignes:</strong> ${analysisResult.rowCount}</p>
            <p><strong>Nombre de colonnes:</strong> ${analysisResult.columnCount}</p>
            <p><strong>Variables numériques:</strong> ${analysisResult.statistics.filter((s: any) => s.type === 'numeric').length}</p>
            <p><strong>Variables qualitatives:</strong> ${analysisResult.statistics.filter((s: any) => s.type === 'text' || s.type === 'age_groups').length}</p>
          </div>

          <h2>Statistiques descriptives</h2>
      `;

      for (const stat of analysisResult.statistics) {
        html += `
          <div class="stat-section">
            <h3>${stat.name} <span class="badge">${stat.type === 'numeric' ? 'Quantitative' : stat.type === 'age_groups' ? 'Tranches d\'âge' : 'Qualitative'}</span></h3>
        `;

        if (stat.type === 'numeric') {
          html += `
            <table>
              <tr><th>Statistique</th><th>Valeur</th></tr>
              <tr><td>Effectif</td><td>${stat.count}</td></tr>
              <tr><td>Moyenne</td><td>${stat.mean}</td></tr>
              <tr><td>Médiane</td><td>${stat.median}</td></tr>
              <tr><td>Écart-type</td><td>${stat.std}</td></tr>
              <tr><td>Minimum</td><td>${stat.min}</td></tr>
              <tr><td>Maximum</td><td>${stat.max}</td></tr>
              <tr><td>Valeurs manquantes</td><td>${stat.missing}</td></tr>
            </table>
          `;
        } else {
          html += `
            <table>
              <tr>
                <th>${stat.type === 'age_groups' ? 'Tranche d\'âge' : stat.name}</th>
                <th>Effectif</th>
                <th>Pourcentage</th>
              </tr>
          `;
          if (stat.frequencies) {
            for (const freq of stat.frequencies) {
              html += `<tr><td>${freq.value}</td><td>${freq.count}</td><td>${freq.percentage}</td></tr>`;
            }
          }
          html += `
              <tr style="background-color: #f2f2f2; font-weight: bold;">
                <td>Total</td>
                <td>${stat.count}</td>
                <td>100,0</td>
              </tr>
            </table>
          `;
          if (stat.missing > 0) {
            html += `<p><em>Valeurs manquantes: ${stat.missing}</em></p>`;
          }
        }
        html += `</div>`;
      }

      html += `
          <h2>Aperçu des données</h2>
          <table>
            <tr>
              ${analysisResult.columns.map((col: string) => `<th>${col}</th>`).join('')}
            </tr>
            ${analysisResult.preview.map((row: any) => `
              <tr>
                ${analysisResult.columns.map((col: string) => `<td>${row[col] || ''}</td>`).join('')}
              </tr>
            `).join('')}
          </table>
        </body>
        </html>
      `;

      if (format === 'word') {
        // Convert HTML to Word format
        const wordContent = `
MIME-Version: 1.0
Content-Type: multipart/related; boundary="BOUNDARY"

--BOUNDARY
Content-Type: text/html; charset="UTF-8"

${html}

--BOUNDARY--
        `;

        return new Response(wordContent, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/msword',
            'Content-Disposition': `attachment; filename="analyse_${analysisResult.fileName}.doc"`,
          },
        });
      } else {
        // Return HTML for PDF (client will handle PDF generation)
        return new Response(JSON.stringify({ html }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        });
      }
    }

    throw new Error('Format non supporté');

  } catch (error: any) {
    console.error('Error generating export:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
