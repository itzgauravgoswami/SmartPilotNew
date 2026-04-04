const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

/**
 * Send OTP verification email
 */
async function sendOtpEmail(to, name, otp) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 13px; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 16px; font-weight: 700; color: #18181b; margin-bottom: 8px; }
        .desc { font-size: 14px; color: #71717a; line-height: 1.6; margin-bottom: 28px; }
        .otp-box { background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px; }
        .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #ea580c; font-family: 'Courier New', monospace; }
        .otp-label { font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
        .expiry { font-size: 13px; color: #71717a; margin-bottom: 24px; }
        .footer { background: #fafafa; padding: 20px 40px; text-align: center; font-size: 11px; color: #a1a1aa; border-top: 1px solid #f4f4f5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Smart Pilot</h1>
          <p>Your AI-Powered Placement Companion</p>
        </div>
        <div class="body">
          <div class="greeting">Hey ${name} 👋</div>
          <div class="desc">
            Thanks for signing up! Use the verification code below to complete your account registration.
          </div>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-label">Verification Code</div>
          </div>
          <div class="expiry">⏳ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</div>
          <div style="font-size: 13px; color: #71717a;">
            If you didn't request this code, you can safely ignore this email.
          </div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Smart Pilot · All rights reserved
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Smart Pilot" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${otp} is your Smart Pilot verification code`,
    html,
  });
}

/**
 * Send welcome email after successful registration
 */
async function sendWelcomeEmail(to, name) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 800; }
        .body { padding: 36px 40px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 16px; }
        .footer { background: #fafafa; padding: 20px 40px; text-align: center; font-size: 11px; color: #a1a1aa; border-top: 1px solid #f4f4f5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>Welcome to Smart Pilot 🚀</h1></div>
        <div class="body">
          <p style="font-size:16px;font-weight:700;color:#18181b;">Hey ${name}!</p>
          <p style="font-size:14px;color:#71717a;line-height:1.6;">
            Your account is ready. Start your AI-powered placement preparation journey today — track your progress, practice with AI mock interviews, and land your dream job.
          </p>
          <a href="${process.env.FRONTEND_URL}/dashboard" class="btn">Go to Dashboard →</a>
        </div>
        <div class="footer">© ${new Date().getFullYear()} Smart Pilot · All rights reserved</div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Smart Pilot" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Welcome to Smart Pilot, ${name}! 🎉`,
    html,
  });
}

/**
 * Send custom email
 */
async function sendCustomEmail(to, subject, text, pdfData, pdfName) {
  const mailOptions = {
    from: `"Smart Pilot" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html: `<div style="font-family: sans-serif; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #18181b;">${text.replace(/\n/g, '<br/>')}</div>`
  };

  if (pdfData && pdfName) {
    mailOptions.attachments = [
      {
        filename: pdfName,
        content: Buffer.from(pdfData, 'base64'),
        contentType: 'application/pdf'
      }
    ];
  }

  await transporter.sendMail(mailOptions);
}

/**
 * Send password-reset OTP email
 */
async function sendPasswordResetOtp(to, name, otp) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f4f5; margin: 0; padding: 20px; }
        .container { max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px 40px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { color: rgba(255,255,255,0.85); margin: 4px 0 0; font-size: 13px; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 16px; font-weight: 700; color: #18181b; margin-bottom: 8px; }
        .desc { font-size: 14px; color: #71717a; line-height: 1.6; margin-bottom: 28px; }
        .otp-box { background: #fff7ed; border: 2px dashed #f97316; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px; }
        .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 12px; color: #ea580c; font-family: 'Courier New', monospace; }
        .otp-label { font-size: 11px; font-weight: 700; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
        .expiry { font-size: 13px; color: #71717a; margin-bottom: 24px; }
        .warning { font-size: 13px; color: #ef4444; font-weight: 600; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
        .footer { background: #fafafa; padding: 20px 40px; text-align: center; font-size: 11px; color: #a1a1aa; border-top: 1px solid #f4f4f5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Smart Pilot</h1>
          <p>Password Reset Request</p>
        </div>
        <div class="body">
          <div class="greeting">Hey ${name} 👋</div>
          <div class="desc">
            We received a request to reset your Smart Pilot account password. Use the code below to proceed. If you didn't make this request, you can safely ignore this email — your password will remain unchanged.
          </div>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="otp-label">Password Reset Code</div>
          </div>
          <div class="expiry">⏳ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</div>
          <div class="warning">⚠️ If you did not request a password reset, please secure your account immediately.</div>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Smart Pilot · All rights reserved
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"Smart Pilot" <${process.env.EMAIL_USER}>`,
    to,
    subject: `${otp} — Your Smart Pilot Password Reset Code`,
    html,
  });
}

module.exports = { sendOtpEmail, sendWelcomeEmail, sendCustomEmail, sendPasswordResetOtp };

