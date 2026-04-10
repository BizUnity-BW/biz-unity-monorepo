import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import flagsmith from 'flagsmith';
import './index.css';
import App from './App.tsx';

flagsmith.init({
  environmentID: import.meta.env.VITE_FLAGSMITH_ENVIRONMENT_KEY,
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
