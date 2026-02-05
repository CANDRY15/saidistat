import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
import saidistatLogoNew from "@/assets/saidistat-logo-new.png";

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

      {/* Animated floating blobs */}
      <div className="hidden sm:block absolute top-20 right-20 w-48 md:w-72 h-48 md:h-72 bg-primary/30 rounded-full blur-3xl animate-float" />
      <div className="hidden sm:block absolute bottom-20 left-20 w-64 md:w-96 h-64 md:h-96 bg-secondary/20 rounded-full blur-3xl animate-float-delayed" />
      <div className="hidden md:block absolute top-1/2 left-1/3 w-40 h-40 bg-accent/15 rounded-full blur-2xl animate-float" style={{ animationDelay: '4s' }} />

      {/* Content */}
      <div className="container relative z-20 mx-auto px-4 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 mb-4 sm:mb-6 animate-fade-in">
            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-primary animate-shimmer" />
            <span className="text-xs sm:text-sm font-medium text-primary">
              Plateforme d'analyse biostatistique
            </span>
          </div>

          {/* Logo with scale animation */}
          <div className="flex justify-center mb-4 sm:mb-6 animate-scale-in">
            <img 
              src={saidistatLogoNew} 
              alt="SaidiStat" 
              className="h-24 sm:h-32 md:h-40 w-auto object-contain drop-shadow-xl hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Subtitle */}
          <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-6 sm:mb-8 leading-relaxed px-2 animate-fade-in-up animation-delay-200">
            Votre assistant intelligent pour l'analyse statistique médicale et la rédaction scientifique
          </p>

          {/* Description */}
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-8 sm:mb-12 max-w-2xl mx-auto px-2 animate-fade-in-up animation-delay-300">
            Analysez vos données, générez automatiquement vos rapports scientifiques et maîtrisez les biostatistiques grâce à une plateforme intuitive conçue pour les chercheurs et professionnels de santé.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 animate-fade-in-up animation-delay-400">
            <Link to="/auth" className="w-full sm:w-auto">
              <Button variant="hero" size="lg" className="group w-full sm:w-auto hover:shadow-lg hover:shadow-primary/25 transition-all duration-300">
                Commencer gratuitement
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/features" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto hover:shadow-md transition-all duration-300">
                Découvrir les fonctionnalités
              </Button>
            </Link>
          </div>

          {/* Stats with staggered count-up animation */}
          <div className="grid grid-cols-3 gap-3 sm:gap-8 mt-12 sm:mt-20">
            <div className="p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 animate-count-up animation-delay-500">
              <div className="text-2xl sm:text-4xl font-bold text-primary mb-1 sm:mb-2">10+</div>
              <div className="text-xs sm:text-base text-muted-foreground">Tests statistiques</div>
            </div>
            <div className="p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-secondary/40 hover:shadow-lg hover:shadow-secondary/10 transition-all duration-300 animate-count-up animation-delay-600">
              <div className="text-2xl sm:text-4xl font-bold text-secondary mb-1 sm:mb-2">100%</div>
              <div className="text-xs sm:text-base text-muted-foreground">Automatisé</div>
            </div>
            <div className="p-3 sm:p-6 rounded-xl sm:rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 animate-count-up animation-delay-700">
              <div className="text-2xl sm:text-4xl font-bold text-accent mb-1 sm:mb-2">∞</div>
              <div className="text-xs sm:text-base text-muted-foreground">Analyses possibles</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
