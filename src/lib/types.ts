export interface Card {
    id: string;
    name: string;
    set: string;
    collector_number: string;
    oracle_text?: string;
    flavor_text?: string;
    mana_cost?: string;
    type_line: string;
    artist?: string;
    image_uris?: {
        normal: string;
        art_crop: string;
    };
}

export interface Clue {
    id: string;
    clue: string;
    answer: string;
    direction: 'across' | 'down';
    x: number;
    y: number;
    length: number;
}

export interface CrosswordGrid {
    width: number;
    height: number;
    grid: (string | null)[][];
    clues: Clue[];
}
