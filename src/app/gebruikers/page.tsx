'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import Sidebar from '../components/Sidebar';
import WebChat from '../components/WebChat';

export default function GebruikersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [showChat, setShowChat] = useState(false);

  // Check if user is admin
  if (!isAuthenticated || user?.role !== 'admin') {
    router.push('/');
    return (
      <div className="dashboard-container">
        <Sidebar />
        <div className="dashboard-main-content">
          <div className="dashboard-header">
            <div className="header-content">
              <div className="welcome-section">
                <h1>Toegang Geweigerd</h1>
                <p>U heeft geen toestemming om deze pagina te bekijken</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar activeSection="gebruikers" />
      
      <div className="dashboard-main-content">
        <div className="dashboard-header">
          <div className="header-content">
            <div className="welcome-section">
              <h1>Gebruikers Beheer</h1>
              <p>Beheer gebruikersaccounts en toegangsrechten</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="gebruikers-content">
            <div className="gebruikers-section">
              <h2>👥 Gebruikers Overzicht</h2>
              <p>Hier komt het gebruikersbeheer en toegangscontrole.</p>
              
              <div className="gebruikers-stats">
                <div className="stat-card">
                  <h3>Totale Gebruikers</h3>
                  <p className="stat-number">0</p>
                </div>
                <div className="stat-card">
                  <h3>Actieve Gebruikers</h3>
                  <p className="stat-number">0</p>
                </div>
                <div className="stat-card">
                  <h3>Admins</h3>
                  <p className="stat-number">0</p>
                </div>
                <div className="stat-card">
                  <h3>Nieuwe Deze Week</h3>
                  <p className="stat-number">0</p>
                </div>
              </div>
            </div>

            <div className="gebruikers-section">
              <h2>🔐 Toegangscontrole</h2>
              <p>Gebruikersbeheer functionaliteit komt hier.</p>
            </div>
          </div>
        </div>
      </div>

      {/* WebChat Bubble */}
      <div className="chat-window">
        <div className="chat-header" onClick={() => setShowChat(!showChat)}>
          <div className="chat-title">💬 Chat Support</div>
          <div className="chat-status">Online</div>
        </div>
        {showChat && <WebChat />}
      </div>
    </div>
  );
}
