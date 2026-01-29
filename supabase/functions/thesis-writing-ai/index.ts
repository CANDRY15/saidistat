import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ThesisRequest {
  action: 'identify_study' | 'generate_section' | 'generate_references' | 'improve_text' | 'add_citations';
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
  existingContent?: string;
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

    let systemPrompt = '';
    let userPrompt = '';

    switch (request.action) {
      case 'identify_study':
        systemPrompt = getStudyIdentificationPrompt();
        userPrompt = `Analyse ce sujet de recherche et identifie le type d'étude le plus approprié:

SUJET: "${request.topic}"
DOMAINE: ${request.context?.domain || 'Médecine'}

Réponds en JSON structuré avec tous les champs demandés.`;
        break;

      case 'generate_section':
        systemPrompt = getSystemPromptForSection(request.section || '', request.studyType || '', request.context);
        userPrompt = getUserPromptForSection(request);
        break;

      case 'generate_references':
        systemPrompt = getReferencesPrompt(request.citationFormat || 'apa');
        userPrompt = `Génère 10-15 références bibliographiques RÉELLES et vérifiables pour le sujet suivant:

SUJET: "${request.topic}"
DOMAINE: ${request.context?.domain || 'Médecine'}
TYPE D'ÉTUDE: ${request.studyType || 'Non spécifié'}

Les références doivent être:
- Des articles de revues médicales reconnues (Lancet, NEJM, BMJ, JAMA, etc.)
- Des publications récentes (2018-2024)
- Pertinentes pour le contexte africain si applicable
- Incluant des publications OMS et des organisations internationales`;
        break;

      case 'improve_text':
        systemPrompt = getTextImprovementPrompt();
        userPrompt = `Améliore ce texte scientifique tout en conservant le sens:

${request.textToImprove}

Contexte: ${request.topic || 'Rédaction scientifique médicale'}`;
        break;

      case 'add_citations':
        systemPrompt = getCitationInsertionPrompt(request.citationFormat || 'apa');
        userPrompt = `Ajoute des citations appropriées dans ce texte:

${request.existingContent}

Format de citation: ${request.citationFormat || 'APA'}
Domaine: ${request.context?.domain || 'Médecine'}`;
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
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes dépassée. Veuillez patienter quelques instants avant de réessayer." }), {
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

function getStudyIdentificationPrompt(): string {
  return `Tu es un EXPERT SENIOR en méthodologie de recherche médicale et épidémiologie avec plus de 20 ans d'expérience.

MISSION: Analyser le sujet de recherche fourni et identifier le type d'étude le plus approprié selon les critères méthodologiques stricts.

TYPES D'ÉTUDES À CONSIDÉRER:
1. **Étude descriptive transversale** - Description d'une situation à un moment donné (prévalence, caractéristiques)
2. **Étude analytique transversale** - Recherche d'associations entre facteurs à un moment donné
3. **Étude de cohorte prospective** - Suivi dans le temps d'un groupe exposé vs non-exposé
4. **Étude de cohorte rétrospective** - Reconstitution du suivi à partir de données historiques
5. **Étude cas-témoins** - Comparaison de cas et témoins pour identifier des facteurs de risque
6. **Essai clinique randomisé** - Intervention avec randomisation
7. **Étude quasi-expérimentale** - Intervention sans randomisation complète
8. **Revue systématique** - Synthèse méthodique de la littérature
9. **Méta-analyse** - Analyse statistique combinée d'études

CRITÈRES DE DÉCISION:
- Présence d'un suivi temporel → Cohorte
- Comparaison cas vs témoins → Cas-témoins
- Description de prévalence/fréquence → Descriptive transversale
- Recherche de facteurs associés sans suivi → Analytique transversale
- Intervention thérapeutique → Essai clinique

FORMAT DE RÉPONSE (JSON strict):
{
  "studyType": "Nom exact du type d'étude",
  "justification": "Explication détaillée de 3-4 phrases justifiant ce choix méthodologique",
  "characteristics": ["Caractéristique 1", "Caractéristique 2", "Caractéristique 3", "Caractéristique 4"],
  "suggestedObjectives": {
    "general": "Objectif général commençant par 'Contribuer à l'amélioration de...' ou 'Déterminer...'",
    "specific": [
      "Objectif spécifique 1 (verbe d'action: Déterminer, Décrire, Identifier...)",
      "Objectif spécifique 2",
      "Objectif spécifique 3"
    ]
  },
  "suggestedVariables": {
    "dependent": "Variable dépendante principale",
    "independent": ["Variable indépendante 1", "Variable indépendante 2"],
    "confounding": ["Variable de confusion potentielle 1", "Variable de confusion 2"]
  },
  "statisticalMethods": ["Méthode statistique 1", "Méthode statistique 2"],
  "sampleSizeConsiderations": "Recommandations pour le calcul de la taille d'échantillon"
}`;
}

function getReferencesPrompt(format: 'apa' | 'vancouver'): string {
  return `Tu es un expert en recherche bibliographique médicale. Tu dois générer des références bibliographiques RÉALISTES et CRÉDIBLES.

FORMAT: ${format === 'apa' ? 'APA 7ème édition' : 'Vancouver (numéroté)'}

CONSIGNES:
- Génère des références qui POURRAIENT exister (noms d'auteurs africains et internationaux crédibles)
- Utilise des revues médicales reconnues: The Lancet, NEJM, BMJ, JAMA, Tropical Medicine & International Health, African Health Sciences, Pan African Medical Journal
- Inclus des rapports d'organismes: OMS, UNICEF, Ministère de la Santé
- Années récentes: 2018-2024
- Mélange articles originaux, revues systématiques et rapports

FORMAT JSON:
{
  "references": [
    {
      "id": "uuid",
      "type": "article",
      "authors": ["Prénom Nom", "Prénom Nom"],
      "year": "2023",
      "title": "Titre de l'article",
      "journal": "Nom du journal",
      "volume": "XX",
      "issue": "X",
      "pages": "XX-XX",
      "doi": "10.xxxx/xxxxx"
    }
  ]
}`;
}

function getTextImprovementPrompt(): string {
  return `Tu es un expert en rédaction scientifique médicale. Tu dois améliorer le texte fourni.

AMÉLIORATIONS À APPORTER:
1. Style académique formel (3ème personne, passé composé/imparfait)
2. Clarté et précision du langage
3. Cohérence des temps verbaux
4. Transitions fluides entre les idées
5. Vocabulaire technique approprié

CONSERVER:
- Le sens original
- Les données chiffrées
- Les citations présentes
- La structure générale

FORMAT JSON:
{
  "improvedText": "Texte amélioré ici",
  "changes": ["Description du changement 1", "Description du changement 2"]
}`;
}

function getCitationInsertionPrompt(format: 'apa' | 'vancouver'): string {
  return `Tu es un expert en rédaction scientifique. Tu dois ajouter des citations dans le texte fourni.

FORMAT DE CITATION: ${format === 'apa' ? 'APA (Auteur, Année)' : 'Vancouver [numéro]'}

RÈGLES:
- Chaque affirmation factuelle doit avoir une citation
- Les statistiques doivent être sourcées
- Utilise "et al." pour 3+ auteurs
- Ne pas surcharger (1-2 citations par phrase max)

FORMAT JSON:
{
  "textWithCitations": "Texte avec citations intégrées",
  "suggestedReferences": [
    {
      "citation": "(Auteur, 2023)",
      "context": "Pour quelle affirmation",
      "suggestedSource": "Type de source recommandé"
    }
  ]
}`;
}

function getSystemPromptForSection(section: string, studyType: string, context?: ThesisRequest['context']): string {
  const basePrompt = `Tu es un EXPERT SENIOR en rédaction de mémoires et thèses médicales avec plus de 20 ans d'expérience dans l'encadrement de travaux scientifiques en Afrique francophone.

STYLE D'ÉCRITURE OBLIGATOIRE:
- Français académique formel
- Temps: présent pour les vérités générales, passé composé/imparfait pour les constats
- 3ème personne (éviter "nous", "je")
- Phrases claires et structurées
- Citations en format auteur-date: (Dupont et al., 2022)

TYPE D'ÉTUDE: ${studyType}
CONTEXTE: ${context?.domain || 'Médecine'} - ${context?.location || 'RDC'}
POPULATION: ${context?.population || 'Non spécifiée'}
PÉRIODE: ${context?.period || 'Non spécifiée'}

RÈGLES GÉNÉRALES:
1. Chaque paragraphe doit contenir 5-8 phrases
2. Chaque affirmation importante doit être sourcée
3. Utiliser des données épidémiologiques récentes et contextualisées
4. Structure pyramide inversée: du général au spécifique
5. Transitions fluides entre les parties

`;

  const sectionPrompts: Record<string, string> = {
    'context': basePrompt + `SECTION: CONTEXTE ET JUSTIFICATION

OBJECTIF: Présenter le cadre général de l'étude et justifier sa pertinence.

STRUCTURE (exactement 2 paragraphes de 6-8 phrases chacun):

**Paragraphe 1 - Contexte général:**
- Définir brièvement la problématique de santé
- Présenter son importance mondiale (données OMS)
- Mentionner l'impact sur les systèmes de santé

**Paragraphe 2 - Justification:**
- Présenter les lacunes dans les connaissances actuelles
- Expliquer pourquoi cette étude est nécessaire
- Annoncer la contribution attendue

FORMAT JSON:
{
  "content": "Texte complet du contexte avec citations (Auteur, Année)",
  "keyPoints": ["Point clé 1", "Point clé 2", "Point clé 3"],
  "suggestedCitations": [
    {"text": "affirmation", "suggestedSource": "OMS, 2023"}
  ]
}`,

    'state_of_question': basePrompt + `SECTION: ÉTAT DE LA QUESTION (REVUE DE LITTÉRATURE INTRODUCTIVE)

OBJECTIF: Présenter une synthèse structurée des connaissances actuelles selon la règle de la pyramide inversée.

STRUCTURE (3 paragraphes de 7-10 phrases chacun):

**Paragraphe 1 - Situation mondiale:**
- Épidémiologie mondiale (prévalence, incidence, mortalité)
- Tendances récentes et évolutions
- Recommandations internationales (OMS)
- Citations obligatoires de revues internationales

**Paragraphe 2 - Situation en Afrique subsaharienne:**
- Spécificités épidémiologiques du continent
- Défis particuliers (accès aux soins, ressources)
- Études africaines pertinentes
- Disparités régionales

**Paragraphe 3 - Situation locale (RDC/région):**
- Données épidémiologiques locales disponibles
- État des services de santé concernés
- Études locales antérieures
- Gaps dans les connaissances locales

FORMAT JSON:
{
  "content": "Texte complet avec structure et citations",
  "worldData": {
    "prevalence": "Chiffre mondial",
    "trend": "Tendance observée",
    "source": "OMS, 2023"
  },
  "africaData": {
    "prevalence": "Chiffre africain",
    "challenges": ["Défi 1", "Défi 2"]
  },
  "localGaps": ["Lacune 1", "Lacune 2"]
}`,

    'problematic': basePrompt + `SECTION: PROBLÉMATIQUE

OBJECTIF: Formuler clairement le problème de recherche et les questions qui en découlent.

STRUCTURE (3 paragraphes):

**Paragraphe 1 - Présentation du problème (6-8 phrases):**
- Reformuler le problème de santé identifié
- Mettre en évidence les conséquences
- Chiffrer l'impact si possible

**Paragraphe 2 - Lacunes et gaps (5-7 phrases):**
- Identifier ce qui manque dans la littérature
- Expliquer pourquoi les études existantes sont insuffisantes
- Pointer les contradictions ou zones d'ombre

**Paragraphe 3 - Questions de recherche (formulation claire):**
- Question principale
- 2-3 questions secondaires
- Formulées de manière interrogative

FORMAT JSON:
{
  "content": "Texte complet de la problématique",
  "mainQuestion": "Question de recherche principale?",
  "secondaryQuestions": [
    "Question secondaire 1?",
    "Question secondaire 2?",
    "Question secondaire 3?"
  ]
}`,

    'choice_relevance': basePrompt + `SECTION: CHOIX ET INTÉRÊT DU SUJET

OBJECTIF: Justifier le choix personnel du sujet et démontrer ses multiples intérêts.

STRUCTURE:

**Choix du sujet (1 paragraphe de 4-5 phrases):**
- Motivation personnelle ou professionnelle
- Observation de terrain qui a suscité l'intérêt
- Pertinence par rapport à la formation

**Intérêt personnel (1 paragraphe de 3-4 phrases):**
- Développement des compétences de l'étudiant
- Contribution à sa formation scientifique
- Préparation à la pratique professionnelle

**Intérêt scientifique (1 paragraphe de 4-5 phrases):**
- Contribution aux connaissances existantes
- Comblement d'un gap dans la littérature
- Génération de données probantes

**Intérêt communautaire/sanitaire (1 paragraphe de 4-5 phrases):**
- Bénéfices pour la population
- Amélioration des pratiques de soins
- Recommandations pour les décideurs

FORMAT JSON:
{
  "content": "Texte complet structuré",
  "personalInterest": "Résumé de l'intérêt personnel",
  "scientificInterest": "Résumé de l'intérêt scientifique", 
  "communityInterest": "Résumé de l'intérêt communautaire"
}`,

    'objectives': basePrompt + `SECTION: OBJECTIFS DE L'ÉTUDE

OBJECTIF: Formuler des objectifs clairs, mesurables et cohérents avec la problématique.

RÈGLES DE FORMULATION:
- Objectif général: 1 seul, commence par "Contribuer à..." ou un verbe d'action général
- Objectifs spécifiques: 3-4 maximum, verbes d'action précis (Déterminer, Décrire, Identifier, Évaluer, Comparer, Analyser)
- SMART: Spécifiques, Mesurables, Atteignables, Réalistes, Temporellement définis
- Cohérence avec le type d'étude (${studyType})

FORMULATION TYPE:
- Pour étude descriptive: "Décrire...", "Déterminer la fréquence de..."
- Pour étude analytique: "Identifier les facteurs associés à...", "Analyser la relation entre..."
- Pour étude de cohorte: "Évaluer l'incidence de...", "Mesurer le risque relatif de..."

FORMAT JSON:
{
  "generalObjective": "Objectif général complet",
  "specificObjectives": [
    "Objectif spécifique 1 (verbe + quoi + chez qui + où + quand)",
    "Objectif spécifique 2",
    "Objectif spécifique 3"
  ],
  "hypotheses": [
    "Hypothèse correspondant à l'objectif 1",
    "Hypothèse correspondant à l'objectif 2"
  ]
}`,

    'subdivision': basePrompt + `SECTION: SUBDIVISION DU TRAVAIL

OBJECTIF: Présenter l'organisation logique du document.

STRUCTURE STANDARD EN 2 PARTIES:

**PREMIÈRE PARTIE: CONSIDÉRATIONS THÉORIQUES**
- Chapitre 1: Généralités sur [le sujet principal]
  - Définitions et concepts clés
  - Classification/Typologie
  - Épidémiologie
  - Physiopathologie/Mécanismes
  
**DEUXIÈME PARTIE: APPROCHE PRATIQUE**
- Chapitre 2: Matériel et Méthodes
  - Type d'étude
  - Population et échantillonnage
  - Variables et collecte
  - Analyse statistique
  
- Chapitre 3: Résultats
  - Résultats descriptifs
  - Résultats analytiques
  
- Chapitre 4: Discussion
  - Interprétation des résultats
  - Comparaison avec la littérature
  - Limites de l'étude

FORMAT JSON:
{
  "content": "Texte narratif présentant la subdivision",
  "structure": {
    "part1": {
      "title": "Considérations théoriques",
      "chapters": [{"title": "...", "sections": ["...", "..."]}]
    },
    "part2": {
      "title": "Approche pratique", 
      "chapters": [{"title": "...", "sections": ["...", "..."]}]
    }
  }
}`,

    'theoretical_part': basePrompt + `SECTION: CONSIDÉRATIONS THÉORIQUES (GÉNÉRALITÉS)

OBJECTIF: Présenter une revue complète et structurée des connaissances sur le sujet.

SOUS-SECTIONS OBLIGATOIRES:

**1. Définitions et concepts (1-2 paragraphes)**
- Définitions officielles (OMS, sociétés savantes)
- Terminologie utilisée

**2. Historique/Évolution des connaissances (optionnel, 1 paragraphe)**

**3. Classification/Typologie (si applicable)**
- Critères de classification
- Types/Stades

**4. Épidémiologie descriptive (2-3 paragraphes)**
- Fréquence mondiale
- Fréquence en Afrique
- Facteurs de variation

**5. Physiopathologie/Mécanismes (1-2 paragraphes)**
- Mécanismes principaux expliqués simplement

**6. Facteurs de risque/étiologie (1-2 paragraphes)**
- Facteurs établis
- Facteurs discutés

**7. Manifestations cliniques/Diagnostic (2 paragraphes)**
- Signes et symptômes
- Critères diagnostiques

**8. Prise en charge/Traitement (1-2 paragraphes)**
- Principes thérapeutiques
- Recommandations actuelles

**9. Complications et pronostic (1 paragraphe)**

FORMAT JSON:
{
  "sections": [
    {
      "title": "1. Définitions",
      "content": "Texte avec citations..."
    },
    {
      "title": "2. Épidémiologie",
      "content": "Texte avec données..."
    }
  ],
  "keyDefinitions": [
    {"term": "Terme", "definition": "Définition", "source": "OMS, 2023"}
  ]
}`,

    'methodology': basePrompt + `SECTION: MATÉRIEL ET MÉTHODES

OBJECTIF: Décrire avec précision la méthodologie permettant de reproduire l'étude.

SOUS-SECTIONS OBLIGATOIRES:

**1. Type et période d'étude (1 paragraphe)**
- Type exact: "${studyType}"
- Période précise
- Justification du choix

**2. Lieu d'étude (1 paragraphe)**
- Description de la structure
- Capacité et activités
- Justification du choix

**3. Population d'étude (2 paragraphes)**
- Définition de la population cible
- Critères d'inclusion (liste)
- Critères d'exclusion (liste)

**4. Échantillonnage (1-2 paragraphes)**
- Technique d'échantillonnage
- Calcul de la taille d'échantillon (formule)
- Justification

**5. Variables étudiées (structure en tableau)**
- Variable dépendante
- Variables indépendantes
- Variables de confusion

**6. Collecte des données (1-2 paragraphes)**
- Outils utilisés (questionnaire, fiche...)
- Procédure de collecte
- Formation des enquêteurs

**7. Analyse des données (1-2 paragraphes)**
- Logiciels utilisés (Epi Info, SPSS, R...)
- Statistiques descriptives prévues
- Tests statistiques analytiques
- Seuil de significativité (p < 0,05)

**8. Considérations éthiques (1 paragraphe)**
- Approbation éthique
- Consentement éclairé
- Confidentialité

FORMAT JSON:
{
  "sections": [
    {
      "title": "Type et période d'étude",
      "content": "..."
    }
  ],
  "variables": {
    "dependent": {"name": "...", "type": "...", "measurement": "..."},
    "independent": [
      {"name": "...", "type": "...", "categories": ["..."]}
    ]
  },
  "statisticalPlan": {
    "descriptive": ["Fréquences", "Moyennes"],
    "analytical": ["Chi-carré", "Odds ratio"],
    "software": "Epi Info 7.2"
  }
}`,

    'results': basePrompt + `SECTION: RÉSULTATS

OBJECTIF: Présenter objectivement les résultats sans interprétation.

STRUCTURE:

**1. Description de l'échantillon (1-2 paragraphes)**
- Taille finale
- Taux de participation/exclusions
- Période effective de collecte

**2. Caractéristiques socio-démographiques (tableaux + texte)**
- Âge (moyenne, extrêmes)
- Sexe (proportion)
- Autres caractéristiques pertinentes

**3. Résultats descriptifs selon les objectifs (par objectif spécifique)**
- Fréquences/prévalences
- Moyennes et écarts-types
- Tableaux et figures référencés

**4. Résultats analytiques (si étude analytique)**
- Analyse bivariée
- Analyse multivariée si applicable
- OR/RR avec IC95% et valeurs p

RÈGLES D'ÉCRITURE:
- Passé composé uniquement
- Pas d'interprétation, juste des constats
- Référencer chaque tableau/figure
- Présenter les données les plus importantes dans le texte

FORMAT JSON:
{
  "sections": [
    {
      "title": "Description de l'échantillon",
      "content": "..."
    }
  ],
  "suggestedTables": [
    {
      "title": "Tableau I. Caractéristiques socio-démographiques",
      "variables": ["Âge", "Sexe", "Profession"]
    }
  ],
  "mainFindings": ["Résultat clé 1", "Résultat clé 2"]
}`,

    'discussion': basePrompt + `SECTION: DISCUSSION

OBJECTIF: Interpréter les résultats et les situer par rapport à la littérature.

STRUCTURE:

**1. Rappel des principaux résultats (1 paragraphe)**
- Résumer les 3-4 résultats majeurs
- Sans répéter les chiffres exacts

**2. Comparaison avec la littérature (2-4 paragraphes)**
- Pour chaque résultat important:
  * Comparaison avec études similaires
  * Explication des concordances
  * Explication des discordances

**3. Interprétation et signification (1-2 paragraphes)**
- Ce que les résultats signifient
- Implications pratiques

**4. Forces de l'étude (1 paragraphe)**
- Points méthodologiques forts
- Originalité

**5. Limites de l'étude (1-2 paragraphes)**
- Biais potentiels (sélection, information, confusion)
- Limites de généralisabilité
- Données manquantes

**6. Recommandations (optionnel)**
- Pour la pratique
- Pour la recherche future

FORMAT JSON:
{
  "sections": [
    {
      "title": "Principaux résultats",
      "content": "..."
    }
  ],
  "comparisonStudies": [
    {
      "author": "Auteur et al., 2022",
      "finding": "Leur résultat",
      "comparison": "Concordant/Discordant",
      "explanation": "Raison possible"
    }
  ],
  "limitations": ["Biais de sélection possible", "..."],
  "strengths": ["Première étude locale", "..."]
}`,

    'conclusion': basePrompt + `SECTION: CONCLUSION

OBJECTIF: Synthétiser les apports de l'étude et ouvrir des perspectives.

STRUCTURE (1 seul paragraphe dense ou 2 paragraphes courts):

**Éléments à inclure:**
1. Rappel du contexte et de l'objectif (1 phrase)
2. Résultats principaux (2-3 phrases)
3. Implications pratiques (1-2 phrases)
4. Perspectives/Recommandations (1-2 phrases)

RÈGLES:
- Maximum 10-12 phrases
- Pas de nouvelles informations
- Pas de citations
- Ton affirmatif et conclusif

FORMAT JSON:
{
  "content": "Texte complet de la conclusion",
  "keyMessages": [
    "Message clé 1 à retenir",
    "Message clé 2 à retenir"
  ],
  "recommendations": [
    "Recommandation pratique 1",
    "Recommandation pour recherche future"
  ]
}`
  };

  return sectionPrompts[section] || basePrompt + `Génère du contenu académique pour la section "${section}".`;
}

function getUserPromptForSection(request: ThesisRequest): string {
  const ctx = request.context || {};
  let prompt = `SUJET DE RECHERCHE: ${request.topic || 'Non spécifié'}
TYPE D'ÉTUDE: ${request.studyType || 'Non spécifié'}
SECTION À GÉNÉRER: ${request.section}

`;
  
  if (ctx.domain) prompt += `DOMAINE: ${ctx.domain}\n`;
  if (ctx.objective) prompt += `OBJECTIF PRINCIPAL: ${ctx.objective}\n`;
  if (ctx.population) prompt += `POPULATION D'ÉTUDE: ${ctx.population}\n`;
  if (ctx.period) prompt += `PÉRIODE D'ÉTUDE: ${ctx.period}\n`;
  if (ctx.location) prompt += `LIEU D'ÉTUDE: ${ctx.location}\n`;
  if (ctx.variables?.length) prompt += `VARIABLES: ${ctx.variables.join(', ')}\n`;
  
  if (ctx.existingSections?.length) {
    prompt += `\nSECTIONS DÉJÀ GÉNÉRÉES (pour cohérence): ${ctx.existingSections.join(', ')}\n`;
  }
  
  if (request.existingContent) {
    prompt += `\nCONTENU EXISTANT À PRENDRE EN COMPTE:\n${request.existingContent}\n`;
  }

  prompt += `\nGénère cette section en respectant strictement le format JSON demandé et les consignes de style académique.`;

  return prompt;
}
