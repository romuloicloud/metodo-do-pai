import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import QuestionArena from './components/QuestionArena';
import Ranking from './components/Ranking';
import StudyCenter from './components/StudyCenter';
import PastExamArena from './components/PastExamArena';
import BottomNav from './components/BottomNav';
import Login from './components/Login';
import DiagnosticWelcome from './components/DiagnosticWelcome';
import DiagnosticArena from './components/DiagnosticArena';
import DiagnosticResult from './components/DiagnosticResult';
import JourneyMap from './components/JourneyMap';
import JourneyPhaseView from './components/JourneyPhase';
import { View, Exam, DiagnosticAnswer, DiagnosticResult as DiagResultType, JourneyPhase } from './types';
import { supabase } from './services/supabaseClient';
import { hasCompletedDiagnostic, analyzeDiagnosticResults, saveDiagnosticResult } from './services/diagnosticService';
import { initializeJourney } from './services/journeyService';
import { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activePhase, setActivePhase] = useState<JourneyPhase | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagResultType | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingDiagnostic, setCheckingDiagnostic] = useState(false);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Verificar diagnóstico após login
  useEffect(() => {
    if (session?.user && !checkingDiagnostic) {
      setCheckingDiagnostic(true);
      hasCompletedDiagnostic(session.user.id).then(completed => {
        if (!completed) {
          setCurrentView('DIAGNOSTIC_WELCOME');
        }
        setCheckingDiagnostic(false);
      });
    }
  }, [session]);

  if (loading) {
    return <div className="bg-background-dark min-h-screen"></div>;
  }

  if (!session) {
    return <Login />;
  }

  const handleSelectExam = (exam: Exam) => {
    setActiveExam(exam);
    setCurrentView('PAST_EXAM_PRACTICE');
  };

  const handleFinishExam = () => {
    setActiveExam(null);
    setCurrentView('STUDY_CENTER');
  };

  // Diagnóstico: iniciar
  const handleStartDiagnostic = () => {
    setCurrentView('DIAGNOSTIC_ARENA');
  };

  // Diagnóstico: completar
  const handleDiagnosticComplete = async (answers: DiagnosticAnswer[]) => {
    const result = analyzeDiagnosticResults(answers);
    setDiagnosticResult(result);

    // Salvar no banco
    if (session?.user) {
      await saveDiagnosticResult(session.user.id, result);
      // Inicializar a jornada com os tópicos fracos
      await initializeJourney(session.user.id, result.weakTopics);
    }

    setCurrentView('DIAGNOSTIC_RESULT');
  };

  // Jornada: começar após diagnóstico
  const handleStartJourney = () => {
    setCurrentView('JOURNEY_MAP');
  };

  // Jornada: selecionar fase
  const handleSelectPhase = (phase: JourneyPhase) => {
    setActivePhase(phase);
    setCurrentView('JOURNEY_PHASE');
  };

  // Jornada: voltar para o mapa
  const handleBackToMap = () => {
    setActivePhase(null);
    setCurrentView('JOURNEY_MAP');
  };

  // Jornada: fase completa
  const handlePhaseComplete = () => {
    setActivePhase(null);
    setCurrentView('JOURNEY_MAP');
  };

  // Esconder BottomNav durante diagnóstico e fases da jornada
  const hideBottomNav = ['DIAGNOSTIC_WELCOME', 'DIAGNOSTIC_ARENA', 'DIAGNOSTIC_RESULT', 'JOURNEY_PHASE', 'PAST_EXAM_PRACTICE'].includes(currentView);

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard setView={setCurrentView} />;
      case 'PRACTICE':
        return <QuestionArena />;
      case 'RANKING':
        return <Ranking />;
      case 'STUDY_CENTER':
        return <StudyCenter onSelectExam={handleSelectExam} setView={setCurrentView} />;
      case 'PAST_EXAM_PRACTICE':
        return activeExam ? <PastExamArena exam={activeExam} onFinishExam={handleFinishExam} /> : <StudyCenter onSelectExam={handleSelectExam} setView={setCurrentView} />;
      case 'DIAGNOSTIC_WELCOME':
        return <DiagnosticWelcome onStart={handleStartDiagnostic} />;
      case 'DIAGNOSTIC_ARENA':
        return <DiagnosticArena onComplete={handleDiagnosticComplete} />;
      case 'DIAGNOSTIC_RESULT':
        return diagnosticResult ? <DiagnosticResult result={diagnosticResult} onStartJourney={handleStartJourney} /> : <Dashboard setView={setCurrentView} />;
      case 'JOURNEY_MAP':
        return <JourneyMap onSelectPhase={handleSelectPhase} />;
      case 'JOURNEY_PHASE':
        return activePhase ? <JourneyPhaseView phase={activePhase} onBack={handleBackToMap} onPhaseComplete={handlePhaseComplete} /> : <JourneyMap onSelectPhase={handleSelectPhase} />;
      default:
        return <Dashboard setView={setCurrentView} />;
    }
  };

  return (
    <div className="w-full h-screen bg-background-light dark:bg-background-dark font-display">
      <div className="max-w-screen-xl mx-auto flex flex-col relative h-full">
        <main className="flex-1 overflow-y-auto">
          {renderView()}
        </main>
        {!hideBottomNav && <BottomNav currentView={currentView} setView={setCurrentView} />}
      </div>
    </div>
  );
};

export default App;
