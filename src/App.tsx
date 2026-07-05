import React, { useState, useEffect, useRef } from 'react';
import { Player, Round, Session, GameSettings, ContractType } from './types';
import { DEFAULT_SETTINGS } from './components/SettingsPanel';
import QuickInput from './components/QuickInput';
import ScoreCalculator from './components/ScoreCalculator';
import SettingsPanel from './components/SettingsPanel';
import HistoryPanel from './components/HistoryPanel';
import RulesPanel from './components/RulesPanel';
import { LOCALES, getTexts, LanguageId } from './locales';
import { motion, AnimatePresence } from 'motion/react';
import { THEMES, applyTheme } from './themes';
import { 
  Plus, 
  Settings, 
  History, 
  RotateCcw, 
  ChevronRight, 
  Trophy, 
  Frown, 
  Trash2, 
  Edit2, 
  X,
  Share2,
  Maximize2,
  Calendar,
  AlertCircle,
  Info,
  Square,
  Play,
  ChevronUp,
  ChevronDown,
  ArrowUpDown
} from 'lucide-react';

export default function App() {
  // 1. Core State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [themeId, setThemeId] = useState<string>('standard');
  const [langId, setLangId] = useState<LanguageId>(() => {
    const stored = localStorage.getItem('wiezen_lang');
    return (stored as LanguageId) || 'nl';
  });

  const TEXTS = getTexts(langId);

  useEffect(() => {
    document.title = TEXTS.appTitle;
  }, [TEXTS.appTitle]);

  // UI State
  const [isAddRoundOpen, setIsAddRoundOpen] = useState(false);
  const [activeAddTab, setActiveAddTab] = useState<'quick' | 'calc'>('calc');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  
  // Custom Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmStyle: 'danger' | 'accent';
    onConfirm: () => void;
  } | null>(null);

  // Score Entry Temporary State
  const [tempScores, setTempScores] = useState<Record<string, number>>({});
  const [isTempScoresValid, setIsTempScoresValid] = useState(true);
  const [tempContractDetails, setTempContractDetails] = useState<any>(null);

  // Scroll ref for the scoreboard container
  const scoreHistoryContainerRef = useRef<HTMLDivElement>(null);

  // 2. Initial State Loading
  useEffect(() => {
    // Load Settings
    const storedSettings = localStorage.getItem('wiezen_settings');
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        
        // Migration from old Dutch keys to new English keys
        const mapped = { ...parsed };
        if (parsed.vraagEnAntwoordBase !== undefined) mapped.askAndAnswerBase = parsed.vraagEnAntwoordBase;
        if (parsed.vraagEnAntwoordOverslag !== undefined) mapped.askAndAnswerOvertrick = parsed.vraagEnAntwoordOverslag;
        if (parsed.vraagEnAntwoordAlleenBase !== undefined) mapped.askAndAnswerAloneBase = parsed.vraagEnAntwoordAlleenBase;
        if (parsed.vraagEnAntwoordAlleenOverslag !== undefined) mapped.askAndAnswerAloneOvertrick = parsed.vraagEnAntwoordAlleenOverslag;
        if (parsed.troelOverslag !== undefined) mapped.troelOvertrick = parsed.troelOverslag;
        if (parsed.troelAlleenBase !== undefined) mapped.troelAloneBase = parsed.troelAlleenBase;
        if (parsed.troelAlleenOverslag !== undefined) mapped.troelAloneOvertrick = parsed.troelAlleenOverslag;
        if (parsed.miseriePoints !== undefined) mapped.miseryPoints = parsed.miseriePoints;
        if (parsed.openMiseriePoints !== undefined) mapped.openMiseryPoints = parsed.openMiseriePoints;

        setSettings({ ...DEFAULT_SETTINGS, ...mapped });
      } catch (e) {
        console.error('Error loading settings', e);
      }
    }

    // Load Theme
    const storedTheme = localStorage.getItem('wiezen_theme');
    if (storedTheme) {
      setThemeId(storedTheme);
    } else {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setThemeId('dark');
      }
    }

    // Load Sessions
    const storedSessions = localStorage.getItem('wiezen_sessions');
    const storedActiveId = localStorage.getItem('wiezen_active_session_id');

    let loadedSessions: Session[] = [];
    let loadedActiveId = '';

    if (storedSessions) {
      try {
        let parsed = JSON.parse(storedSessions);
        // Migrate contract types from old Dutch literals to English
        loadedSessions = parsed.map((s: any) => ({
          ...s,
          rounds: (s.rounds || []).map((r: any) => {
            if (r.contract) {
              if (r.contract.type === 'vraag_antwoord') r.contract.type = 'ask_answer';
              if (r.contract.type === 'miserie') r.contract.type = 'misery';
              if (r.contract.type === 'open_miserie') r.contract.type = 'open_misery';
            }
            return r;
          })
        }));
      } catch (e) {
        console.error('Error loading sessions', e);
      }
    }

    if (storedActiveId) {
      loadedActiveId = storedActiveId;
    }

    // If no sessions, seed a default one
    if (loadedSessions.length === 0) {
      const defaultPlayers: Player[] = [
        { id: 'p1', name: 'SP1' },
        { id: 'p2', name: 'SP2' },
        { id: 'p3', name: 'SP3' },
        { id: 'p4', name: 'SP4' },
      ];
      const newSession: Session = {
        id: 'session_' + Date.now(),
        date: new Date().toISOString(),
        players: defaultPlayers,
        rounds: [],
        isActive: true,
      };
      loadedSessions = [newSession];
      loadedActiveId = newSession.id;
    }

    setSessions(loadedSessions);
    setActiveSessionId(loadedActiveId);
    
    // Save defaults back to ensure synchronization
    localStorage.setItem('wiezen_sessions', JSON.stringify(loadedSessions));
    localStorage.setItem('wiezen_active_session_id', loadedActiveId);
  }, []);

  // Apply visual theme changes and sync to localStorage
  useEffect(() => {
    const selectedTheme = THEMES.find((t) => t.id === themeId) || THEMES[0];
    applyTheme(selectedTheme);
    localStorage.setItem('wiezen_theme', themeId);
  }, [themeId]);

  /**
   * Persists the sessions list to both component state and browser localStorage.
   * Ensures that all round modifications, name changes, or deletes are kept in-sync.
   * @param {Session[]} updatedSessions - The new array of played game sessions.
   */
  const saveSessions = (updatedSessions: Session[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('wiezen_sessions', JSON.stringify(updatedSessions));
  };

  /**
   * Processes and activates sessions loaded from a backup CSV file.
   * Finds the active game session, or falls back to the first available game session,
   * setting it as the active session for the scoreboard panel.
   * @param {Session[]} imported - The list of parsed sessions retrieved from the CSV file.
   */
  const handleImportSessions = (imported: Session[]) => {
    saveSessions(imported);
    const active = imported.find(s => s.isActive) || imported[0];
    if (active) {
      setActiveSessionId(active.id);
      localStorage.setItem('wiezen_active_session_id', active.id);
    }
  };

  /**
   * Updates game settings (scoring coefficients and base parameters) across the app.
   * Saves updated coefficients to localStorage for persistent configuration in future sessions.
   * @param {GameSettings} newSettings - The new scoring coefficients.
   */
  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    localStorage.setItem('wiezen_settings', JSON.stringify(newSettings));
  };

  // Get active session
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Helper to scroll to bottom of notepad
  useEffect(() => {
    if (isAddRoundOpen === false && scoreHistoryContainerRef.current) {
      setTimeout(() => {
        const container = scoreHistoryContainerRef.current;
        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [activeSession?.rounds.length, isAddRoundOpen]);

  /**
   * Sequentially recalculates running totals for each player across all rounds.
   * This is called after any round is added, edited, deleted, or reordered
   * to guarantee that cumulative totals are mathematically correct and up to date.
   * @param {Session} session - The game session containing rounds to process.
   * @returns {Session} The updated session with recalculated cumulative running totals.
   */
  const recalculateSessionRounds = (session: Session): Session => {
    let currentTotals: Record<string, number> = {};
    session.players.forEach((p) => {
      currentTotals[p.id] = 0;
    });

    const updatedRounds = session.rounds.map((round, idx) => {
      const nextTotals: Record<string, number> = {};
      session.players.forEach((p) => {
        const roundDelta = round.scores[p.id] || 0;
        currentTotals[p.id] += roundDelta;
        nextTotals[p.id] = currentTotals[p.id];
      });

      return {
        ...round,
        roundNumber: idx + 1,
        totals: nextTotals,
      };
    });

    return {
      ...session,
      rounds: updatedRounds,
    };
  };

  /**
   * Reorders rounds in the active session. This is invoked during drag/reorder mode.
   * Swaps adjacent rounds and runs a full sequential recalculation of player totals afterwards.
   * @param {number} index - The zero-indexed position of the round to move.
   * @param {'up' | 'down'} direction - The movement direction.
   */
  const handleMoveRound = (index: number, direction: 'up' | 'down') => {
    if (!activeSession) return;
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= activeSession.rounds.length) return;

    const updatedRounds = [...activeSession.rounds];
    const temp = updatedRounds[index];
    updatedRounds[index] = updatedRounds[nextIndex];
    updatedRounds[nextIndex] = temp;

    const updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return recalculateSessionRounds({
          ...s,
          rounds: updatedRounds,
        });
      }
      return s;
    });

    saveSessions(updatedSessions);
  };

  // Update player names inline
  const handleUpdatePlayerName = (playerId: string, newName: string) => {
    // Keep only letters and digits, limit to max 3 chars, uppercase
    const filteredName = newName.replace(/[^a-zA-Z0-9]/g, '');
    const formattedName = filteredName.slice(0, 3).toUpperCase();

    const updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionId) {
        const updatedPlayers = s.players.map((p) => {
          if (p.id === playerId) {
            return { ...p, name: formattedName };
          }
          return p;
        });
        return { ...s, players: updatedPlayers };
      }
      return s;
    });

    saveSessions(updatedSessions);
  };

  // Add/Edit round score submit
  const handleSaveRound = () => {
    if (!isTempScoresValid) return;

    const updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionId) {
        let updatedRounds = [...s.rounds];

        if (editingRoundId) {
          // Editing existing
          updatedRounds = updatedRounds.map((r) => {
            if (r.id === editingRoundId) {
              return {
                ...r,
                scores: tempScores,
                contract: tempContractDetails,
              };
            }
            return r;
          });
        } else {
          // Adding new
          const newRound: Round = {
            id: 'round_' + Date.now(),
            roundNumber: s.rounds.length + 1,
            scores: tempScores,
            totals: {}, // Will be calculated by recalculateSessionRounds
            contract: tempContractDetails,
          };
          updatedRounds.push(newRound);
        }

        const updatedSession = recalculateSessionRounds({
          ...s,
          rounds: updatedRounds,
        });

        return updatedSession;
      }
      return s;
    });

    saveSessions(updatedSessions);
    setIsAddRoundOpen(false);
    setEditingRoundId(null);
    setTempScores({});
    setTempContractDetails(null);
  };

  // Open round editor
  const handleOpenEditRound = (round: Round) => {
    setEditingRoundId(round.id);
    setTempScores(round.scores);
    setTempContractDetails(round.contract || null);
    setIsTempScoresValid(true);
    setActiveAddTab(round.contract ? 'calc' : 'quick');
    setIsAddRoundOpen(true);
  };

  // Delete round
  const handleDeleteRound = (roundId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: TEXTS.deleteRoundTitle,
      message: TEXTS.deleteRoundMessage,
      confirmText: TEXTS.deleteRoundConfirmText,
      confirmStyle: 'danger',
      onConfirm: () => {
        const updatedSessions = sessions.map((s) => {
          if (s.id === activeSessionId) {
            const updatedRounds = s.rounds.filter((r) => r.id !== roundId);
            return recalculateSessionRounds({
              ...s,
              rounds: updatedRounds,
            });
          }
          return s;
        });

        saveSessions(updatedSessions);
        setConfirmDialog(null);
      }
    });
  };

  // New Session Creation
  const handleNewSession = () => {
    setConfirmDialog({
      isOpen: true,
      title: TEXTS.newGameTitle,
      message: TEXTS.newGameMessage,
      confirmText: TEXTS.newGameConfirmText,
      confirmStyle: 'accent',
      onConfirm: () => {
        // Copy current players to carry over names if preferred
        const currentPlayers = activeSession?.players || [
          { id: 'p1', name: 'SP1' },
          { id: 'p2', name: 'SP2' },
          { id: 'p3', name: 'SP3' },
          { id: 'p4', name: 'SP4' },
        ];

        const newSession: Session = {
          id: 'session_' + Date.now(),
          date: new Date().toISOString(),
          players: currentPlayers.map(p => ({ ...p })), // clone players
          rounds: [],
          isActive: true,
        };

        const updatedSessions = sessions.map((s) => ({ ...s, isActive: false }));
        updatedSessions.push(newSession);

        saveSessions(updatedSessions);
        setActiveSessionId(newSession.id);
        localStorage.setItem('wiezen_active_session_id', newSession.id);
        setIsSettingsOpen(false);
        setConfirmDialog(null);
      }
    });
  };

  // End current game
  const handleEndGame = () => {
    setConfirmDialog({
      isOpen: true,
      title: TEXTS.endGameTitle,
      message: TEXTS.endGameMessage,
      confirmText: TEXTS.endGameConfirmText,
      confirmStyle: 'accent',
      onConfirm: () => {
        const updatedSessions = sessions.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              isActive: false,
            };
          }
          return s;
        });
        saveSessions(updatedSessions);
        setIsSettingsOpen(false);
        setConfirmDialog(null);
      }
    });
  };

  // Reset current session
  const handleResetSession = () => {
    setConfirmDialog({
      isOpen: true,
      title: TEXTS.resetGameTitle,
      message: TEXTS.resetGameMessage,
      confirmText: TEXTS.resetGameConfirmText,
      confirmStyle: 'danger',
      onConfirm: () => {
        const updatedSessions = sessions.map((s) => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              rounds: [],
            };
          }
          return s;
        });
        saveSessions(updatedSessions);
        setIsSettingsOpen(false);
        setConfirmDialog(null);
      }
    });
  };

  // Select older session from history
  const handleSelectSession = (id: string) => {
    const updatedSessions = sessions.map((s) => ({
      ...s,
      isActive: s.id === id,
    }));
    saveSessions(updatedSessions);
    setActiveSessionId(id);
    localStorage.setItem('wiezen_active_session_id', id);
  };

  // Delete session from history
  const handleDeleteSession = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: TEXTS.deleteGameTitle,
      message: TEXTS.deleteGameMessage,
      confirmText: TEXTS.deleteGameConfirmText,
      confirmStyle: 'danger',
      onConfirm: () => {
        const remainingSessions = sessions.filter((s) => s.id !== id);
        
        // If we deleted the active one, pick another or create new
        let nextActiveId = activeSessionId;
        let finalSessions = [...remainingSessions];

        if (id === activeSessionId) {
          if (remainingSessions.length > 0) {
            nextActiveId = remainingSessions[0].id;
            remainingSessions[0].isActive = true;
          } else {
            const defaultPlayers: Player[] = [
              { id: 'p1', name: 'SP1' },
              { id: 'p2', name: 'SP2' },
              { id: 'p3', name: 'SP3' },
              { id: 'p4', name: 'SP4' },
            ];
            const newSession: Session = {
              id: 'session_' + Date.now(),
              date: new Date().toISOString(),
              players: defaultPlayers,
              rounds: [],
              isActive: true,
            };
            finalSessions = [newSession];
            nextActiveId = newSession.id;
          }
        }

        saveSessions(finalSessions);
        setActiveSessionId(nextActiveId);
        localStorage.setItem('wiezen_active_session_id', nextActiveId);
        setConfirmDialog(null);
      }
    });
  };

  // Helper to generate text label for a contract
  const getContractLabel = (contract: any, players: Player[]) => {
    if (!contract) return '';
    const getPlayerName = (id: string) => players.find(p => p.id === id)?.name || id;

    const type = contract.type;
    const isSuccess = contract.isSuccess;

    const cl = TEXTS.contractLabels || {
      tricks: 'tricks',
      succeeded: 'Geslaagd',
      failed: 'Gefaald',
      askAndAnswer: 'Vraag & Antwoord',
      askAlone: 'Vraag Alleen',
      troelTogether: 'Troel',
      troelAlone: 'Troel Alleen',
      misery: 'Miserie',
      openMisery: 'Miserie Op Tafel',
      solo: 'Solo',
      soloSlim: 'Solo Slim',
      passLabel: 'Alle spelers gepast',
      manualScore: 'Manuele score',
      contractFallback: 'Contract',
    };

    const statusText = isSuccess ? cl.succeeded.toUpperCase() : cl.failed.toUpperCase();

    switch (type) {
      case 'ask_answer': {
        const asker = getPlayerName(contract.askerId);
        const tricks = contract.tricks !== undefined ? ` (${contract.tricks} ${cl.tricks})` : '';
        if (contract.responderId && contract.responderId !== 'none') {
          const responder = getPlayerName(contract.responderId);
          return `${asker} & ${responder}: ${cl.askAndAnswer.toUpperCase()}${tricks} (${statusText})`;
        }
        return `${asker}: ${cl.askAlone.toUpperCase()}${tricks} (${statusText})`;
      }
      case 'troel': {
        const asker = getPlayerName(contract.askerId);
        const tricks = contract.tricks !== undefined ? ` (${contract.tricks} ${cl.tricks})` : '';
        if (contract.responderId && contract.responderId !== 'none') {
          const responder = getPlayerName(contract.responderId);
          return `${asker} & ${responder}: ${cl.troelTogether.toUpperCase()}${tricks} (${statusText})`;
        }
        return `${asker}: ${cl.troelAlone.toUpperCase()}${tricks} (${statusText})`;
      }
      case 'misery': {
        const winners = contract.miseryWinners || [];
        const losers = contract.miseryLosers || [];
        const allMiserie = [...winners, ...losers];
        if (allMiserie.length > 0) {
          const names = allMiserie.map((id: string) => getPlayerName(id)).join(' & ');
          const successStatus = losers.length === 0 ? cl.succeeded.toUpperCase() : cl.failed.toUpperCase();
          return `${names}: ${cl.misery.toUpperCase()} (${successStatus})`;
        }
        const asker = contract.askerId ? getPlayerName(contract.askerId) : '';
        return asker ? `${asker}: ${cl.misery.toUpperCase()} (${statusText})` : `${cl.misery.toUpperCase()} (${statusText})`;
      }
      case 'open_misery': {
        const winners = contract.miseryWinners || [];
        const losers = contract.miseryLosers || [];
        const allMiserie = [...winners, ...losers];
        if (allMiserie.length > 0) {
          const names = allMiserie.map((id: string) => getPlayerName(id)).join(' & ');
          const successStatus = losers.length === 0 ? cl.succeeded.toUpperCase() : cl.failed.toUpperCase();
          return `${names}: ${cl.openMisery.toUpperCase()} (${successStatus})`;
        }
        const asker = contract.askerId ? getPlayerName(contract.askerId) : '';
        return asker ? `${asker}: ${cl.openMisery.toUpperCase()} (${statusText})` : `${cl.openMisery.toUpperCase()} (${statusText})`;
      }
      case 'solo': {
        const player = getPlayerName(contract.soloPlayerId);
        return `${player}: ${cl.solo.toUpperCase()} ${contract.tricks || 9} (${statusText})`;
      }
      case 'solo_slim': {
        const player = getPlayerName(contract.soloPlayerId);
        return `${player}: ${cl.soloSlim.toUpperCase()} (${statusText})`;
      }
      case 'passen': {
        return cl.passLabel.toUpperCase();
      }
      case 'custom': {
        if (contract.customReason) {
          return `${cl.manualScore.toUpperCase()} - ${contract.customReason.toUpperCase()}`;
        }
        return cl.manualScore.toUpperCase();
      }
      default:
        return cl.contractFallback.toUpperCase();
    }
  };

  // 3. Analytics & Standing calculations
  const getLeaderboard = () => {
    if (!activeSession) return [];

    const players = activeSession.players;
    const lastRound = activeSession.rounds[activeSession.rounds.length - 1];
    
    return players.map((p) => {
      const score = lastRound ? lastRound.totals[p.id] : 0;
      return {
        ...p,
        score,
      };
    }).sort((a, b) => b.score - a.score);
  };

  const leaderboard = getLeaderboard();
  const maxScore = leaderboard.length > 0 ? Math.max(...leaderboard.map(l => l.score)) : 0;
  const minScore = leaderboard.length > 0 ? Math.min(...leaderboard.map(l => l.score)) : 0;

  // Render player name helper with lead/lag badges
  const renderPlayerHeaderBadge = (playerId: string) => {
    if (!activeSession || !activeSession.rounds || activeSession.rounds.length === 0) return null;
    
    const lastRound = activeSession.rounds[activeSession.rounds.length - 1];
    const score = lastRound.totals[playerId] || 0;

    if (score === maxScore && maxScore > 0) {
      return (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-amber-300 shadow-xs uppercase tracking-wider scale-90 z-20">
          <Trophy className="w-2.5 h-2.5 shrink-0" />
          Kop
        </span>
      );
    }
    if (score === minScore && minScore < 0) {
      return (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-rose-100 text-rose-800 text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 border border-rose-200 uppercase tracking-wider scale-90 z-20">
          <Frown className="w-2.5 h-2.5 shrink-0 text-rose-500" />
          Nat
        </span>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 hd-pattern text-hd-text flex flex-col items-center justify-start sm:p-4 md:p-8 select-none font-sans overflow-hidden">
      
      {/* Main Application Outer Container */}
      <div className="w-full max-w-md bg-hd-bg sm:rounded-3xl shadow-xl border-0 sm:border border-hd-border overflow-hidden flex flex-col h-full sm:h-[840px] relative">
        
        {/* App Top Toolbar */}
        <div className="bg-hd-bg/90 backdrop-blur-xs border-b-2 border-hd-border px-5 pt-[calc(env(safe-area-inset-top,0px)+0.875rem)] pb-3.5 flex items-center justify-between shrink-0 z-10 text-hd-text">
          <div className="flex flex-col">
            <h1 className="text-base font-bold uppercase border-b-2 border-hd-accent inline-block text-hd-text tracking-tight">
              {TEXTS.appTitle}
            </h1>
            <span className="text-[10px] text-hd-muted font-mono uppercase tracking-widest mt-0.5">
              {activeSession ? new Date(activeSession.date).toLocaleDateString(langId === 'nl' ? 'nl-BE' : 'en-US', { day: '2-digit', month: 'short' }) : (TEXTS.today)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsRulesOpen(true)}
              className="p-2 text-hd-muted hover:text-hd-text hover:bg-white/50 border border-transparent hover:border-hd-border rounded-md transition-all cursor-pointer"
              title={TEXTS.rules}
              id="rules-btn"
            >
              <Info className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 text-hd-muted hover:text-hd-text hover:bg-white/50 border border-transparent hover:border-hd-border rounded-md transition-all cursor-pointer relative"
              title={TEXTS.history}
              id="history-btn"
            >
              <History className="w-4 h-4" />
              {sessions.length > 1 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-hd-accent rounded-full" />
              )}
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-hd-muted hover:text-hd-text hover:bg-white/50 border border-transparent hover:border-hd-border rounded-md transition-all cursor-pointer"
              title={TEXTS.settings}
              id="settings-btn"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* High Density Score Board Container */}
        <div className="flex-1 min-h-0 px-4 py-5 flex flex-col bg-hd-bg/45 relative">
          
           {/* High Density Score Table Sheet */}
          <div className="bg-hd-card border border-hd-border rounded-2xl p-4 flex-1 min-h-0 flex flex-col relative shadow-sm text-hd-text">
            
            {isReorderMode && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-2.5 flex items-center justify-between text-[10px] text-amber-800 animate-in fade-in slide-in-from-top-1 duration-150 shrink-0 font-sans">
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  <ArrowUpDown className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-pulse" />
                  <span>{TEXTS.reorderModeActive}</span>
                </div>
                <button
                  onClick={() => setIsReorderMode(false)}
                  className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[9px] font-extrabold uppercase cursor-pointer transition-colors"
                >
                  {TEXTS.done}
                </button>
              </div>
            )}

            {/* Table Header Row (Player Names) */}
            <div className="grid grid-cols-4 border-b-2 border-hd-text pb-3 mb-2 shrink-0 relative">
              {/* Vertical separator lines - Only for Paper theme */}
              {themeId === 'paper' && (
                <div className="absolute top-1 bottom-3 left-0 right-0 grid grid-cols-4 pointer-events-none z-0">
                  <div className="border-r border-hd-border border-dotted"></div>
                  <div className="border-r border-hd-border border-dotted"></div>
                  <div className="border-r border-hd-border border-dotted"></div>
                  <div></div>
                </div>
              )}
              {activeSession && activeSession.rounds.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsReorderMode(!isReorderMode)}
                  className={`absolute -bottom-[11px] -left-1.5 z-30 w-5 h-5 flex items-center justify-center rounded-full border transition-all cursor-pointer shadow-xs ${
                    isReorderMode 
                      ? 'bg-hd-accent border-hd-accent text-white scale-110 animate-pulse' 
                      : 'bg-hd-card border-hd-border text-hd-muted hover:text-hd-text hover:bg-hd-bg hover:scale-105'
                  }`}
                  title={isReorderMode ? (TEXTS.stopReordering) : (TEXTS.reorderMode)}
                  id="reorder-toggle-divider-btn"
                >
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              )}
              {activeSession?.players.map((player) => (
                <div key={player.id} className="text-center relative flex flex-col items-center justify-center">
                  {renderPlayerHeaderBadge(player.id)}
                  
                  {/* Inline editable name input */}
                  <input
                    type="text"
                    value={player.name ?? ''}
                    onChange={(e) => handleUpdatePlayerName(player.id, e.target.value)}
                    maxLength={3}
                    className="w-16 text-center text-2xl font-mono font-bold bg-transparent border-0 text-hd-text uppercase focus:outline-none focus:ring-0 cursor-pointer hover:bg-hd-bg/50 rounded-md py-0.5 tracking-tight transition-all"
                    placeholder="???"
                    title={TEXTS.clickToEditPlayerName}
                    id={`player-header-${player.id}`}
                  />
                  <span className="text-[8px] text-hd-muted font-bold uppercase tracking-wider">{TEXTS.player}</span>
                </div>
              ))}
            </div>

            {/* Score History Rows */}
            <div ref={scoreHistoryContainerRef} className="flex-1 overflow-y-auto min-h-0 space-y-px py-1 pr-1 scrollbar-thin">
              {!activeSession || activeSession.rounds.length === 0 ? (
                <div 
                  onClick={() => {
                    if (activeSession?.isActive) {
                      setEditingRoundId(null);
                      setTempScores({});
                      setTempContractDetails(null);
                      setIsTempScoresValid(true);
                      setActiveAddTab('calc');
                      setIsAddRoundOpen(true);
                    } else {
                      handleNewSession();
                    }
                  }}
                  className="flex-1 flex flex-col items-center justify-center py-16 text-center space-y-4 px-6 border-2 border-dashed border-hd-border/60 hover:border-hd-accent/40 rounded-xl hover:bg-hd-bg/30 transition-all duration-150 cursor-pointer m-2 select-none"
                  title={activeSession?.isActive ? TEXTS.noRoundsDesc : TEXTS.noRoundsDescInactive}
                >
                  <div className="w-12 h-12 rounded-full bg-hd-bg border border-hd-border flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-hd-muted" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-hd-text text-sm uppercase tracking-wide">{TEXTS.noRoundsTitle}</h3>
                    <p className="text-xs text-hd-muted max-w-[200px] mx-auto leading-relaxed">
                      {activeSession?.isActive ? TEXTS.noRoundsDesc : TEXTS.noRoundsDescInactive}
                    </p>
                  </div>
                </div>
              ) : (
                activeSession.rounds.map((round, idx) => {
                  return (
                    <div
                      key={round.id}
                      onClick={() => {
                        if (!isReorderMode) {
                          handleOpenEditRound(round);
                        }
                      }}
                      className={`flex flex-col py-2.5 border-b border-hd-border/60 rounded-md transition-all relative group ${
                        isReorderMode 
                          ? 'bg-amber-50/10 cursor-default' 
                          : 'hover:bg-hd-bg/60 cursor-pointer'
                      }`}
                      id={`round-row-${round.id}`}
                      title={isReorderMode ? (TEXTS.useArrowsToMove) : (TEXTS.clickToEdit)}
                    >
                      {/* Vertical separator lines - Only for Paper theme */}
                      {themeId === 'paper' && (
                        <div className="absolute top-2 bottom-2 left-0 right-0 grid grid-cols-4 pointer-events-none z-0">
                          <div className="border-r border-hd-border border-dotted"></div>
                          <div className="border-r border-hd-border border-dotted"></div>
                          <div className="border-r border-hd-border border-dotted"></div>
                          <div></div>
                        </div>
                      )}
                      
                      {/* Round indicator marker / reorder controls */}
                      {isReorderMode ? (
                        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 z-20">
                           <button
                            type="button"
                            disabled={idx === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveRound(idx, 'up');
                            }}
                            className="p-1 bg-hd-card border border-hd-border rounded hover:bg-hd-bg text-hd-text disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer active:scale-90 transition-all shadow-xs"
                            title={TEXTS.moveUp}
                          >
                            <ChevronUp className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-[8px] font-mono font-bold text-hd-text select-none">
                            R{round.roundNumber}
                          </span>
                          <button
                            type="button"
                            disabled={idx === activeSession.rounds.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveRound(idx, 'down');
                            }}
                            className="p-1 bg-hd-card border border-hd-border rounded hover:bg-hd-bg text-hd-text disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer active:scale-90 transition-all shadow-xs"
                            title={TEXTS.moveDown}
                          >
                            <ChevronDown className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="absolute -left-2 top-4 text-[8px] bg-hd-text/10 text-hd-text font-mono font-bold px-1 py-0.5 rounded pointer-events-none uppercase tracking-tighter">
                          R{round.roundNumber}
                        </span>
                      )}

                      {/* Score cell for each player */}
                      <div className="grid grid-cols-4 w-full relative z-10">
                        {activeSession.players.map((p) => {
                          const total = round.totals[p.id] ?? 0;
                          const delta = round.scores[p.id] ?? 0;

                          return (
                            <div key={p.id} className="text-center relative flex flex-col items-center justify-center">
                              {/* Running Cumulative Total */}
                              <span className="text-lg font-mono font-bold text-hd-text leading-none">
                                {total > 0 ? `+${total}` : total}
                              </span>
                              
                              {/* Delta change helper */}
                              {delta !== 0 && (
                                <span
                                  className={`text-[8px] font-mono font-bold px-1 rounded-sm absolute -top-1.5 right-1.5 border scale-90 ${
                                    delta > 0
                                      ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                                      : 'text-red-500 bg-red-500/10 border-red-500/20'
                                  }`}
                                >
                                  {delta > 0 ? `+${delta}` : delta}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Contract Info tag */}
                      {round.contract && (
                        <div className="text-[9px] text-hd-accent font-mono uppercase tracking-wider text-center mt-1 bg-hd-card border border-hd-border/60 py-0.5 px-2 rounded-md w-fit mx-auto select-none relative z-10 shadow-xs">
                          {getContractLabel(round.contract, activeSession.players)}
                        </div>
                      )}

                      {/* Floating edit actions */}
                      {activeSession?.isActive && !isReorderMode && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-hd-card/95 border border-hd-border pr-1 rounded shadow-sm py-0.5 pr-1 pl-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditRound(round);
                            }}
                            className="p-1 text-hd-text hover:bg-hd-bg rounded"
                            id={`inline-edit-${round.id}`}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRound(round.id);
                            }}
                            className="p-1 text-hd-accent hover:bg-hd-bg rounded"
                            id={`inline-delete-${round.id}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              
              {/* Dummy element for scroll anchoring */}
              <div className="h-4" />
            </div>

            {/* Double underline notebook bottom footer (Standings total) */}
            {activeSession?.rounds.length > 0 && (
              <div className="mt-4 border-t-4 border-double border-hd-border pt-3 shrink-0 bg-hd-bg/30 py-2 px-0 rounded-lg relative">
                {/* Vertical separator lines - Only for Paper theme */}
                {themeId === 'paper' && (
                  <div className="absolute top-2 bottom-2 left-0 right-0 grid grid-cols-4 pointer-events-none z-0">
                    <div className="border-r border-hd-border border-dotted"></div>
                    <div className="border-r border-hd-border border-dotted"></div>
                    <div className="border-r border-hd-border border-dotted"></div>
                    <div></div>
                  </div>
                )}
                <div className="grid grid-cols-4 relative z-10">
                  {activeSession.players.map((p) => {
                    const lastRound = activeSession.rounds[activeSession.rounds.length - 1];
                    const finalTotal = lastRound ? lastRound.totals[p.id] : 0;
                    const isWinner = finalTotal === maxScore && maxScore > 0;
                    
                    return (
                      <div key={p.id} className="text-center flex flex-col items-center">
                        <span className={`text-xl font-mono font-extrabold ${
                          isWinner ? 'text-emerald-700 font-extrabold' : 'text-hd-text'
                        }`}>
                          {finalTotal > 0 ? `+${finalTotal}` : finalTotal}
                        </span>
                        <span className="text-[8px] font-bold tracking-wider uppercase text-hd-muted mt-0.5">
                          {TEXTS.standings}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* High Density Footer Add Button Bar */}
        <div className="bg-hd-card p-4 border-t border-hd-border shrink-0 flex items-center justify-between gap-3 z-10">
          
          {/* Quick Stats Summary */}
          {activeSession?.rounds.length > 0 ? (
            <div className="text-[10px] text-hd-muted font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <span className={`w-1.5 h-1.5 rounded-full ${activeSession?.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span>
                {TEXTS.roundCompleted.replace('{num}', String(activeSession.rounds.length))}
                {!activeSession?.isActive && ` ${TEXTS.finishedSuffix}`}
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-hd-muted font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <span className={`w-1.5 h-1.5 rounded-full ${activeSession?.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span>
                {TEXTS.noRoundsPlayed}
                {!activeSession?.isActive && ` ${TEXTS.finishedSuffix}`}
              </span>
            </div>
          )}

          {/* Solid styled accent action button */}
          {activeSession?.isActive ? (
            <button
              onClick={() => {
                setEditingRoundId(null);
                setTempScores({});
                setTempContractDetails(null);
                setIsTempScoresValid(true);
                setActiveAddTab('calc');
                setIsAddRoundOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold uppercase text-xs tracking-wider shadow-md hover:shadow-lg active:translate-y-0.5 transition-all cursor-pointer"
              id="add-round-floating-btn"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              {TEXTS.enterRoundBtn}
            </button>
          ) : (
            <button
              onClick={handleNewSession}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold uppercase text-xs tracking-wider shadow-md hover:shadow-lg active:translate-y-0.5 transition-all cursor-pointer"
              id="add-round-floating-btn"
            >
              <Play className="w-4 h-4 fill-white" />
              {TEXTS.startNewGameBtn}
            </button>
          )}
        </div>

        {/* Real High Density Footer Info Bar */}
        <div className="h-[calc(3rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-hd-text text-hd-bg px-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider shrink-0 select-none">
          <div className="flex gap-4">
            <span>{TEXTS.playersLabel} {activeSession?.players.map(p => p.name).join(', ')}</span>
            <span className="hidden sm:inline">{TEXTS.roundsLabel}: {activeSession?.rounds.length}</span>
          </div>
          <div className="flex items-center gap-4">
            {activeSession?.isActive ? (
              <button 
                onClick={handleEndGame}
                className="text-red-400 hover:text-red-300 transition-colors cursor-pointer flex items-center justify-center font-bold p-1"
                title={TEXTS.endCurrentGame}
              >
                <Square className="w-4 h-4 fill-red-400 text-red-400" />
              </button>
            ) : (
              <button 
                onClick={handleNewSession}
                className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer flex items-center justify-center font-bold p-1"
                title={TEXTS.startNewGame}
              >
                <Play className="w-4 h-4 fill-emerald-400 text-emerald-400 border-none outline-none" />
              </button>
            )}
          </div>
        </div>

        {/* ---------------- DRAWERS & DIALOGS ---------------- */}

        {/* 1. Add/Edit Score Modal Dialog */}
        <AnimatePresence>
          {isAddRoundOpen && (
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setIsAddRoundOpen(false);
                  setEditingRoundId(null);
                }
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="bg-hd-card w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85svh] sm:max-h-[90svh] overflow-hidden border border-hd-border"
              >
                {/* Modal Header */}
                <div className="px-6 py-4 bg-hd-bg border-b-2 border-hd-border flex items-center justify-between shrink-0">
                  <div className="flex flex-col">
                    <h2 className="text-base font-bold uppercase tracking-tight text-hd-text">
                      {(() => {
                        const currentRoundNumber = editingRoundId 
                          ? activeSession?.rounds.find(r => r.id === editingRoundId)?.roundNumber ?? 1
                          : (activeSession?.rounds.length ?? 0) + 1;
                        return editingRoundId 
                          ? `${TEXTS.round} ${currentRoundNumber} (${TEXTS.editRoundHeader.replace(/Ronde/i, '').trim()})` 
                          : `${TEXTS.round} ${currentRoundNumber}`;
                      })()}
                    </h2>
                    <span className="text-xs text-hd-muted font-mono uppercase tracking-wider mt-0.5">
                      {editingRoundId ? TEXTS.editRoundSubheader : TEXTS.newRoundSubheader}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setIsAddRoundOpen(false);
                      setEditingRoundId(null);
                    }}
                    className="p-1 rounded-md hover:bg-white/60 transition-colors cursor-pointer border border-transparent hover:border-hd-border"
                    id="close-add-round-modal"
                  >
                    <X className="w-4 h-4 text-hd-muted" />
                  </button>
                </div>



                {/* Modal Main Form Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {activeAddTab === 'quick' ? (
                    <QuickInput
                      players={activeSession.players}
                      initialScores={tempScores}
                      settings={settings}
                      themeId={themeId}
                      texts={TEXTS}
                      onScoresChange={(scores, isValid, contractDetails) => {
                        setTempScores(scores);
                        setIsTempScoresValid(isValid);
                        setTempContractDetails(contractDetails || null);
                      }}
                    />
                  ) : (
                    <ScoreCalculator
                      players={activeSession.players}
                      settings={settings}
                      themeId={themeId}
                      texts={TEXTS}
                      initialContract={tempContractDetails}
                      onScoresChange={(scores, isValid, details) => {
                        setTempScores(scores);
                        setIsTempScoresValid(isValid);
                        setTempContractDetails(details);
                      }}
                    />
                  )}
                </div>

                {/* Modal Footer Controls */}
                <div className="px-6 py-4 bg-hd-bg border-t-2 border-hd-border flex flex-col gap-3 shrink-0">
                  {!isTempScoresValid && (
                    <div className="flex items-center justify-center text-center gap-1.5 text-red-500 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider font-mono">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {tempContractDetails?.validationError || (activeAddTab === 'quick' 
                        ? (TEXTS.sumMustBeZeroError) 
                        : (TEXTS.invalidEntryError))}
                    </div>
                  )}
                  <div className="flex flex-col gap-2.5 w-full">
                    <div className="flex items-center gap-3 w-full">
                      <button
                        onClick={() => {
                          setIsAddRoundOpen(false);
                          setEditingRoundId(null);
                        }}
                        className="flex-1 py-2.5 border border-hd-border text-hd-text hover:bg-hd-card rounded-lg font-bold uppercase tracking-wider text-xs transition-all cursor-pointer"
                        id="cancel-add-round-btn"
                      >
                        {TEXTS.cancel}
                      </button>
                      <button
                        onClick={handleSaveRound}
                        disabled={!isTempScoresValid}
                        className="flex-1 py-2.5 bg-hd-accent hover:opacity-90 disabled:opacity-40 text-white rounded-lg font-bold uppercase tracking-wider text-xs shadow-sm transition-all cursor-pointer"
                        id="save-round-btn"
                      >
                        {editingRoundId ? TEXTS.save : TEXTS.add}
                      </button>
                    </div>

                    {editingRoundId && (
                      <button
                        onClick={() => {
                          // Close modal first
                          setIsAddRoundOpen(false);
                          const roundIdToDelete = editingRoundId;
                          setEditingRoundId(null);
                          // Call existing safe deletion logic with confirmation dialog
                          handleDeleteRound(roundIdToDelete);
                        }}
                        className="w-full py-2 flex items-center justify-center gap-1.5 border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-lg font-bold uppercase tracking-wider text-xs transition-all cursor-pointer"
                        id="delete-round-from-modal-btn"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {TEXTS.deleteRoundTitle}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 2. Slideover Drawer: History */}
        <AnimatePresence>
          {isHistoryOpen && (
            <div className="absolute inset-0 bg-black/40 z-40">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="w-4/5 max-w-sm h-full bg-hd-card border-r-2 border-hd-border shadow-2xl relative z-50"
              >
                <HistoryPanel
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSelectSession={handleSelectSession}
                  onDeleteSession={handleDeleteSession}
                  onImportSessions={handleImportSessions}
                  onClose={() => setIsHistoryOpen(false)}
                  texts={TEXTS}
                />
              </motion.div>
              <div 
                onClick={() => setIsHistoryOpen(false)} 
                className="absolute inset-0 z-30" 
              />
            </div>
          )}
        </AnimatePresence>

        {/* Slideover Drawer: Rules */}
        <AnimatePresence>
          {isRulesOpen && (
            <div className="absolute inset-0 bg-black/40 z-40">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="w-4/5 max-w-sm h-full bg-hd-card border-r-2 border-hd-border absolute left-0 z-50 shadow-2xl"
              >
                <RulesPanel onClose={() => setIsRulesOpen(false)} texts={TEXTS} />
              </motion.div>
              <div 
                onClick={() => setIsRulesOpen(false)} 
                className="absolute inset-0 z-30" 
              />
            </div>
          )}
        </AnimatePresence>

        {/* 3. Slideover Drawer: Settings */}
        <AnimatePresence>
          {isSettingsOpen && (
            <div className="absolute inset-0 bg-black/40 z-40">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'tween', duration: 0.25 }}
                className="w-4/5 max-w-sm h-full bg-hd-card border-l-2 border-hd-border absolute right-0 z-50 shadow-2xl"
              >
                <SettingsPanel
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onResetSession={handleResetSession}
                  onNewSession={handleNewSession}
                  onEndSession={handleEndGame}
                  activeSessionIsActive={activeSession?.isActive}
                  sessions={sessions}
                  players={activeSession?.players}
                  onUpdatePlayerName={handleUpdatePlayerName}
                  onClose={() => setIsSettingsOpen(false)}
                  currentThemeId={themeId}
                  onChangeTheme={setThemeId}
                  texts={TEXTS}
                  currentLanguageId={langId}
                  onChangeLanguage={(newLang) => {
                    setLangId(newLang);
                    localStorage.setItem('wiezen_lang', newLang);
                  }}
                />
              </motion.div>
              <div 
                onClick={() => setIsSettingsOpen(false)} 
                className="absolute inset-0 z-30" 
              />
            </div>
          )}
        </AnimatePresence>

        {/* 4. Custom Confirmation Modal */}
        <AnimatePresence>
          {confirmDialog && confirmDialog.isOpen && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[200] p-4 animate-fade-in"
              onClick={() => setConfirmDialog(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-hd-card w-full max-w-xs rounded-2xl shadow-2xl p-5 border border-hd-border flex flex-col items-center text-center space-y-4"
              >
                <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
                  confirmDialog.confirmStyle === 'danger' ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'
                }`}>
                  <AlertCircle className="w-5 h-5" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-hd-text text-sm uppercase tracking-wide font-mono">
                    {confirmDialog.title}
                  </h3>
                  <p className="text-[11px] text-hd-muted leading-relaxed font-sans px-1">
                    {confirmDialog.message}
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full pt-1">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 py-2 border border-hd-border text-hd-text hover:bg-hd-bg rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer"
                  >
                    {TEXTS.cancel}
                  </button>
                  <button
                    onClick={() => {
                      confirmDialog.onConfirm();
                    }}
                    className={`flex-1 py-2 text-white rounded-lg font-bold uppercase tracking-wider text-[10px] shadow-sm transition-all cursor-pointer ${
                      confirmDialog.confirmStyle === 'danger'
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-hd-accent hover:opacity-90'
                    }`}
                  >
                    {confirmDialog.confirmText}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
