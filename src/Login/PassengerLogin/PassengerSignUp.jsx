import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import manDrivingIMG from '../../assets/driving-homepage.jpg';
import './PassengerloginCss/PassengerSignUp.css';
import Header from '../../Header'

const getPasswordStrength = (pwd) => {
  const criteria = {
    length: pwd.length >= 8,
    uppercase: /[A-Z]/.test(pwd),
    lowercase: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    symbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pwd),
  };
  const score = Object.values(criteria).filter(Boolean).length;
  let level = '';
  if (pwd.length === 0) level = '';
  else if (score <= 2) level = 'weak';
  else if (score <= 4) level = 'medium';
  else level = 'strong';
  return { level, criteria, score };
};

function PassengerSignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const { level: strengthLevel, criteria } = getPasswordStrength(password);

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
      console.log('Attempting signup with email:', email);
      console.log('Sending request to: http://localhost:3001/api/passenger/signup');

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

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        alert("✅ Sign up successful!");
        navigate('/PassengerLogin');
      } else {
        setError(data.message || "Sign up failed");
      }

    } catch (error) {
      console.error("Fetch error details:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      setError(`Connection error: ${error.message}. Please check the console for details.`);
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
                {password.length > 0 && (
                  <>
                    <div className="strength-bar-wrapper">
                      <div className={`strength-bar strength-bar--${strengthLevel}`}>
                        <span /><span /><span />
                      </div>
                      <span className={`strength-label strength-label--${strengthLevel}`}>
                        {strengthLevel === 'weak' && '⚠ Weak'}
                        {strengthLevel === 'medium' && '◑ Medium'}
                        {strengthLevel === 'strong' && '✔ Strong'}
                      </span>
                    </div>
                    <ul className="password-requirements">
                      <li className={criteria.length ? 'met' : ''}>At least 8 characters</li>
                      <li className={criteria.uppercase ? 'met' : ''}>Uppercase letter (A–Z)</li>
                      <li className={criteria.lowercase ? 'met' : ''}>Lowercase letter (a–z)</li>
                      <li className={criteria.number ? 'met' : ''}>Number (0–9)</li>
                      <li className={criteria.symbol ? 'met' : ''}>Symbol (!@#$%^&*…)</li>
                    </ul>
                  </>
                )}
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