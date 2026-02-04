import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import MobileBottomNav from "./components/MobileBottomNav";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DataAnalysis from "./pages/DataAnalysis";
import StatisticalTests from "./pages/StatisticalTests";
import Writing from "./pages/Writing";
import ThesisWriting from "./pages/ThesisWriting";
import Training from "./pages/Training";
import TrainingModule from "./pages/TrainingModule";
import Exercises from "./pages/Exercises";
import DescriptiveStats from "./pages/exercises/DescriptiveStats";
import ZScore from "./pages/exercises/ZScore";
import SampleSize from "./pages/exercises/SampleSize";
import TwoMeansComparison from "./pages/exercises/TwoMeansComparison";
import Percentiles from "./pages/exercises/Percentiles";
import Probability from "./pages/exercises/Probability";
import VariableTypes from "./pages/exercises/VariableTypes";
import NotFound from "./pages/NotFound";
import Features from "./pages/Features";
import Documentation from "./pages/Documentation";
import Tutorials from "./pages/Tutorials";
import Support from "./pages/Support";
import About from "./pages/About";

// Test pages
import Chi2Test from "./pages/tests/Chi2Test";
import TTest from "./pages/tests/TTest";
import TestAssistant from "./pages/tests/TestAssistant";

// Epidemiology pages
import EpidemiologyExercises from "./pages/EpidemiologyExercises";
import DiagnosticTest from "./pages/epidemiology/DiagnosticTest";
import CohortStudy from "./pages/epidemiology/CohortStudy";
import CaseControl from "./pages/epidemiology/CaseControl";
import FrequencyMeasures from "./pages/epidemiology/FrequencyMeasures";
import MortalityRates from "./pages/epidemiology/MortalityRates";
import StudyIdentifier from "./pages/epidemiology/StudyIdentifier";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/data-analysis" element={<DataAnalysis />} />
            <Route path="/statistical-tests" element={<StatisticalTests />} />
            <Route path="/tests/chi2" element={<Chi2Test />} />
            <Route path="/tests/ttest" element={<TTest />} />
            <Route path="/tests/assistant" element={<TestAssistant />} />
            <Route path="/writing" element={<Writing />} />
            <Route path="/thesis-writing" element={<ThesisWriting />} />
            <Route path="/training" element={<Training />} />
            <Route path="/training/:moduleId" element={<TrainingModule />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/exercises/descriptive-stats" element={<DescriptiveStats />} />
            <Route path="/exercises/z-score" element={<ZScore />} />
            <Route path="/exercises/sample-size" element={<SampleSize />} />
            <Route path="/exercises/two-means" element={<TwoMeansComparison />} />
            <Route path="/exercises/percentiles" element={<Percentiles />} />
            <Route path="/exercises/probability" element={<Probability />} />
            <Route path="/exercises/variable-types" element={<VariableTypes />} />
            <Route path="/epidemiology" element={<EpidemiologyExercises />} />
            <Route path="/epidemiology/diagnostic-test" element={<DiagnosticTest />} />
            <Route path="/epidemiology/cohort-study" element={<CohortStudy />} />
            <Route path="/epidemiology/case-control" element={<CaseControl />} />
            <Route path="/epidemiology/frequency-measures" element={<FrequencyMeasures />} />
            <Route path="/epidemiology/mortality-rates" element={<MortalityRates />} />
            <Route path="/epidemiology/study-identifier" element={<StudyIdentifier />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <MobileBottomNav />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
