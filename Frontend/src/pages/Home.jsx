import React, { useCallback, useEffect, useState } from 'react';
import { io } from "socket.io-client";
import ChatMobileBar from '../components/chat/ChatMobileBar.jsx';
import ChatSidebar from '../components/chat/ChatSidebar.jsx';
import ChatMessages from '../components/chat/ChatMessages.jsx';
import ChatComposer from '../components/chat/ChatComposer.jsx';
import '../components/chat/ChatLayout.css';
import { fakeAIReply } from '../components/chat/aiClient.js';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import {
  ensureInitialChat,
  startNewChat,
  selectChat,
  setInput,
  sendingStarted,
  sendingFinished,
  addUserMessage,
  addAIMessage,
  setChats
} from '../store/chatSlice.js';


import { Link, useNavigate } from 'react-router-dom';

const Home = () => {
  const dispatch = useDispatch();
  const chats = useSelector(state => state.chat.chats);
  const activeChatId = useSelector(state => state.chat.activeChatId);
  const input = useSelector(state => state.chat.input);
  const isSending = useSelector(state => state.chat.isSending);
  const [ sidebarOpen, setSidebarOpen ] = React.useState(false);
  const [ socket, setSocket ] = useState(null);
  const [ isAuthenticated, setIsAuthenticated ] = useState(false);
  const navigate = useNavigate();

  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const [ messages, setMessages ] = useState([]);

  // Check authentication status
  useEffect(() => {
    axios.get("http://localhost:3000/api/chat", { withCredentials: true })
      .then(response => {
        dispatch(setChats(response.data.chats.reverse()));
        setIsAuthenticated(true);
      })
      .catch(() => {
        setIsAuthenticated(false);
      });

    const tempSocket = io("http://localhost:3000", {
      withCredentials: true,
    });

    tempSocket.on("ai-response", (messagePayload) => {
      setMessages((prevMessages) => [ ...prevMessages, {
        type: 'ai',
        content: messagePayload.content
      } ]);
      dispatch(sendingFinished());
    });
    setSocket(tempSocket);
  }, [dispatch]);

  const handleNewChat = async () => {
    let title = window.prompt('Enter a title for the new chat:', '');
    if (title) title = title.trim();
    if (!title) return;
    const response = await axios.post("http://localhost:3000/api/chat", {
      title
    }, {
      withCredentials: true
    });
    getMessages(response.data.chat._id);
    dispatch(startNewChat(response.data.chat));
    setSidebarOpen(false);
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || !activeChatId || isSending) return;
    dispatch(sendingStarted());
    const newMessages = [ ...messages, {
      type: 'user',
      content: trimmed
    } ];
    setMessages(newMessages);
    dispatch(setInput(''));
    socket.emit("ai-message", {
      chat: activeChatId,
      content: trimmed
    });
  };

  const getMessages = async (chatId) => {
    const response = await axios.get(`http://localhost:3000/api/chat/messages/${chatId}`, { withCredentials: true });
    setMessages(response.data.messages.map(m => ({
      type: m.role === 'user' ? 'user' : 'ai',
      content: m.content
    })));
  };

  // Logout handler
  const handleLogout = () => {
    // Remove cookie by making a logout request or clearing it client-side
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setIsAuthenticated(false);
    navigate('/');
  };

  if (!isAuthenticated) {
    return (
      <div className="center-min-h-screen">
        <div className="auth-card" style={{ textAlign: 'center' }}>
        <img src='./src/assets/Aurora.png' style={{height:80, width:80, marginBottom:-50,marginLeft:140}}></img>
          <h1>Welcome to Aurora</h1>
          <p style={{ marginTop:-30}}>Please login or register to access chat features.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center',  }}>
            <Link to="/login">
              <button className="primary-btn">Login</button>
            </Link>
            <Link to="/register">
              <button className="primary-btn">Register</button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Handler to delete a chat
  const handleDeleteChat = async (chatId) => {
    if (!window.confirm('Are you sure you want to delete this chat? This action cannot be undone.')) return;
    try {
      await axios.delete(`http://localhost:3000/api/chat/${chatId}`, { withCredentials: true });
      // Remove chat from Redux state
      const updatedChats = chats.filter(c => c.id !== chatId && c._id !== chatId);
      dispatch(setChats(updatedChats));
      // If the deleted chat is active, clear messages and activeChatId
      if (activeChatId === chatId) {
        dispatch(selectChat(null));
        setMessages([]);
      }
    } catch (err) {
      alert('Failed to delete chat.');
    }
  };

  return (
    <div className="chat-layout minimal">
      <ChatMobileBar
        onToggleSidebar={() => setSidebarOpen(o => !o)}
        onNewChat={handleNewChat}
      />
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          dispatch(selectChat(id));
          setSidebarOpen(false);
          getMessages(id);
        }}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        open={sidebarOpen}
        handleLogout={handleLogout}
      />
      <main className="chat-main" role="main">
        {messages.length === 0 && (
          <div className="chat-welcome" aria-hidden="true">
            <div className="chip">Early Preview</div>
            <h1>Aurora</h1>
            <p>Ask anything. Paste text, brainstorm ideas, or get quick explanations. Your chats stay in the sidebar so you can pick up where you left off.</p>
          </div>
        )}
        <ChatMessages messages={messages} isSending={isSending} />
        {activeChatId && (
          <ChatComposer
            input={input}
            setInput={(v) => dispatch(setInput(v))}
            onSend={sendMessage}
            isSending={isSending}
          />
        )}
      </main>
      {sidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Home;
