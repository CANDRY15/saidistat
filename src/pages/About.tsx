import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Target, 
  Users, 
  Award,
  Heart,
  ArrowRight,
  GraduationCap,
  Stethoscope,
  FlaskConical
} from "lucide-react";
import saidistatLogo from "@/assets/saidistat-logo-new.png";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
              <img 
                src={saidistatLogo} 
                alt="SaidiStat" 
                className="h-24 w-auto"
              />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              À propos de SaidiStat
            </h1>
            <p className="text-lg text-muted-foreground">
              Une plateforme conçue par des professionnels de santé, pour des professionnels de santé.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="container mx-auto px-4 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <Target className="w-8 h-8 text-primary" />
                Notre mission
              </h2>
              <p className="text-muted-foreground mb-4">
                SaidiStat a été créé avec une mission claire : rendre les biostatistiques accessibles à tous les professionnels de santé et chercheurs, quel que soit leur niveau en statistiques.
              </p>
              <p className="text-muted-foreground mb-4">
                Nous croyons que les analyses statistiques ne devraient pas être un obstacle à la recherche médicale. C'est pourquoi nous avons développé une plateforme intuitive qui guide les utilisateurs à chaque étape de leur analyse.
              </p>
              <p className="text-muted-foreground">
                Notre intelligence artificielle vous accompagne dans le choix des tests appropriés, l'interprétation des résultats et la rédaction de vos publications scientifiques.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="text-center p-6">
                <CardContent className="p-0">
                  <div className="text-4xl font-bold text-primary mb-2">10+</div>
                  <p className="text-sm text-muted-foreground">Tests statistiques</p>
                </CardContent>
              </Card>
              <Card className="text-center p-6">
                <CardContent className="p-0">
                  <div className="text-4xl font-bold text-secondary mb-2">1000+</div>
                  <p className="text-sm text-muted-foreground">Analyses réalisées</p>
                </CardContent>
              </Card>
              <Card className="text-center p-6">
                <CardContent className="p-0">
                  <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                  <p className="text-sm text-muted-foreground">Disponibilité</p>
                </CardContent>
              </Card>
              <Card className="text-center p-6">
                <CardContent className="p-0">
                  <div className="text-4xl font-bold text-secondary mb-2">100%</div>
                  <p className="text-sm text-muted-foreground">Gratuit</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Who is it for Section */}
        <section className="container mx-auto px-4 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Pour qui ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Étudiants</h3>
                <p className="text-muted-foreground text-sm">
                  Étudiants en médecine, pharmacie, sciences de la santé préparant leur thèse ou mémoire.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Praticiens</h3>
                <p className="text-muted-foreground text-sm">
                  Médecins, infirmiers et professionnels de santé souhaitant analyser leurs données cliniques.
                </p>
              </CardContent>
            </Card>
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FlaskConical className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Chercheurs</h3>
                <p className="text-muted-foreground text-sm">
                  Chercheurs en santé publique et épidémiologie réalisant des études observationnelles.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Values Section */}
        <section className="container mx-auto px-4 mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center flex items-center justify-center gap-3">
            <Heart className="w-8 h-8 text-destructive" />
            Nos valeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Excellence</h3>
              <p className="text-sm text-muted-foreground">
                Des calculs rigoureux et conformes aux standards internationaux.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Accessibilité</h3>
              <p className="text-sm text-muted-foreground">
                Une interface simple et intuitive pour tous les niveaux.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Accompagnement</h3>
              <p className="text-sm text-muted-foreground">
                Un support réactif et des tutoriels pour vous guider.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Innovation</h3>
              <p className="text-sm text-muted-foreground">
                Des outils IA de pointe pour automatiser vos analyses.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4">
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Rejoignez SaidiStat aujourd'hui
            </h2>
            <p className="text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
              Commencez à analyser vos données et à rédiger vos publications scientifiques dès maintenant.
            </p>
            <Link to="/auth">
              <Button variant="secondary" size="lg" className="bg-background text-foreground hover:bg-background/90">
                Créer mon compte gratuit
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

export default About;
