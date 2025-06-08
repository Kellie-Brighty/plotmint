# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```

# PlotMint

PlotMint is a decentralized storytelling platform where chapters are minted as NFTs and readers influence stories through voting.

## Features

- Create and explore interactive stories
- Vote on story direction to influence the narrative
- Collect chapters as NFTs
- Track story progress and engagement metrics
- Mobile-responsive design with dark mode support

## User Dashboards

PlotMint includes two comprehensive dashboards for different user roles:

### Reader Dashboard
- **Collections Tab**: View and manage all collected story chapters
- **Reading History**: Track reading progress across multiple stories
- **Voting History**: Review previous story direction votes
- **Notifications**: Stay updated on new chapters and story developments

### Creator Dashboard
- **Story Management**: Create, edit, and manage interactive stories
- **Analytics**: Track reader engagement, collections, and revenue
- **Chapter Drafts**: Manage in-progress chapters and publishing workflow

## Scroll-to-Top Behavior

The application implements a scroll-to-top mechanism using React Router. When users navigate between pages, the `ScrollToTop` component automatically scrolls the window to the top, providing a better user experience.

This behavior is implemented globally and doesn't require individual components to manage their own scroll position. The component leverages React Router's `useLocation` hook to detect route changes.

## Development

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies: `npm install` or `yarn`
3. Start development server: `npm run dev` or `yarn dev`

## Built With

- React
- TypeScript
- React Router
- Framer Motion
- Tailwind CSS
