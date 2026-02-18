# 🔐 Email Verification Authentication System

This project includes a two-factor authentication system with email verification codes for both passengers and drivers.

## 📧 Email Configuration

### Quick Setup for Development (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate an App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password

3. **Configure .env file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=kentsevellino11@gmail.com
   EMAIL_PASS=ulkmsiflbzepnsqg
   EMAIL_FROM=Ambaturide <kentsevellino11@gmail.com>
   ```

### Alternative: Console Logging (No Email Setup)

If you don't configure email settings, verification codes will be logged to the console. This is perfect for development and testing.

Look for output like:
```
═══════════════════════════════════════
📧 VERIFICATION CODE (No Email Service)
═══════════════════════════════════════
Email: user@example.com
Name: John Doe
Code: 123456
═══════════════════════════════════════
```

## 🚀 How It Works

### For Passengers & Drivers

1. **Login**: Enter email and password
2. **Verification**: A 6-digit code is sent to your email
3. **Enter Code**: Input the 6-digit code in the verification screen
4. **Access Granted**: Upon successful verification, you're logged in

### Features

- ✅ 6-digit random verification codes
- ✅ 10-minute expiration for security
- ✅ Resend code functionality with 60-second cooldown
- ✅ Auto-submit when all digits are entered
- ✅ Paste support for verification codes
- ✅ Mobile-responsive design
- ✅ Beautiful gradient UI
- ✅ Console fallback when email is not configured

## 🛠️ Backend Endpoints

### Passenger Authentication
- `POST /api/passenger/login` - Initiate login and send verification code
- `POST /api/passenger/verify-code` - Verify the 6-digit code
- `POST /api/passenger/resend-code` - Resend verification code

### Driver Authentication
- `POST /api/driver/login` - Initiate login and send verification code
- `POST /api/driver/verify-code` - Verify the 6-digit code
- `POST /api/driver/resend-code` - Resend verification code

## 🔧 Technical Details

### Code Storage
- Verification codes are temporarily stored in memory (Map)
- For production, consider using Redis or database storage
- Codes expire after 10 minutes

### Security Features
- Codes are 6 random digits (100,000 to 999,999)
- Time-limited validity (10 minutes)
- Rate limiting on resend (60 seconds)
- Secure httpOnly cookies for JWT tokens

## 📱 User Experience

### Verification Screen Features
- Clean, modern UI with gradient design
- Individual input boxes for each digit
- Auto-focus and auto-advance between inputs
- Backspace navigation
- Full paste support
- Real-time validation
- Resend timer countdown
- Error handling with user-friendly messages

## 🧪 Testing

### Without Email Configuration
1. Start the server: `npm start`
2. Login with passenger or driver credentials
3. Check the terminal/console for the verification code
4. Enter the code in the verification screen

### With Email Configuration
1. Configure .env with your email settings
2. Start the server
3. Login with passenger or driver credentials
4. Check your email for the verification code
5. Enter the code in the verification screen

## 📦 Dependencies

- `nodemailer` - Email sending
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `express` - Web framework

## 🔒 Security Best Practices

1. Never commit `.env` file to version control
2. Use app passwords, not your actual email password
3. Enable 2FA on your email account
4. Use environment variables for all sensitive data
5. Implement rate limiting on login and verification endpoints
6. Consider using Redis for production code storage

## 🎨 Customization

### Email Template
Edit [src/Backend/emailService.js](src/Backend/emailService.js) to customize the email design.

### Verification UI
Edit [src/Login/VerificationCode.jsx](src/Login/VerificationCode.jsx) and [src/Login/VerificationCode.css](src/Login/VerificationCode.css) to customize the verification screen.

### Code Length & Expiration
Modify in [src/Backend/emailService.js](src/Backend/emailService.js):
- Change code length in `generateVerificationCode()`
- Change expiration time in login endpoints (default: 10 minutes)
