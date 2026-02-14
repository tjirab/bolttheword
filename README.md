# Bolt The Word ⚡️🧩

**Daily Magic: The Gathering Crossword**

<p align="center">
  <img src="src/assets/boltthebird.png" alt="Bolt The Word Logo" width="120" height="120" style="border-radius: 50%;">
</p>

# [⚡️ PLAY NOW ⚡️](https://tjirab.github.io/bolttheword/)

Test your knowledge of Magic: The Gathering cards, lore, and mechanics with a new crossword puzzle every day!

## 🎮 How to Play

1.  **Daily Puzzle**: A new puzzle is generated every day based on the current date. Everyone gets the same puzzle!
2.  **Clues**: Click on a clue in the list or a cell in the grid to highlight the word.
    *   **Flavor**: Guess the card from its flavor text.
    *   **Oracle**: Fill in the blank (classic card text).
    *   **Artist**: Identify the card by its artist, set, and mana cost.
    *   **Type & Cost**: Guess the card from its type line and mana cost.
3.  **Navigation**:
    *   Type to fill in letters.
    *   Use **Arrow Keys** to move around.
    *   Click a cell **twice** to switch direction (Across/Down).
    *   **Backspace** clears the cell and moves back.
4.  **Winning**: The game will automatically notify you when the grid is filled correctly.
5.  **Stuck?**: You can click the "Concede" button to reveal the solution.

## 🛠️ Development

This project is built with **React**, **TypeScript**, **Vite**, and **Tailwind CSS**. It fetches data from the [Scryfall API](https://scryfall.com/docs/api).

### Prerequisites
- Node.js (v18+)
- npm

### Installation

```bash
git clone https://github.com/tjirab/bolttheword.git
cd bolttheword
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
```

For advanced configuration (ESLint, React Compiler), see [DEVELOPMENT.md](DEVELOPMENT.md).

## 🚀 Deployment

The project is configured for **GitHub Pages**.

To deploy manually:

```bash
npm run deploy
```

This will build the project and push the `dist` folder to the `gh-pages` branch.

## 🔒 Security

This is a client-side application. No user data is stored or transmitted to any server (other than fetching public card data from Scryfall).

## 📄 License
MIT
