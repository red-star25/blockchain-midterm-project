import { useState } from 'react';
import './App.css';
import CryptoZombies from './components/CryptoZombies';
import CryptoMarketplace from './components/CryptoMarketplace';

function App() {
  const [view, setView] = useState('dashboard');

  return (
    <div className="app-shell">
      <main className="app-content">
        {view === 'dashboard' ? (
          <CryptoZombies onGoToMarketplace={() => setView('marketplace')} />
        ) : (
          <CryptoMarketplace onGoToDashboard={() => setView('dashboard')} />
        )}
      </main>
    </div>
  );
}

export default App;
