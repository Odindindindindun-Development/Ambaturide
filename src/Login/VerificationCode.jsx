import { useState, useRef, useEffect } from 'react';
import './VerificationCode.css';

function VerificationCode({ email, userType, onVerificationSuccess, onResendCode }) {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(60);
    const inputRefs = useRef([]);

    // Focus first input only on initial mount
    useEffect(() => {
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []); // Empty dependency array - runs only once on mount

    // Countdown timer for resend
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const handleChange = (index, value) => {
        // Remove non-numeric characters
        const numericValue = value.replace(/[^\d]/g, '');

        // If multiple digits are entered (paste or autofill), distribute them
        if (numericValue.length > 1) {
            const digits = numericValue.slice(0, 6).split('');
            const newCode = [...code];

            digits.forEach((digit, i) => {
                if (index + i < 6) {
                    newCode[index + i] = digit;
                }
            });

            setCode(newCode);
            setError('');

            // Focus the next empty input or the last filled one
            const nextIndex = Math.min(index + digits.length, 5);
            setTimeout(() => {
                if (inputRefs.current[nextIndex]) {
                    inputRefs.current[nextIndex].focus();
                }
            }, 0);

            // Auto-submit when all digits are entered
            if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
                setTimeout(() => handleVerify(newCode.join('')), 100);
            }
            return;
        }

        // Single digit entry
        if (numericValue.length <= 1) {
            const newCode = [...code];
            newCode[index] = numericValue;
            setCode(newCode);
            setError('');

            // Auto-focus next input after state update
            if (numericValue && index < 5) {
                setTimeout(() => {
                    if (inputRefs.current[index + 1]) {
                        inputRefs.current[index + 1].focus();
                    }
                }, 0);
            }

            // Auto-submit when all digits are entered
            if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
                setTimeout(() => handleVerify(newCode.join('')), 100);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace') {
            e.preventDefault();
            const newCode = [...code];

            if (code[index]) {
                // Clear current input
                newCode[index] = '';
                setCode(newCode);
            } else if (index > 0) {
                // Clear previous input and move focus back
                newCode[index - 1] = '';
                setCode(newCode);
                setTimeout(() => {
                    if (inputRefs.current[index - 1]) {
                        inputRefs.current[index - 1].focus();
                    }
                }, 0);
            }
        }
        // Handle Delete key
        else if (e.key === 'Delete') {
            e.preventDefault();
            const newCode = [...code];
            newCode[index] = '';
            setCode(newCode);
        }
        // Handle arrow keys
        else if (e.key === 'ArrowLeft' && index > 0) {
            e.preventDefault();
            setTimeout(() => {
                if (inputRefs.current[index - 1]) {
                    inputRefs.current[index - 1].focus();
                }
            }, 0);
        }
        else if (e.key === 'ArrowRight' && index < 5) {
            e.preventDefault();
            setTimeout(() => {
                if (inputRefs.current[index + 1]) {
                    inputRefs.current[index + 1].focus();
                }
            }, 0);
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').trim();

        // Only process if it's 6 digits
        if (/^\d{6}$/.test(pastedData)) {
            const newCode = pastedData.split('');
            setCode(newCode);
            inputRefs.current[5].focus();

            // Auto-submit after paste
            setTimeout(() => handleVerify(pastedData), 100);
        }
    };

    const handleVerify = async (codeString = null) => {
        const verificationCode = codeString || code.join('');

        if (verificationCode.length !== 6) {
            setError('Please enter all 6 digits');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const endpoint = userType === 'passenger'
                ? 'http://localhost:3001/api/passenger/verify-code'
                : 'http://localhost:3001/api/driver/verify-code';

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code: verificationCode }),
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Invalid verification code');
                setCode(['', '', '', '', '', '']);
                if (inputRefs.current[0]) {
                    inputRefs.current[0].focus();
                }
                return;
            }

            // Success - call parent callback
            onVerificationSuccess(data);
        } catch (err) {
            console.error('❌ Verification error:', err);
            setError('Server error. Please try again.');
            setCode(['', '', '', '', '', '']);
            if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0) return;

        setLoading(true);
        setError('');
        setCode(['', '', '', '', '', '']);

        try {
            await onResendCode();
            setResendTimer(60); // Reset timer
            if (inputRefs.current[0]) {
                inputRefs.current[0].focus();
            }
        } catch (err) {
            setError('Failed to resend code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="verification-container">
            <div className="verification-card">
                <div className="verification-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 8L12 13L4 8V6L12 11L20 6V8Z" fill="#4F46E5" />
                    </svg>
                </div>

                <h2 className="verification-title">Verify Your Email</h2>
                <p className="verification-subtitle">
                    We sent a 6-digit code to <strong>{email}</strong>
                </p>

                {error && <div className="verification-error">{error}</div>}

                <form className="verification-form" onSubmit={(e) => { e.preventDefault(); handleVerify(); }}>
                    <div className="code-inputs" onPaste={handlePaste}>
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => inputRefs.current[index] = el}
                                type="text"
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onFocus={(e) => {
                                    // Only select if there's a value to replace
                                    if (e.target.value) {
                                        e.target.select();
                                    }
                                }}
                                className="code-input"
                                disabled={loading}
                                autoComplete="one-time-code"
                                aria-label={`Digit ${index + 1}`}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        className="verify-button"
                        disabled={loading || code.some(digit => digit === '')}
                    >
                        {loading ? 'Verifying...' : 'Verify'}
                    </button>
                </form>

                <div className="resend-section">
                    <p>Didn't receive the code?</p>
                    {resendTimer > 0 ? (
                        <p className="resend-timer">Resend in {resendTimer}s</p>
                    ) : (
                        <button
                            onClick={handleResend}
                            className="resend-button"
                            disabled={loading}
                        >
                            Resend Code
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default VerificationCode;
