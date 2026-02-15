import seedrandom from 'seedrandom';
import type { Card, Clue, CrosswordGrid } from './types';

function cleanWord(word: string): string {
    return word
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z]/g, '')
        .toUpperCase();
}

// Set name mapping
const SET_NAMES: Record<string, string> = {
    'leb': 'BETA',
    'arn': 'ARABIANNIGHTS',
    'leg': 'LEGENDS',
    'drk': 'THEDARK',
    'atq': 'ANTIQUITIES',
    'fem': 'FALLENEMPIRES'
};

function getArtistSurname(artist: string): string {
    const parts = artist.split(' ');
    // Handle cases like "Douglas Shuler" -> "SHULER"
    // "Anson Maddocks" -> "MADDOCKS"
    return cleanWord(parts[parts.length - 1]);
}

function getBasicType(typeLine: string): string | null {
    const types = ['Creature', 'Artifact', 'Enchantment', 'Sorcery', 'Instant', 'Land', 'Planeswalker'];
    for (const t of types) {
        if (typeLine.includes(t)) return t.toUpperCase();
    }
    return null;
}

function formatManaCost(cost: string): string {
    if (!cost) return '';
    // {2}{B}{B} -> 2BB
    return cost.replace(/[{}]/g, '');
}

interface Candidate {
    word: string;
    clue: string;
    card: Card;
    type: 'name' | 'artist' | 'type' | 'set' | 'cost';
}

function canPlaceWordAt(grid: (string | null)[][], word: string, x: number, y: number, direction: 'across' | 'down'): boolean {
    const height = grid.length;
    const width = grid[0].length;
    const dx = direction === 'across' ? 1 : 0;
    const dy = direction === 'down' ? 1 : 0;

    if (x < 0 || y < 0 || x + dx * word.length > width || y + dy * word.length > height) return false;

    // Check boundaries (start and end)
    if (direction === 'across') {
        if (x > 0 && grid[y][x - 1] !== null) return false;
        if (x + word.length < width && grid[y][x + word.length] !== null) return false;
    } else {
        if (y > 0 && grid[y - 1][x] !== null) return false;
        if (y + word.length < height && grid[y + word.length][x] !== null) return false;
    }

    for (let i = 0; i < word.length; i++) {
        const cx = x + dx * i;
        const cy = y + dy * i;
        const char = word[i];
        const cell = grid[cy][cx];

        if (cell !== null && cell !== char) return false;

        // Check adjacent cells (perpendicular) to ensure we don't accidentally create adjacent words
        // Only if the cell is currently empty (if it's an intersection, we're good)
        if (cell === null) {
            if (direction === 'across') {
                if (cy > 0 && grid[cy - 1][cx] !== null) return false;
                if (cy + 1 < height && grid[cy + 1][cx] !== null) return false;
            } else {
                if (cx > 0 && grid[cy][cx - 1] !== null) return false;
                if (cx + 1 < width && grid[cy][cx + 1] !== null) return false;
            }
        }
    }

    return true;
}

function placeWord(grid: (string | null)[][], word: string, x: number, y: number, direction: 'across' | 'down') {
    const dx = direction === 'across' ? 1 : 0;
    const dy = direction === 'down' ? 1 : 0;
    for (let i = 0; i < word.length; i++) {
        grid[y + dy * i][x + dx * i] = word[i];
    }
}

export function generateCrossword(cards: Card[], dateStr: string): CrosswordGrid {
    const rng = seedrandom(dateStr);
    const WIDTH = 15;
    const HEIGHT = 15;
    const grid: (string | null)[][] = Array(HEIGHT).fill(null).map(() => Array(WIDTH).fill(null));
    const clues: Clue[] = [];

    // 1. Generate all possible candidates from cards
    const allCandidates: Candidate[] = [];

    cards.forEach(card => {
        // A. Card Name (Classic)
        // Clue: "Oracle: ..." or "Flavor: ..."
        const cleanName = cleanWord(card.name);
        if (cleanName.length >= 3 && cleanName.length <= 12) {
            // Decide on clue style for name
            const isFlavor = card.flavor_text && rng() > 0.5;
            let clueText = "";
            if (isFlavor && card.flavor_text) {
                clueText = `Flavor: "${card.flavor_text}"`;
            } else if (card.oracle_text) {
                clueText = `Oracle: ${card.oracle_text.replace(new RegExp(card.name, 'gi'), 'CARDNAME')}`;
            } else {
                clueText = `[${card.set.toUpperCase()}] ${card.type_line}`;
            }

            allCandidates.push({ word: cleanName, clue: clueText, card, type: 'name' });
        }

        // B. Artist Surname
        if (card.artist) {
            const surname = getArtistSurname(card.artist);
            if (surname.length >= 3 && surname.length <= 12) {
                allCandidates.push({
                    word: surname,
                    clue: `Artist of "${card.name}"`,
                    card,
                    type: 'artist'
                });
            }
        }

        // C. Card Type (Basic)
        const typeChoice = getBasicType(card.type_line);
        if (typeChoice && typeChoice.length >= 3 && typeChoice.length <= 12) {
            allCandidates.push({
                word: typeChoice,
                clue: `Type of "${card.name}"`,
                card,
                type: 'type'
            });
        }

        // D. Set Name
        if (card.set && SET_NAMES[card.set]) {
            const setName = SET_NAMES[card.set];
            allCandidates.push({
                word: setName,
                clue: `Set containing "${card.name}"`,
                card,
                type: 'set'
            });
        }

        // E. Mana Cost
        if (card.mana_cost) {
            const formattedCost = formatManaCost(card.mana_cost);
            if (formattedCost.length >= 3 && formattedCost.length <= 12) {
                allCandidates.push({
                    word: formattedCost,
                    clue: `Mana cost of "${card.name}"`,
                    card,
                    type: 'cost'
                });
            }
        }
    });

    // Shuffle candidates
    const candidates = allCandidates.sort(() => rng() - 0.5);

    // Limits for specific clue types
    const MAX_SPECIAL_CLUES = 2;
    let typeCount = 0;
    let setCount = 0;
    let costCount = 0;
    let artistCount = 0;

    const placedItems: { candidate: Candidate; x: number; y: number; dir: 'across' | 'down' }[] = [];

    // Helper to check and increment limits
    const checkAndIncrementLimit = (type: string): boolean => {
        if (type === 'type') {
            if (typeCount >= MAX_SPECIAL_CLUES) return false;
            typeCount++;
            return true;
        }
        if (type === 'set') {
            if (setCount >= MAX_SPECIAL_CLUES) return false;
            setCount++;
            return true;
        }
        if (type === 'cost') {
            if (costCount >= MAX_SPECIAL_CLUES) return false;
            costCount++;
            return true;
        }
        if (type === 'artist') {
            if (artistCount >= MAX_SPECIAL_CLUES) return false;
            artistCount++;
            return true;
        }
        return true;
    };

    // Place first word
    if (candidates.length > 0) {
        // Find a valid starting candidate (prefer name or artist to start, or just check limits)
        let firstIndex = 0;
        let first: Candidate | null = null;

        // Try to find a valid first candidate that satisfies limits
        for (let i = 0; i < candidates.length; i++) {
            if (checkAndIncrementLimit(candidates[i].type)) {
                first = candidates[i];
                firstIndex = i;
                break;
            }
        }

        if (first) {
            const word = first.word;
            const dir = rng() > 0.5 ? 'across' : 'down';
            const startX = dir === 'across' ? Math.floor((WIDTH - word.length) / 2) : Math.floor(WIDTH / 2);
            const startY = dir === 'down' ? Math.floor((HEIGHT - word.length) / 2) : Math.floor(HEIGHT / 2);

            if (canPlaceWordAt(grid, word, startX, startY, dir)) {
                placeWord(grid, word, startX, startY, dir);
                placedItems.push({ candidate: first, x: startX, y: startY, dir });
                // Remove placed candidate from list to avoid duplicates (though we iterate fwd)
                candidates.splice(firstIndex, 1);
            } else {
                // Revert counts if failed to place (though first word usually succeeds)
                if (first.type === 'type') typeCount--;
                if (first.type === 'set') setCount--;
                if (first.type === 'cost') costCount--;
                if (first.type === 'artist') artistCount--;
            }
        }
    }

    // Iterative placement
    // We already removed the first placed one if any, so we iterate from 0
    for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];

        // Check limits BEFORE trying to place
        if (candidate.type === 'type' && typeCount >= MAX_SPECIAL_CLUES) continue;
        if (candidate.type === 'set' && setCount >= MAX_SPECIAL_CLUES) continue;
        if (candidate.type === 'cost' && costCount >= MAX_SPECIAL_CLUES) continue;
        if (candidate.type === 'artist' && artistCount >= MAX_SPECIAL_CLUES) continue;

        const word = candidate.word;
        let placed = false;

        // Try to intersect with existing words
        const targets = [...placedItems].sort(() => rng() - 0.5);

        for (const target of targets) {
            if (placed) break;
            const targetWord = target.candidate.word;

            for (let j = 0; j < targetWord.length; j++) {
                if (placed) break;
                const intersectChar = targetWord[j];
                const tx = target.x + (target.dir === 'across' ? j : 0);
                const ty = target.y + (target.dir === 'down' ? j : 0);

                // Find this char in the new word
                for (let k = 0; k < word.length; k++) {
                    if (word[k] === intersectChar) {
                        // Potential intersection
                        const newDir = target.dir === 'across' ? 'down' : 'across';
                        const nx = tx - (newDir === 'across' ? k : 0);
                        const ny = ty - (newDir === 'down' ? k : 0);

                        // Check if any existing word starts at this position
                        const sharesStart = placedItems.some(pi => pi.x === nx && pi.y === ny);

                        if (!sharesStart && canPlaceWordAt(grid, word, nx, ny, newDir)) {
                            placeWord(grid, word, nx, ny, newDir);
                            placedItems.push({ candidate, x: nx, y: ny, dir: newDir });

                            // Increment limits
                            if (candidate.type === 'type') typeCount++;
                            if (candidate.type === 'set') setCount++;
                            if (candidate.type === 'cost') costCount++;
                            if (candidate.type === 'artist') artistCount++;

                            placed = true;
                            break;
                        }
                    }
                }
            }
        }
    }

    // Generate clues
    placedItems.forEach((pi) => {
        clues.push({
            id: `${pi.candidate.card.id}-${pi.x}-${pi.y}`, // Unique ID just in case
            clue: pi.candidate.clue,
            answer: pi.candidate.word,
            direction: pi.dir,
            x: pi.x,
            y: pi.y,
            length: pi.candidate.word.length
        });
    });

    return { width: WIDTH, height: HEIGHT, grid, clues };
}
