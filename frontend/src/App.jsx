import { useState } from 'react';
import './App.css';
import binhiLogo from './assets/binhiLogo.png';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Username:', username, 'Password:', password);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="left-panel">
          <h1>Account Login</h1>
          <p>Please enter your merchant credentials provided by the admin to access your store management panel.</p>
        </div>
        <div className="right-panel">
          <img src={binhiLogo} alt="BinhiNav Logo" className="logo" />
          <h2>Get Started</h2>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder=" "
                required
              />
              <label htmlFor="username">Username</label>
            </div>

            <div className="input-group">
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                required
              />
              <label htmlFor="password">Password</label>
            </div>

            <button type="submit">Sign In</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
