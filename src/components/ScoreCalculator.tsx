import React, { useState, useEffect } from 'react';
import { Player, ContractType, GameSettings } from '../types';
import { Award, ShieldAlert, Zap, Layers, RefreshCw } from 'lucide-react';
import { TEXTS as DEFAULT_TEXTS } from '../locales/nl';
import {
  calculateVraagAntwoord,
  calculateTroel,
  calculateMiserie,
  calculateSolo,
  calculateSoloSlim,
  calculatePassen,
} from '../lib/scoring';

interface ScoreCalculatorProps {
  players: Player[];
  settings: GameSettings;
  onScoresChange: (scores: Record<string, number>, isValid: boolean, contractDetails: any) => void;
  themeId?: string;
  texts?: typeof DEFAULT_TEXTS;
  initialContract?: any;
}

export default function ScoreCalculator({
  players,
  settings,
  onScoresChange,
  themeId,
  texts = DEFAULT_TEXTS,
  initialContract,
}: ScoreCalculatorProps) {
  const TEXTS = texts;
  const [contractType, setContractType] = useState<ContractType>(initialContract?.type || 'ask_answer');

  // Vraag & Antwoord state
  const [askerId, setAskerId] = useState<string>(initialContract?.askerId || players[0]?.id || '');
  const [responderId, setResponderId] = useState<string>(initialContract?.responderId || 'none'); // 'none' means alone
  const [tricksWon, setTricksWon] = useState<number>(initialContract?.tricks && initialContract?.type === 'ask_answer' ? initialContract.tricks : 8);

  // Miserie state
  // Player ID -> 'opponent' | 'success' | 'failed'
  const [miseryStates, setMiserieStates] = useState<Record<string, 'opponent' | 'success' | 'failed'>>(() => {
    if (initialContract?.type === 'misery' || initialContract?.type === 'open_misery') {
      const states: Record<string, 'opponent' | 'success' | 'failed'> = {};
      players.forEach((p) => { states[p.id] = 'opponent'; });
      (initialContract.miseryWinners || []).forEach((id: string) => { states[id] = 'success'; });
      (initialContract.miseryLosers || []).forEach((id: string) => { states[id] = 'failed'; });
      return states;
    }
    const states: Record<string, 'opponent' | 'success' | 'failed'> = {};
    players.forEach((p) => {
      states[p.id] = 'opponent';
    });
    return states;
  });

  // Solo state (Abondance / Solo Slim)
  const [soloPlayerId, setSoloPlayerId] = useState<string>(initialContract?.soloPlayerId || players[0]?.id || '');
  const [soloTarget, setSoloTarget] = useState<number>(initialContract?.tricks && (initialContract?.type === 'solo' || initialContract?.type === 'solo_slim') ? initialContract.tricks : 9); // 9, 10, 11, 12 for Solo, 13 for Solo Slim
  const [soloSuccess, setSoloSuccess] = useState<boolean>(initialContract?.isSuccess ?? true);

  // Custom state
  const [customScores, setCustomScores] = useState<Record<string, number>>(() => {
    if (initialContract?.type === 'custom' && initialContract.customScores) {
      return { ...initialContract.customScores };
    }
    const defaultScores: Record<string, number> = {};
    players.forEach((p) => { defaultScores[p.id] = 0; });
    return defaultScores;
  });
  const [customReason, setCustomReason] = useState<string>(initialContract?.customReason || '');
  const [isZeroSum, setIsZeroSum] = useState<boolean>(initialContract?.isZeroSum ?? true);

  // Calculate scores based on the inputs
  const calculateScores = (): { scores: Record<string, number>; details: any; isValid: boolean } => {
    let calculated: Record<string, number> = {};
    let details: any = { type: contractType };
    let isValid = true;

    switch (contractType) {
      case 'ask_answer': {
        const hasResponder = responderId !== 'none';
        details = {
          ...details,
          askerId,
          responderId: hasResponder ? responderId : undefined,
          tricks: tricksWon,
          isSuccess: tricksWon >= (hasResponder ? (settings.askAndAnswerTricksTarget ?? 8) : (settings.askAndAnswerAloneTricksTarget ?? 5)),
        };
        calculated = calculateVraagAntwoord(tricksWon, hasResponder, askerId, responderId, players, settings);
        break;
      }

      case 'troel': {
        const hasResponder = responderId !== 'none' && responderId !== askerId;
        if (!hasResponder) {
          isValid = false;
          details.validationError = TEXTS.errorTroelPartner;
        }
        details = {
          ...details,
          askerId,
          responderId: hasResponder ? responderId : undefined,
          tricks: tricksWon,
          isSuccess: tricksWon >= (settings.troelTricksTarget ?? 8),
        };
        calculated = calculateTroel(tricksWon, hasResponder, askerId, responderId, players, settings);
        break;
      }

      case 'misery':
      case 'open_misery': {
        const successIds = Object.keys(miseryStates).filter((id) => miseryStates[id] === 'success');
        const failedIds = Object.keys(miseryStates).filter((id) => miseryStates[id] === 'failed');
        const activeCount = successIds.length + failedIds.length;
        if (activeCount === 0) {
          isValid = false;
          details.validationError = TEXTS.errorMiserieMinOne;
        } else if (activeCount > 3) {
          isValid = false;
          details.validationError = TEXTS.errorMiserieMaxThree;
        }
        details = {
          ...details,
          miseryWinners: successIds,
          miseryLosers: failedIds,
          isSuccess: failedIds.length === 0, // Success if no one failed
        };
        calculated = calculateMiserie(miseryStates, contractType === 'open_misery', players, settings);
        break;
      }

      case 'solo': {
        details = {
          ...details,
          soloPlayerId,
          tricks: soloTarget,
          isSuccess: soloSuccess,
        };
        calculated = calculateSolo(soloTarget, soloSuccess, soloPlayerId, players, settings);
        break;
      }

      case 'solo_slim': {
        details = {
          ...details,
          soloPlayerId,
          tricks: 13,
          isSuccess: soloSuccess,
        };
        calculated = calculateSoloSlim(soloSuccess, soloPlayerId, players, settings);
        break;
      }

      case 'custom': {
        details = {
          ...details,
          customReason,
          customScores: { ...customScores },
          isZeroSum,
        };
        calculated = { ...customScores };
        
        // Check zero-sum if enabled
        if (isZeroSum) {
          const sumValue: any = Object.values(customScores).reduce((a: number, b: unknown) => a + (b as number), 0);
          if (sumValue !== 0) {
            isValid = false;
            const sumStr = (sumValue as number) > 0 ? `+${sumValue}` : `${sumValue}`;
            details.validationError = `${TEXTS.zeroSumError} ${sumStr}`;
          }
        }
        break;
      }

      case 'passen': {
        details = {
          ...details,
          isSuccess: true,
        };
        calculated = calculatePassen(players);
        break;
      }
    }

    return { scores: calculated, details, isValid };
  };

  const currentResult = calculateScores();

  // Notify parent on state change
  useEffect(() => {
    onScoresChange(currentResult.scores, currentResult.isValid, currentResult.details);
  }, [contractType, askerId, responderId, tricksWon, miseryStates, soloPlayerId, soloTarget, soloSuccess, customScores, customReason, isZeroSum, settings]);

  // Synchronize tricks won when responder selection changes (alone = 5 tricks, with partner = 8 tricks)
  useEffect(() => {
    if (contractType === 'ask_answer') {
      if (responderId === 'none') {
        setTricksWon(settings.askAndAnswerAloneTricksTarget ?? 5);
      } else {
        setTricksWon(settings.askAndAnswerTricksTarget ?? 8);
      }
    } else if (contractType === 'troel') {
      if (responderId === 'none' || responderId === askerId) {
        const nextPartner = players.find((p) => p.id !== askerId)?.id || '';
        setResponderId(nextPartner);
      }
      setTricksWon(settings.troelTricksTarget ?? 8);
    }
  }, [responderId, contractType, askerId, players, settings]);

  const toggleMiserieState = (playerId: string) => {
    setMiserieStates((prev) => {
      const current = prev[playerId];
      let next: 'opponent' | 'success' | 'failed' = 'opponent';
      if (current === 'opponent') next = 'success';
      else if (current === 'success') next = 'failed';
      
      return {
        ...prev,
        [playerId]: next,
      };
    });
  };

  return (
    <div className="space-y-4 text-hd-text">
      {/* Contract type tabs */}
      <div className="flex flex-wrap gap-1 bg-hd-bg border border-hd-border p-1 rounded-lg">
        {[
          { id: 'ask_answer', label: TEXTS.contractLabels?.askAndAnswer || TEXTS.askAndAnswerShort },
          { id: 'troel', label: TEXTS.contractLabels?.troelTogether },
          { id: 'misery', label: TEXTS.contractLabels?.misery },
          { id: 'open_misery', label: TEXTS.contractLabels?.openMisery || TEXTS.onTableShort },
          { id: 'solo', label: TEXTS.contractLabels?.solo },
          { id: 'solo_slim', label: TEXTS.contractLabels?.soloSlim },
          { id: 'custom', label: TEXTS.contractLabels?.manualScore || TEXTS.manualShort },
          { id: 'passen', label: TEXTS.passButton },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setContractType(tab.id as ContractType)}
            className={`flex-1 min-w-[65px] py-2 text-[10px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer text-center ${
              contractType === tab.id
                ? (themeId === 'dark' || themeId === 'glass' || themeId === 'cards'
                    ? 'bg-hd-accent text-white shadow-2xs'
                    : 'bg-hd-text text-white shadow-2xs')
                : 'text-hd-muted hover:text-hd-text'
            }`}
            id={`tab-contract-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contract Specific Form */}
      <div className="bg-hd-card border border-hd-border rounded-lg p-4 space-y-4 shadow-2xs">
        {contractType === 'ask_answer' && (
          <div className="space-y-4">
            {/* Asker & Responder selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-hd-muted uppercase tracking-wider block">
                  {TEXTS.asker || 'Vrager'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {players.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setAskerId(p.id);
                        if (responderId === p.id) setResponderId('none');
                      }}
                      className={`py-2 px-1 text-sm font-mono font-bold rounded border transition-all cursor-pointer ${
                        askerId === p.id
                          ? (themeId === 'dark' || themeId === 'glass' || themeId === 'cards'
                              ? 'bg-hd-accent border-hd-accent text-white shadow-xs'
                              : 'bg-hd-text border-hd-text text-white shadow-xs')
                          : 'bg-hd-bg border-hd-border text-hd-text hover:bg-hd-card/50'
                      }`}
                      id={`va-asker-${p.id}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-hd-muted uppercase tracking-wider block">
                  {TEXTS.partnerOptional || 'Partner'}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {players.map((p) => (
                    <button
                      key={p.id}
                      disabled={askerId === p.id}
                      onClick={() => setResponderId(p.id)}
                      className={`py-2 px-1 text-sm font-mono font-bold rounded border transition-all cursor-pointer disabled:opacity-30 ${
                        responderId === p.id
                          ? (themeId === 'dark' || themeId === 'glass' || themeId === 'cards'
                              ? 'bg-hd-accent border-hd-accent text-white shadow-xs'
                              : 'bg-hd-text border-hd-text text-white shadow-xs')
                          : 'bg-hd-bg border-hd-border text-hd-text hover:bg-hd-card/50'
                      }`}
                      id={`va-responder-${p.id}`}
                    >
                      {p.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setResponderId('none')}
                    className={`py-2 px-1 text-[10px] font-bold uppercase tracking-wider rounded border transition-all col-span-2 cursor-pointer ${
                      responderId === 'none'
                        ? 'bg-hd-accent border-hd-accent text-white'
                        : 'bg-hd-bg border-hd-border text-hd-muted hover:bg-hd-card/50'
                    }`}
                    id="va-responder-none"
                  >
                    Alleen gaan
                  </button>
                </div>
              </div>
            </div>

            <hr className="border-hd-border" />

            {/* Tricks selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wide text-hd-text">{TEXTS.tricksMade}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTricksWon((prev) => Math.max(0, prev - 1))}
                    className="w-7 h-7 flex items-center justify-center bg-hd-card border border-hd-border rounded-md hover:bg-hd-bg text-hd-text active:scale-95 transition-all font-bold cursor-pointer select-none"
                    id="decrease-tricks-va"
                  >
                    -
                  </button>
                  {(() => {
                    const responderIsNone = responderId === 'none';
                    const basisTricks = responderIsNone 
                      ? (settings.askAndAnswerAloneTricksTarget ?? 5) 
                      : (settings.askAndAnswerTricksTarget ?? 8);
                    const isAtLeastBasis = tricksWon >= basisTricks;
                    return (
                      <span className={`text-base font-mono font-bold px-3 py-0.5 border rounded-md min-w-[2.2rem] text-center select-none transition-all duration-150 ${
                        isAtLeastBasis 
                          ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30 font-extrabold shadow-2xs' 
                          : 'text-hd-accent bg-hd-bg border-hd-border'
                      }`}>
                        {tricksWon}
                      </span>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => setTricksWon((prev) => Math.min(13, prev + 1))}
                    className="w-7 h-7 flex items-center justify-center bg-hd-card border border-hd-border rounded-md hover:bg-hd-bg text-hd-text active:scale-95 transition-all font-bold cursor-pointer select-none"
                    id="increase-tricks-va"
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
                id="va-tricks-slider"
              />
              <div className="flex justify-between text-[9px] text-hd-muted font-mono font-bold px-1">
                <span>0</span>
                {responderId === 'none' ? (
                  <>
                    <span>{TEXTS.downRangeLabel.replace('0-7', `0-${(settings.askAndAnswerAloneTricksTarget ?? 5) - 1}`)}</span>
                    <span className="text-hd-accent font-extrabold text-xs">{(settings.askAndAnswerAloneTricksTarget ?? 5)} ({TEXTS.basisTag})</span>
                    <span>{TEXTS.wonRangeLabel.replace('8+', `${(settings.askAndAnswerAloneTricksTarget ?? 5)}+`)}</span>
                  </>
                ) : (
                  <>
                    <span>{TEXTS.downRangeLabel.replace('0-7', `0-${(settings.askAndAnswerTricksTarget ?? 8) - 1}`)}</span>
                    <span className="text-hd-accent font-extrabold text-xs">{(settings.askAndAnswerTricksTarget ?? 8)} ({TEXTS.basisTag})</span>
                    <span>{TEXTS.wonRangeLabel.replace('8+', `${(settings.askAndAnswerTricksTarget ?? 8)}+`)}</span>
                  </>
                )}
                <span>13</span>
              </div>
            </div>
          </div>
        )}

        {contractType === 'troel' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Asker & Responder selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-hd-muted uppercase tracking-wider block">
                  {TEXTS.asker3Aces}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {players.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setAskerId(p.id);
                        if (responderId === p.id || responderId === 'none') {
                          const nextPartner = players.find((other) => other.id !== p.id)?.id || '';
                          setResponderId(nextPartner);
                        }
                      }}
                      className={`py-2 px-1 text-sm font-mono font-bold rounded border transition-all cursor-pointer ${
                        askerId === p.id
                          ? (themeId === 'dark' || themeId === 'glass' || themeId === 'cards'
                              ? 'bg-hd-accent border-hd-accent text-white shadow-xs'
                              : 'bg-hd-text border-hd-text text-white shadow-xs')
                          : 'bg-hd-bg border-hd-border text-hd-text hover:bg-hd-card/50'
                      }`}
                      id={`troel-asker-${p.id}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-hd-muted uppercase tracking-wider block">
                  {TEXTS.partner4thAceShort}
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {players.map((p) => (
                    <button
                      key={p.id}
                      disabled={askerId === p.id}
                      onClick={() => setResponderId(p.id)}
                      className={`py-2 px-1 text-sm font-mono font-bold rounded border transition-all cursor-pointer disabled:opacity-30 ${
                        responderId === p.id
                          ? (themeId === 'dark' || themeId === 'glass' || themeId === 'cards'
                              ? 'bg-hd-accent border-hd-accent text-white shadow-xs'
                              : 'bg-hd-text border-hd-text text-white shadow-xs')
                          : 'bg-hd-bg border-hd-border text-hd-text hover:bg-hd-card/50'
                      }`}
                      id={`troel-responder-${p.id}`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <hr className="border-hd-border" />

            {/* Tricks selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wide text-hd-text">{TEXTS.tricksMade}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTricksWon((prev) => Math.max(0, prev - 1))}
                    className="w-7 h-7 flex items-center justify-center bg-hd-card border border-hd-border rounded-md hover:bg-hd-bg text-hd-text active:scale-95 transition-all font-bold cursor-pointer select-none"
                    id="decrease-tricks-troel"
                  >
                    -
                  </button>
                  {(() => {
                    const isAtLeastBasis = tricksWon >= (settings.troelTricksTarget ?? 8);
                    return (
                      <span className={`text-base font-mono font-bold px-3 py-0.5 border rounded-md min-w-[2.2rem] text-center select-none transition-all duration-150 ${
                        isAtLeastBasis 
                          ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30 font-extrabold shadow-2xs' 
                          : 'text-hd-accent bg-hd-bg border-hd-border'
                      }`}>
                        {tricksWon}
                      </span>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => setTricksWon((prev) => Math.min(13, prev + 1))}
                    className="w-7 h-7 flex items-center justify-center bg-hd-card border border-hd-border rounded-md hover:bg-hd-bg text-hd-text active:scale-95 transition-all font-bold cursor-pointer select-none"
                    id="increase-tricks-troel"
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
                id="troel-tricks-slider"
              />
              <div className="flex justify-between text-[9px] text-hd-muted font-mono font-bold px-1">
                <span>0</span>
                <>
                  <span>{TEXTS.downRangeLabel.replace('0-7', `0-${(settings.troelTricksTarget ?? 8) - 1}`)}</span>
                  <span className="text-hd-accent font-extrabold text-xs">{(settings.troelTricksTarget ?? 8)} ({TEXTS.basisTag})</span>
                  <span>{TEXTS.wonRangeLabel.replace('8+', `${(settings.troelTricksTarget ?? 8)}+`)}</span>
                </>
                <span>13</span>
              </div>
            </div>
          </div>
        )}

        {(contractType === 'misery' || contractType === 'open_misery') && (
          <div className="space-y-3">
            <p className="text-xs text-hd-muted leading-relaxed">
              {TEXTS.miseryInstructions}
            </p>
            
            <div className="grid grid-cols-2 gap-2.5">
              {players.map((p) => {
                const state = miseryStates[p.id] || 'opponent';
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleMiserieState(p.id)}
                    className={`p-3 rounded-lg border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                      state === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                        : state === 'failed'
                        ? 'bg-red-500/10 border-red-500/30 text-red-500'
                        : 'bg-hd-bg border-hd-border text-hd-text hover:bg-hd-card/50'
                    }`}
                    id={`misery-btn-${p.id}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full bg-hd-bg flex items-center justify-center font-mono font-bold text-xs uppercase border border-hd-border">
                        {p.name}
                      </span>
                      <span className="font-bold text-sm">{p.name}</span>
                    </div>

                    <div className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 mt-2">
                      {state === 'success' && (
                        <span className="text-emerald-700 bg-emerald-100/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                          ✓ {TEXTS.successBtn}
                        </span>
                      )}
                      {state === 'failed' && (
                        <span className="text-red-700 bg-red-100/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                          ✗ {TEXTS.failedBtn}
                        </span>
                      )}
                      {state === 'opponent' && (
                        <span className="text-hd-muted bg-hd-bg border border-hd-border px-1.5 py-0.5 rounded">
                          {TEXTS.miseryStateOpponent}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {(contractType === 'solo' || contractType === 'solo_slim') && (
          <div className="space-y-4">
            {/* Solo Player */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-hd-muted uppercase tracking-wider block">
                Solo {TEXTS.player}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {players.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSoloPlayerId(p.id)}
                    className={`py-2 text-sm font-mono font-bold rounded border transition-all cursor-pointer ${
                      soloPlayerId === p.id
                        ? (themeId === 'dark' || themeId === 'glass' || themeId === 'cards'
                            ? 'bg-hd-accent border-hd-accent text-white shadow-xs'
                            : 'bg-hd-text border-hd-text text-white shadow-xs')
                        : 'bg-hd-bg border-hd-border text-hd-text hover:bg-hd-card/50'
                    }`}
                    id={`solo-player-${p.id}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {contractType === 'solo' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-hd-muted uppercase tracking-wider block">
                  {TEXTS.bidTricksAbondance}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[9, 10, 11, 12].map((num) => (
                    <button
                      key={num}
                      onClick={() => setSoloTarget(num)}
                      className={`py-2 text-xs font-mono font-bold rounded border transition-all cursor-pointer ${
                        soloTarget === num
                          ? (themeId === 'dark' || themeId === 'glass' || themeId === 'cards'
                              ? 'bg-hd-accent border-hd-accent text-white shadow-xs'
                              : 'bg-hd-text border-hd-text text-white shadow-xs')
                          : 'bg-hd-bg border-hd-border text-hd-text hover:bg-hd-card/50'
                      }`}
                      id={`solo-target-${num}`}
                    >
                      {num} {TEXTS.tricksUnit}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <hr className="border-hd-border" />

            {/* Solo Result */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-hd-muted uppercase tracking-wider block">
                {TEXTS.resultLabel}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSoloSuccess(true)}
                  className={`py-2.5 rounded border font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    soloSuccess
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                      : 'bg-hd-bg border-hd-border text-hd-muted hover:bg-hd-card/50'
                  }`}
                  id="solo-success-btn"
                >
                  <Award className="w-4 h-4 text-emerald-500" />
                  {TEXTS.successBtn}
                </button>

                <button
                  onClick={() => setSoloSuccess(false)}
                  className={`py-2.5 rounded border font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                    !soloSuccess
                      ? 'bg-red-500/10 border-red-500/30 text-red-500'
                      : 'bg-hd-bg border-hd-border text-hd-muted hover:bg-hd-card/50'
                  }`}
                  id="solo-failed-btn"
                >
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  {TEXTS.failedBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {contractType === 'custom' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center justify-between">
              <p className="text-xs text-hd-muted leading-relaxed max-w-[70%]">
                {TEXTS.manualScoreInstructions}
              </p>
              
              <button 
                onClick={() => setIsZeroSum(!isZeroSum)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isZeroSum 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                    : 'bg-hd-bg border-hd-border text-hd-muted opacity-50 hover:opacity-100'
                }`}
              >
                <RefreshCw className={`w-3 h-3 ${isZeroSum ? 'animate-spin-slow' : ''}`} />
                {TEXTS.zeroSumLabel}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {players.map((p) => {
                const val = customScores[p.id] || 0;
                return (
                  <div key={p.id} className="bg-hd-bg border border-hd-border rounded-lg p-2.5 flex items-center justify-between shadow-3xs hover:border-hd-muted transition-colors">
                    <span className="font-bold text-sm text-hd-text">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCustomScores(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) - 1 }))}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-hd-card border border-hd-border text-hd-text hover:bg-hd-bg hover:text-red-500 active:scale-95 transition-all cursor-pointer"
                      >
                        -
                      </button>
                      <input 
                        type="number"
                        value={val === 0 ? '0' : val}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setCustomScores(prev => ({ ...prev, [p.id]: isNaN(v) ? 0 : v }));
                        }}
                        className={`w-11 text-center bg-transparent border-b-2 border-hd-border font-mono font-bold text-sm focus:outline-none focus:border-hd-accent transition-colors ${
                          val > 0 ? 'text-emerald-600 border-emerald-500/30' : val < 0 ? 'text-red-600 border-red-500/30' : 'text-hd-text'
                        }`}
                      />
                      <button 
                        onClick={() => setCustomScores(prev => ({ ...prev, [p.id]: (prev[p.id] || 0) + 1 }))}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-hd-card border border-hd-border text-hd-text hover:bg-hd-bg hover:text-emerald-500 active:scale-95 transition-all cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2 pt-2 border-t border-hd-border/50">
              <label className="text-[10px] font-bold text-hd-muted uppercase tracking-wider block">
                {TEXTS.reasonLabel}
              </label>
              <input 
                type="text" 
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                maxLength={30}
                placeholder={TEXTS.reasonPlaceholder}
                className="w-full bg-hd-bg border border-hd-border rounded-md px-3.5 py-2.5 text-sm text-hd-text placeholder-hd-muted focus:outline-none focus:border-hd-accent shadow-3xs"
              />
            </div>
          </div>
        )}

        {contractType === 'passen' && (
          <div className="space-y-3">
            <p className="text-xs text-hd-muted leading-relaxed">
              {TEXTS.passenInstructions}
            </p>
          </div>
        )}
      </div>

      {/* Result Preview Panel */}
      <div className="bg-hd-bg border border-hd-border rounded-lg p-4">
        <h4 className="text-[10px] font-bold text-hd-muted uppercase tracking-wider mb-2 font-mono">
          {TEXTS.previewResults}
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {players.map((p) => {
            const score = currentResult.scores[p.id] || 0;
            return (
              <div
                key={p.id}
                className="bg-hd-card rounded p-2 border border-hd-border text-center shadow-2xs"
              >
                <span className="text-[9px] font-bold text-hd-muted block mb-0.5 uppercase tracking-wider">
                  {p.name}
                </span>
                <span
                  className={`text-base font-mono font-bold ${
                    score > 0
                      ? 'text-emerald-700'
                      : score < 0
                      ? 'text-red-600'
                      : 'text-hd-muted'
                  }`}
                  id={`preview-score-${p.id}`}
                >
                  {score > 0 ? `+${score}` : score}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
