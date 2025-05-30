'use client'

import Link from 'next/link';
export default function NavBar() {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-lg font-bold">
          Home
        </Link>
        <div className="space-x-4">
          <Link href="/Pages/Add_Game" className="text-white hover:text-gray-300">
            Add Game
          </Link>
          <Link href="/Playground" className="text-white hover:text-gray-300">
            Play
          </Link>
        </div>
      </div>
    </nav>
  );
}
