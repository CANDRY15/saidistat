import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Clock, 
  BarChart3,
  FileText,
  Activity,
  Calculator
} from "lucide-react";

const tutorials = [
  {
    title: "Introduction à SaidiStat",
    description: "Découvrez l'interface et les fonctionnalités principales de la plateforme.",
    duration: "5 min",
    level: "Débutant",
    category: "Général",
    icon: Play
  },
  {
    title: "Importer et analyser des données",
    description: "Apprenez à importer vos fichiers Excel/CSV et à générer des statistiques descriptives.",
    duration: "10 min",
    level: "Débutant",
    category: "Analyse",
    icon: BarChart3
  },
  {
    title: "Réaliser un test du Chi²",
    description: "Guide pas à pas pour effectuer et interpréter un test du Chi² sur vos données.",
    duration: "8 min",
    level: "Intermédiaire",
    category: "Tests",
    icon: Calculator
  },
  {
    title: "Calculer le Risque Relatif",
    description: "Maîtrisez les calculs épidémiologiques pour les études de cohorte.",
    duration: "12 min",
    level: "Intermédiaire",
    category: "Épidémiologie",
    icon: Activity
  },
  {
    title: "Rédiger une introduction avec l'IA",
    description: "Utilisez l'assistant IA pour générer des sections de thèse scientifique.",
    duration: "15 min",
    level: "Avancé",
    category: "Rédaction",
    icon: FileText
  },
  {
    title: "Gérer les références bibliographiques",
    description: "Importez des références depuis PubMed et DOI, et créez votre bibliographie.",
    duration: "10 min",
    level: "Intermédiaire",
    category: "Rédaction",
    icon: FileText
  }
];

const getLevelColor = (level: string) => {
  switch (level) {
    case "Débutant":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100";
    case "Intermédiaire":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100";
    case "Avancé":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const Tutorials = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Tutoriels
            </h1>
            <p className="text-lg text-muted-foreground">
              Apprenez à utiliser SaidiStat avec nos tutoriels vidéo et guides interactifs.
            </p>
          </div>
        </section>

        {/* Filter Buttons */}
        <section className="container mx-auto px-4 mb-8">
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="default" size="sm">Tous</Button>
            <Button variant="outline" size="sm">Général</Button>
            <Button variant="outline" size="sm">Analyse</Button>
            <Button variant="outline" size="sm">Tests</Button>
            <Button variant="outline" size="sm">Épidémiologie</Button>
            <Button variant="outline" size="sm">Rédaction</Button>
          </div>
        </section>

        {/* Tutorials Grid */}
        <section className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tutorials.map((tutorial, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:border-primary/50"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <tutorial.icon className="w-6 h-6" />
                    </div>
                    <Badge className={getLevelColor(tutorial.level)}>
                      {tutorial.level}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-4">{tutorial.title}</CardTitle>
                  <CardDescription>{tutorial.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {tutorial.duration}
                    </div>
                    <Badge variant="outline">{tutorial.category}</Badge>
                  </div>
                  <Button className="w-full mt-4 gap-2">
                    <Play className="w-4 h-4" />
                    Regarder
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Coming Soon Section */}
        <section className="container mx-auto px-4 mt-16">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Plus de tutoriels à venir</h2>
              <p className="text-muted-foreground mb-6">
                Nous ajoutons régulièrement de nouveaux tutoriels. Inscrivez-vous pour être notifié des nouvelles publications.
              </p>
              <Button variant="outline">
                S'inscrire aux notifications
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Tutorials;
