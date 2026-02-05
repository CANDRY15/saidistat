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
            <p className="text-lg text-muted-foreground">
              Tout ce dont vous avez besoin pour maîtriser SaidiStat et réaliser vos analyses biostatistiques.
            </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documentationSections.map((section, index) => (
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
