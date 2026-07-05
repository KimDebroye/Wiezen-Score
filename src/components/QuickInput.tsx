import React, { useState, useEffect } from 'react';
import { Player, GameSettings, ContractType } from '../types';
import { Sparkles, RefreshCw, AlertTriangle, User, Check, X } from 'lucide-react';
import { TEXTS as DEFAULT_TEXTS } from '../locales/nl';
import {
  calculateVraagAntwoord,
  calculateTroel,
  calculateMiserie,
  calculateSolo,
  calculateSoloSlim,
} from '../lib/scoring';

interface QuickInputProps {
  players: Player[];
  initialScores?: Record<string, number>;
  onScoresChange: (scores: Record<string, number>, isValid: boolean, contractDetails?: any) => void;
  settings: GameSettings;
  themeId?: string;
  texts?: typeof DEFAULT_TEXTS;
}

export default function QuickInput({
  players,
  initialScores,
  onScoresChange,
  settings,
  themeId,
  texts = DEFAULT_TEXTS,
}: QuickInputProps) {
  const TEXTS = texts;
  // Initialize scores
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const defaultScores: Record<string, number> = {};
    players.forEach((p) => {
      const initialVal = initialScores ? initialScores[p.id] : 0;
      defaultScores[p.id] = Number.isNaN(initialVal) || initialVal === undefined || initialVal === null ? 0 : initialVal;
    });
    return defaultScores;
  });

  // Auto-fill/balance configuration
  const [autoBalance, setAutoBalance] = useState(true);
  const [balancePlayerId, setBalancePlayerId] = useState<string>(() => players[3]?.id || '');

  // Quick Contract Selection state
  const [selectedAskerId, setSelectedAskerId] = useState<string>('');
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('none');
  const [selectedContract, setSelectedContract] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(true);
  const [tricksWon, setTricksWon] = useState<number>(8);

  // Calculate sum of scores safely
  const sumScores = (Object.values(scores) as number[]).reduce((a, b) => {
    const val = Number.isNaN(b) || b === undefined || b === null ? 0 : b;
    return a + val;
  }, 0);
  const isValid = sumScores === 0;

  // Calculate contract-based scores
  const getCalculatedScores = (
    askerId: string,
    partnerId: string,
    contract: string,
    success: boolean,
    tricks: number
  ): { scores: Record<string, number>; contractDetails: any } => {
    let calculated: Record<string, number> = {};
    if (!contract || !askerId) {
      players.forEach((p) => { calculated[p.id] = 0; });
      return { scores: calculated, contractDetails: null };
    }

    let contractDetails: any = {
      type: contract as ContractType,
      isSuccess: success
    };

    switch (contract) {
      case 'ask_answer': {
        const hasPartner = partnerId !== 'none' && partnerId !== askerId;
        contractDetails.askerId = askerId;
        if (hasPartner) contractDetails.responderId = partnerId;
        contractDetails.tricks = tricks;
        contractDetails.isSuccess = tricks >= (hasPartner ? (settings.askAndAnswerTricksTarget ?? 8) : (settings.askAndAnswerAloneTricksTarget ?? 5));
        calculated = calculateVraagAntwoord(tricks, hasPartner, askerId, partnerId, players, settings);
        break;
      }

      case 'troel': {
        const hasPartner = partnerId !== 'none' && partnerId !== askerId;
        contractDetails.askerId = askerId;
        if (hasPartner) contractDetails.responderId = partnerId;
        contractDetails.tricks = tricks;
        contractDetails.isSuccess = tricks >= (settings.troelTricksTarget ?? 8);
        calculated = calculateTroel(tricks, hasPartner, askerId, partnerId, players, settings);
        break;
      }

      case 'misery':
      case 'open_misery': {
        contractDetails.miseryWinners = success ? [askerId] : [];
        contractDetails.miseryLosers = success ? [] : [askerId];
        const states: Record<string, 'opponent' | 'success' | 'failed'> = {};
        players.forEach((p) => {
          if (p.id === askerId) {
            states[p.id] = success ? 'success' : 'failed';
          } else {
            states[p.id] = 'opponent';
          }
        });
        calculated = calculateMiserie(states, contract === 'open_misery', players, settings);
        break;
      }

      case 'solo': {
        contractDetails.soloPlayerId = askerId;
        contractDetails.tricks = 9;
        calculated = calculateSolo(9, success, askerId, players, settings);
        break;
      }

      case 'solo_slim': {
        contractDetails.soloPlayerId = askerId;
        contractDetails.tricks = 13;
        calculated = calculateSoloSlim(success, askerId, players, settings);
        break;
      }
    }

    return { scores: calculated, contractDetails };
  };

  // Synchronize default tricks won when selectedPartnerId or selectedContract changes
  useEffect(() => {
    if (selectedContract === 'ask_answer') {
      if (selectedPartnerId === 'none') {
        setTricksWon(settings.askAndAnswerAloneTricksTarget ?? 5);
      } else {
        setTricksWon(settings.askAndAnswerTricksTarget ?? 8);
      }
    } else if (selectedContract === 'troel') {
      if (selectedPartnerId === 'none' || selectedPartnerId === selectedAskerId) {
        const nextPartner = players.find((p) => p.id !== selectedAskerId)?.id || '';
        setSelectedPartnerId(nextPartner);
      }
      setTricksWon(settings.troelTricksTarget ?? 8);
    }
  }, [selectedPartnerId, selectedContract, selectedAskerId, players, settings]);

  // Live apply quick contract selection to score states
  useEffect(() => {
    if (selectedContract && selectedAskerId) {
      const isSamen = selectedPartnerId !== 'none' && selectedPartnerId !== selectedAskerId;
      const target = selectedContract === 'troel'
        ? (settings.troelTricksTarget ?? 8)
        : (isSamen ? (settings.askAndAnswerTricksTarget ?? 8) : (settings.askAndAnswerAloneTricksTarget ?? 5));
      const calculatedSuccess = (selectedContract === 'ask_answer' || selectedContract === 'troel') 
        ? tricksWon >= target 
        : isSuccess;

      const { scores: calculatedScores, contractDetails } = getCalculatedScores(
        selectedAskerId,
        selectedPartnerId,
        selectedContract,
        calculatedSuccess,
        tricksWon
      );
      setScores(calculatedScores);
      onScoresChange(calculatedScores, true, contractDetails);
    }
  }, [selectedAskerId, selectedPartnerId, selectedContract, isSuccess, tricksWon, settings]);

  // Let parent know about scores and validity on manual entry
  useEffect(() => {
    if (!selectedContract) {
      onScoresChange(scores, isValid, null);
    }
  }, [scores, isValid, selectedContract]);

  // Handle score change for a specific player (clears quick contract)
  const updatePlayerScore = (playerId: string, delta: number, absolute?: boolean) => {
    // Clear quick contract to ensure manual input takes precedence
    setSelectedContract('');
    setSelectedAskerId('');

    setScores((prev) => {
      const next = { ...prev };
      
      const parsedDelta = Number.isNaN(delta) || delta === undefined || delta === null ? 0 : delta;
      if (absolute) {
        next[playerId] = parsedDelta;
      } else {
        const currentVal = Number.isNaN(next[playerId]) || next[playerId] === undefined || next[playerId] === null ? 0 : next[playerId];
        next[playerId] = currentVal + parsedDelta;
      }

      // If auto-balance is enabled and we are not modifying the balance player
      if (autoBalance && playerId !== balancePlayerId) {
        // Calculate sum of all OTHER players
        const otherSum = Object.entries(next)
          .filter(([id]) => id !== balancePlayerId)
          .reduce((sum, [_, val]) => {
            const num = Number.isNaN(val) || val === undefined || val === null ? 0 : (val as number);
            return sum + num;
          }, 0);
        
        // Balance player gets the negative of the other sum
        next[balancePlayerId] = -otherSum;
      }

      return next;
    });
  };

  // Reset all to zero & clear contract selection
  const handleReset = () => {
    setSelectedContract('');
    setSelectedAskerId('');
    setSelectedPartnerId('none');
    
    const resetScores: Record<string, number> = {};
    players.forEach((p) => {
      resetScores[p.id] = 0;
    });
    setScores(resetScores);
  };

  // Toggle autobalance
  const handleToggleAutoBalance = () => {
    const nextVal = !autoBalance;
    setAutoBalance(nextVal);
    if (nextVal) {
      const targetId = balancePlayerId || players[3]?.id || players[0]?.id;
      setBalancePlayerId(targetId);
      
      // Immediately balance
      setScores((prev) => {
        const next = { ...prev };
        const otherSum = Object.entries(next)
          .filter(([id]) => id !== targetId)
          .reduce((sum, [_, val]) => {
            const num = Number.isNaN(val) || val === undefined || val === null ? 0 : (val as number);
            return sum + num;
          }, 0);
        next[targetId] = -otherSum;
        return next;
      });
    }
  };

  const clearContractSelection = () => {
    setSelectedContract('');
    setSelectedAskerId('');
    setSelectedPartnerId('none');
  };

  const getContractLabelText = () => {
    const asker = players.find(p => p.id === selectedAskerId)?.name || '';
    const partner = players.find(p => p.id === selectedPartnerId)?.name || '';
    
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

    switch (selectedContract) {
      case 'ask_answer': {
        const isSamen = selectedPartnerId !== 'none' && selectedPartnerId !== selectedAskerId;
        const target = isSamen ? 8 : 5;
        const currentIsSuccess = tricksWon >= target;
        const diff = Math.abs(tricksWon - target);
        const overslagenText = diff > 0 ? ` (${diff} ${tricksWon >= target ? TEXTS.overtricksUnit : TEXTS.underUnit})` : '';
        const statusText = currentIsSuccess ? TEXTS.successBtn : TEXTS.failedBtn;
        return isSamen
          ? `${asker} & ${partner}: ${cl.askAndAnswer} - ${tricksWon} ${TEXTS.tricksUnit} (${statusText}${overslagenText})`
          : `${asker}: ${cl.askAlone} - ${tricksWon} ${TEXTS.tricksUnit} (${statusText}${overslagenText})`;
      }
      case 'troel': {
        const target = 8;
        const currentIsSuccess = tricksWon >= target;
        const diff = Math.abs(tricksWon - target);
        const overslagenText = diff > 0 ? ` (${diff} ${tricksWon >= target ? TEXTS.overtricksUnit : TEXTS.underUnit})` : '';
        const statusText = currentIsSuccess ? TEXTS.successBtn : TEXTS.failedBtn;
        return `${asker} & ${partner}: ${cl.troelTogether} - ${tricksWon} ${TEXTS.tricksUnit} (${statusText}${overslagenText})`;
      }
      case 'misery': {
        const statusText = isSuccess ? TEXTS.successBtn : TEXTS.failedBtn;
        return `${asker}: ${cl.misery} (${statusText})`;
      }
      case 'open_misery': {
        const statusText = isSuccess ? TEXTS.successBtn : TEXTS.failedBtn;
        return `${asker}: ${cl.openMisery} (${statusText})`;
      }
      case 'solo': {
        const statusText = isSuccess ? TEXTS.successBtn : TEXTS.failedBtn;
        return `${asker}: ${cl.solo} (${statusText})`;
      }
      case 'solo_slim': {
        const statusText = isSuccess ? TEXTS.successBtn : TEXTS.failedBtn;
        return `${asker}: ${cl.soloSlim} (${statusText})`;
      }
      default:
        return '';
    }
  };

  const getContractLabelTextForId = (id: string): string => {
    const cl: any = TEXTS.contractLabels || {};
    switch (id) {
      case 'ask_answer': return cl.askAndAnswer || TEXTS.askAndAnswerShort;
      case 'troel': return cl.troelTogether;
      case 'misery': return cl.misery;
      case 'open_misery': return cl.openMisery || TEXTS.onTableShort;
      case 'solo': return cl.solo ? `${cl.solo} (9+)` : 'Solo (9+)';
      case 'solo_slim': return cl.soloSlim;
      default: return id;
    }
  };

  return (
    <div className="space-y-4 text-hd-text">
      {/* BRAND NEW: Interactive Button-based contract selector ("Wie speelde wat?") */}
      <div className="bg-hd-bg/40 border-2 border-hd-border rounded-xl p-4 space-y-4 shadow-3xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-hd-text flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-hd-accent" />
            {TEXTS.whoPlayedWhat}
          </h3>
          {selectedContract && (
            <button
              onClick={clearContractSelection}
              className="text-[10px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1 hover:underline cursor-pointer"
            >
              <X className="w-3 h-3" /> {TEXTS.clearBtn}
            </button>
          )}
        </div>

        {/* 1. Player Selector Button Grid */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-hd-muted uppercase tracking-wider block">
            {TEXTS.choosePlayer}
          </span>
          <div className="grid grid-cols-4 gap-2">
            {players.map((p) => {
              const isSelected = selectedAskerId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedAskerId(p.id);
                    if (selectedPartnerId === p.id) {
                      setSelectedPartnerId('none');
                    }
                    // Auto select first contract if none selected
                    if (!selectedContract) {
                      setSelectedContract('ask_answer');
                    }
                  }}
                  className={`py-2 px-1 text-sm font-mono font-bold rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? (themeId === 'dark' || themeId === 'glass' || themeId === 'cards'
                          ? 'bg-hd-accent border-hd-accent text-white shadow-xs'
                          : 'bg-hd-text border-hd-text text-white shadow-xs')
                      : 'bg-hd-card border-hd-border text-hd-text hover:bg-hd-bg/80'
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Partner selector for Vraag & Antwoord or Troel */}
        {(selectedContract === 'ask_answer' || selectedContract === 'troel') && selectedAskerId && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            <span className="text-[10px] font-bold text-hd-muted uppercase tracking-wider block">
              {selectedContract === 'troel' ? TEXTS.partner4thAce : TEXTS.partnerOptional}
            </span>
            <div className={`grid ${selectedContract === 'troel' ? 'grid-cols-3' : 'grid-cols-5'} gap-1.5`}>
              {selectedContract === 'ask_answer' && (
                <button
                  onClick={() => setSelectedPartnerId('none')}
                  className={`py-1.5 px-1 text-[9px] font-bold uppercase tracking-wider rounded border transition-all cursor-pointer col-span-2 ${
                    selectedPartnerId === 'none'
                      ? 'bg-hd-accent border-hd-accent text-white shadow-xs'
                      : 'bg-hd-card border-hd-border text-hd-muted hover:bg-hd-bg/80'
                  }`}
                >
                  {TEXTS.goAlone}
                </button>
              )}
              {players
                .filter((p) => p.id !== selectedAskerId)
                .map((p) => {
                  const isSelected = selectedPartnerId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPartnerId(p.id)}
                      className={`py-1.5 px-1 text-xs font-mono font-bold rounded border transition-all cursor-pointer ${
                        isSelected
                          ? (themeId === 'dark' || themeId === 'glass' || themeId === 'cards'
                              ? 'bg-hd-accent border-hd-accent text-white shadow-xs'
                              : 'bg-hd-text border-hd-text text-white shadow-xs')
                          : 'bg-hd-card border-hd-border text-hd-text hover:bg-hd-bg/80'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* 2. Contract Buttons Grid */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-hd-muted uppercase tracking-wider block">
            {TEXTS.whatWasPlayed}
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'ask_answer' },
              { id: 'troel' },
              { id: 'misery' },
              { id: 'open_misery' },
              { id: 'solo' },
              { id: 'solo_slim' },
            ].map((contract) => {
              const isSelected = selectedContract === contract.id;
              return (
                <button
                  key={contract.id}
                  disabled={!selectedAskerId}
                  onClick={() => setSelectedContract(contract.id)}
                  className={`py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                    isSelected
                      ? 'bg-hd-accent border-hd-accent text-white shadow-xs'
                      : 'bg-hd-card border-hd-border text-hd-text hover:bg-hd-bg/80'
                  }`}
                >
                  {getContractLabelTextForId(contract.id)}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Success / Failure Buttons Grid */}
        {selectedContract && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
            {(selectedContract === 'ask_answer' || selectedContract === 'troel') ? (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-hd-muted uppercase tracking-wider block">
                  {TEXTS.tricksAchieved}
                </span>
                <div className="bg-hd-card border border-hd-border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-hd-text">{TEXTS.tricksWon}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTricksWon((prev) => Math.max(0, prev - 1))}
                        className="w-7 h-7 flex items-center justify-center bg-hd-card border border-hd-border rounded-md hover:bg-hd-bg text-hd-text active:scale-95 transition-all font-bold cursor-pointer select-none"
                        id="decrease-tricks-quick"
                      >
                        -
                      </button>
                      {(() => {
                        const basisTricks = selectedContract === 'troel' 
                          ? (settings.troelTricksTarget ?? 8) 
                          : (selectedPartnerId === 'none' ? (settings.askAndAnswerAloneTricksTarget ?? 5) : (settings.askAndAnswerTricksTarget ?? 8));
                        const isAtLeastBasis = tricksWon >= basisTricks;
                        return (
                          <span className={`text-sm font-mono font-bold px-2.5 py-0.5 border rounded-md min-w-[3.5rem] text-center select-none transition-all duration-150 ${
                            isAtLeastBasis 
                              ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30 font-extrabold shadow-2xs' 
                              : 'text-hd-accent bg-hd-bg border-hd-border'
                          }`}>
                            {tricksWon} {TEXTS.tricksUnit}
                          </span>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() => setTricksWon((prev) => Math.min(13, prev + 1))}
                        className="w-7 h-7 flex items-center justify-center bg-hd-card border border-hd-border rounded-md hover:bg-hd-bg text-hd-text active:scale-95 transition-all font-bold cursor-pointer select-none"
                        id="increase-tricks-quick"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="13"
                    value={tricksWon}
                    onChange={(e) => setTricksWon(Number(e.target.value))}
                    className="w-full accent-hd-accent h-2 bg-hd-bg border border-hd-border rounded cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-hd-muted font-mono font-bold px-1">
                    <span>0 {TEXTS.tricksUnit}</span>
                    {selectedContract === 'troel' ? (
                      <span className="text-hd-accent font-extrabold">{(settings.troelTricksTarget ?? 8)} ({TEXTS.basisTag})</span>
                    ) : (
                      selectedPartnerId === 'none' ? (
                        <span className="text-hd-accent font-extrabold">{(settings.askAndAnswerAloneTricksTarget ?? 5)} ({TEXTS.basisTag})</span>
                      ) : (
                        <span className="text-hd-accent font-extrabold">{(settings.askAndAnswerTricksTarget ?? 8)} ({TEXTS.basisTag})</span>
                      )
                    )}
                    <span>13 {TEXTS.tricksUnit}</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <span className="text-[10px] font-bold text-hd-muted uppercase tracking-wider block">
                  {TEXTS.resultLabel}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsSuccess(true)}
                    className={`py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isSuccess
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-hd-card border-hd-border text-emerald-500 hover:bg-emerald-500/10'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" /> {TEXTS.successBtn}
                  </button>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className={`py-2.5 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !isSuccess
                        ? 'bg-red-600 border-red-600 text-white shadow-xs'
                        : 'bg-hd-card border-hd-border text-red-500 hover:bg-red-500/10'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" /> {TEXTS.failedBtn}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Summary tag feedback */}
        {selectedContract && selectedAskerId && (
          <div className="bg-hd-accent/10 border border-hd-accent/20 rounded-lg p-2.5 text-center text-xs font-bold tracking-tight text-hd-accent font-mono animate-pulse uppercase">
            {getContractLabelText()}
          </div>
        )}
      </div>

      {/* Manual Fine-Tuning Separator */}
      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-dashed border-hd-border"></div>
        <span className="flex-shrink mx-3 text-[10px] font-bold text-hd-muted uppercase tracking-widest font-mono">
          {TEXTS.manualAdjustment}
        </span>
        <div className="flex-grow border-t border-dashed border-hd-border"></div>
      </div>

      {/* Grid of Players */}
      <div className="grid grid-cols-2 gap-3">
        {players.map((player) => {
          const isBalance = autoBalance && player.id === balancePlayerId;
          const score = scores[player.id] || 0;

          return (
            <div
              key={player.id}
              className={`p-3 rounded-lg border transition-all flex flex-col justify-between ${
                isBalance
                  ? 'bg-amber-500/5 border-hd-border shadow-2xs'
                  : 'bg-hd-card border-hd-border shadow-2xs'
              }`}
            >
              {/* Player Header */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-7 h-7 rounded-full bg-hd-bg flex items-center justify-center font-mono font-bold text-hd-text text-xs uppercase border border-hd-border">
                    {player.name || '?'}
                  </span>
                  <span className="font-bold text-hd-text text-sm">
                    {player.name || TEXTS.player}
                  </span>
                </div>
              </div>

              {/* Score Display / Manual input */}
              <div className="flex items-center justify-center py-2 mb-2 bg-hd-bg/40 rounded border border-hd-border relative">
                <input
                  type="number"
                  value={Number.isNaN(score) || score === undefined || score === null ? '' : score}
                  disabled={isBalance}
                  onChange={(e) => {
                    const parsed = e.target.value === '' ? 0 : Number(e.target.value);
                    updatePlayerScore(player.id, parsed, true);
                  }}
                  className={`w-20 text-center font-mono font-bold text-xl bg-transparent focus:outline-none focus:ring-0 ${
                    score > 0 
                      ? 'text-emerald-700' 
                      : score < 0 
                      ? 'text-red-600'
                      : 'text-hd-text'
                  } ${isBalance ? 'opacity-80' : ''}`}
                />
              </div>

              {/* Increments Buttons */}
              <div className="flex gap-1.5 justify-center">
                <button
                  onClick={() => updatePlayerScore(player.id, -1)}
                  disabled={isBalance}
                  className="w-10 h-10 rounded bg-hd-bg border border-hd-border text-hd-text font-mono font-bold text-base hover:bg-hd-card disabled:opacity-30 flex items-center justify-center transition-all cursor-pointer active:translate-y-0.5 shadow-2xs"
                >
                  -1
                </button>
                <button
                  onClick={() => updatePlayerScore(player.id, -5)}
                  disabled={isBalance}
                  className="w-10 h-10 rounded bg-hd-bg border border-hd-border text-hd-text font-mono font-bold text-xs hover:bg-hd-card disabled:opacity-30 flex items-center justify-center transition-all cursor-pointer active:translate-y-0.5 shadow-2xs"
                >
                  -5
                </button>
                <button
                  onClick={() => updatePlayerScore(player.id, 5)}
                  disabled={isBalance}
                  className="w-10 h-10 rounded bg-hd-bg border border-hd-border text-hd-text font-mono font-bold text-xs hover:bg-hd-card disabled:opacity-30 flex items-center justify-center transition-all cursor-pointer active:translate-y-0.5 shadow-2xs"
                >
                  +5
                </button>
                <button
                  onClick={() => updatePlayerScore(player.id, 1)}
                  disabled={isBalance}
                  className="w-10 h-10 rounded bg-hd-bg border border-hd-border text-hd-text font-mono font-bold text-base hover:bg-hd-card disabled:opacity-30 flex items-center justify-center transition-all cursor-pointer active:translate-y-0.5 shadow-2xs"
                >
                  +1
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Validation status / reset */}
      <div className="flex items-center justify-between border-t border-hd-border pt-3 mt-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-hd-muted hover:text-hd-text hover:bg-hd-bg rounded transition-all cursor-pointer border border-transparent hover:border-hd-border"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {TEXTS.restoreToZero}
        </button>

        <div className="flex items-center gap-1.5">
          {!isValid ? (
            <div className="flex items-center gap-1 text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded text-xs font-bold font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              {TEXTS.sumMustBeZero.replace('{score}', (sumScores > 0 ? `+${sumScores}` : String(sumScores)))}
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded text-xs font-bold font-mono">
              {TEXTS.sumIsZero}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
