import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Mail, 
  MessageCircle, 
  FileQuestion,
  Clock,
  CheckCircle2,
  Send,
  Loader2
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const faqs = [
  {
    question: "Comment importer mes données Excel ?",
    answer: "Allez dans la section 'Analyse de données', cliquez sur 'Importer un fichier' et sélectionnez votre fichier Excel (.xlsx) ou CSV. Le système détectera automatiquement les variables."
  },
  {
    question: "Quel test statistique dois-je utiliser ?",
    answer: "Utilisez notre Assistant de Test qui vous guidera dans le choix du test approprié en fonction de vos données et de votre question de recherche."
  },
  {
    question: "Comment exporter mes résultats en Word ?",
    answer: "Dans la section Rédaction scientifique, utilisez le bouton 'Exporter' pour télécharger votre document au format Word (.docx) avec toutes les mises en forme."
  },
  {
    question: "Les données sont-elles sécurisées ?",
    answer: "Oui, toutes vos données sont chiffrées et stockées de manière sécurisée. Nous ne partageons jamais vos données avec des tiers."
  }
];

const Support = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from("support_messages").insert({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        user_id: user?.id ?? null,
      });

      if (error) throw error;

      toast({
        title: "Message envoyé ✅",
        description: "Nous vous répondrons dans les plus brefs délais.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section className="container mx-auto px-4 mb-16">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Support
            </h1>
            <p className="text-lg text-muted-foreground">
              Notre équipe est là pour vous aider. Consultez notre FAQ ou contactez-nous directement.
            </p>
          </div>
        </section>

        {/* Support Stats */}
        <section className="container mx-auto px-4 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-2xl font-bold">{"< 24h"}</p>
                <p className="text-sm text-muted-foreground">Temps de réponse moyen</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <CheckCircle2 className="w-8 h-8 text-secondary mx-auto mb-3" />
                <p className="text-2xl font-bold">98%</p>
                <p className="text-sm text-muted-foreground">Taux de satisfaction</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
                <p className="text-2xl font-bold">24/7</p>
                <p className="text-sm text-muted-foreground">Disponibilité</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* FAQ Section */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <FileQuestion className="w-6 h-6 text-primary" />
                Questions fréquentes
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{faq.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Mail className="w-6 h-6 text-primary" />
                Nous contacter
              </h2>
              <Card>
                <CardHeader>
                  <CardTitle>Envoyez-nous un message</CardTitle>
                  <CardDescription>
                    Remplissez le formulaire ci-dessous et nous vous répondrons rapidement.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nom</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Sujet</Label>
                      <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e) => setFormData({...formData, subject: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2">
                      <Send className="w-4 h-4" />
                      Envoyer le message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Direct Contact */}
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Email direct</p>
                      <a href="mailto:contact@saidistat.com" className="text-primary hover:underline">
                        contact@saidistat.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Support;
