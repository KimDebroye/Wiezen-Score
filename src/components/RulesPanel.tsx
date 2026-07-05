import React from 'react';
import { X, BookOpen, Users, Trophy } from 'lucide-react';
import { TEXTS as DEFAULT_TEXTS } from '../locales/nl';

/**
 * Interface definition for the Rules Panel properties.
 */
interface RulesPanelProps {
  onClose: () => void;
  texts?: typeof DEFAULT_TEXTS;
}

/**
 * RulesPanel Component - Renders an interactive game rules guide in Dutch 
 * for Whist (Belgian Wiezen). Uses modern, theme-friendly styles.
 */
export default function RulesPanel({ onClose, texts = DEFAULT_TEXTS }: RulesPanelProps) {
  const TEXTS = texts;
  return (
    <div className="flex flex-col h-full bg-hd-card text-hd-text" id="rules-panel">
      {/* Header Panel */}
      <div className="px-5 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 border-b border-hd-border flex items-center justify-between shrink-0 bg-hd-header-bg">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-hd-accent" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider font-mono">
            {TEXTS.rulesTitle}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-hd-bg border border-transparent hover:border-hd-border rounded transition-all cursor-pointer text-hd-muted hover:text-hd-text"
          id="close-rules-btn"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Rules Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* Introduction Panel */}
        <div className="bg-hd-bg/40 border border-hd-border rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-hd-accent flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {TEXTS.rulesWhatIs}
          </h3>
          <p className="text-[11px] text-hd-muted leading-relaxed">
            {TEXTS.rulesWhatIsText}
          </p>
        </div>

        {/* List of Contracts */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-hd-muted uppercase tracking-widest border-b border-hd-border pb-1 font-mono">
            {TEXTS.rulesContractsHeader}
          </h4>

          {/* Vraag & Antwoord */}
          <div className="border border-hd-border rounded-xl p-4 space-y-1.5 hover:border-hd-text transition-all bg-hd-card shadow-3xs">
            <div className="flex justify-between items-start">
              <span className="text-xs font-extrabold text-hd-text font-mono">{TEXTS.rulesAskAndAnswerTitle}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-500/20">{TEXTS.rulesTricks8}</span>
            </div>
            <p className="text-[11px] text-hd-muted leading-relaxed">
              {TEXTS.rulesAskAndAnswerDesc}
            </p>
          </div>

          {/* Troel */}
          <div className="border border-hd-border rounded-xl p-4 space-y-1.5 hover:border-hd-text transition-all bg-hd-card shadow-3xs">
            <div className="flex justify-between items-start">
              <span className="text-xs font-extrabold text-hd-text font-mono">{TEXTS.rulesTroelTitle}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-500/20">{TEXTS.rulesTricks8}</span>
            </div>
            <p className="text-[11px] text-hd-muted leading-relaxed">
              {TEXTS.rulesTroelDesc}
            </p>
          </div>

          {/* Miserie */}
          <div className="border border-hd-border rounded-xl p-4 space-y-1.5 hover:border-hd-text transition-all bg-hd-card shadow-3xs">
            <div className="flex justify-between items-start">
              <span className="text-xs font-extrabold text-hd-text font-mono">{TEXTS.rulesMiseryTitle}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-full border border-rose-500/20">{TEXTS.rulesTricks0}</span>
            </div>
            <p className="text-[11px] text-hd-muted leading-relaxed">
              {TEXTS.rulesMiseryDesc}
            </p>
          </div>

          {/* Open Miserie */}
          <div className="border border-hd-border rounded-xl p-4 space-y-1.5 hover:border-hd-text transition-all bg-hd-card shadow-3xs">
            <div className="flex justify-between items-start">
              <span className="text-xs font-extrabold text-hd-text font-mono">{TEXTS.rulesOpenMiseryTitle}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-400 rounded-full border border-rose-500/20">{TEXTS.rulesTricks0}</span>
            </div>
            <p className="text-[11px] text-hd-muted leading-relaxed">
              {TEXTS.rulesOpenMiseryDesc}
            </p>
          </div>

          {/* Solo */}
          <div className="border border-hd-border rounded-xl p-4 space-y-1.5 hover:border-hd-text transition-all bg-hd-card shadow-3xs">
            <div className="flex justify-between items-start">
              <span className="text-xs font-extrabold text-hd-text font-mono">{TEXTS.rulesSoloTitle}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-full border border-amber-500/20">{TEXTS.rulesTricks9to12}</span>
            </div>
            <p className="text-[11px] text-hd-muted leading-relaxed">
              {TEXTS.rulesSoloDesc}
            </p>
          </div>

          {/* Solo Slim */}
          <div className="border border-hd-border rounded-xl p-4 space-y-1.5 hover:border-hd-text transition-all bg-hd-card shadow-3xs">
            <div className="flex justify-between items-start">
              <span className="text-xs font-extrabold text-hd-text font-mono">{TEXTS.rulesSoloSlimTitle}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-purple-500/10 text-purple-700 dark:text-purple-400 rounded-full border border-purple-500/20">{TEXTS.rulesTricks13}</span>
            </div>
            <p className="text-[11px] text-hd-muted leading-relaxed">
              {TEXTS.rulesSoloSlimDesc}
            </p>
          </div>

        </div>

        {/* Scoring & Overslagen explanation */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            {TEXTS.rulesScoringTitle}
          </h3>
          <p className="text-[11px] text-hd-muted leading-relaxed">
            {TEXTS.rulesScoringDesc1}
          </p>
          <p className="text-[11px] text-hd-muted leading-relaxed">
            {TEXTS.rulesScoringDesc2}
          </p>
        </div>
      </div>
    </div>
  );
}
