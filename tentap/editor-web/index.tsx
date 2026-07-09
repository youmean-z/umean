import React from 'react';
import { createRoot } from 'react-dom/client';

import { AdvancedEditor } from './AdvancedEditor.js';

declare global {
  interface Window {
    contentInjected?: boolean;
    dynamicHeight?: boolean;
  }
}

const contentInjected = () => window.contentInjected;

const interval = setInterval(() => {
  if (!contentInjected()) {
    return;
  }

  const container = document.getElementById('root');
  if (!container) {
    return;
  }

  createRoot(container).render(
    <React.StrictMode>
      <AdvancedEditor />
    </React.StrictMode>,
  );

  clearInterval(interval);
}, 1);
