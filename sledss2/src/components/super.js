import React, { useState, useEffect, useRef } from 'react';
 import config from './config';


function SuperAgentPage() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [userID, setUserID] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const storedID = localStorage.getItem('userID');
    if (storedID) {
      setUserID(storedID);

      const eventSource = new EventSource(`${config.backendUrl}/api/notifications/${storedID}`);
      eventSource.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.warn("Sound error:", err));
        }

        setNotifications(prev => [
          { text: data.message, timestamp: new Date().toLocaleString() },
          ...prev
        ]);
        setUnreadCount(prev => prev + 1);
      };

      eventSource.onerror = () => {
        eventSource.close();
      };

      return () => eventSource.close();
    }
  }, []);

  const handleAsk = async () => {
    if (!message.trim()) {
      alert('Please enter a question.');
      return;
    }

    try {
      const res = await fetch(`${config.backendUrl}/api/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID, message }),
      });

      const data = await res.json();
      setResponse(res.ok ? data.response : `Error: ${data.error}`);
    } catch (error) {
      console.error(error);
      setResponse('Something went wrong.');
    }
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (unreadCount > 0) setUnreadCount(0);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  return (
    <div style={styles.container}>
      <audio ref={audioRef} src="/notification.wav" preload="auto" />

      <h1 style={styles.title}>💬 Your Lifestyle Companion</h1>

      <div style={styles.notificationWrapper}>
        <span style={styles.bell} onClick={toggleNotifications}>🔔</span>
        {unreadCount > 0 && <span style={styles.unreadBadge}>{unreadCount}</span>}

        {showNotifications && (
          <div style={styles.notificationDropdown}>
            <div style={styles.notificationHeader}>🔔 Notifications</div>
            {notifications.length === 0 ? (
              <div style={styles.emptyNote}>You're all caught up!</div>
            ) : (
              notifications.map((note, index) => (
                <div key={index} style={styles.notificationItem}>
                  <div style={styles.notificationText}>{note.text}</div>
                  <div style={styles.notificationTime}>{note.timestamp}</div>
                </div>
              ))
            )}
            <button style={styles.clearButton} onClick={handleClearNotifications}>Clear All</button>
          </div>
        )}
      </div>

      <textarea
        style={styles.textarea}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask something meaningful about your lifestyle..."
      />

      <button style={styles.askButton} onClick={handleAsk}>✨ Ask Agent</button>

      <div style={styles.responseBox}>
        <strong>Agent’s Response:</strong>
        <p>{response}</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '750px',
    margin: '60px auto',
    padding: '50px',
    background: 'linear-gradient(135deg, #e0f7fa, #ffffff)',
    borderRadius: '20px',
    boxShadow: '0 12px 60px rgba(0,0,0,0.15)',
    position: 'relative',
    fontFamily: '"Poppins", sans-serif',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.3)',
  },
  title: {
    fontSize: '36px',
    fontWeight: '800',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: '40px',
  },
  notificationWrapper: {
    position: 'absolute',
    top: '30px',
    right: '30px',
    cursor: 'pointer',
  },
  bell: {
    fontSize: '30px',
    color: '#34495e',
    transition: 'transform 0.3s ease',
  },
  unreadBadge: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    fontSize: '12px',
    borderRadius: '50%',
    padding: '4px 8px',
    fontWeight: 'bold',
  },
  notificationDropdown: {
    position: 'absolute',
    top: '45px',
    right: '0',
    width: '340px',
    maxHeight: '400px',
    overflowY: 'auto',
    background: '#ffffffcc',
    borderRadius: '12px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    zIndex: 10,
    border: '1px solid #ccc',
    backdropFilter: 'blur(10px)',
  },
  notificationHeader: {
    padding: '15px 20px',
    borderBottom: '1px solid #eee',
    fontSize: '18px',
    fontWeight: 'bold',
    background: '#fefefe',
    color: '#f39c12',
  },
  emptyNote: {
    padding: '25px',
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#999',
  },
  notificationItem: {
    padding: '12px 20px',
    borderBottom: '1px dashed #ddd',
    transition: 'background 0.3s',
  },
  notificationText: {
    fontWeight: '500',
    color: '#34495e',
  },
  notificationTime: {
    fontSize: '12px',
    color: '#888',
    marginTop: '6px',
  },
  clearButton: {
    width: '90%',
    margin: '15px auto',
    display: 'block',
    padding: '10px 0',
    background: '#f39c12',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background 0.3s ease',
  },
  textarea: {
    width: '100%',
    padding: '20px',
    fontSize: '16px',
    borderRadius: '12px',
    border: '1.5px solid #ccc',
    outline: 'none',
    transition: 'border 0.3s ease',
    boxShadow: '0 6px 15px rgba(0,0,0,0.05)',
    background: '#ffffff',
  },
  askButton: {
    marginTop: '25px',
    padding: '15px 50px',
    fontSize: '18px',
    borderRadius: '12px',
    backgroundColor: '#1abc9c',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background 0.3s, transform 0.2s',
    boxShadow: '0 8px 20px rgba(26, 188, 156, 0.3)',
  },
  responseBox: {
    marginTop: '40px',
    padding: '30px',
    backgroundColor: '#ecf0f1',
    borderRadius: '12px',
    border: '1px solid #bdc3c7',
    color: '#2c3e50',
    fontSize: '16px',
    lineHeight: '1.6',
    boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
  },
};

export default SuperAgentPage;

