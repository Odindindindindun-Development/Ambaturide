import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import manDrivingIMG from '../../assets/driving-homepage.jpg';
import './DriverLogin.css';
import DriverHeader from '../../../src/DriverHeader.jsx';

function DriverLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // local admin shortcut
    if (email === 'admin' && password === 'adminadmin') {
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('user', JSON.stringify({ Email: email, role: 'admin' }));
      // ensure driver flag is cleared for admin
      localStorage.removeItem('driver');
      navigate('/admin');
      return;
    }

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      // ✅ Save logged-in driver to localStorage
      // Use data.driver instead of undefined driverData variable
      const driverData = data.driver || data; // Handle both response formats
      
      localStorage.setItem('user', JSON.stringify(driverData));
      localStorage.setItem('driver', JSON.stringify(driverData));
      localStorage.removeItem('isAdmin');
      
      console.log('✅ Driver login success:', data);

      // ✅ Navigate to driver dashboard
      navigate('/DriverBooking');
    } catch (err) {
      console.error('❌ Error:', err);
      setError('Server error. Please try again later.');
    }
  };

  return (
    <>
      <DriverHeader />
      <div className="app-container">
        <div className="homepage-container">
          <div className="homepage-left">
            <div className="login-header">
              <h2>Driver Sign In</h2>
              <p>Access your driver dashboard</p>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="email">Email or Phone Number</label>
                <input
                  type="text"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email or phone number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <div className="remember-me">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <a href="#" className="forgot-password">Forgot password?</a>
              </div>

              <button type="submit" className="login-btn">Sign In</button>

              <div className="divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="create-account-btn"
                onClick={() => navigate('/DriverSignUp')}
              >
                Create Driver Account
              </button>
            </form>
          </div>

          <div className="homepage-right">
            <div className="image-container">
              <img src={manDrivingIMG} alt="Person driving" className="login-image" />
              <div className="image-overlay">
                <h3>Ride with Confidence</h3>
                <p>Safe, reliable transportation at your fingertips</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DriverLogin;