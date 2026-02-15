import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import manDrivingIMG from '../../assets/driving-homepage.jpg';
import './PassengerSignUp.css';
import Header from '../../Header'

function PassengerSignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  if (!email || !password || !confirmPassword) {
    setError('Please fill in all fields');
    return;
  }

  if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  if (password.length < 6) {
    setError('Password must be at least 6 characters');
    return;
  }

  try {
    const response = await fetch("http://localhost:3001/api/passenger/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Passenger",
        lastName: "User",
        email,
        password,
        phoneNumber: "0000000000",
        address: "Unknown",
        birthDate: "2000-01-01"
      }),
    });

    const data = await response.json();

    if (data.success) {
      alert("✅ Sign up successful!");
      navigate('/PassengerLogin');
    } else {
      setError(data.message || "Sign up failed");
    }

  } catch (error) {
    console.error("Error:", error);
    setError("Something went wrong. Please try again.");
  }
};


  return (
    <>
  <Header />
    <div className="app-container">
      <div className="homepage-container">
        <div className="homepage-left">
          <div className="login-header">
            <h2>Create Account</h2>
            <p>Join us and start your journey</p>
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
                  type={showPassword ? "text" : "password"} 
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
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-container">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>
            
            <button type="submit" className="login-btn">Sign Up</button>
            
            <div className="divider">
              <span>Already have an account?</span>
            </div>
            
            <button 
              type="button" 
              className="create-account-btn"
              onClick={() => navigate('/PassengerLogin')}
            >
              Sign In
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

export default PassengerSignUp;