// Email service for sending verification codes
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Create transporter
const createTransporter = () => {
    // For development, use ethereal email (fake SMTP)
    // For production, use real SMTP credentials from environment variables

    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    // Fallback to console logging if no email configuration
    console.warn('⚠️ No email configuration found. Verification codes will be logged to console.');
    return null;
};

// Generate random 6-digit code
export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification code email
export const sendVerificationEmail = async (email, code, userName = 'User') => {
    const transporter = createTransporter();

    if (!transporter) {
        // Log to console if no email service configured
        console.log('═══════════════════════════════════════');
        console.log('📧 VERIFICATION CODE (No Email Service)');
        console.log('═══════════════════════════════════════');
        console.log(`Email: ${email}`);
        console.log(`Name: ${userName}`);
        console.log(`Code: ${code}`);
        console.log('═══════════════════════════════════════');
        return { success: true, message: 'Code logged to console' };
    }

    const mailOptions = {
        from: `"Ambaturide" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Ambaturide Verification Code',
        html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
          }
          .content {
            padding: 40px 30px;
          }
          .code-container {
            background: #f8fafc;
            border: 2px dashed #667eea;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
            margin: 30px 0;
          }
          .code {
            font-size: 36px;
            font-weight: bold;
            color: #667eea;
            letter-spacing: 8px;
            margin: 10px 0;
          }
          .warning {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            background: #f8fafc;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚗 Ambaturide</h1>
          </div>
          <div class="content">
            <h2>Hello ${userName},</h2>
            <p>Welcome to Ambaturide! To complete your login, please verify your email address using the code below:</p>
            
            <div class="code-container">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">Your Verification Code</p>
              <div class="code">${code}</div>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">This code expires in 10 minutes</p>
            </div>
            
            <p>Enter this code in the verification screen to access your account.</p>
            
            <div class="warning">
              <strong>⚠️ Security Notice:</strong> Never share this code with anyone. Ambaturide staff will never ask for your verification code.
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this code, please ignore this email or contact our support team.</p>
          </div>
          <div class="footer">
            <p>© 2026 Ambaturide. All rights reserved.</p>
            <p>Safe travels! 🚗</p>
          </div>
        </div>
      </body>
      </html>
    `,
        text: `
Hello ${userName},

Your Ambaturide verification code is: ${code}

This code expires in 10 minutes.

If you didn't request this code, please ignore this email.

© 2026 Ambaturide
    `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        // Still log to console as fallback
        console.log('═══════════════════════════════════════');
        console.log('📧 VERIFICATION CODE (Email Failed)');
        console.log('═══════════════════════════════════════');
        console.log(`Email: ${email}`);
        console.log(`Name: ${userName}`);
        console.log(`Code: ${code}`);
        console.log('═══════════════════════════════════════');
        return { success: false, error: error.message };
    }
};

export default {
    generateVerificationCode,
    sendVerificationEmail
};
