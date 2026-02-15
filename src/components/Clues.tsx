import React from 'react';
import type { Clue } from '../lib/types';
import classNames from 'classnames';

interface CluesProps {
    clues: Clue[];
    activeClueId: string | null;
    onClueClick: (clueId: string) => void;
}

export const Clues: React.FC<CluesProps> = ({ clues, activeClueId, onClueClick }) => {
    const across = clues.filter(c => c.direction === 'across');
    const down = clues.filter(c => c.direction === 'down');

    // We need to display the clue number (index + 1)
    // But since we split them, we need to find their original index.
    const getClueNum = (clue: Clue) => clues.indexOf(clue) + 1;

    const ClueList = ({ title, items }: { title: string, items: Clue[] }) => (
        <div className="flex flex-col gap-2">
            <h3 className="font-serif text-xl font-bold border-b border-gray-600 pb-1 mb-2 text-gray-200">{title}</h3>
            <ul className="space-y-1 max-h-[60vh] lg:max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar">
                {items.map(clue => (
                    <li
                        key={clue.id}
                        onClick={() => onClueClick(clue.id)}
                        className={classNames(
                            "p-2 rounded cursor-pointer text-sm leading-snug transition-colors",
                            {
                                "bg-yellow-600 text-white font-medium": activeClueId === clue.id,
                                "bg-gray-800 text-gray-300 hover:bg-gray-700": activeClueId !== clue.id
                            }
                        )}
                    >
                        <span className="font-bold mr-1">{getClueNum(clue)}.</span>
                        {clue.clue}
                    </li>
                ))}
                {items.length === 0 && <li className="text-gray-500 italic">No clues</li>}
            </ul>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
            <ClueList title="Across" items={across} />
            <ClueList title="Down" items={down} />
        </div>
    );
};
