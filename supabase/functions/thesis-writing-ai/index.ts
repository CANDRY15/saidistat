import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ThesisRequest {
  action: 'generate_introduction' | 'generate_theoretical' | 'generate_methodology' | 'generate_discussion' | 'generate_conclusion' | 'analyze_data' | 'improve_text' | 'fetch_doi' | 'search_pubmed';
  topic?: string;
  studyType?: string;
  section?: string;
  context?: {
    domain?: string;
    objective?: string;
    population?: string;
    period?: string;
    location?: string;
    variables?: string[];
    existingSections?: string[];
  };
  doi?: string;
  pubmedQuery?: string;
  excelData?: any;
  textToImprove?: string;
  citationFormat?: 'apa' | 'vancouver';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const request: ThesisRequest = await req.json();
    console.log('Thesis AI request:', request.action);

    // Handle DOI fetch
    if (request.action === 'fetch_doi' && request.doi) {
      return await handleDOIFetch(request.doi);
    }

    // Handle PubMed search
    if (request.action === 'search_pubmed' && request.pubmedQuery) {
      return await handlePubMedSearch(request.pubmedQuery);
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (request.action) {
      case 'generate_introduction':
        systemPrompt = getIntroductionSystemPrompt();
        userPrompt = getIntroductionUserPrompt(request);
        break;

      case 'generate_theoretical':
        systemPrompt = getTheoreticalSystemPrompt();
        userPrompt = getTheoreticalUserPrompt(request);
        break;

      case 'generate_methodology':
        systemPrompt = getMethodologySystemPrompt();
        userPrompt = getMethodologyUserPrompt(request);
        break;

      case 'analyze_data':
        systemPrompt = getDataAnalysisSystemPrompt();
        userPrompt = getDataAnalysisUserPrompt(request);
        break;

      case 'generate_discussion':
        systemPrompt = getDiscussionSystemPrompt();
        userPrompt = getDiscussionUserPrompt(request);
        break;

      case 'generate_conclusion':
        systemPrompt = getConclusionSystemPrompt();
        userPrompt = getConclusionUserPrompt(request);
        break;

      case 'improve_text':
        systemPrompt = getTextImprovementPrompt();
        userPrompt = `Améliore ce texte scientifique tout en conservant le sens:\n\n${request.textToImprove}\n\nContexte: ${request.topic || 'Rédaction scientifique médicale'}`;
        break;

      default:
        throw new Error('Action non reconnue');
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes dépassée. Veuillez patienter quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants. Veuillez recharger votre compte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response received, length:', content.length);

    // Parse JSON response
    let result;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        result = JSON.parse(jsonStr);
      } else {
        result = { content };
      }
    } catch {
      result = { content };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in thesis-writing-ai:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// DOI Fetch Handler
async function handleDOIFetch(doi: string) {
  try {
    const cleanDOI = doi.replace(/^https?:\/\/doi\.org\//, '').trim();
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDOI)}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "DOI non trouvé" }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const work = data.message;

    const reference = {
      id: crypto.randomUUID(),
      type: 'article' as const,
      authors: work.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()) || [],
      year: work.published?.['date-parts']?.[0]?.[0]?.toString() || work['published-print']?.['date-parts']?.[0]?.[0]?.toString() || '',
      title: work.title?.[0] || '',
      journal: work['container-title']?.[0] || '',
      volume: work.volume || '',
      issue: work.issue || '',
      pages: work.page || '',
      doi: cleanDOI,
    };

    return new Response(JSON.stringify({ reference }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('DOI fetch error:', error);
    return new Response(JSON.stringify({ error: "Erreur lors de la récupération du DOI" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// PubMed Search Handler
async function handlePubMedSearch(query: string) {
  try {
    // Search PubMed
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=10&retmode=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) {
      return new Response(JSON.stringify({ references: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch details
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
    const fetchResponse = await fetch(fetchUrl);
    const xmlText = await fetchResponse.text();

    // Simple XML parsing for PubMed
    const references = parseSimplePubMedXML(xmlText);

    return new Response(JSON.stringify({ references }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('PubMed search error:', error);
    return new Response(JSON.stringify({ error: "Erreur lors de la recherche PubMed" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

function parseSimplePubMedXML(xml: string): any[] {
  const references: any[] = [];
  const articleMatches = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

  for (const articleXml of articleMatches) {
    try {
      const pmid = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] || '';
      const title = articleXml.match(/<ArticleTitle>([^<]+)<\/ArticleTitle>/)?.[1] || '';
      const journal = articleXml.match(/<Title>([^<]+)<\/Title>/)?.[1] || '';
      const year = articleXml.match(/<PubDate>[\s\S]*?<Year>(\d+)<\/Year>/)?.[1] || '';
      const volume = articleXml.match(/<Volume>([^<]+)<\/Volume>/)?.[1] || '';
      const issue = articleXml.match(/<Issue>([^<]+)<\/Issue>/)?.[1] || '';
      const pages = articleXml.match(/<MedlinePgn>([^<]+)<\/MedlinePgn>/)?.[1] || '';
      
      // Extract authors
      const authorMatches = articleXml.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
      const authors = authorMatches.map(authorXml => {
        const lastName = authorXml.match(/<LastName>([^<]+)<\/LastName>/)?.[1] || '';
        const foreName = authorXml.match(/<ForeName>([^<]+)<\/ForeName>/)?.[1] || '';
        return `${foreName} ${lastName}`.trim();
      }).filter(a => a);

      // Extract DOI if available
      const doi = articleXml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/)?.[1] || '';

      if (title && authors.length > 0) {
        references.push({
          id: crypto.randomUUID(),
          pmid,
          type: 'article',
          authors,
          year,
          title,
          journal,
          volume,
          issue,
          pages,
          doi,
        });
      }
    } catch (e) {
      console.error('Error parsing article:', e);
    }
  }

  return references;
}

// ==================== INTRODUCTION COMPLÈTE ====================
function getIntroductionSystemPrompt(): string {
  return `Tu es un EXPERT SENIOR en rédaction de mémoires et thèses médicales en RDC avec plus de 25 ans d'expérience.

Tu dois générer une INTRODUCTION COMPLÈTE de minimum 4 pages selon la structure exacte suivante:

## STRUCTURE OBLIGATOIRE DE L'INTRODUCTION (dans cet ordre exact):

### 1. ÉTAT DE LA QUESTION (environ 2 pages - minimum 5 références)
- Commence TOUJOURS par la définition du sujet/de la maladie (selon OMS ou sociétés savantes)
- Suit la pyramide inversée:
  * Données MONDIALES (prévalence, incidence, mortalité mondiale avec références OMS)
  * Données en AFRIQUE (spécificités du continent, données régionales)
  * Données au PAYS (RDC ou pays concerné, statistiques nationales)
  * Données LOCALES (ville, province, hôpital concerné)
- Chaque niveau doit avoir au moins une référence récente (2018-2024)
- Transition vers la problématique

### 2. PROBLÉMATIQUE (intégrée à l'état de la question)
- Problème identifié malgré les efforts/protocoles existants
- Persistance de la morbidité/mortalité
- Gaps dans les connaissances locales

### 3. QUESTIONS DE RECHERCHE
- Introduction expliquant pourquoi ces questions
- 3-4 questions de recherche sous forme de liste à puces
- Questions formulées de manière précise et mesurable

### 4. CHOIX ET INTÉRÊT DU SUJET
**Choix:** Explication de la motivation (problème de santé majeur, prévalence élevée, etc.)
**Intérêts:**
- Plan personnel: approfondir les connaissances
- Plan scientifique: apporter des données locales de référence
- Plan communautaire: impact sur la santé de la communauté

### 5. OBJECTIFS
**A. Objectif général:**
- Commence par "Contribuer à la réduction de..." ou formulation similaire

**B. Objectifs spécifiques:**
- 3-4 objectifs commençant par des verbes d'action (Déterminer, Décrire, Identifier...)
- Liés aux questions de recherche

### 6. SUBDIVISION DU TRAVAIL
- Introduction et conclusion générale mentionnées
- Première partie: considérations théoriques (généralités sur le sujet)
- Deuxième partie: cadre de recherche, méthodologie, résultats, discussion

## STYLE D'ÉCRITURE:
- Français académique formel
- 3ème personne
- Temps: présent pour vérités générales, passé pour constats
- Citations format: (Auteur et al., Année)
- Paragraphes de 5-8 phrases minimum
- Transitions fluides entre sections

## FORMAT DE RÉPONSE (JSON):
{
  "content": "Texte HTML complet de l'introduction avec balises <h2>, <h3>, <p>, <ul>, <li>",
  "sections": [
    {"id": "etat_question", "title": "État de la question", "wordCount": 800},
    {"id": "questions_recherche", "title": "Questions de recherche", "wordCount": 150},
    {"id": "choix_interet", "title": "Choix et intérêt du sujet", "wordCount": 300},
    {"id": "objectifs", "title": "Objectifs", "wordCount": 200},
    {"id": "subdivision", "title": "Subdivision du travail", "wordCount": 150}
  ],
  "references": [
    {"citation": "(OMS, 2023)", "fullReference": "Organisation Mondiale de la Santé..."}
  ],
  "totalWordCount": 1600
}`;
}

function getIntroductionUserPrompt(request: ThesisRequest): string {
  return `SUJET DE RECHERCHE: ${request.topic}

INFORMATIONS CONTEXTUELLES:
- Domaine: ${request.context?.domain || 'Médecine'}
- Population d'étude: ${request.context?.population || 'Non spécifiée'}
- Période d'étude: ${request.context?.period || 'Non spécifiée'}
- Lieu d'étude: ${request.context?.location || 'Non spécifié'}

Génère l'INTRODUCTION COMPLÈTE (minimum 4 pages/1600 mots) en respectant EXACTEMENT la structure demandée.

L'état de la question doit:
1. Commencer par la DÉFINITION du sujet/maladie
2. Suivre la pyramide inversée: Monde → Afrique → Pays → Ville locale
3. Inclure au minimum 5 références récentes (2018-2024)
4. Intégrer la problématique de façon fluide

Les questions de recherche doivent être 3-4 questions précises et mesurables.

Le choix et intérêt doit couvrir: choix personnel, intérêt personnel, scientifique, communautaire.

Les objectifs doivent être SMART et liés aux questions de recherche.

La subdivision doit annoncer les 2 parties du travail.

GÉNÈRE LE CONTENU COMPLET EN FORMAT JSON.`;
}

// ==================== PARTIE THÉORIQUE ====================
function getTheoreticalSystemPrompt(): string {
  return `Tu es un EXPERT SENIOR en rédaction de mémoires médicales. Tu dois générer la PARTIE THÉORIQUE (Généralités) d'une thèse.

## STRUCTURE OBLIGATOIRE (minimum 15 pages/6000 mots):

### 1. DÉFINITIONS ET CONCEPTS
- Définitions officielles (OMS, sociétés savantes)
- Terminologie utilisée
- Concepts clés à comprendre

### 2. HISTORIQUE (optionnel)
- Évolution des connaissances
- Découvertes majeures

### 3. ÉPIDÉMIOLOGIE
- Épidémiologie mondiale (prévalence, incidence, tendances)
- Épidémiologie en Afrique
- Épidémiologie locale
- Facteurs de variation

### 4. CLASSIFICATION/TYPES
- Critères de classification
- Différents types/formes
- Stades/grades si applicable

### 5. PHYSIOPATHOLOGIE/MÉCANISMES
- Mécanismes principaux
- Explications physiopathologiques
- Schémas conceptuels

### 6. FACTEURS DE RISQUE/ÉTIOLOGIE
- Facteurs de risque établis
- Facteurs de risque discutés
- Facteurs protecteurs

### 7. MANIFESTATIONS CLINIQUES
- Signes et symptômes
- Formes cliniques
- Complications précoces

### 8. DIAGNOSTIC
- Critères diagnostiques officiels
- Examens paracliniques
- Diagnostic différentiel

### 9. PRISE EN CHARGE/TRAITEMENT
- Principes thérapeutiques
- Protocoles actuels
- Recommandations internationales

### 10. COMPLICATIONS ET PRONOSTIC
- Complications à court terme
- Complications à long terme
- Facteurs pronostiques

### 11. PRÉVENTION
- Prévention primaire
- Prévention secondaire
- Prévention tertiaire

## STYLE:
- Académique, 3ème personne
- Citations fréquentes (Auteur, Année)
- Tableaux suggérés quand pertinent
- Minimum 20 références

## FORMAT JSON:
{
  "content": "Texte HTML complet avec <h2>, <h3>, <h4>, <p>, <ul>, <li>, <table>",
  "sections": [
    {"id": "definitions", "title": "Définitions", "wordCount": 400}
  ],
  "references": [
    {"citation": "(OMS, 2023)", "fullReference": "..."}
  ],
  "suggestedTables": [
    {"title": "Tableau I: Classification de...", "content": "Description"}
  ],
  "totalWordCount": 6000
}`;
}

function getTheoreticalUserPrompt(request: ThesisRequest): string {
  return `SUJET: ${request.topic}
DOMAINE: ${request.context?.domain || 'Médecine'}
LIEU: ${request.context?.location || 'RDC'}

Génère la PARTIE THÉORIQUE COMPLÈTE (minimum 15 pages/6000 mots) avec:
- Toutes les sections obligatoires
- Minimum 20 références récentes
- Tableaux suggérés
- Style académique rigoureux

GÉNÈRE EN FORMAT JSON.`;
}

// ==================== MÉTHODOLOGIE ====================
function getMethodologySystemPrompt(): string {
  return `Tu es un EXPERT en méthodologie de recherche médicale. Génère la section MATÉRIEL ET MÉTHODES complète.

## STRUCTURE OBLIGATOIRE:

### 1. TYPE ET PÉRIODE D'ÉTUDE
- Type exact de l'étude (descriptive, analytique, prospective, rétrospective...)
- Période exacte
- Justification du choix

### 2. LIEU D'ÉTUDE
- Description de la structure sanitaire
- Localisation géographique
- Capacité et services
- Justification du choix

### 3. POPULATION D'ÉTUDE
- Population cible
- Population source
- Critères d'inclusion (liste)
- Critères d'exclusion (liste)

### 4. ÉCHANTILLONNAGE
- Technique d'échantillonnage utilisée
- Calcul de la taille d'échantillon (formule de Cochran ou autre)
- Taille finale de l'échantillon

### 5. VARIABLES ÉTUDIÉES
- Variable dépendante (principale)
- Variables indépendantes (liste détaillée)
- Variables de confusion potentielles

### 6. COLLECTE DES DONNÉES
- Instruments utilisés (questionnaire, fiche d'enquête...)
- Procédure de collecte
- Personnel impliqué
- Durée de collecte

### 7. ANALYSE DES DONNÉES
- Logiciel utilisé (SPSS, Epi Info, R...)
- Statistiques descriptives prévues
- Tests statistiques analytiques
- Seuil de significativité (p < 0,05)

### 8. CONSIDÉRATIONS ÉTHIQUES
- Approbation du comité d'éthique
- Consentement éclairé
- Confidentialité des données
- Anonymisation

## FORMAT JSON:
{
  "content": "Texte HTML complet",
  "variables": {
    "dependent": {"name": "...", "type": "...", "measurement": "..."},
    "independent": [{"name": "...", "type": "...", "categories": [...]}]
  },
  "sampleSize": {
    "formula": "n = Z²pq/d²",
    "calculation": "...",
    "result": 150
  },
  "statisticalPlan": ["Chi-carré", "Odds ratio", "Régression logistique"]
}`;
}

function getMethodologyUserPrompt(request: ThesisRequest): string {
  return `SUJET: ${request.topic}
TYPE D'ÉTUDE SUGGÉRÉ: ${request.studyType || 'Descriptive transversale'}
POPULATION: ${request.context?.population || 'Non spécifiée'}
PÉRIODE: ${request.context?.period || 'Non spécifiée'}
LIEU: ${request.context?.location || 'Non spécifié'}

Génère la section MATÉRIEL ET MÉTHODES complète et détaillée.

GÉNÈRE EN FORMAT JSON.`;
}

// ==================== ANALYSE DES DONNÉES ====================
function getDataAnalysisSystemPrompt(): string {
  return `Tu es un EXPERT en biostatistique et analyse de données médicales.

Tu reçois des données d'une base Excel et tu dois:
1. Analyser les données (statistiques descriptives et analytiques)
2. Interpréter les résultats
3. Générer le texte de la section RÉSULTATS

## ANALYSES À EFFECTUER:

### Statistiques descriptives:
- Effectifs et pourcentages pour variables qualitatives
- Moyenne, écart-type, médiane pour variables quantitatives
- Tableaux de fréquences

### Statistiques analytiques (si applicable):
- Test du Chi-carré ou Fisher exact
- Odds ratio avec IC à 95%
- Test t de Student ou Mann-Whitney
- Régression logistique si nécessaire

## STYLE D'ÉCRITURE DES RÉSULTATS:
- Passé composé uniquement
- Objectif, sans interprétation
- Référencer chaque tableau/figure
- Mentionner les valeurs p

## FORMAT JSON:
{
  "content": "Texte HTML de la section Résultats",
  "tables": [
    {
      "number": "I",
      "title": "Caractéristiques socio-démographiques",
      "data": [["Variable", "n", "%"], ...]
    }
  ],
  "mainFindings": ["Résultat clé 1", "Résultat clé 2"],
  "statisticalTests": [
    {"test": "Chi-carré", "variable": "...", "pValue": 0.023}
  ]
}`;
}

function getDataAnalysisUserPrompt(request: ThesisRequest): string {
  return `SUJET: ${request.topic}
OBJECTIFS SPÉCIFIQUES: ${request.context?.objective || 'Non spécifiés'}

DONNÉES EXCEL À ANALYSER:
${JSON.stringify(request.excelData, null, 2)}

Analyse ces données et génère:
1. Les résultats descriptifs (tableaux de fréquences)
2. Les résultats analytiques (tests statistiques)
3. Le texte de la section RÉSULTATS

NOTE: Ne pas inclure de références dans les résultats.

GÉNÈRE EN FORMAT JSON.`;
}

// ==================== DISCUSSION ====================
function getDiscussionSystemPrompt(): string {
  return `Tu es un EXPERT en rédaction scientifique. Génère la section DISCUSSION.

## STRUCTURE OBLIGATOIRE:

### 1. RAPPEL DES PRINCIPAUX RÉSULTATS (1 paragraphe)
- Résumer les 3-4 résultats majeurs sans répéter les chiffres

### 2. COMPARAISON AVEC LA LITTÉRATURE (3-4 paragraphes)
- Pour chaque résultat important:
  * Comparaison avec études similaires
  * Explication des concordances
  * Explication des discordances
  * Citations appropriées

### 3. INTERPRÉTATION (1-2 paragraphes)
- Signification des résultats
- Implications pratiques

### 4. FORCES DE L'ÉTUDE (1 paragraphe)
- Points méthodologiques forts
- Originalité

### 5. LIMITES (1-2 paragraphes)
- Biais potentiels
- Limites de généralisabilité
- Données manquantes

### 6. RECOMMANDATIONS (optionnel)
- Pour la pratique clinique
- Pour la recherche future

## STYLE:
- Présent et passé composé
- Citations fréquentes (Auteur, Année)
- Nuancé et objectif

## FORMAT JSON:
{
  "content": "Texte HTML complet",
  "comparisonStudies": [
    {"author": "Dupont et al., 2022", "finding": "...", "comparison": "Concordant/Discordant"}
  ],
  "limitations": ["Biais de sélection", "..."],
  "strengths": ["Première étude locale", "..."],
  "references": [{"citation": "...", "fullReference": "..."}]
}`;
}

function getDiscussionUserPrompt(request: ThesisRequest): string {
  return `SUJET: ${request.topic}
RÉSULTATS OBTENUS: ${request.context?.existingSections?.join(', ') || 'Non spécifiés'}

Génère la section DISCUSSION complète avec:
- Comparaison avec la littérature récente (minimum 8 références)
- Forces et limites de l'étude
- Recommandations

GÉNÈRE EN FORMAT JSON.`;
}

// ==================== CONCLUSION ====================
function getConclusionSystemPrompt(): string {
  return `Tu es un EXPERT en rédaction scientifique. Génère la CONCLUSION.

## STRUCTURE (1-2 paragraphes, max 15 phrases):

1. Rappel du contexte et objectif (1 phrase)
2. Résultats principaux (2-3 phrases)
3. Implications pratiques (1-2 phrases)
4. Recommandations (2-3 phrases)
5. Perspectives/ouverture (1-2 phrases)

## RÈGLES:
- Maximum 15 phrases
- Pas de nouvelles informations
- Pas de citations
- Ton affirmatif et conclusif
- Pas de chiffres précis (utiliser "élevé", "majoritairement", etc.)

## FORMAT JSON:
{
  "content": "Texte HTML de la conclusion",
  "keyMessages": ["Message clé 1", "Message clé 2"],
  "recommendations": ["Recommandation 1", "Recommandation 2"]
}`;
}

function getConclusionUserPrompt(request: ThesisRequest): string {
  return `SUJET: ${request.topic}
OBJECTIF PRINCIPAL: ${request.context?.objective || 'Non spécifié'}

Génère la CONCLUSION en respectant les règles.

GÉNÈRE EN FORMAT JSON.`;
}

// ==================== AMÉLIORATION DE TEXTE ====================
function getTextImprovementPrompt(): string {
  return `Tu es un expert en rédaction scientifique médicale. Améliore le texte fourni.

AMÉLIORATIONS:
1. Style académique formel (3ème personne)
2. Clarté et précision
3. Cohérence des temps verbaux
4. Transitions fluides
5. Vocabulaire technique approprié

CONSERVER:
- Le sens original
- Les données chiffrées
- Les citations présentes
- La structure générale

FORMAT JSON:
{
  "improvedText": "Texte amélioré ici",
  "changes": ["Changement 1", "Changement 2"]
}`;
}
