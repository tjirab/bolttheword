import { useState, useEffect } from 'react';
import { fetchCards } from './lib/scryfall';
import { generateCrossword } from './lib/generator';
import type { CrosswordGrid } from './lib/types';
import { Crossword } from './components/Crossword';
import { Clues } from './components/Clues';
import seedrandom from 'seedrandom';
import { Sparkles, Loader2 } from 'lucide-react';
import boltLogo from './assets/boltthebird.png';

function App() {
  const [gridData, setGridData] = useState<CrosswordGrid | null>(null);
  const [userGrid, setUserGrid] = useState<(string | null)[][]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [activeClueId, setActiveClueId] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    const initGame = async () => {
      setLoading(true);
      const today = new Date().toDateString();
      const rng = seedrandom(today);

      // Pick a random page between 1 and 6 (approx max pages based on set size)
      // Actually fetchCards defaults to 1.
      // We want to vary the cards, so let's pick a page based on the seed.
      const page = Math.floor(rng() * 5) + 1;

      const cards = await fetchCards(page);
      if (cards.length > 0) {
        // We might want to combine multiple pages or filter better, but start with this.
        const grid = generateCrossword(cards, today);
        setGridData(grid);
        setUserGrid(Array(grid.height).fill(null).map(() => Array(grid.width).fill(null)));

        // Find first clue to select
        if (grid.clues.length > 0) {
          const first = grid.clues[0];
          setSelectedCell({ x: first.x, y: first.y });
          setActiveClueId(first.id);
          setDirection(first.direction);
        }
      }
      setLoading(false);
    };

    initGame();
  }, []);

  // Update active clue based on selection
  useEffect(() => {
    if (!gridData || !selectedCell) return;

    // Find a clue that includes this cell in the current direction
    const relevantClue = gridData.clues.find(c => {
      if (c.direction !== direction) return false;
      if (direction === 'across') {
        return c.y === selectedCell.y && selectedCell.x >= c.x && selectedCell.x < c.x + c.length;
      } else {
        return c.x === selectedCell.x && selectedCell.y >= c.y && selectedCell.y < c.y + c.length;
      }
    });

    if (relevantClue) {
      setActiveClueId(relevantClue.id);
    } else {
      // Try other direction if current doesn't match
      const otherClue = gridData.clues.find(c => {
        const dir = direction === 'across' ? 'down' : 'across';
        if (c.direction !== dir) return false;
        if (dir === 'across') {
          return c.y === selectedCell.y && selectedCell.x >= c.x && selectedCell.x < c.x + c.length;
        } else {
          return c.x === selectedCell.x && selectedCell.y >= c.y && selectedCell.y < c.y + c.length;
        }
      });
      if (otherClue) {
        setActiveClueId(otherClue.id);
        // Don't auto-switch direction here, it might be annoying.
      } else {
        setActiveClueId(null);
      }
    }
  }, [selectedCell, direction, gridData]);

  const handleCellClick = (x: number, y: number) => {
    if (selectedCell?.x === x && selectedCell?.y === y) {
      setDirection(prev => prev === 'across' ? 'down' : 'across');
    } else {
      setSelectedCell({ x, y });
    }
  };

  const handleCellChange = (x: number, y: number, value: string) => {
    if (solved) return;

    const newGrid = [...userGrid.map(row => [...row])];
    newGrid[y][x] = value;
    setUserGrid(newGrid);

    // Move cursor
    if (value !== '') {
      // Advance
      if (direction === 'across') {
        // We need to check if next cell is valid (not null/black)
        let nextX = x + 1;
        while (nextX < (gridData?.width || 0) && gridData?.grid[y][nextX] !== null) {
          setSelectedCell({ x: nextX, y });
          break;
        }
      } else {
        if (y + 1 < (gridData?.height || 0) && gridData?.grid[y + 1][x] !== null) {
          setSelectedCell({ x, y: y + 1 });
        }
      }
    }

    // Check win condition
    checkWin(newGrid);
  };

  const checkWin = (currentGrid: (string | null)[][]) => {
    if (!gridData) return;
    let isConnect = true;
    for (let y = 0; y < gridData.height; y++) {
      for (let x = 0; x < gridData.width; x++) {
        if (gridData.grid[y][x] !== null) {
          if (currentGrid[y][x] !== gridData.grid[y][x]) {
            isConnect = false;
            break;
          }
        }
      }
    }
    if (isConnect) setSolved(true);
  };

  const handleClueClick = (clueId: string) => {
    const clue = gridData?.clues.find(c => c.id === clueId);
    if (clue) {
      setSelectedCell({ x: clue.x, y: clue.y });
      setDirection(clue.direction);
      setActiveClueId(clueId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center py-8 px-4 font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold flex items-center justify-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
          <img
            src={boltLogo}
            alt="Bolt The Bird"
            className="w-16 h-16 rounded-full object-cover object-center border-2 border-yellow-400 shadow-md bg-black"
          />
          Bolt The Word
        </h1>
        <p className="text-gray-400 mt-2 text-lg">Daily Magic: The Gathering Crossword</p>
        <p className="text-xs text-gray-600 font-mono mt-1">{new Date().toDateString()} • v1.11 (Expanded Mechanics)</p>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-yellow-500" />
          <p className="text-xl font-medium animate-pulse">Conjuring Puzzle...</p>
        </div>
      ) : gridData ? (
        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full px-4 md:px-8">
          <div className="flex-1 w-full max-w-[1200px] flex flex-col items-center">
            <Crossword
              gridData={gridData}
              userGrid={userGrid}
              onCellChange={handleCellChange}
              selectedCell={selectedCell}
              onCellClick={handleCellClick}
              direction={direction}
              highlightedClueId={activeClueId}
            />
            <div className="text-sm text-gray-500 mt-4 max-w-md text-center">
              <p>Click twice to switch direction. Use arrow keys to navigate.</p>
            </div>
          </div>

          <div className="w-full lg:w-[400px] shrink-0">
            <Clues clues={gridData.clues} activeClueId={activeClueId} onClueClick={handleClueClick} />
          </div>
        </div>
      ) : (
        <div className="text-red-400">Failed to load puzzle. Please refresh.</div>
      )}

      {!loading && !solved && gridData && (
        <div className="mt-8">
          <button
            onClick={() => {
              const filled = gridData.grid.map(row => row.map(cell => cell || ''));
              setUserGrid(filled);
              setSolved(true);
            }}
            className="text-red-400 hover:text-red-300 transition-colors text-sm underline opacity-50 hover:opacity-100"
          >
            Concede (Reveal Answers)
          </button>
        </div>
      )}

      {solved && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 p-8 rounded-2xl border border-yellow-500/50 shadow-2xl text-center max-w-md mx-4 animate-in fade-in zoom-in duration-300">
            <Sparkles className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
            <h2 className="text-3xl font-bold text-white mb-2">Quest Completed!</h2>
            <p className="text-gray-300 mb-6">You have deciphered the ancient texts.</p>
            <button
              onClick={() => setSolved(false)}
              className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-full transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
