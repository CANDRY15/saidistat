import { Card, CardContent } from "@/components/ui/card";
import { Database, FileText, GraduationCap, Calculator, ChartBar, FileCheck } from "lucide-react";
import analysisIcon from "@/assets/feature-analysis.png";
import writingIcon from "@/assets/feature-writing.png";
import learningIcon from "@/assets/feature-learning.png";

const features = [
  {
    icon: Database,
    image: analysisIcon,
    title: "Analyse de données",
    description: "Importez vos datasets (CSV, Excel, SPSS) et obtenez des analyses statistiques complètes automatiquement.",
    gradient: "from-primary to-primary-glow"
  },
  {
    icon: Calculator,
    image: analysisIcon,
    title: "Tests statistiques",
    description: "Plus de 10 tests statistiques : Khi², t de Student, Mann-Whitney, corrélations, régressions et bien plus.",
    gradient: "from-secondary to-secondary"
  },
  {
    icon: FileText,
    image: writingIcon,
    title: "Rédaction automatique",
    description: "Générez automatiquement les sections de votre article scientifique (Introduction, Méthodes, Résultats, Discussion).",
    gradient: "from-primary to-secondary"
  },
  {
    icon: ChartBar,
    image: analysisIcon,
    title: "Visualisations",
    description: "Créez des graphiques professionnels : histogrammes, boxplots, heatmaps et diagrammes personnalisables.",
    gradient: "from-secondary to-primary"
  },
  {
    icon: GraduationCap,
    image: learningIcon,
    title: "Formation interactive",
    description: "Exercices corrigés, explications détaillées des formules et progression suivie pour maîtriser les biostatistiques.",
    gradient: "from-accent to-primary"
  },
  {
    icon: FileCheck,
    image: writingIcon,
    title: "Export multi-format",
    description: "Exportez vos rapports en PDF, Word ou LaTeX avec formatage académique professionnel.",
    gradient: "from-primary to-accent"
  }
];

const Features = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Fonctionnalités Principales
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour mener à bien vos projets de recherche médicale
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-xl transition-all duration-300 border-border hover:border-primary/50 overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="relative mb-4">
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-lg blur-xl group-hover:opacity-20 transition-opacity`} />
                    <div className={`relative w-16 h-16 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-8 h-8 text-primary-foreground" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
