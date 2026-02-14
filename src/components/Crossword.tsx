import React, { useEffect, useRef } from 'react';
import type { CrosswordGrid } from '../lib/types';
import classNames from 'classnames';

interface CrosswordProps {
    gridData: CrosswordGrid;
    userGrid: (string | null)[][];
    onCellChange: (x: number, y: number, value: string) => void;
    selectedCell: { x: number; y: number } | null;
    onCellClick: (x: number, y: number) => void;
    direction: 'across' | 'down';
    highlightedClueId: string | null;
}

export const Crossword: React.FC<CrosswordProps> = ({
    gridData,
    userGrid,
    onCellChange,
    selectedCell,
    onCellClick,
    direction,
    highlightedClueId
}) => {
    const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize refs grid
    if (inputRefs.current.length !== gridData.height) {
        inputRefs.current = Array(gridData.height).fill(null).map(() => Array(gridData.width).fill(null));
    }

    // Focus management
    useEffect(() => {
        if (selectedCell) {
            // Small timeout to ensure render updates before focus
            setTimeout(() => {
                inputRefs.current[selectedCell.y]?.[selectedCell.x]?.focus();
            }, 0);
        }
    }, [selectedCell, direction]);

    // Global keydown handler to support "type anywhere"
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (!selectedCell) return;

            const isGridInput = (e.target as HTMLElement).tagName === 'INPUT' && containerRef.current?.contains(e.target as Node);

            if (isGridInput) {
                return;
            }

            // Focus lost implementation:
            if (e.key === 'Backspace') {
                e.preventDefault();
                if (userGrid[selectedCell.y][selectedCell.x] === '') {
                    // Move back
                    let dx = direction === 'across' ? -1 : 0;
                    let dy = direction === 'down' ? -1 : 0;
                    let nextX = selectedCell.x + dx;
                    let nextY = selectedCell.y + dy;
                    if (nextX >= 0 && nextX < gridData.width && nextY >= 0 && nextY < gridData.height && gridData.grid[nextY][nextX] !== null) {
                        onCellClick(nextX, nextY);
                    }
                } else {
                    onCellChange(selectedCell.x, selectedCell.y, '');
                }
            } else if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
                onCellChange(selectedCell.x, selectedCell.y, e.key.toUpperCase());
            } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                let dx = 0;
                let dy = 0;
                switch (e.key) {
                    case 'ArrowUp': dy = -1; break;
                    case 'ArrowDown': dy = 1; break;
                    case 'ArrowLeft': dx = -1; break;
                    case 'ArrowRight': dx = 1; break;
                }

                let nextX = selectedCell.x + dx;
                let nextY = selectedCell.y + dy;

                if (nextX >= 0 && nextX < gridData.width && nextY >= 0 && nextY < gridData.height) {
                    if (gridData.grid[nextY][nextX] !== null) {
                        onCellClick(nextX, nextY);
                    } else {
                        nextX += dx;
                        nextY += dy;
                        if (nextX >= 0 && nextX < gridData.width && nextY >= 0 && nextY < gridData.height && gridData.grid[nextY][nextX] !== null) {
                            onCellClick(nextX, nextY);
                        }
                    }
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [selectedCell, gridData, onCellChange, onCellClick, direction, userGrid]);


    const handleKeyDown = (e: React.KeyboardEvent, x: number, y: number) => {
        // Local handler for when input IS focused
        if (e.key === 'Backspace') {
            e.preventDefault();
            if (userGrid[y][x] === '') {
                // Move back
                let dx = direction === 'across' ? -1 : 0;
                let dy = direction === 'down' ? -1 : 0;
                let nextX = x + dx;
                let nextY = y + dy;
                if (nextX >= 0 && nextX < gridData.width && nextY >= 0 && nextY < gridData.height && gridData.grid[nextY][nextX] !== null) {
                    onCellClick(nextX, nextY);
                }
            } else {
                onCellChange(x, y, '');
            }
        } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            let dx = 0;
            let dy = 0;
            switch (e.key) {
                case 'ArrowUp': dy = -1; break;
                case 'ArrowDown': dy = 1; break;
                case 'ArrowLeft': dx = -1; break;
                case 'ArrowRight': dx = 1; break;
            }

            let nextX = x + dx;
            let nextY = y + dy;

            while (nextX >= 0 && nextX < gridData.width && nextY >= 0 && nextY < gridData.height) {
                if (gridData.grid[nextY][nextX] !== null) {
                    onCellClick(nextX, nextY);
                    return;
                }
                nextX += dx;
                nextY += dy;
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>, x: number, y: number) => {
        const val = e.target.value.slice(-1).toUpperCase(); // Take last char
        onCellChange(x, y, val);
    };

    // Helper to determine if a cell is part of the highlighted clue
    const isHighlighted = (x: number, y: number) => {
        if (!highlightedClueId) return false;
        const clue = gridData.clues.find(c => c.id === highlightedClueId);
        if (!clue) return false;

        if (clue.direction === 'across') {
            return y === clue.y && x >= clue.x && x < clue.x + clue.length;
        } else {
            return x === clue.x && y >= clue.y && y < clue.y + clue.length;
        }
    };

    return (
        <div
            ref={containerRef}
            className="flex flex-col items-center justify-center mx-auto"
            style={{ width: '100%', containerType: 'inline-size' }}
        >
            <div
                className="grid bg-black border-[5px] border-black select-none w-full shadow-2xl box-border"
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${gridData.width}, 1fr)`,
                    gridTemplateRows: `repeat(${gridData.height}, 1fr)`,
                    gap: '1px',
                    padding: '0',
                    aspectRatio: '1 / 1',
                }}
            >
                {gridData.grid.map((row, y) => (
                    row.map((cell, x) => {
                        const isBlack = cell === null;
                        const isSelected = selectedCell?.x === x && selectedCell?.y === y;
                        const isClueHighlight = isHighlighted(x, y);

                        if (isBlack) {
                            return (
                                <div
                                    key={`${x}-${y}`}
                                    className="relative w-full h-full bg-black overflow-hidden"
                                >
                                    {/* Black cell content */}
                                </div>
                            );
                        }

                        // Check for clue number
                        const clueIndex = gridData.clues.findIndex(c => c.x === x && c.y === y);
                        const clueLabel = clueIndex !== -1 ? clueIndex + 1 : null;

                        return (
                            <div
                                key={`${x}-${y}`}
                                className="relative w-full h-full bg-white group overflow-hidden"
                            >
                                {clueLabel && (
                                    <span className="absolute top-[2%] left-[2%] text-[9px] leading-none font-bold text-white bg-black px-[2px] py-[0.5px] rounded-[1px] pointer-events-none z-10 font-sans select-none">
                                        {clueLabel}
                                    </span>
                                )}

                                <input
                                    ref={(el) => { if (el) inputRefs.current[y][x] = el; }}
                                    type="text"
                                    maxLength={1}
                                    value={userGrid[y][x] || ''}
                                    onChange={(e) => handleChange(e, x, y)}
                                    onKeyDown={(e) => handleKeyDown(e, x, y)}
                                    onClick={() => onCellClick(x, y)}
                                    style={{
                                        colorScheme: 'light',
                                        backgroundColor: isSelected ? '#fff9db' : (isClueHighlight ? '#fca5a5' : '#ffffff')
                                    }}
                                    className={classNames(
                                        "absolute inset-0 w-full h-full text-center font-bold uppercase outline-none cursor-pointer p-0 m-0 rounded-none caret-black flex items-center justify-center bg-transparent",
                                        // Dynamic font size based on container width approximation or media queries
                                        "text-[clamp(12px,4.5cqw,28px)]",
                                        {
                                            "text-black": true,
                                            "z-20": isSelected,
                                        }
                                    )}
                                />
                                {isSelected && (
                                    <div className="absolute inset-0 border-[4px] border-red-600 pointer-events-none z-30 shadow-sm box-border" />
                                )}
                            </div>
                        );
                    })
                ))}
            </div>
        </div>
    );
};
