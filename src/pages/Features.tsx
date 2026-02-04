import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  BarChart3, 
  FileText, 
  GraduationCap, 
  Activity, 
  Calculator, 
  Brain,
  ArrowRight,
  CheckCircle2
} from "lucide-react";

const features = [
  {
    title: "Analyse de données",
    description: "Importez vos fichiers Excel/CSV et obtenez des analyses statistiques complètes automatiquement.",
    icon: BarChart3,
    link: "/data-analysis",
    highlights: ["Import Excel/CSV", "Statistiques descriptives", "Visualisations automatiques", "Export des résultats"]
  },
  {
    title: "Tests statistiques",
    description: "Réalisez des tests statistiques (Chi², t-test, corrélation) avec interprétation automatique.",
    icon: Calculator,
    link: "/statistical-tests",
    highlights: ["Test du Chi²", "Test t de Student", "ANOVA", "Corrélation de Pearson"]
  },
  {
    title: "Rédaction scientifique",
    description: "Assistant IA pour la rédaction de thèses et articles scientifiques avec gestion des références.",
    icon: FileText,
    link: "/thesis-writing",
    highlights: ["Génération automatique", "Gestion des références", "Export Word/PDF", "Formatage académique"]
  },
  {
    title: "Exercices pratiques",
    description: "Entraînez-vous sur des exercices de biostatistique avec corrections détaillées.",
    icon: GraduationCap,
    link: "/exercises",
    highlights: ["Statistiques descriptives", "Calcul d'échantillon", "Z-score", "Probabilités"]
  },
  {
    title: "Épidémiologie",
    description: "Calculez les mesures épidémiologiques et analysez vos études observationnelles.",
    icon: Activity,
    link: "/epidemiology",
    highlights: ["Études de cohorte", "Cas-témoins", "Tests diagnostiques", "Mesures de fréquence"]
  },
  {
    title: "Assistant IA",
    description: "Un assistant intelligent qui vous guide dans vos analyses et répond à vos questions.",
    icon: Brain,
    link: "/data-analysis",
    highlights: ["Choix du test approprié", "Interprétation des résultats", "Conseils méthodologiques", "Support 24/7"]
  }
];

const Features = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Fonctionnalités
            </h1>
            <p className="text-lg text-muted-foreground">
              Découvrez tous les outils que SaidiStat met à votre disposition pour simplifier vos analyses biostatistiques et votre rédaction scientifique.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/50"
              >
                <CardHeader>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-secondary" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                  <Link to={feature.link}>
                    <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Découvrir
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 mt-16">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Prêt à commencer ?
            </h2>
            <p className="text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
              Créez votre compte gratuitement et accédez à toutes les fonctionnalités de SaidiStat.
            </p>
            <Link to="/auth">
              <Button variant="secondary" size="lg" className="bg-background text-foreground hover:bg-background/90">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Features;
