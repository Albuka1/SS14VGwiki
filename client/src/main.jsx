import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';

import App from './App';
import AppErrorBoundary from './components/AppErrorBoundary';
import NavigationEffects from './components/NavigationEffects';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AppErrorBoundary>
      <NavigationEffects />
      <App />
    </AppErrorBoundary>
  </BrowserRouter>
);
