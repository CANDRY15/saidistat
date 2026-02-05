import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { 
  BookOpen, 
  FileText, 
  Video, 
  Code,
  ArrowRight,
  ExternalLink,
  Search,
  X
} from "lucide-react";

const documentationSections = [
  {
    title: "Guide de démarrage",
    description: "Apprenez les bases de SaidiStat et commencez à analyser vos données en quelques minutes.",
    icon: BookOpen,
    articles: [
      "Créer un compte",
      "Importer vos données",
      "Réaliser votre première analyse",
      "Exporter vos résultats"
    ]
  },
  {
    title: "Analyses statistiques",
    description: "Documentation complète sur tous les tests statistiques disponibles.",
    icon: FileText,
    articles: [
      "Statistiques descriptives",
      "Test du Chi² (χ²)",
      "Test t de Student",
      "ANOVA et comparaisons multiples"
    ]
  },
  {
    title: "Épidémiologie",
    description: "Guides détaillés pour les calculs épidémiologiques.",
    icon: Code,
    articles: [
      "Mesures de fréquence",
      "Études de cohorte",
      "Études cas-témoins",
      "Tests diagnostiques"
    ]
  },
  {
    title: "Rédaction scientifique",
    description: "Maîtrisez l'assistant de rédaction et les outils d'export.",
    icon: Video,
    articles: [
      "Utiliser l'assistant IA",
      "Gérer les références bibliographiques",
      "Insérer tableaux et figures",
      "Exporter en Word/PDF"
    ]
  }
];

const Documentation = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return documentationSections;
    const query = searchQuery.toLowerCase();
    return documentationSections
      .map((section) => {
        const titleMatch = section.title.toLowerCase().includes(query);
        const descMatch = section.description.toLowerCase().includes(query);
        const matchingArticles = section.articles.filter((a) =>
          a.toLowerCase().includes(query)
        );
        if (titleMatch || descMatch || matchingArticles.length > 0) {
          return {
            ...section,
            articles: titleMatch || descMatch ? section.articles : matchingArticles,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof documentationSections;
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Documentation
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Tout ce dont vous avez besoin pour maîtriser SaidiStat et réaliser vos analyses biostatistiques.
            </p>
            {/* Search Bar */}
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans la documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-10 h-12 text-base rounded-full border-2 focus-visible:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="container mx-auto px-4 mb-12">
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Guide rapide
            </Button>
            <Button variant="outline" className="gap-2">
              <Video className="w-4 h-4" />
              Tutoriels vidéo
            </Button>
            <Button variant="outline" className="gap-2">
              <FileText className="w-4 h-4" />
              FAQ
            </Button>
          </div>
        </section>

        {/* Documentation Grid */}
        <section className="container mx-auto px-4">
          {filteredSections.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucun résultat trouvé</h3>
              <p className="text-muted-foreground">
                Essayez avec d'autres termes de recherche.
              </p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSections.map((section, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <section.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.articles.map((article, i) => (
                      <li key={i}>
                        <button className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">
                          <span className="text-sm">{article}</span>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Help Section */}
        <section className="container mx-auto px-4 mt-16">
          <Card className="bg-muted/30">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Besoin d'aide supplémentaire ?</h2>
              <p className="text-muted-foreground mb-6">
                Notre équipe de support est disponible pour répondre à toutes vos questions.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/support">
                  <Button className="gap-2">
                    Contacter le support
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/tutorials">
                  <Button variant="outline" className="gap-2">
                    Voir les tutoriels
                    <Video className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Documentation;
