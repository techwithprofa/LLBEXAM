'use client';

import { useState } from 'react';
import GameList from '../Components/Playgrounds_Components/GameList';
import GamePlayground from '../Components/Playgrounds_Components/GamePlayground';

export default function Playground() {
  const [selectedGameId, setSelectedGameId] = useState<string>('dwxjydtzz');

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Left sidebar with GameList */}
      <div className="w-90 border-r border-gray-200 bg-gray-50">
        <GameList onGameSelect={setSelectedGameId} />
      </div>
      
      {/* Main content area with GamePlayground */}
      <div className="flex-1">
        <GamePlayground gameId={selectedGameId} />
      </div>
    </div>
  );
}
