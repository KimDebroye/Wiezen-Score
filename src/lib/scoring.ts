import { Player, GameSettings } from '../types';

/**
 * Calculates the score delta for each player in a "Vraag & Antwoord" round.
 * Conforms 100% to the official IWWA (International World Whist Association) scoring.
 */
export const calculateVraagAntwoord = (
  tricks: number,
  hasPartner: boolean,
  askerId: string,
  responderId: string,
  players: Player[],
  settings: GameSettings
): Record<string, number> => {
  const scores: Record<string, number> = {};
  players.forEach((p) => { scores[p.id] = 0; });

  if (hasPartner) {
    // Vragen en meegaan (Partner Game)
    const target = settings.askAndAnswerTricksTarget ?? 8;
    if (tricks >= target) {
      let points = 0;
      if (tricks === 13) {
        // Grote runder / Grand Chelem: dynamically calculated as double the linear 13-trick score
        const linear13 = settings.askAndAnswerBase + (13 - target) * settings.askAndAnswerOvertrick;
        points = linear13 * 2;
      } else {
        // Linear overtricks: base + per overtrick
        points = settings.askAndAnswerBase + (tricks - target) * settings.askAndAnswerOvertrick;
      }

      scores[askerId] = points;
      scores[responderId] = points;
      players.forEach((p) => {
        if (p.id !== askerId && p.id !== responderId) {
          scores[p.id] = -points;
        }
      });
    } else {
      // Failed!
      // Penalty is -6 for 1 down (which is (base * 3)), and -2 for each additional undertrick
      const penaltyBase = (settings.askAndAnswerBase * 3);
      const points = penaltyBase + (target - 1 - tricks) * 2;

      scores[askerId] = -points;
      scores[responderId] = -points;
      players.forEach((p) => {
        if (p.id !== askerId && p.id !== responderId) {
          scores[p.id] = points;
        }
      });
    }
  } else {
    // Alleen gaan (Solo game in question-answer)
    const base = settings.askAndAnswerAloneBase; // default is 2
    const overslag = settings.askAndAnswerAloneOvertrick; // default is 1
    const target = settings.askAndAnswerAloneTricksTarget ?? 5;
    
    if (tricks >= target) {
      let pointsPerOpponent = 0;
      if (tricks === 13) {
        // 13 tricks in Solo is dynamically calculated as double the linear 13-trick score per opponent
        const linear13 = base + (13 - target) * overslag;
        pointsPerOpponent = linear13 * 2;
      } else {
        pointsPerOpponent = base + (tricks - target) * overslag;
      }

      scores[askerId] = pointsPerOpponent * 3;
      players.forEach((p) => {
        if (p.id !== askerId) {
          scores[p.id] = -pointsPerOpponent;
        }
      });
    } else {
      // Failed Alleen gaan
      // 1 down = 2 * base points per opponent, and 2 * overslag points per additional undertrick
      const pointsPerOpponent = (base * 2) + (target - 1 - tricks) * (overslag * 2);

      scores[askerId] = -pointsPerOpponent * 3;
      players.forEach((p) => {
        if (p.id !== askerId) {
          scores[p.id] = pointsPerOpponent;
        }
      });
    }
  }

  return scores;
};

/**
 * Calculates the score delta for each player in a "Troel" round.
 * Conforms 100% to the official IWWA scoring (Column 9).
 */
export const calculateTroel = (
  tricks: number,
  hasPartner: boolean,
  askerId: string,
  responderId: string,
  players: Player[],
  settings: GameSettings
): Record<string, number> => {
  const scores: Record<string, number> = {};
  players.forEach((p) => { scores[p.id] = 0; });

  const target = settings.troelTricksTarget ?? 8;

  if (hasPartner) {
    if (tricks >= target) {
      let points = 0;
      if (tricks === 13) {
        // Trou (3 as) all 13 tricks is dynamically calculated as double the linear 13-trick score
        const linear13 = settings.troelBase + (13 - target) * settings.troelOvertrick;
        points = linear13 * 2;
      } else {
        // Base + per overtrick
        points = settings.troelBase + (tricks - target) * settings.troelOvertrick;
      }

      scores[askerId] = points;
      scores[responderId] = points;
      players.forEach((p) => {
        if (p.id !== askerId && p.id !== responderId) {
          scores[p.id] = -points;
        }
      });
    } else {
      // Failed Troel!
      // Shares the same penalty values as Vraag & Antwoord: -6 for 1 down, -2 for each further undertrick
      const points = 6 + (target - 1 - tricks) * 2;

      scores[askerId] = -points;
      scores[responderId] = -points;
      players.forEach((p) => {
        if (p.id !== askerId && p.id !== responderId) {
          scores[p.id] = points;
        }
      });
    }
  } else {
    // If somehow Troel is played alone (fallback)
    if (tricks >= target) {
      const points = settings.troelBase + (tricks - target) * settings.troelOvertrick;
      scores[askerId] = points * 3;
      players.forEach((p) => {
        if (p.id !== askerId) scores[p.id] = -points;
      });
    } else {
      const points = 6 + (target - 1 - tricks) * 2;
      scores[askerId] = -points * 3;
      players.forEach((p) => {
        if (p.id !== askerId) scores[p.id] = points;
      });
    }
  }

  return scores;
};

/**
 * Calculates the score delta for "Miserie" and "Miserie op Tafel (Op Tafel)".
 * Conforms 100% to the official IWWA matrix table for 1, 2, or 3 Miserie players.
 */
export const calculateMiserie = (
  states: Record<string, 'opponent' | 'success' | 'failed'>,
  isOpTafel: boolean,
  players: Player[],
  settings: GameSettings
): Record<string, number> => {
  const scores: Record<string, number> = {};
  players.forEach((p) => { scores[p.id] = 0; });

  const miseryPlayers = players.filter(p => states[p.id] === 'success' || states[p.id] === 'failed');
  const successPlayers = players.filter(p => states[p.id] === 'success');
  const failedPlayers = players.filter(p => states[p.id] === 'failed');

  const numMiserie = miseryPlayers.length;
  const numSuccess = successPlayers.length;
  const numFailed = failedPlayers.length;

  // If no one is playing misery, return 0s
  if (numMiserie === 0) {
    return scores;
  }

  // Base points value per opponent: 7 for normal Miserie, 14 for Miserie op Tafel
  const B = isOpTafel ? settings.openMiseryPoints : settings.miseryPoints;

  if (numMiserie === 1) {
    // 1 Player Miserie (Column 1 of matrix)
    if (numSuccess === 1) {
      // Succeeded: Player gets +3*B, opponents pay -B
      const winner = successPlayers[0].id;
      scores[winner] = 3 * B;
      players.forEach(p => {
        if (p.id !== winner) scores[p.id] = -B;
      });
    } else if (numFailed === 1) {
      // Failed: Player pays -3*B, opponents get +B
      const loser = failedPlayers[0].id;
      scores[loser] = -3 * B;
      players.forEach(p => {
        if (p.id !== loser) scores[p.id] = B;
      });
    }
  } else if (numMiserie === 2) {
    // 2 Players Miserie (Column 2 of matrix)
    if (numSuccess === 2) {
      // Both succeeded: both get +2*B, opponents pay -2*B
      successPlayers.forEach(p => { scores[p.id] = 2 * B; });
      players.forEach(p => {
        if (states[p.id] === 'opponent') scores[p.id] = -2 * B;
      });
    } else if (numSuccess === 1 && numFailed === 1) {
      // One succeeded, one failed: winner gets +4*B, loser pays -4*B, opponents get 0
      const winner = successPlayers[0].id;
      const loser = failedPlayers[0].id;
      scores[winner] = 4 * B;
      scores[loser] = -4 * B;
      // Opponents remain 0
    } else if (numFailed === 2) {
      // Both failed: both pay -2*B, opponents get +2*B
      failedPlayers.forEach(p => { scores[p.id] = -2 * B; });
      players.forEach(p => {
        if (states[p.id] === 'opponent') scores[p.id] = 2 * B;
      });
    }
  } else if (numMiserie === 3) {
    // 3 Players Miserie (Column 3 of matrix)
    if (numSuccess === 3) {
      // All 3 succeeded: they get +B each, the 1 opponent pays -3*B
      successPlayers.forEach(p => { scores[p.id] = B; });
      players.forEach(p => {
        if (states[p.id] === 'opponent') scores[p.id] = -3 * B;
      });
    } else if (numSuccess === 2 && numFailed === 1) {
      // 2 succeeded, 1 failed: winners get +3*B, loser pays -5*B, opponent gets -B
      successPlayers.forEach(p => { scores[p.id] = 3 * B; });
      const loser = failedPlayers[0].id;
      scores[loser] = -5 * B;
      players.forEach(p => {
        if (states[p.id] === 'opponent') scores[p.id] = -B;
      });
    } else if (numSuccess === 1 && numFailed === 2) {
      // 1 succeeded, 2 failed: winner gets +5*B, losers pay -3*B, opponent gets +B
      const winner = successPlayers[0].id;
      scores[winner] = 5 * B;
      failedPlayers.forEach(p => { scores[p.id] = -3 * B; });
      players.forEach(p => {
        if (states[p.id] === 'opponent') scores[p.id] = B;
      });
    } else if (numFailed === 3) {
      // All 3 failed: they pay -B each, opponent gets +3*B
      failedPlayers.forEach(p => { scores[p.id] = -B; });
      players.forEach(p => {
        if (states[p.id] === 'opponent') scores[p.id] = 3 * B;
      });
    }
  }

  return scores;
};

/**
 * Calculates the score delta for "Solo (Abondance)".
 * Conforms 100% to Columns 4, 5, 7, 8 of the IWWA sheet.
 */
export const calculateSolo = (
  target: number,
  isSuccess: boolean,
  soloPlayerId: string,
  players: Player[],
  settings: GameSettings
): Record<string, number> => {
  const scores: Record<string, number> = {};
  players.forEach((p) => { scores[p.id] = 0; });

  // Get exact IWWA points depending on the bid target slagen (9, 10, 11, or 12)
  // These represent the points EACH opponent pays/receives
  let basePointsPerOpponent = settings.soloAbondancePoints; // fallback
  if (target === 9) {
    basePointsPerOpponent = 5;  // 15 total
  } else if (target === 10) {
    basePointsPerOpponent = 6;  // 18 total
  } else if (target === 11) {
    basePointsPerOpponent = 8;  // 24 total
  } else if (target === 12) {
    basePointsPerOpponent = 9;  // 27 total
  }

  const totalPoints = basePointsPerOpponent * 3;

  if (isSuccess) {
    scores[soloPlayerId] = totalPoints;
    players.forEach((p) => {
      if (p.id !== soloPlayerId) {
        scores[p.id] = -basePointsPerOpponent;
      }
    });
  } else {
    scores[soloPlayerId] = -totalPoints;
    players.forEach((p) => {
      if (p.id !== soloPlayerId) {
        scores[p.id] = basePointsPerOpponent;
      }
    });
  }

  return scores;
};

/**
 * Calculates the score delta for "Solo Slim" (Grand Chelem).
 * Conforms 100% to Column 13 of the IWWA sheet.
 */
export const calculateSoloSlim = (
  isSuccess: boolean,
  soloPlayerId: string,
  players: Player[],
  settings: GameSettings
): Record<string, number> => {
  const scores: Record<string, number> = {};
  players.forEach((p) => { scores[p.id] = 0; });

  const basePointsPerOpponent = settings.soloSlimPoints; // Default 30 (90 total)
  const totalPoints = basePointsPerOpponent * 3;

  if (isSuccess) {
    scores[soloPlayerId] = totalPoints;
    players.forEach((p) => {
      if (p.id !== soloPlayerId) {
        scores[p.id] = -basePointsPerOpponent;
      }
    });
  } else {
    scores[soloPlayerId] = -totalPoints;
    players.forEach((p) => {
      if (p.id !== soloPlayerId) {
        scores[p.id] = basePointsPerOpponent;
      }
    });
  }

  return scores;
};

/**
 * Calculates the score delta for "Passen" where all players pass (0 points).
 */
export const calculatePassen = (players: Player[]): Record<string, number> => {
  const scores: Record<string, number> = {};
  players.forEach((p) => {
    scores[p.id] = 0;
  });
  return scores;
};

