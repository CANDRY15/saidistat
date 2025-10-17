import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, ArrowLeft, BookOpen, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Writing = () => {
  const [selectedSection, setSelectedSection] = useState<string>("introduction");

  const sections = [
    {
      id: "introduction",
      name: "Introduction",
      description: "Contexte, problématique et objectifs",
      icon: "📝",
    },
    {
      id: "methods",
      name: "Méthodes",
      description: "Population, protocole et analyses",
      icon: "🔬",
    },
    {
      id: "results",
      name: "Résultats",
      description: "Présentation des données et analyses",
      icon: "📊",
    },
    {
      id: "discussion",
      name: "Discussion",
      description: "Interprétation et limites",
      icon: "💭",
    },
    {
      id: "references",
      name: "Références",
      description: "Bibliographie Vancouver/APA",
      icon: "📚",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BioStasmarT
              </span>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Rédaction scientifique
          </h1>
          <p className="text-xl text-muted-foreground">
            Générez automatiquement vos sections de rapport scientifique
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sections */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sections disponibles</CardTitle>
                <CardDescription>
                  Sélectionnez une section pour générer le contenu automatiquement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sections.map((section) => (
                    <Card
                      key={section.id}
                      className={`cursor-pointer transition-all duration-300 ${
                        selectedSection === section.id
                          ? "border-primary shadow-lg"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedSection(section.id)}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{section.icon}</span>
                          <CardTitle className="text-lg">{section.name}</CardTitle>
                        </div>
                        <CardDescription>{section.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Personnalisation</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="style" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="style">Style</TabsTrigger>
                    <TabsTrigger value="length">Longueur</TabsTrigger>
                    <TabsTrigger value="format">Format</TabsTrigger>
                  </TabsList>
                  <TabsContent value="style" className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline">Académique</Button>
                      <Button variant="outline">Professionnel</Button>
                      <Button variant="outline">Vulgarisation</Button>
                      <Button variant="outline">Synthétique</Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="length" className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <Button variant="outline">Court</Button>
                      <Button variant="outline">Moyen</Button>
                      <Button variant="outline">Détaillé</Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="format" className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Word
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        PDF
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Markdown
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        LaTeX
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <Button size="lg" variant="hero">
                <FileText className="w-5 h-5 mr-2" />
                Générer la section
              </Button>
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Comment ça marche ?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                      1
                    </div>
                    <p>Sélectionnez la section à rédiger</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                      2
                    </div>
                    <p>Choisissez le style et la longueur</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                      3
                    </div>
                    <p>L'IA génère le contenu adapté</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
                      4
                    </div>
                    <p>Exportez dans le format souhaité</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fonctionnalités</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span>Intégration des résultats</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span>Citations automatiques</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-accent"></span>
                  <span>Formats multiples</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span>Style personnalisable</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Writing;
