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
  const [gameMode, setGameMode] = useState<'oldschool' | 'premodern'>('oldschool');

  useEffect(() => {
    const initGame = async () => {
      setLoading(true);
      const today = new Date().toDateString();
      // Combine date and mode for seed so they have different puzzles
      const seed = `${today}-${gameMode}`;
      const rng = seedrandom(seed);

      // Pick a random page between 1 and 6 (approx max pages based on set size)
      // Actually fetchCards defaults to 1.
      // We want to vary the cards, so let's pick a page based on the seed.
      const page = Math.floor(rng() * 5) + 1;

      const cards = await fetchCards(page, gameMode);
      if (cards.length > 0) {
        // We might want to combine multiple pages or filter better, but start with this.
        const grid = generateCrossword(cards, seed);
        setGridData(grid);
        setUserGrid(Array(grid.height).fill(null).map(() => Array(grid.width).fill(null)));
        setSolved(false); // Reset solved state on mode change

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
  }, [gameMode]); // Re-run when gameMode changes

  // ... (existing code)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center py-8 px-4 font-sans">
      <header className="mb-8 text-center flex flex-col items-center">
        <h1 className="text-4xl font-extrabold flex items-center justify-center gap-3 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
          <img
            src={boltLogo}
            alt="Bolt The Bird"
            className="w-16 h-16 rounded-full object-cover object-center border-2 border-yellow-400 shadow-md bg-black"
          />
          Bolt The Word
        </h1>
        <p className="text-gray-400 mt-2 text-lg">Daily Magic: The Gathering Crossword</p>

        {/* Game Mode Selector */}
        <div className="mt-4 flex gap-2 bg-gray-800 p-1 rounded-lg border border-gray-700">
          <button
            onClick={() => setGameMode('oldschool')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${gameMode === 'oldschool'
                ? 'bg-yellow-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
          >
            Old School (93/94)
          </button>
          <button
            onClick={() => setGameMode('premodern')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${gameMode === 'premodern'
                ? 'bg-yellow-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
              }`}
          >
            Premodern
          </button>
        </div>

        <p className="text-xs text-gray-600 font-mono mt-3">{new Date().toDateString()} • v1.11 (Expanded Mechanics)</p>
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
              <p className="mb-2">Click twice to switch direction. Use arrow keys to navigate.</p>
              <div className="text-xs text-gray-400 border-t border-gray-800 pt-2 flex flex-col gap-1">
                <p><span className="font-bold text-gray-500">Artists:</span> Surname only (e.g. "RUSH")</p>
                <p><span className="font-bold text-gray-500">Mana Cost:</span> No symbols (e.g. "2BB" for {"{2}{B}{B}"})</p>
              </div>
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
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => {
              if (!selectedCell) return;
              const { x, y } = selectedCell;
              if (gridData.grid[y][x]) {
                const newGrid = [...userGrid.map(row => [...row])];
                newGrid[y][x] = gridData.grid[y][x];
                setUserGrid(newGrid);
                checkWin(newGrid);
              }
            }}
            className="text-yellow-500 hover:text-yellow-400 transition-colors text-sm underline opacity-70 hover:opacity-100"
          >
            Reveal Cell
          </button>
          <button
            onClick={() => {
              if (!activeClueId) return;
              const clue = gridData.clues.find(c => c.id === activeClueId);
              if (clue) {
                const newGrid = [...userGrid.map(row => [...row])];
                const dx = clue.direction === 'across' ? 1 : 0;
                const dy = clue.direction === 'down' ? 1 : 0;
                for (let i = 0; i < clue.length; i++) {
                  newGrid[clue.y + dy * i][clue.x + dx * i] = gridData.grid[clue.y + dy * i][clue.x + dx * i];
                }
                setUserGrid(newGrid);
                checkWin(newGrid);
              }
            }}
            className="text-orange-500 hover:text-orange-400 transition-colors text-sm underline opacity-70 hover:opacity-100"
          >
            Reveal Word
          </button>
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
