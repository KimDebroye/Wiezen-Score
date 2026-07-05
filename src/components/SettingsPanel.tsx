import React from 'react';
import { GameSettings, Session, Player } from '../types';
import { RotateCcw, Sliders, X, Play, User, Square, Palette, Check, Globe } from 'lucide-react';
import { TEXTS as DEFAULT_TEXTS } from '../locales/nl';
import { THEMES } from '../themes';
import { LOCALES } from '../locales';

/**
 * Interface defining the properties accepted by the SettingsPanel Component.
 */
interface SettingsPanelProps {
  settings: GameSettings;
  onUpdateSettings: (settings: GameSettings) => void;
  onResetSession: () => void;
  onNewSession: () => void;
  onEndSession?: () => void;
  activeSessionIsActive?: boolean;
  onClose: () => void;
  sessions: Session[];
  players?: Player[];
  onUpdatePlayerName?: (playerId: string, newName: string) => void;
  
  // Theme management states passed down from the central App context
  currentThemeId: string;
  onChangeTheme: (themeId: string) => void;

  // Language management states
  texts?: typeof DEFAULT_TEXTS;
  currentLanguageId: string;
  onChangeLanguage: (langId: 'nl' | 'en') => void;
}

/**
 * Standard default coefficients matching the International World Whist Association
 * and typical Belgian local café standard rule guidelines.
 */
export const DEFAULT_SETTINGS: GameSettings = {
  askAndAnswerBase: 2,
  askAndAnswerOvertrick: 1,
  askAndAnswerAloneBase: 2,
  askAndAnswerAloneOvertrick: 1,
  troelBase: 4,
  troelOvertrick: 2,
  troelAloneBase: 4,
  troelAloneOvertrick: 2,
  miseryPoints: 7,
  openMiseryPoints: 14,
  soloAbondancePoints: 5,
  soloSlimPoints: 30,
  askAndAnswerTricksTarget: 8,
  askAndAnswerAloneTricksTarget: 5,
  troelTricksTarget: 8,
};

/**
 * SettingsPanel Component - Offers comprehensive configuration of scoring factors,
 * player uppercase profile names, core session controllers, and visual style skin customization.
 */
export default function SettingsPanel({
  settings,
  onUpdateSettings,
  onResetSession,
  onNewSession,
  onEndSession,
  activeSessionIsActive = true,
  onClose,
  players,
  onUpdatePlayerName,
  currentThemeId,
  onChangeTheme,
  texts = DEFAULT_TEXTS,
  currentLanguageId,
  onChangeLanguage,
}: SettingsPanelProps) {
  const TEXTS = texts;
  // Tracking intermediate state before committing resetting action
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [showTricksResetConfirm, setShowTricksResetConfirm] = React.useState(false);

  /**
   * Helper to write back changes to a single mathematical multiplier value inside coefficients settings.
   */
  const handleChange = (key: keyof GameSettings, value: number) => {
    onUpdateSettings({
      ...settings,
      [key]: value,
    });
  };

  /**
   * Safe confirmation timeout trigger for target tricks restoration.
   */
  const handleResetTricksToDefault = () => {
    if (showTricksResetConfirm) {
      onUpdateSettings({
        ...settings,
        askAndAnswerTricksTarget: 8,
        askAndAnswerAloneTricksTarget: 5,
        troelTricksTarget: 8,
      });
      setShowTricksResetConfirm(false);
    } else {
      setShowTricksResetConfirm(true);
      setTimeout(() => setShowTricksResetConfirm(false), 3000);
    }
  };

  /**
   * Safe confirmation timeout trigger for coefficient restoration.
   */
  const handleResetToDefault = () => {
    if (showResetConfirm) {
      onUpdateSettings(DEFAULT_SETTINGS);
      setShowResetConfirm(false);
    } else {
      setShowResetConfirm(true);
      setTimeout(() => setShowResetConfirm(false), 3000);
    }
  };

  return (
    <div className="flex flex-col h-full bg-hd-card text-hd-text">
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)] pb-4 bg-hd-header-bg border-b-2 border-hd-header-border shrink-0">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-hd-text" />
          <h2 className="text-base font-bold uppercase tracking-tight text-hd-text">{TEXTS.settingsTitle}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-hd-bg/80 border border-transparent hover:border-hd-border transition-colors cursor-pointer"
          id="close-settings-btn"
        >
          <X className="w-4 h-4 text-hd-muted" />
        </button>
      </div>

      {/* Main configuration content block */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-hd-card">
        
        {/* Visual Themes Skin Chooser Section */}
        <div className="bg-hd-bg/40 rounded-lg p-4 border border-hd-border space-y-3">
          <h3 className="text-[10px] font-bold text-hd-muted uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-hd-accent" />
            {TEXTS.themeVisualLabel}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {THEMES.map((theme) => {
              const isSelected = theme.id === currentThemeId;
              const translatedName = TEXTS.themes?.[theme.id as keyof typeof TEXTS.themes] || theme.name;
              return (
                <button
                  key={theme.id}
                  onClick={() => onChangeTheme(theme.id)}
                  className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden select-none ${
                    isSelected 
                      ? 'border-hd-text ring-1 ring-hd-text bg-hd-card' 
                      : 'border-hd-border/60 hover:border-hd-text bg-hd-bg/30'
                  }`}
                  id={`theme-btn-${theme.id}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide truncate">
                      {translatedName}
                    </span>
                    {isSelected && (
                      <Check className="w-3 h-3 text-hd-accent shrink-0" />
                    )}
                  </div>
                  
                  {/* Decorative color swatches preview dot line */}
                  <div className="flex gap-1 mt-2">
                    <span className="w-2 h-2 rounded-full border border-hd-border/20" style={{ backgroundColor: theme.colors.bg }} title={TEXTS.themeColors?.bg} />
                    <span className="w-2 h-2 rounded-full border border-hd-border/20" style={{ backgroundColor: theme.colors.cardBg }} title={TEXTS.themeColors?.card} />
                    <span className="w-2 h-2 rounded-full border border-hd-border/20" style={{ backgroundColor: theme.colors.accent }} title={TEXTS.themeColors?.accent} />
                    <span className="w-2 h-2 rounded-full border border-hd-border/20" style={{ backgroundColor: theme.colors.text }} title={TEXTS.themeColors?.text} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Selection Section */}
        <div className="bg-hd-bg/40 rounded-lg p-4 border border-hd-border space-y-3">
          <h3 className="text-[10px] font-bold text-hd-muted uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-hd-accent" />
            {TEXTS.languageLabel}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(LOCALES).map((loc) => {
              const isSelected = loc.id === currentLanguageId;
              return (
                <button
                  key={loc.id}
                  onClick={() => onChangeLanguage(loc.id as 'nl' | 'en')}
                  className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer relative overflow-hidden select-none ${
                    isSelected 
                      ? 'border-hd-text ring-1 ring-hd-text bg-hd-card' 
                      : 'border-hd-border/60 hover:border-hd-text bg-hd-bg/30'
                  }`}
                  id={`lang-btn-${loc.id}`}
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wide truncate">
                    {loc.id === 'nl' ? TEXTS.dutch : TEXTS.english}
                  </span>
                  {isSelected && (
                    <Check className="w-3 h-3 text-hd-accent shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Player uppercase Initials Editing */}
        {players && onUpdatePlayerName && (
          <div className="bg-hd-bg/40 rounded-lg p-4 border border-hd-border space-y-3">
            <h3 className="text-[10px] font-bold text-hd-muted uppercase tracking-wider mb-1 font-mono flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-hd-accent" />
              {TEXTS.playersAndNamesTitle}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {players.map((p, idx) => (
                <div key={p.id} className="space-y-1">
                  <label className="text-[9px] font-bold text-hd-muted uppercase tracking-wider block">
                    {TEXTS.player} {idx + 1}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={p.name ?? ''}
                      onChange={(e) => onUpdatePlayerName(p.id, e.target.value)}
                      maxLength={3}
                      className="w-full pl-2 pr-8 py-1.5 border border-hd-border rounded-lg bg-hd-card text-hd-text font-mono font-bold text-sm uppercase focus:outline-none focus:border-hd-accent"
                      placeholder={`SP${idx+1}`}
                      id={`settings-player-name-${p.id}`}
                    />
                    <div className="absolute right-2.5 w-5 h-5 rounded-full bg-hd-bg border border-hd-border flex items-center justify-center font-mono font-bold text-[9px] text-hd-text uppercase select-none pointer-events-none">
                      {p.name || '?'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game State Management Actions */}
        <div className="bg-hd-bg/40 rounded-lg p-4 border border-hd-border space-y-3">
          <h3 className="text-[10px] font-bold text-hd-muted uppercase tracking-wider mb-2 font-mono">
            {TEXTS.gameManagementTitle}
          </h3>
          {activeSessionIsActive ? (
            onEndSession && (
              <button
                onClick={onEndSession}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
                id="end-current-session-btn"
              >
                <Square className="w-3.5 h-3.5 fill-white" />
                {TEXTS.endCurrentGameBtn}
              </button>
            )
          ) : (
            <button
              onClick={onNewSession}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
              id="start-new-session-btn"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              {TEXTS.startNewGameBtn}
            </button>
          )}
          
          <button
            onClick={onResetSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-hd-border hover:bg-hd-bg text-hd-text rounded-lg font-bold uppercase tracking-wider text-xs transition-colors cursor-pointer"
            id="reset-current-session-btn"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {TEXTS.resetAndRestartBtn}
          </button>
        </div>

        {/* Target Tricks Configuration Section */}
        <div className="bg-hd-bg/40 rounded-lg p-4 border border-hd-border space-y-4">
          <div className="flex items-center justify-between border-b border-hd-border pb-2 mb-2">
            <h3 className="text-[10px] font-bold text-hd-muted uppercase tracking-wider font-mono">
              {TEXTS.targetTricksSectionTitle}
            </h3>
            <button
              onClick={handleResetTricksToDefault}
              className={`text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                showTricksResetConfirm ? 'text-red-600 hover:underline' : 'text-hd-accent hover:underline'
              }`}
              id="reset-tricks-defaults-btn"
            >
              {showTricksResetConfirm ? TEXTS.sureResetConfirm : TEXTS.resetScoringDefaultBtn}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col justify-end">
              <span className="text-[9px] text-hd-muted font-mono block mb-1 uppercase tracking-wider leading-tight">
                {TEXTS.askAndAnswerTogether}
              </span>
              <div className="flex items-center">
                <input
                  type="number"
                  value={settings.askAndAnswerTricksTarget ?? 8}
                  onChange={(e) => handleChange('askAndAnswerTricksTarget', Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-hd-border rounded bg-hd-card text-hd-text font-mono font-bold text-center focus:outline-none focus:border-hd-accent"
                  min="1"
                  max="13"
                  id="input-setting-tricks-va-target"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <span className="text-[9px] text-hd-muted font-mono block mb-1 uppercase tracking-wider leading-tight">
                {TEXTS.askAndAnswerAlone}
              </span>
              <div className="flex items-center">
                <input
                  type="number"
                  value={settings.askAndAnswerAloneTricksTarget ?? 5}
                  onChange={(e) => handleChange('askAndAnswerAloneTricksTarget', Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-hd-border rounded bg-hd-card text-hd-text font-mono font-bold text-center focus:outline-none focus:border-hd-accent"
                  min="1"
                  max="13"
                  id="input-setting-tricks-vaa-target"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <span className="text-[9px] text-hd-muted font-mono block mb-1 uppercase tracking-wider leading-tight">
                {TEXTS.troelTitle}
              </span>
              <div className="flex items-center">
                <input
                  type="number"
                  value={settings.troelTricksTarget ?? 8}
                  onChange={(e) => handleChange('troelTricksTarget', Number(e.target.value))}
                  className="w-full px-2 py-1.5 border border-hd-border rounded bg-hd-card text-hd-text font-mono font-bold text-center focus:outline-none focus:border-hd-accent"
                  min="1"
                  max="13"
                  id="input-setting-tricks-troel-target"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Multipliers Coefficients Tuning Section */}
        <div className="bg-hd-bg/40 rounded-lg p-4 border border-hd-border space-y-4">
          <div className="flex items-center justify-between border-b border-hd-border pb-2 mb-2">
            <h3 className="text-[10px] font-bold text-hd-muted uppercase tracking-wider font-mono">
              {TEXTS.pointsCalculationTitle}
            </h3>
            <button
              onClick={handleResetToDefault}
              className={`text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                showResetConfirm ? 'text-red-600 hover:underline' : 'text-hd-accent hover:underline'
              }`}
              id="reset-scoring-defaults-btn"
            >
              {showResetConfirm ? TEXTS.sureResetConfirm : TEXTS.resetScoringDefaultBtn}
            </button>
          </div>

          <div className="space-y-4">
            {/* Vraag & Antwoord */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-hd-text block uppercase tracking-wide">
                {TEXTS.askAndAnswerTogether}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col justify-end">
                  <span className="text-[10px] text-hd-muted font-mono block mb-1 uppercase tracking-wider">
                    {TEXTS.basePointsTricks?.replace('{tricks}', String(settings.askAndAnswerTricksTarget ?? 8)) || `Basispunten (${settings.askAndAnswerTricksTarget ?? 8} slagen)`}
                  </span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={settings.askAndAnswerBase ?? 0}
                      onChange={(e) => handleChange('askAndAnswerBase', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-hd-border rounded bg-hd-card text-hd-text font-mono font-bold text-center focus:outline-none focus:border-hd-accent"
                      min="0"
                      id="input-setting-va-base"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <span className="text-[10px] text-hd-muted font-mono block mb-1 uppercase tracking-wider">
                    {TEXTS.perOvertrick}
                  </span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={settings.askAndAnswerOvertrick ?? 0}
                      onChange={(e) => handleChange('askAndAnswerOvertrick', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-hd-border rounded bg-hd-card text-hd-text font-mono font-bold text-center focus:outline-none focus:border-hd-accent"
                      min="0"
                      id="input-setting-va-over"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-hd-text block uppercase tracking-wide">
                {TEXTS.askAndAnswerAlone}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col justify-end">
                  <span className="text-[10px] text-hd-muted font-mono block mb-1 uppercase tracking-wider">
                    {TEXTS.basePointsTricks?.replace('{tricks}', String(settings.askAndAnswerAloneTricksTarget ?? 5)) || `Basispunten (${settings.askAndAnswerAloneTricksTarget ?? 5} slagen)`}
                  </span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={settings.askAndAnswerAloneBase ?? 0}
                      onChange={(e) => handleChange('askAndAnswerAloneBase', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-hd-border rounded bg-hd-card text-hd-text font-mono font-bold text-center focus:outline-none focus:border-hd-accent"
                      min="0"
                      id="input-setting-vaa-base"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <span className="text-[10px] text-hd-muted font-mono block mb-1 uppercase tracking-wider">
                    {TEXTS.perOvertrick}
                  </span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={settings.askAndAnswerAloneOvertrick ?? 0}
                      onChange={(e) => handleChange('askAndAnswerAloneOvertrick', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-hd-border rounded bg-hd-card text-hd-text font-mono font-bold text-center focus:outline-none focus:border-hd-accent"
                      min="0"
                      id="input-setting-vaa-over"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-hd-border" />

            {/* Troel */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-hd-text block uppercase tracking-wide">
                {TEXTS.troelTitle}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col justify-end">
                  <span className="text-[10px] text-hd-muted font-mono block mb-1 uppercase tracking-wider">
                    {TEXTS.basePointsTricks?.replace('{tricks}', String(settings.troelTricksTarget ?? 8)) || `Basispunten (${settings.troelTricksTarget ?? 8} slagen)`}
                  </span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={settings.troelBase ?? 0}
                      onChange={(e) => handleChange('troelBase', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-hd-border rounded bg-hd-card text-hd-text font-mono font-bold text-center focus:outline-none focus:border-hd-accent"
                      min="0"
                      id="input-setting-troel-base"
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <span className="text-[10px] text-hd-muted font-mono block mb-1 uppercase tracking-wider">
                    {TEXTS.perOvertrick}
                  </span>
                  <div className="flex items-center">
                    <input
                      type="number"
                      value={settings.troelOvertrick ?? 0}
                      onChange={(e) => handleChange('troelOvertrick', Number(e.target.value))}
                      className="w-full px-3 py-1.5 border border-hd-border rounded bg-hd-card text-hd-text font-mono font-bold text-center focus:outline-none focus:border-hd-accent"
                      min="0"
                      id="input-setting-troel-over"
                    />
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-hd-border" />

            {/* Miserie */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-hd-text block uppercase tracking-wide">
                  {TEXTS.miseryTitle}
                </label>
                <span className="text-[10px] text-hd-muted font-mono block mb-1 uppercase tracking-wider">{TEXTS.perPlayer}</span>
                <input
                  type="number"
                  value={settings.miseryPoints ?? 0}
                  onChange={(e) => handleChange('miseryPoints', Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-hd-border rounded bg-hd-card text-hd-text font-mono font-bold text-center focus:outline-none focus:border-hd-accent"
                  min="0"
                  id="input-setting-misery"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-hd-text block uppercase tracking-wide">
                  {TEXTS.onTableTitle}
                </label>
                <span className="text-[10px] text-hd-muted font-mono block mb-1 uppercase tracking-wider">{TEXTS.perPlayer}</span>
                <input
                  type="number"
                  value={settings.openMiseryPoints ?? 0}
                  onChange={(e) => handleChange('openMiseryPoints', Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-hd-border rounded bg-hd-card text-hd-text font-mono font-bold text-center focus:outline-none focus:border-hd-accent"
                  min="0"
                  id="input-setting-open-misery"
                />
              </div>
            </div>

            <hr className="border-hd-border" />

            {/* Solo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-hd-text block uppercase tracking-wide">
                  {TEXTS.soloAbondanceTitle}
                </label>
                <span className="text-[10px] text-hd-muted font-mono block mb-1 uppercase tracking-wider">{TEXTS.perOpponent}</span>
                <input
                  type="number"
                  value={settings.soloAbondancePoints ?? 0}
                  onChange={(e) => handleChange('soloAbondancePoints', Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-hd-border rounded bg-hd-card text-hd-text font-mono font-bold text-center focus:outline-none focus:border-hd-accent"
                  min="0"
                  id="input-setting-solo"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-hd-text block uppercase tracking-wide">
                  {TEXTS.soloSlimTitle}
                </label>
                <span className="text-[10px] text-hd-muted font-mono block mb-1 uppercase tracking-wider">{TEXTS.perOpponent}</span>
                <input
                  type="number"
                  value={settings.soloSlimPoints ?? 0}
                  onChange={(e) => handleChange('soloSlimPoints', Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-hd-border rounded bg-hd-card text-hd-text font-mono font-bold text-center focus:outline-none focus:border-hd-accent"
                  min="0"
                  id="input-setting-solo-slim"
                />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
