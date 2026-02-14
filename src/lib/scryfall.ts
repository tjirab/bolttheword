import type { Card } from './types';

const SETS = ['leb', 'arn', 'leg', 'drk', 'atq', 'fem'];
const QUERY = `(${SETS.map(s => `set:${s}`).join(' OR ')}) -is:basic -type:basic`;

export async function fetchCards(page: number = 1): Promise<Card[]> {
    try {
        const response = await fetch(`https://api.scryfall.com/cards/search?q=${encodeURIComponent(QUERY)}&page=${page}`);
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
