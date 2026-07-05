// Unit tests for the Wiezen Scoreboard official IWWA scoring library.
// Run this script using 'npx tsx src/test-scoring.ts' to verify 100% compliance.

import {
  calculateVraagAntwoord,
  calculateTroel,
  calculateMiserie,
  calculateSolo,
  calculateSoloSlim,
} from './lib/scoring';
import { Player, GameSettings } from './types';

const testPlayers: Player[] = [
  { id: '1', name: 'A' },
  { id: '2', name: 'B' },
  { id: '3', name: 'C' },
  { id: '4', name: 'D' },
];

const defaultSettings: GameSettings = {
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

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  }
}

console.log('--- STARTING WIEZEN SCOREBOARD TEST SUITE ---');

// Test 1: Vraag & Antwoord - Success partner
const vaSuccess = calculateVraagAntwoord(8, true, '1', '2', testPlayers, defaultSettings);
assert(vaSuccess['1'] === 2 && vaSuccess['2'] === 2 && vaSuccess['3'] === -2 && vaSuccess['4'] === -2, 'Vraag & Antwoord (8 slagen): +2/+2/-2/-2');

// Test 2: Vraag & Antwoord - 9 slagen partner (1 overslag)
const vaOverslag = calculateVraagAntwoord(9, true, '1', '2', testPlayers, defaultSettings);
assert(vaOverslag['1'] === 3 && vaOverslag['2'] === 3 && vaOverslag['3'] === -3 && vaOverslag['4'] === -3, 'Vraag & Antwoord (9 slagen): +3/+3/-3/-3');

// Test 3: Vraag & Antwoord - 13 slagen partner (Grote runder)
const vaRunder = calculateVraagAntwoord(13, true, '1', '2', testPlayers, defaultSettings);
assert(vaRunder['1'] === 14 && vaRunder['2'] === 14 && vaRunder['3'] === -14 && vaRunder['4'] === -14, 'Vraag & Antwoord (13 slagen): +14/+14/-14/-14');

// Test 4: Vraag & Antwoord - 7 slagen partner (1 down)
const vaDown1 = calculateVraagAntwoord(7, true, '1', '2', testPlayers, defaultSettings);
assert(vaDown1['1'] === -6 && vaDown1['2'] === -6 && vaDown1['3'] === 6 && vaDown1['4'] === 6, 'Vraag & Antwoord (7 slagen, 1 down): -6/-6/+6/+6');

// Test 5: Vraag & Antwoord - 5 slagen partner (3 down)
const vaDown3 = calculateVraagAntwoord(5, true, '1', '2', testPlayers, defaultSettings);
assert(vaDown3['1'] === -10 && vaDown3['2'] === -10 && vaDown3['3'] === 10 && vaDown3['4'] === 10, 'Vraag & Antwoord (5 slagen, 3 down): -10/-10/+10/+10');

// Test 6: Vraag & Antwoord - Alleen gaan success (8 slagen)
const vaAlleen8 = calculateVraagAntwoord(8, false, '1', '', testPlayers, defaultSettings);
assert(vaAlleen8['1'] === 15 && vaAlleen8['2'] === -5 && vaAlleen8['3'] === -5 && vaAlleen8['4'] === -5, 'Alleen gaan (8 slagen): +15/-5/-5/-5');

// Test 7: Vraag & Antwoord - Alleen gaan failed (4 slagen, 1 down)
const vaAlleenDown = calculateVraagAntwoord(4, false, '1', '', testPlayers, defaultSettings);
assert(vaAlleenDown['1'] === -12 && vaAlleenDown['2'] === 4 && vaAlleenDown['3'] === 4 && vaAlleenDown['4'] === 4, 'Alleen gaan failed (4 slagen, 1 down): -12/+4/+4/+4');

// Test 8: Troel - Success (8 slagen)
const troelSuccess = calculateTroel(8, true, '1', '2', testPlayers, defaultSettings);
assert(troelSuccess['1'] === 4 && troelSuccess['2'] === 4 && troelSuccess['3'] === -4 && troelSuccess['4'] === -4, 'Troel success (8 slagen): +4/+4/-4/-4');

// Test 9: Troel - 13 slagen
const troelRunder = calculateTroel(13, true, '1', '2', testPlayers, defaultSettings);
assert(troelRunder['1'] === 28 && troelRunder['2'] === 28 && troelRunder['3'] === -28 && troelRunder['4'] === -28, 'Troel 13 slagen: +28/+28/-28/-28');

// Test 10: Troel - Failed (7 slagen, 1 down)
const troelFailed = calculateTroel(7, true, '1', '2', testPlayers, defaultSettings);
assert(troelFailed['1'] === -6 && troelFailed['2'] === -6 && troelFailed['3'] === 6 && troelFailed['4'] === 6, 'Troel failed (7 slagen, 1 down): -6/-6/+6/+6');

// Test 11: 1 Player Miserie - Success
const misery1Success = calculateMiserie({ '1': 'success', '2': 'opponent', '3': 'opponent', '4': 'opponent' }, false, testPlayers, defaultSettings);
assert(misery1Success['1'] === 21 && misery1Success['2'] === -7 && misery1Success['3'] === -7 && misery1Success['4'] === -7, '1 Player Miserie (Success): +21/-7/-7/-7');

// Test 12: 1 Player Miserie op Tafel - Failed
const miseryOpTafel1Failed = calculateMiserie({ '1': 'failed', '2': 'opponent', '3': 'opponent', '4': 'opponent' }, true, testPlayers, defaultSettings);
assert(miseryOpTafel1Failed['1'] === -42 && miseryOpTafel1Failed['2'] === 14 && miseryOpTafel1Failed['3'] === 14 && miseryOpTafel1Failed['4'] === 14, '1 Player Miserie op Tafel (Failed): -42/+14/+14/+14');

// Test 13: 2 Players Miserie - 1 Success, 1 Failed
const misery2Mix = calculateMiserie({ '1': 'success', '2': 'failed', '3': 'opponent', '4': 'opponent' }, false, testPlayers, defaultSettings);
assert(misery2Mix['1'] === 28 && misery2Mix['2'] === -28 && misery2Mix['3'] === 0 && misery2Mix['4'] === 0, '2 Players Miserie (1 Success, 1 Failed): +28/-28/0/0');

// Test 14: 3 Players Miserie - 2 Success, 1 Failed
const misery3Mix = calculateMiserie({ '1': 'success', '2': 'success', '3': 'failed', '4': 'opponent' }, false, testPlayers, defaultSettings);
assert(misery3Mix['1'] === 21 && misery3Mix['2'] === 21 && misery3Mix['3'] === -35 && misery3Mix['4'] === -7, '3 Players Miserie (2 Success, 1 Failed): +21/+21/-35/-7');

// Test 15: Solo Abondance 9
const solo9 = calculateSolo(9, true, '1', testPlayers, defaultSettings);
assert(solo9['1'] === 15 && solo9['2'] === -5 && solo9['3'] === -5 && solo9['4'] === -5, 'Solo Abondance 9 (Success): +15/-5/-5/-5');

// Test 16: Solo Abondance 12
const solo12 = calculateSolo(12, false, '1', testPlayers, defaultSettings);
assert(solo12['1'] === -27 && solo12['2'] === 9 && solo12['3'] === 9 && solo12['4'] === 9, 'Solo Abondance 12 (Failed): -27/+9/+9/+9');

// Test 17: Solo Slim
const soloSlim = calculateSoloSlim(true, '1', testPlayers, defaultSettings);
assert(soloSlim['1'] === 90 && soloSlim['2'] === -30 && soloSlim['3'] === -30 && soloSlim['4'] === -30, 'Solo Slim (Success): +90/-30/-30/-30');


console.log(`\n--- TEST RESULTS: Passed: ${passed}, Failed: ${failed} ---`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! THE SYSTEM IS 100% IWWA COMPLIANT.');
}
