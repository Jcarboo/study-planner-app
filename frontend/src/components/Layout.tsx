import React from 'react';
import Navbar from './Navbar';

type LayoutProps = {
  children: React.ReactNode;
  isLoggedIn: boolean;
  onLogout: () => void;
  noPadding?: boolean;
};

export default function Layout({ children, isLoggedIn, onLogout, noPadding = false }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} onLogout={onLogout} />
      <main className='{`flex-1`}'>
        {children}
      </main>
    </div>
  );
}
