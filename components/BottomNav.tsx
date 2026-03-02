
import React from 'react';
import { View } from '../types';
import { DashboardIcon, PracticeIcon, RankingIcon, StudyIcon } from './icons';

interface BottomNavProps {
  currentView: View;
  setView: (view: View) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-0.5 transition-colors w-20 pt-1 ${isActive ? 'text-primary' : 'text-slate-400'}`}
  >
    {icon}
    <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
      {label}
    </span>
  </button>
);

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex items-start justify-around pt-2 pb-safe z-50" style={{ minHeight: '64px' }}>
      <NavItem
        label="Painel"
        icon={<DashboardIcon />}
        isActive={currentView === 'DASHBOARD'}
        onClick={() => setView('DASHBOARD')}
      />
      <NavItem
        label="Estudar"
        icon={<StudyIcon />}
        isActive={currentView === 'STUDY_CENTER'}
        onClick={() => setView('STUDY_CENTER')}
      />
      <NavItem
        label="Jornada"
        icon={<span className="text-xl">🗺️</span>}
        isActive={currentView === 'JOURNEY_MAP' || currentView === 'JOURNEY_PHASE'}
        onClick={() => setView('JOURNEY_MAP')}
      />
      <NavItem
        label="Praticar"
        icon={<PracticeIcon />}
        isActive={currentView === 'PRACTICE'}
        onClick={() => setView('PRACTICE')}
      />
      <NavItem
        label="Ranking"
        icon={<RankingIcon />}
        isActive={currentView === 'RANKING'}
        onClick={() => setView('RANKING')}
      />
    </nav>
  );
};

export default BottomNav;
