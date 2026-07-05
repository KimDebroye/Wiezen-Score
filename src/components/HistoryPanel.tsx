import React, { useState } from 'react';
import { Session } from '../types';
import { History, X, Calendar, Award, Trash2, ArrowLeftRight, Download, Upload, Copy, Check } from 'lucide-react';
import { TEXTS as DEFAULT_TEXTS } from '../locales/nl';

/**
 * Interface definition for the History Panel properties.
 */
interface HistoryPanelProps {
  sessions: Session[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onImportSessions: (sessions: Session[]) => void;
  onClose: () => void;
  texts?: typeof DEFAULT_TEXTS;
}

/**
 * Pure utility to safely escape raw CSV strings according to the RFC 4180 standard.
 * Surrounds fields containing commas, double quotes, or newlines with double quotes,
 * and escapes existing double quotes inside.
 * 
 * @param {string} field - Raw data value to escape.
 * @returns {string} Fully escaped string compliant with RFC 4180.
 */
const escapeCsvField = (field: string): string => {
  if (field === null || field === undefined) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Parses a single line from a CSV file, properly parsing quoted strings and escaped double quotes.
 * Supports configurable delimiter for different regional list separator defaults (e.g., semicolon on some devices).
 * 
 * @param {string} line - The raw separated line.
 * @param {string} delimiter - The delimiter character (default is comma).
 * @returns {string[]} An array of unescaped column values.
 */
const parseCsvLine = (line: string, delimiter: string = ','): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // skip the escaped quote pair
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
};

/**
 * HistoryPanel Component - Renders a sidebar list of previous Whist game sessions.
 * Supports individual session reactivation, file deletion, and direct import/export of 
 * backup spreadsheets with advanced conflict merging options.
 */
export default function HistoryPanel({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onImportSessions,
  onClose,
  texts = DEFAULT_TEXTS,
}: HistoryPanelProps) {
  const TEXTS = texts;
  // Tracking feedback for single session text copied triggers
  const [copiedSessionId, setCopiedSessionId] = useState<string | null>(null);
  
  // Feedback status banner states for CSV backup operations
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  
  // Interactive wizard states for incoming session backup merges
  const [pendingImportSessions, setPendingImportSessions] = useState<Session[] | null>(null);
  const [hasConflicts, setHasConflicts] = useState(false);

  // Manual text-paste import backup modal
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');

  // Sort sessions with the newest played games appearing first
  const sortedSessions = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  /**
   * Helper to convert an ISO timestamp into a beautiful local date string representation.
   */
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const locale = TEXTS.localeDateCode;
      return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  /**
   * Translates contract structural details into highly readable localized labels for the history sheet.
   */
  const getContractLabel = (contract: any, players: { id: string; name: string }[]) => {
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

    const statusText = isSuccess ? cl.succeeded : cl.failed;

    switch (type) {
      case 'ask_answer': {
        const asker = getPlayerName(contract.askerId);
        const tricks = contract.tricks !== undefined ? ` (${contract.tricks} ${cl.tricks})` : '';
        if (contract.responderId && contract.responderId !== 'none') {
          const responder = getPlayerName(contract.responderId);
          return `${asker} & ${responder}: ${cl.askAndAnswer}${tricks} (${statusText})`;
        }
        return `${asker}: ${cl.askAlone}${tricks} (${statusText})`;
      }
      case 'troel': {
        const asker = getPlayerName(contract.askerId);
        const tricks = contract.tricks !== undefined ? ` (${contract.tricks} ${cl.tricks})` : '';
        if (contract.responderId && contract.responderId !== 'none') {
          const responder = getPlayerName(contract.responderId);
          return `${asker} & ${responder}: ${cl.troelTogether}${tricks} (${statusText})`;
        }
        return `${asker}: ${cl.troelAlone}${tricks} (${statusText})`;
      }
      case 'misery': {
        return `${cl.misery} (${statusText})`;
      }
      case 'open_misery': {
        return `${cl.openMisery} (${statusText})`;
      }
      case 'solo': {
        const player = getPlayerName(contract.soloPlayerId);
        return `${player}: ${cl.solo} ${contract.tricks || 9} (${statusText})`;
      }
      case 'solo_slim': {
        const player = getPlayerName(contract.soloPlayerId);
        return `${player}: ${cl.soloSlim} (${statusText})`;
      }
      case 'passen': {
        return cl.passLabel;
      }
      case 'custom': {
        if (contract.customReason) {
          return `${cl.manualScore} - ${contract.customReason}`;
        }
        return cl.manualScore;
      }
      default:
        return cl.contractFallback;
    }
  };

  /**
   * Generates total summary scores of a game session to display in the overview card.
   */
  const getSessionSummary = (session: Session) => {
    if (session.rounds.length === 0) {
      return {
        summaryText: TEXTS.noRoundsPlayed,
        playersText: session.players.map(p => p.name).join(' - '),
        winnerName: null
      };
    }

    const lastRound = session.rounds[session.rounds.length - 1];
    
    // Determine the player with the highest final score
    let maxScore = -Infinity;
    let winner: string | null = null;
    
    const scores = Object.entries(lastRound.totals).map(([id, total]) => {
      const player = session.players.find(p => p.id === id);
      const name = player ? player.name : id;
      if (total > maxScore) {
        maxScore = total;
        winner = name;
      }
      return `${name}: ${total > 0 ? '+' : ''}${total}`;
    });

    return {
      summaryText: `${session.rounds.length} ${TEXTS.roundsUnit} • ${scores.join(', ')}`,
      playersText: session.players.map(p => p.name).join(' - '),
      winnerName: maxScore > 0 ? winner : null
    };
  };

  /**
   * Generates CSV data content from the current active history sessions.
   */
  const generateBackupCsvContent = (): string => {
    const headers = ['id', 'date', 'isActive', 'players', 'rounds'].join(',');
    const rows = sessions.map((s) => {
      const idEscaped = escapeCsvField(s.id);
      const dateEscaped = escapeCsvField(s.date);
      const activeEscaped = escapeCsvField(String(s.isActive));
      const playersEscaped = escapeCsvField(JSON.stringify(s.players));
      const roundsEscaped = escapeCsvField(JSON.stringify(s.rounds));
      return `${idEscaped},${dateEscaped},${activeEscaped},${playersEscaped},${roundsEscaped}`;
    });
    return [headers, ...rows].join("\n");
  };

  /**
   * Packages and downloads all history sessions as a single consolidated CSV document.
   */
  const handleExportAll = () => {
    try {
      const csvContent = generateBackupCsvContent();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `wiezen_score_backups_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showStatus(TEXTS.backupExportedSuccess, "success");
    } catch (e) {
      showStatus(TEXTS.exportBackupFailedError, "error");
    }
  };

  /**
   * Generates CSV/JSON payload and copies it to clipboard for bulletproof copy/paste backup.
   */
  const handleCopyBackupToClipboard = () => {
    try {
      const csvContent = generateBackupCsvContent();
      navigator.clipboard.writeText(csvContent).then(() => {
        showStatus(TEXTS.backupCopiedSuccess, "success");
      }).catch(() => {
        showStatus(TEXTS.copyBackupFailedError, "error");
      });
    } catch (e) {
      showStatus(TEXTS.generateBackupFailedError, "error");
    }
  };

  /**
   * Parses text backup content from either CSV or JSON, validates format,
   * handles commas vs semicolons regional overrides, and queues import wizard.
   */
  const processImportText = (text: string): boolean => {
    try {
      if (!text || !text.trim()) {
        showStatus(TEXTS.importError, "error");
        return false;
      }

      let cleanedText = text.trim();

      // Clean byte order mark (BOM) if present
      if (cleanedText.startsWith('\uFEFF')) {
        cleanedText = cleanedText.substring(1);
      }

      // Check if the file is URL-encoded (common issue when mobile browsers save data: URIs raw)
      if (cleanedText.includes('%22') || cleanedText.includes('%2C') || cleanedText.includes('%5B') || cleanedText.includes('%7B')) {
        try {
          cleanedText = decodeURIComponent(cleanedText);
        } catch (err) {
          // Proceed with raw text if decoding fails
        }
      }

      let importedSessions: Session[] = [];

      // Check if it's a JSON array or single object
      if (cleanedText.startsWith('[') || cleanedText.startsWith('{')) {
        try {
          const parsed = JSON.parse(cleanedText);
          const rawSessions = Array.isArray(parsed) ? parsed : [parsed];
          for (const s of rawSessions) {
            if (s && s.id && s.date && Array.isArray(s.players) && Array.isArray(s.rounds)) {
              importedSessions.push({
                id: String(s.id),
                date: String(s.date),
                isActive: Boolean(s.isActive),
                players: s.players,
                rounds: s.rounds
              });
            }
          }
        } catch (jsonErr) {
          // Fall back to CSV parsing
        }
      }

      // If not parsed as JSON, parse as CSV
      if (importedSessions.length === 0) {
        const lines = cleanedText.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) {
          showStatus(TEXTS.importError, "error");
          return false;
        }

        const headerLine = lines[0];
        if (!headerLine.includes('players') || !headerLine.includes('rounds')) {
          showStatus(TEXTS.importError, "error");
          return false;
        }

        // Auto-detect list separator/delimiter: comma (,) vs semicolon (;)
        // European excel locales default to semicolon for CSV exports
        const delimiter = headerLine.includes(';') ? ';' : ',';

        for (let i = 1; i < lines.length; i++) {
          const rowValues = parseCsvLine(lines[i], delimiter);
          if (rowValues.length < 5) continue;

          const id = rowValues[0];
          const date = rowValues[1];
          const isActive = rowValues[2] === 'true';
          
          let players;
          let rounds;
          try {
            players = JSON.parse(rowValues[3]);
            rounds = JSON.parse(rowValues[4]);
          } catch (jsonErr) {
            // Android WebView single quotes fallback conversion
            try {
              players = JSON.parse(rowValues[3].replace(/'/g, '"'));
              rounds = JSON.parse(rowValues[4].replace(/'/g, '"'));
            } catch (innerErr) {
              continue;
            }
          }

          importedSessions.push({
            id,
            date,
            isActive,
            players,
            rounds
          });
        }
      }

      if (importedSessions.length === 0) {
        showStatus(TEXTS.importError, "error");
        return false;
      }

      // Assess potential overlaps
      const currentIds = new Set(sessions.map(s => s.id));
      const conflicting = importedSessions.some(s => currentIds.has(s.id));

      setPendingImportSessions(importedSessions);
      setHasConflicts(conflicting);
      return true;
    } catch (err) {
      showStatus(TEXTS.importError, "error");
      return false;
    }
  };

  /**
   * Pre-loads the selected backup file, assesses potential duplication conflicts,
   * and triggers the interactive resolution modal choice.
   */
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processImportText(text);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset files array
  };

  /**
   * Generates and downloads a single game session as a CSV file.
   */
  const handleDownloadSingleCSV = (session: Session) => {
    try {
      const headers = ['id', 'date', 'isActive', 'players', 'rounds'].join(',');
      const idEscaped = escapeCsvField(session.id);
      const dateEscaped = escapeCsvField(session.date);
      const activeEscaped = escapeCsvField(String(session.isActive));
      const playersEscaped = escapeCsvField(JSON.stringify(session.players));
      const roundsEscaped = escapeCsvField(JSON.stringify(session.rounds));
      const row = `${idEscaped},${dateEscaped},${activeEscaped},${playersEscaped},${roundsEscaped}`;

      const csvContent = [headers, row].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const dateStr = new Date(session.date).toISOString().slice(0, 10);
      link.setAttribute("download", `wiezen_score_game_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showStatus(TEXTS.gameExportedSuccess, "success");
    } catch (e) {
      showStatus(TEXTS.exportGameFailedError, "error");
    }
  };

  /**
   * Copies a comprehensive, beautifully formatted text breakdown of the game to the clipboard.
   */
  const handleCopySingleText = (session: Session) => {
    try {
      const dateStr = formatDate(session.date);
      let text = `🏆 ${TEXTS.appTitle} - ${dateStr}\n`;
      text += `👥 ${TEXTS.playersLabel} ${session.players.map(p => p.name).join(' - ')}\n\n`;
      
      if (session.rounds.length === 0) {
        text += TEXTS.noRoundsPlayedHistory;
      } else {
        text += TEXTS.roundHistoryPrefix;
        session.rounds.forEach((r) => {
          const scoresStr = session.players.map((p) => {
            const s = r.scores[p.id] ?? 0;
            return `${p.name}: ${s > 0 ? '+' : ''}${s}`;
          }).join(', ');
          const contractStr = r.contract ? ` [${getContractLabel(r.contract, session.players)}]` : '';
          const roundText = TEXTS.roundHistoryRound;
          text += `• ${roundText} ${r.roundNumber}: ${scoresStr}${contractStr}\n`;
        });
        
        const lastRound = session.rounds[session.rounds.length - 1];
        text += TEXTS.finalStandings;
        const standings = session.players.map((p) => {
          const finalTotal = lastRound ? lastRound.totals[p.id] : 0;
          const formattedTotal = finalTotal > 0 ? `+${finalTotal}` : `${finalTotal}`;
          return `• ${p.name}: ${formattedTotal}`;
        }).join('\n');
        text += standings;
      }

      navigator.clipboard.writeText(text).then(() => {
        setCopiedSessionId(session.id);
        setTimeout(() => setCopiedSessionId(null), 2000);
      });
    } catch (e) {
      showStatus(TEXTS.errorCopyingScores, "error");
    }
  };

  /**
   * Sets and clears temporary status strings.
   */
  const showStatus = (text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  return (
    <div className="flex flex-col h-full bg-hd-card relative text-hd-text">
      {/* Header Panel */}
      <div className="flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 bg-hd-header-bg border-b-2 border-hd-header-border shrink-0">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-hd-text" />
          <h2 className="text-base font-bold uppercase tracking-tight text-hd-text">{TEXTS.historyTitle}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-hd-bg/80 border border-transparent hover:border-hd-border transition-colors cursor-pointer"
          id="close-history-btn"
        >
          <X className="w-4 h-4 text-hd-muted" />
        </button>
      </div>

      {/* Main Sessions List View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-hd-card">
        {sortedSessions.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-3">
            <History className="w-10 h-10 text-hd-muted mx-auto" />
            <p className="text-hd-text font-bold uppercase tracking-wider text-xs">{TEXTS.noHistoryTitle}</p>
            <p className="text-[10px] text-hd-muted font-mono uppercase tracking-wider">{TEXTS.noHistoryDesc}</p>
          </div>
        ) : (
          sortedSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const { summaryText, playersText, winnerName } = getSessionSummary(session);

            return (
              <div
                key={session.id}
                className={`p-4 bg-hd-card rounded-lg border transition-all ${
                  isActive
                    ? 'border-hd-text ring-1 ring-hd-text/10 shadow-xs'
                    : 'border-hd-border hover:border-hd-text'
                }`}
                id={`session-card-${session.id}`}
              >
                <div className="flex flex-col gap-2.5">
                  {/* Top row: Date/label and action symbols (CSV, copy, delete) */}
                  <div className="flex items-center justify-between gap-2 border-b border-hd-border/10 pb-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-hd-muted" />
                      <span className="text-xs font-bold text-hd-text">
                        {formatDate(session.date)}
                      </span>
                      {isActive && session.isActive && (
                        <span className="px-1.5 py-0.5 bg-hd-accent text-white text-[9px] font-bold rounded uppercase tracking-wider">
                          {TEXTS.activeBadge}
                        </span>
                      )}
                    </div>

                    {/* Action buttons (CSV, copy, delete) */}
                    <div className="flex items-center gap-0.5 shrink-0">
                      {/* 1. Activate session button (Only shown if NOT active) */}
                      {!isActive && (
                        <button
                          onClick={() => {
                            onSelectSession(session.id);
                            onClose();
                          }}
                          className="p-1.5 text-hd-accent hover:bg-hd-bg border border-transparent hover:border-hd-border rounded transition-all cursor-pointer"
                          title={TEXTS.activateSessionTooltip}
                          id={`activate-session-${session.id}`}
                        >
                          <ArrowLeftRight className="w-4 h-4" />
                        </button>
                      )}

                      {/* 2. Download Single Session CSV button */}
                      <button
                        onClick={() => handleDownloadSingleCSV(session)}
                        className="p-1.5 text-hd-muted hover:text-hd-text hover:bg-hd-bg border border-transparent hover:border-hd-border rounded transition-all cursor-pointer"
                        title={TEXTS.exportSessionTooltip}
                        id={`csv-session-${session.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {/* 3. Copy Single Session Text button */}
                      <button
                        onClick={() => handleCopySingleText(session)}
                        className="p-1.5 text-hd-muted hover:text-hd-text hover:bg-hd-bg border border-transparent hover:border-hd-border rounded transition-all cursor-pointer"
                        title={TEXTS.copySessionTooltip}
                        id={`copy-session-${session.id}`}
                      >
                        {copiedSessionId === session.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      
                      {/* 4. Delete Session (Trash) button */}
                      <button
                        onClick={() => onDeleteSession(session.id)}
                        className="p-1.5 text-hd-muted hover:text-red-600 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded transition-all cursor-pointer"
                        title={TEXTS.deleteSessionTooltip}
                        id={`delete-session-${session.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom details flowing cleanly underneath the header */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-hd-muted font-mono tracking-wider uppercase">
                      {TEXTS.playersLabel} {playersText}
                    </p>
                    
                    <p className="text-xs text-hd-text font-mono leading-relaxed">
                      {summaryText}
                    </p>

                    {winnerName && (
                      <div className="flex items-center gap-1.5 mt-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider font-mono px-2 py-0.5 rounded border border-emerald-500/20 w-fit">
                        <Award className="w-3 h-3 text-emerald-500" />
                        {TEXTS.winnerLabel} {winnerName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Backup and Import/Export Section at the Bottom */}
      <div className="px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1.2rem)] pt-4 bg-hd-card border-t-2 border-hd-border shrink-0 shadow-xs">
        <div className="p-3.5 bg-hd-bg/85 border-2 border-dashed border-hd-border rounded-xl space-y-2 shadow-2xs">
          <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-hd-text font-mono flex items-center gap-1.5">
            <ArrowLeftRight className="w-3.5 h-3.5 text-hd-accent" />
            {TEXTS.exportHistoryHeader}
          </h3>
          
          {/* Row 1: File Export & File Import */}
          <div className="flex gap-2">
            <button
              onClick={handleExportAll}
              className="flex-1 py-1.5 px-2 bg-hd-card hover:bg-hd-bg text-hd-text border border-hd-border hover:border-hd-text rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:translate-y-0.5"
              id="export-all-history-btn"
              title={TEXTS.exportAllTooltip}
            >
              <Download className="w-3.5 h-3.5 text-hd-accent" />
              <span>{TEXTS.exportAllBtn}</span>
            </button>
            <label
              className="flex-1 py-1.5 px-2 bg-hd-card hover:bg-hd-bg text-hd-text border border-hd-border hover:border-hd-text rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:translate-y-0.5 text-center cursor-pointer"
              id="import-all-history-label"
              title={TEXTS.importAllTooltip}
            >
              <Upload className="w-3.5 h-3.5 text-hd-accent flex-shrink-0" />
              <span>{TEXTS.chooseFileBtn}</span>
              <input
                type="file"
                accept=".csv,text/csv,text/plain,application/csv,application/vnd.ms-excel,*/*"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Row 2: Clipboard Copy & Paste (Bulletproof for Mobile Webview/APK wrappers) */}
          <div className="flex gap-2">
            <button
              onClick={handleCopyBackupToClipboard}
              className="flex-1 py-1.5 px-2 bg-hd-card hover:bg-hd-bg text-hd-text border border-hd-border hover:border-hd-text rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:translate-y-0.5"
              id="copy-backup-text-btn"
              title={TEXTS.copyBackupTooltip}
            >
              <Copy className="w-3.5 h-3.5 text-hd-accent" />
              <span>{TEXTS.copyBackupBtn}</span>
            </button>
            <button
              onClick={() => {
                setPasteText('');
                setShowPasteModal(true);
              }}
              className="flex-1 py-1.5 px-2 bg-hd-card hover:bg-hd-bg text-hd-text border border-hd-border hover:border-hd-text rounded-lg text-[9px] font-extrabold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:translate-y-0.5 text-center"
              id="paste-backup-text-btn"
              title={TEXTS.pasteBackupTooltip}
            >
              <Upload className="w-3.5 h-3.5 text-hd-accent" />
              <span>{TEXTS.pasteTextBtn}</span>
            </button>
          </div>

          {statusMessage && (
            <div className={`text-[9px] font-bold uppercase tracking-wider font-mono text-center p-1.5 rounded-md border transition-all ${
              statusMessage.type === 'success' 
                ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20' 
                : 'text-rose-700 bg-rose-500/10 border-rose-500/20'
            }`}>
              {statusMessage.text}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Import Dialog / Overwrite Options Modal */}
      {pendingImportSessions && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[200] p-4 animate-fade-in">
          <div className="bg-hd-card w-full max-w-sm rounded-2xl shadow-2xl p-5 border border-hd-border flex flex-col space-y-4 text-hd-text">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-hd-bg flex items-center justify-center border border-hd-border mx-auto">
                <Upload className="w-5 h-5 text-hd-accent" />
              </div>
              <h3 className="text-xs font-extrabold text-hd-text uppercase tracking-wider font-mono">
                {TEXTS.importGamesTitle}
              </h3>
              <p className="text-[11px] text-hd-muted font-sans px-1">
                {TEXTS.importGamesDesc.replace('{count}', String(pendingImportSessions.length))}
              </p>
            </div>

            <div className="space-y-2">
              {/* Option 1: Overwrite All */}
              <button
                onClick={() => {
                  onImportSessions(pendingImportSessions);
                  setPendingImportSessions(null);
                  showStatus(TEXTS.allSessionsOverwrittenSuccess, "success");
                }}
                className="w-full p-2.5 bg-hd-card hover:bg-red-500/5 border border-hd-border hover:border-red-500/30 rounded-lg text-left transition-all group flex flex-col gap-0.5 cursor-pointer text-hd-text"
              >
                <span className="text-[10px] font-extrabold text-red-600 uppercase tracking-wider flex items-center gap-1 font-mono">
                  {TEXTS.overwriteAllBtn}
                </span>
                <span className="text-[9px] text-hd-muted group-hover:text-red-500/80 font-sans leading-tight">
                  {TEXTS.overwriteAllDesc}
                </span>
              </button>

              {/* Option 2: Append & Overwrite duplicates */}
              <button
                onClick={() => {
                  const existingMap = new Map(sessions.map(s => [s.id, s]));
                  pendingImportSessions.forEach(s => {
                    existingMap.set(s.id, s);
                  });
                  onImportSessions(Array.from(existingMap.values()));
                  setPendingImportSessions(null);
                  showStatus(TEXTS.sessionsAppendedOverwriteSuccess, "success");
                }}
                className="w-full p-2.5 bg-hd-card hover:bg-emerald-500/5 border border-hd-border hover:border-emerald-500/30 rounded-lg text-left transition-all group flex flex-col gap-0.5 cursor-pointer text-hd-text"
              >
                <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider flex items-center gap-1 font-mono">
                  {hasConflicts ? TEXTS.appendOverwriteBtn : TEXTS.appendOnlyBtn}
                </span>
                <span className="text-[9px] text-hd-muted group-hover:text-emerald-500/80 font-sans leading-tight">
                  {hasConflicts 
                    ? TEXTS.appendOverwriteDesc 
                    : TEXTS.appendOnlyDesc}
                </span>
              </button>

              {/* Option 3: Append & Keep duplicates (only shown if there are conflicts) */}
              {hasConflicts && (
                <button
                  onClick={() => {
                    const existingMap = new Map(sessions.map(s => [s.id, s]));
                    pendingImportSessions.forEach(s => {
                      if (!existingMap.has(s.id)) {
                        existingMap.set(s.id, s);
                      }
                    });
                    onImportSessions(Array.from(existingMap.values()));
                    setPendingImportSessions(null);
                    showStatus(TEXTS.sessionsAppendedKeepSuccess, "success");
                  }}
                  className="w-full p-2.5 bg-hd-card hover:bg-hd-bg border border-hd-border hover:border-hd-text rounded-lg text-left transition-all group flex flex-col gap-0.5 cursor-pointer text-hd-text"
                >
                  <span className="text-[10px] font-extrabold text-hd-text uppercase tracking-wider flex items-center gap-1 font-mono">
                    {TEXTS.appendKeepBtn}
                  </span>
                  <span className="text-[9px] text-hd-muted group-hover:text-hd-text font-sans leading-tight">
                    {TEXTS.appendKeepDesc}
                  </span>
                </button>
              )}
            </div>

            <button
              onClick={() => setPendingImportSessions(null)}
              className="w-full py-1.5 bg-hd-bg hover:bg-hd-border border border-hd-border rounded-lg text-[9px] font-extrabold uppercase tracking-widest text-hd-muted hover:text-hd-text transition-all cursor-pointer font-mono"
            >
              {TEXTS.cancelBtn}
            </button>
          </div>
        </div>
      )}

      {/* Manual Paste Text Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[200] p-4 animate-fade-in">
          <div className="bg-hd-card w-full max-w-sm rounded-2xl shadow-2xl p-5 border border-hd-border flex flex-col space-y-4 text-hd-text">
            <div className="text-center space-y-1.5">
              <div className="w-10 h-10 rounded-full bg-hd-bg flex items-center justify-center border border-hd-border mx-auto">
                <Upload className="w-5 h-5 text-hd-accent" />
              </div>
              <h3 className="text-xs font-extrabold text-hd-text uppercase tracking-wider font-mono">
                {TEXTS.pasteModalTitle}
              </h3>
              <p className="text-[10px] text-hd-muted font-sans px-1 leading-tight">
                {TEXTS.pasteModalDesc}
              </p>
            </div>

            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={TEXTS.pasteModalPlaceholder}
              className="w-full h-32 p-2.5 bg-hd-bg border border-hd-border focus:border-hd-accent rounded-lg text-xs font-mono resize-none focus:outline-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPasteModal(false);
                  setPasteText('');
                }}
                className="flex-1 py-1.5 bg-hd-bg hover:bg-hd-border border border-hd-border rounded-lg text-[9px] font-extrabold uppercase tracking-widest text-hd-muted hover:text-hd-text transition-all cursor-pointer font-mono"
              >
                {TEXTS.cancelBtn}
              </button>
              <button
                onClick={() => {
                  if (!pasteText.trim()) {
                    showStatus(TEXTS.pleaseEnterBackupTextError, "error");
                    return;
                  }
                  const success = processImportText(pasteText);
                  if (success) {
                    setShowPasteModal(false);
                    setPasteText('');
                  }
                }}
                className="flex-1 py-1.5 bg-hd-accent hover:opacity-90 text-white rounded-lg text-[9px] font-extrabold uppercase tracking-widest transition-all cursor-pointer font-mono"
              >
                {TEXTS.importBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
