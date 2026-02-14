import seedrandom from 'seedrandom';
import type { Card, Clue, CrosswordGrid } from './types';

function cleanWord(word: string): string {
    return word.replace(/[^a-zA-Z]/g, '').toUpperCase();
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

    // Filter cards with simple names and reasonable length
    const candidates = cards.filter(c => {
        const clean = cleanWord(c.name);
        return clean.length >= 3 && clean.length <= 12;
    }).sort(() => rng() - 0.5);

    const placedCards: { card: Card; word: string; x: number; y: number; dir: 'across' | 'down' }[] = [];

    // Place first word in the center
    if (candidates.length > 0) {
        const first = candidates[0];
        const word = cleanWord(first.name);
        const dir = rng() > 0.5 ? 'across' : 'down';

        // adjust centering based on direction
        const startX = dir === 'across' ? Math.floor((WIDTH - word.length) / 2) : Math.floor(WIDTH / 2);
        const startY = dir === 'down' ? Math.floor((HEIGHT - word.length) / 2) : Math.floor(HEIGHT / 2);

        if (canPlaceWordAt(grid, word, startX, startY, dir)) {
            placeWord(grid, word, startX, startY, dir);
            placedCards.push({ card: first, word, x: startX, y: startY, dir });
        }
    }

    // Iterative placement
    for (let i = 1; i < candidates.length; i++) {
        const card = candidates[i];
        const word = cleanWord(card.name);
        let placed = false;

        // Try to intersect with existing words
        const targets = [...placedCards].sort(() => rng() - 0.5);

        for (const target of targets) {
            if (placed) break;
            // Try every intersection point
            for (let j = 0; j < target.word.length; j++) {
                if (placed) break;
                const intersectChar = target.word[j];
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
                        // User request: "avoid cases were across and down start from the same point"
                        const sharesStart = placedCards.some(pc => pc.x === nx && pc.y === ny);

                        if (!sharesStart && canPlaceWordAt(grid, word, nx, ny, newDir)) {
                            placeWord(grid, word, nx, ny, newDir);
                            placedCards.push({ card, word, x: nx, y: ny, dir: newDir });
                            placed = true;
                            break;
                        }
                    }
                }
            }
        }
    }

    // Generate clues
    placedCards.forEach((pc) => {
        // Generate a clue text based on card properties
        const clueType = Math.floor(rng() * 4); // 0: Flavor, 1: Oracle, 2: Type+Cost, 3: Artist
        let clueText = "";

        if (clueType === 0 && pc.card.flavor_text) {
            clueText = `Flavor: ${pc.card.flavor_text}`;
        } else if (clueType === 1 && pc.card.oracle_text) {
            clueText = `Oracle: ${pc.card.oracle_text.replace(pc.card.name, 'CARDNAME')}`;
        } else if (clueType === 2) {
            clueText = `${pc.card.type_line}; ${pc.card.mana_cost || '0'}`;
        } else if (clueType === 3 && pc.card.artist) {
            clueText = `Artist: ${pc.card.artist}; ${pc.card.set.toUpperCase()}; ${pc.card.mana_cost || ''}`;
        } else {
            // Fallback
            clueText = `[${pc.card.set.toUpperCase()}] ${pc.card.type_line}`;
        }

        clues.push({
            id: pc.card.id,
            clue: clueText,
            answer: pc.word,
            direction: pc.dir,
            x: pc.x,
            y: pc.y,
            length: pc.word.length
        });
    });

    return { width: WIDTH, height: HEIGHT, grid, clues };
}
