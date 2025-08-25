'use client';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  activeSection?: string;
}

export default function Sidebar({ activeSection }: SidebarProps) {
  const router = useRouter();

  const handleLandingPage = () => {
    router.push('/');
  };

  const handleUploadDocuments = () => {
    router.push('/info');
  };

  const handleChatBeheren = () => {
    router.push('/chat-beheren');
  };

  const handleLogging = () => {
    router.push('/logging');
  };

  const handleGebruikers = () => {
    router.push('/gebruikers');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Admin Panel</h3>
      </div>
      
      <nav className="sidebar-nav">
        <button 
          className={`sidebar-item ${activeSection === 'landing' ? 'active' : ''}`}
          onClick={handleLandingPage}
        >
          <div className="sidebar-icon">🏠</div>
          <div className="sidebar-content">
            <span className="sidebar-title">Landing Page</span>
            <span className="sidebar-description">Ga naar webchat</span>
          </div>
        </button>

        <button 
          className={`sidebar-item ${activeSection === 'documenten' ? 'active' : ''}`}
          onClick={handleUploadDocuments}
        >
          <div className="sidebar-icon">📄</div>
          <div className="sidebar-content">
            <span className="sidebar-title">Documenten Beheren</span>
            <span className="sidebar-description">Upload en beheer documenten</span>
          </div>
        </button>

        <button 
          className={`sidebar-item ${activeSection === 'chat' ? 'active' : ''}`}
          onClick={handleChatBeheren}
        >
          <div className="sidebar-icon">💬</div>
          <div className="sidebar-content">
            <span className="sidebar-title">Chat Support</span>
            <span className="sidebar-description">Bekijk en beheer chat</span>
          </div>
        </button>

        <button 
          className={`sidebar-item ${activeSection === 'logging' ? 'active' : ''}`}
          onClick={handleLogging}
        >
          <div className="sidebar-icon">📊</div>
          <div className="sidebar-content">
            <span className="sidebar-title">WebChat Logging</span>
            <span className="sidebar-description">Bekijk chat logs en statistieken</span>
          </div>
        </button>

        <button 
          className={`sidebar-item ${activeSection === 'gebruikers' ? 'active' : ''}`}
          onClick={handleGebruikers}
        >
          <div className="sidebar-icon">👥</div>
          <div className="sidebar-content">
            <span className="sidebar-title">Gebruikers</span>
            <span className="sidebar-description">Beheer gebruikers</span>
          </div>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">Y</div>
        </div>
      </div>
    </div>
  );
}
