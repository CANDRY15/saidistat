import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-background z-10" />
        <img 
          src={heroImage} 
          alt="Hero background" 
          className="w-full h-full object-cover opacity-40"
        />
      </div>

      {/* Animated gradient blobs */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-primary/30 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Content */}
      <div className="container relative z-20 mx-auto px-4 py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Plateforme d'analyse biostatistique
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-fade-in-up">
            BioStasmarT
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed animate-fade-in-up animation-delay-200">
            Votre assistant intelligent pour l'analyse statistique médicale et la rédaction scientifique
          </p>

          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto animate-fade-in-up animation-delay-300">
            Analysez vos données, générez automatiquement vos rapports scientifiques et maîtrisez les biostatistiques grâce à une plateforme intuitive conçue pour les chercheurs et professionnels de santé.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-400">
            <Link to="/auth">
              <Button variant="hero" size="lg" className="group">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/features">
              <Button variant="outline" size="lg">
                Découvrir les fonctionnalités
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20 animate-fade-in-up animation-delay-500">
            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <div className="text-4xl font-bold text-primary mb-2">10+</div>
              <div className="text-muted-foreground">Tests statistiques</div>
            </div>
            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <div className="text-4xl font-bold text-secondary mb-2">100%</div>
              <div className="text-muted-foreground">Automatisé</div>
            </div>
            <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border">
              <div className="text-4xl font-bold text-accent mb-2">∞</div>
              <div className="text-muted-foreground">Analyses possibles</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
