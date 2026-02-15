import type { Card } from './types';

const OLD_SCHOOL_SETS = ['leb', 'arn', 'leg', 'drk', 'atq', 'fem'];
const OLD_SCHOOL_QUERY = `(${OLD_SCHOOL_SETS.map(s => `set:${s}`).join(' OR ')}) -is:basic -type:basic`;
const PREMODERN_QUERY = `f:premodern -is:basic -type:basic`;

export type GameMode = 'oldschool' | 'premodern';

export async function fetchCards(page: number = 1, mode: GameMode = 'oldschool'): Promise<Card[]> {
    const query = mode === 'premodern' ? PREMODERN_QUERY : OLD_SCHOOL_QUERY;
    try {
        const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&page=${page}`);
        if (!response.ok) {
            throw new Error('Failed to fetch cards');
        }
        const data = await response.json();
        return data.data.map((card: any) => ({
            id: card.id,
            name: card.name.split(' // ')[0], // Take first face of double-faced cards
            set: card.set,
            collector_number: card.collector_number,
            oracle_text: card.oracle_text,
            flavor_text: card.flavor_text,
            mana_cost: card.mana_cost,
            type_line: card.type_line,
            artist: card.artist,
            image_uris: card.image_uris || (card.card_faces && card.card_faces[0].image_uris),
        }));
    } catch (error) {
        console.error(error);
        return [];
    }
}
