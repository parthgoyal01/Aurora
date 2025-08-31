import React, { useState } from 'react';
import './ChatSidebar.css';


const ChatSidebar = ({ chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, open, user, handleLogout }) => {

  const [showProfile, setShowProfile] = useState(false);

  const handleProfileClick = () => setShowProfile(true);
  const handleCloseProfile = () => setShowProfile(false);

  return (
    <aside className={"chat-sidebar " + (open ? 'open' : '')} aria-label="Previous chats">
      <div className="sidebar-header">
        <h2>Chats</h2>
        <button className="small-btn" onClick={onNewChat}>New</button>
      </div>
      <nav className="chat-list" aria-live="polite">
        {chats.map((c, idx) => (
          <React.Fragment key={c._id}>
            <div className="chat-list-item-wrapper">
              <button
                className={"chat-list-item " + (c._id === activeChatId ? 'active' : '')}
                onClick={() => onSelectChat(c._id)}
              >
                <span className="title-line">{c.title}</span>
              </button>
              <button
                className="delete-chat-btn"
                title="Delete chat"
                onClick={() => onDeleteChat(c._id)}
              >🗑️</button>
            </div>
            {/* Add space between chat titles except after last item */}
            {idx < chats.length - 1 && <div style={{ height: '2rem' }} />}
          </React.Fragment>
        ))}
        {chats.length === 0 && <p className="empty-hint">No chats yet.</p>}
      </nav>
      {/* Profile and Logout buttons at the bottom of sidebar */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '1rem 0' }}>
  <button className="primary-btn" onClick={handleProfileClick}>Profile</button>
  <button className="primary-btn" onClick={handleLogout}>Logout</button>
      </div>

      {/* Profile Modal */}
      {showProfile && user && (
        <div className="profile-modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: '8px', minWidth: '300px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Profile Details</h3>
            <p><strong>Name:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <button className="primary-btn" style={{ marginTop: '1rem' }} onClick={handleCloseProfile}>Close</button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default ChatSidebar;
