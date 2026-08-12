import React, { useState } from 'react';
import Login from './Login';
import FloristApp from './FloristApp';
import CustomerApp from './CustomerApp';
import DeliveryApp from './DeliveryApp';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [username, setUsername] = useState(localStorage.getItem('username') || 'user');
  const [role, setRole] = useState(localStorage.getItem('role') || 'ROLE_CUSTOMER');

  const handleLoginSuccess = (newToken, newUsername, newRole) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    localStorage.setItem('role', newRole);
    setToken(newToken);
    setUsername(newUsername);
    setRole(newRole);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    setToken(null);
    setUsername('');
    setRole('');
  };

  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  if (role === 'ROLE_ADMIN') {
    return <FloristApp token={token} username={username} onLogout={handleLogout} />;
  }

  if (role === 'ROLE_DELIVERY' || username === 'rider') {
    return <DeliveryApp token={token} username={username} onLogout={handleLogout} />;
  }

  return <CustomerApp token={token} username={username} onLogout={handleLogout} />;
}

export default App;
