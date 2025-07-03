// lib/email/templates.ts
// Professional Email Templates for Real Estate MVP

export const EmailTemplateHTML = {
  // Base template wrapper for consistent styling
  BASE_WRAPPER: (content: string, preheader?: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VirtualEstate</title>
    ${preheader ? `<meta name="description" content="${preheader}">` : ''}
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #334155;
            background-color: #f8fafc;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .header {
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            padding: 40px 30px;
            text-align: center;
        }
        
        .logo {
            color: #ffffff;
            font-size: 28px;
            font-weight: 700;
            text-decoration: none;
            margin-bottom: 8px;
            display: inline-block;
        }
        
        .header-subtitle {
            color: #dbeafe;
            font-size: 16px;
            font-weight: 400;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .content h1 {
            color: #1e293b;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 20px;
            line-height: 1.3;
        }
        
        .content h2 {
            color: #334155;
            font-size: 20px;
            font-weight: 600;
            margin: 30px 0 15px 0;
        }
        
        .content p {
            margin-bottom: 16px;
            font-size: 16px;
            line-height: 1.6;
        }
        
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
            color: #ffffff !important;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: all 0.3s ease;
        }
        
        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
        }
        
        .property-card {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            background-color: #f8fafc;
        }
        
        .property-title {
            color: #1e293b;
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .property-price {
            color: #059669;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .property-details {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 12px;
        }
        
        .info-box {
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .warning-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .success-box {
            background-color: #d1fae5;
            border-left: 4px solid #10b981;
            padding: 16px;
            margin: 20px 0;
            border-radius: 4px;
        }
        
        .footer {
            background-color: #f1f5f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            color: #64748b;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .social-links {
            margin: 20px 0;
        }
        
        .social-links a {
            display: inline-block;
            margin: 0 8px;
            padding: 8px;
            background-color: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            line-height: 20px;
        }
        
        .unsubscribe {
            color: #94a3b8;
            font-size: 12px;
            text-decoration: none;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        .table th,
        .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
        }
        
        .table th {
            background-color: #f8fafc;
            font-weight: 600;
            color: #374151;
        }
        
        @media (max-width: 600px) {
            .container { margin: 0; }
            .header, .content, .footer { padding: 20px; }
            .content h1 { font-size: 20px; }
            .btn { display: block; text-align: center; }
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>`,

  // Welcome Email Template
  WELCOME: `
<div class="container">
    <div class="header">
        <div class="logo">🏠 VirtualEstate</div>
        <div class="header-subtitle">Your Gateway to Perfect Properties</div>
    </div>
    
    <div class="content">
        <h1>Welcome to VirtualEstate, {{user_name}}! 🎉</h1>
        
        <p>We're thrilled to have you join our community of property seekers and real estate enthusiasts. You've just unlocked access to the most innovative virtual tour and AI-powered property search platform in the market.</p>
        
        <div class="success-box">
            <strong>Your account is now active!</strong><br>
            Start exploring properties with our cutting-edge 3D tours and AI assistants.
        </div>
        
        <h2>What's Next?</h2>
        <p>Here are some exciting features to explore:</p>
        
        <ul style="margin: 16px 0 16px 20px;">
            <li><strong>🔍 AI-Powered Search:</strong> Find your perfect property with intelligent recommendations</li>
            <li><strong>🏠 Virtual 3D Tours:</strong> Experience properties from anywhere in the world</li>
            <li><strong>🤖 AI Voice Assistant:</strong> Ask questions about any property in real-time</li>
            <li><strong>📅 Easy Scheduling:</strong> Book viewings directly with verified agents</li>
            <li><strong>💬 Live Video Consultations:</strong> Connect with real estate experts instantly</li>
        </ul>
        
        <a href="{{website_url}}/properties" class="btn">Start Exploring Properties</a>
        
        <div class="info-box">
            <strong>Pro Tip:</strong> Set up your search preferences and save favorite properties to get personalized alerts when new matches become available.
        </div>
        
        <p>If you have any questions, our support team is here to help 24/7. Simply reply to this email or contact us through the platform.</p>
        
        <p>Happy house hunting! 🏡</p>
        
        <p>Best regards,<br>The VirtualEstate Team</p>
    </div>
    
    <div class="footer">
        <p>© 2024 VirtualEstate. All rights reserved.</p>
        <p>{{company_address}}</p>
        <div class="social-links">
            <a href="{{facebook_url}}">f</a>
            <a href="{{twitter_url}}">t</a>
            <a href="{{instagram_url}}">i</a>
            <a href="{{linkedin_url}}">in</a>
        </div>
        <a href="{{unsubscribe_url}}" class="unsubscribe">Unsubscribe</a>
    </div>
</div>`,

  // Property Inquiry Confirmation
  INQUIRY_CONFIRMATION: `
<div class="container">
    <div class="header">
        <div class="logo">🏠 VirtualEstate</div>
        <div class="header-subtitle">Your Property Inquiry</div>
    </div>
    
    <div class="content">
        <h1>Inquiry Received Successfully! ✅</h1>
        
        <p>Hi {{user_name}},</p>
        
        <p>Thank you for your interest in <strong>{{property_title}}</strong>. We've received your inquiry and are excited to help you with your property search.</p>
        
        <div class="property-card">
            <div class="property-title">{{property_title}}</div>
            <div class="property-price">{{property_price}}</div>
            <div class="property-details">{{property_address}}</div>
            <div class="property-details">{{property_details}}</div>
        </div>
        
        <div class="success-box">
            <strong>Inquiry Reference:</strong> #{{inquiry_id}}<br>
            <strong>Submitted:</strong> {{inquiry_date}}<br>
            <strong>Status:</strong> Under Review
        </div>
        
        <h2>What Happens Next?</h2>
        <ol style="margin: 16px 0 16px 20px;">
            <li>Our AI system will match you with the best agent for this property</li>
            <li>A qualified agent will review your inquiry within 2 hours</li>
            <li>You'll receive a personalized response with detailed information</li>
            <li>Schedule a virtual or in-person tour at your convenience</li>
        </ol>
        
        <a href="{{property_url}}" class="btn">View Property Details</a>
        
        <div class="info-box">
            <strong>Need immediate assistance?</strong><br>
            Contact our support team at {{support_email}} or {{support_phone}}<br>
            Reference your inquiry ID: #{{inquiry_id}}
        </div>
        
        <p>We appreciate your interest and look forward to helping you find your perfect property!</p>
        
        <p>Best regards,<br>The VirtualEstate Team</p>
    </div>
    
    <div class="footer">
        <p>© 2024 VirtualEstate. All rights reserved.</p>
        <a href="{{unsubscribe_url}}" class="unsubscribe">Unsubscribe</a>
    </div>
</div>`,

  // Viewing Confirmation
  VIEWING_CONFIRMATION: `
<div class="container">
    <div class="header">
        <div class="logo">🏠 VirtualEstate</div>
        <div class="header-subtitle">Property Viewing Confirmed</div>
    </div>
    
    <div class="content">
        <h1>Your Viewing is Confirmed! 🗓️</h1>
        
        <p>Hi {{user_name}},</p>
        
        <p>Great news! Your property viewing has been confirmed. Here are all the details you need:</p>
        
        <div class="property-card">
            <div class="property-title">{{property_title}}</div>
            <div class="property-details">📍 {{property_address}}</div>
            <div class="property-details">📅 {{viewing_date}} at {{viewing_time}}</div>
            <div class="property-details">⏱️ Duration: {{viewing_duration}} minutes</div>
            <div class="property-details">👤 Your agent: {{broker_name}}</div>
            <div class="property-details">📞 Agent phone: {{broker_phone}}</div>
        </div>
        
        <div class="success-box">
            <strong>Confirmation Code:</strong> {{confirmation_code}}<br>
            <strong>Viewing Type:</strong> {{viewing_type}}<br>
            <strong>Status:</strong> Confirmed ✅
        </div>
        
        <h2>Before Your Viewing</h2>
        <ul style="margin: 16px 0 16px 20px;">
            <li>Bring a valid photo ID</li>
            <li>Arrive 5 minutes early</li>
            <li>Prepare any questions about the property</li>
            <li>Have your confirmation code ready: <strong>{{confirmation_code}}</strong></li>
        </ul>
        
        <div class="info-box">
            <strong>Location & Contact Info:</strong><br>
            📍 {{property_address}}<br>
            👤 {{broker_name}}<br>
            📞 {{broker_phone}}<br>
            📧 {{broker_email}}
        </div>
        
        <a href="{{calendar_link}}" class="btn">Add to Calendar</a>
        
        <h2>Need to Make Changes?</h2>
        <p>If you need to reschedule or cancel your viewing, please contact your agent directly or use your confirmation code {{confirmation_code}} on our platform.</p>
        
        <div class="warning-box">
            <strong>Please note:</strong> We require at least 2 hours notice for cancellations or rescheduling.
        </div>
        
        <p>We're excited to help you explore this property! If you have any questions before your viewing, don't hesitate to reach out.</p>
        
        <p>Best regards,<br>The VirtualEstate Team</p>
    </div>
    
    <div class="footer">
        <p>© 2024 VirtualEstate. All rights reserved.</p>
        <a href="{{unsubscribe_url}}" class="unsubscribe">Unsubscribe</a>
    </div>
</div>`,

  // Agent Inquiry Notification
  INQUIRY_AGENT_NOTIFICATION: `
<div class="container">
    <div class="header">
        <div class="logo">🏠 VirtualEstate</div>
        <div class="header-subtitle">New Property Inquiry</div>
    </div>
    
    <div class="content">
        <h1>New Lead Alert! 🚨</h1>
        
        <p>Hi {{agent_name}},</p>
        
        <p>You have a new qualified inquiry for one of your listings. Here are the details:</p>
        
        <div class="property-card">
            <div class="property-title">{{property_title}}</div>
            <div class="property-price">{{property_price}}</div>
            <div class="property-details">{{property_address}}</div>
        </div>
        
        <h2>Client Information</h2>
        <table class="table">
            <tr>
                <td><strong>Name:</strong></td>
                <td>{{client_name}}</td>
            </tr>
            <tr>
                <td><strong>Email:</strong></td>
                <td><a href="mailto:{{client_email}}">{{client_email}}</a></td>
            </tr>
            <tr>
                <td><strong>Phone:</strong></td>
                <td><a href="tel:{{client_phone}}">{{client_phone}}</a></td>
            </tr>
            <tr>
                <td><strong>Inquiry Date:</strong></td>
                <td>{{inquiry_date}}</td>
            </tr>
        </table>
        
        <h2>Client Message</h2>
        <div class="info-box">
            {{inquiry_message}}
        </div>
        
        <div class="warning-box">
            <strong>Response Time Target:</strong> Please respond within 2 hours to maximize conversion potential.
        </div>
        
        <a href="{{agent_dashboard_url}}" class="btn">View in Dashboard</a>
        
        <h2>Quick Actions</h2>
        <ul style="margin: 16px 0 16px 20px;">
            <li>📧 <a href="mailto:{{client_email}}?subject=Re: {{property_title}} Inquiry">Send Email Response</a></li>
            <li>📞 <a href="tel:{{client_phone}}">Call Client Now</a></li>
            <li>📅 <a href="{{scheduling_url}}">Schedule Property Viewing</a></li>
            <li>📊 <a href="{{client_profile_url}}">View Client Profile</a></li>
        </ul>
        
        <p>This lead is automatically scored as <strong>{{lead_score}}/100</strong> based on our AI analysis.</p>
        
        <p>Best of luck with your new lead!</p>
        
        <p>The VirtualEstate Team</p>
    </div>
    
    <div class="footer">
        <p>© 2024 VirtualEstate. All rights reserved.</p>
        <p>Need help? Contact support at {{support_email}}</p>
    </div>
</div>`,

  // HeyGen Session Summary
  HEYGEN_SESSION_SUMMARY: `
<div class="container">
    <div class="header">
        <div class="logo">🏠 VirtualEstate</div>
        <div class="header-subtitle">AI Consultation Summary</div>
    </div>
    
    <div class="content">
        <h1>Your AI Property Consultation Summary 🤖</h1>
        
        <p>Hi {{user_name}},</p>
        
        <p>Thank you for using our AI-powered property consultation. Here's a summary of your session:</p>
        
        <div class="property-card">
            <div class="property-title">{{property_title}}</div>
            <div class="property-details">📅 Session Date: {{session_date}}</div>
            <div class="property-details">⏱️ Duration: {{session_duration}}</div>
            <div class="property-details">🤖 AI Agent: {{agent_name}}</div>
        </div>
        
        <h2>Topics Discussed</h2>
        <ul style="margin: 16px 0 16px 20px;">
            {{#each topics_discussed}}
            <li>{{this}}</li>
            {{/each}}
        </ul>
        
        <h2>Key Insights from Our AI</h2>
        <div class="info-box">
            {{ai_insights}}
        </div>
        
        <h2>Recommended Next Steps</h2>
        <ol style="margin: 16px 0 16px 20px;">
            {{#each next_steps}}
            <li>{{this}}</li>
            {{/each}}
        </ol>
        
        <a href="{{property_url}}" class="btn">View Property Details</a>
        
        <div class="success-box">
            <strong>Want to continue the conversation?</strong><br>
            Schedule a follow-up consultation or connect with a human agent for personalized assistance.
        </div>
        
        <p>Have more questions? Feel free to start another AI consultation or contact our human experts.</p>
        
        <p>Best regards,<br>The VirtualEstate Team</p>
    </div>
    
    <div class="footer">
        <p>© 2024 VirtualEstate. All rights reserved.</p>
        <a href="{{unsubscribe_url}}" class="unsubscribe">Unsubscribe</a>
    </div>
</div>`,

  // Password Reset
  PASSWORD_RESET: `
<div class="container">
    <div class="header">
        <div class="logo">🏠 VirtualEstate</div>
        <div class="header-subtitle">Password Reset Request</div>
    </div>
    
    <div class="content">
        <h1>Reset Your Password 🔐</h1>
        
        <p>Hi there,</p>
        
        <p>We received a request to reset your VirtualEstate account password. If you made this request, click the button below to create a new password:</p>
        
        <a href="{{reset_url}}" class="btn">Reset Password</a>
        
        <div class="warning-box">
            <strong>Security Notice:</strong><br>
            This link will expire in {{expiry_hours}} hours for your security.<br>
            If you didn't request this reset, please ignore this email.
        </div>
        
        <h2>Alternative Method</h2>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #3b82f6;">{{reset_url}}</p>
        
        <p>If you have any questions or need assistance, contact our support team at {{support_email}}.</p>
        
        <p>Best regards,<br>The VirtualEstate Security Team</p>
    </div>
    
    <div class="footer">
        <p>© 2024 VirtualEstate. All rights reserved.</p>
        <p>This is an automated security email.</p>
    </div>
</div>`,

  // Daily Admin Report
  DAILY_REPORT: `
<div class="container">
    <div class="header">
        <div class="logo">🏠 VirtualEstate</div>
        <div class="header-subtitle">Daily Analytics Report</div>
    </div>
    
    <div class="content">
        <h1>Daily Report - {{report_date}} 📊</h1>
        
        <p>Here's your daily performance summary:</p>
        
        <h2>Key Metrics</h2>
        <table class="table">
            <tr>
                <td><strong>New Properties Listed</strong></td>
                <td>{{new_properties}}</td>
            </tr>
            <tr>
                <td><strong>Property Views</strong></td>
                <td>{{property_views}} ({{views_change}})</td>
            </tr>
            <tr>
                <td><strong>New Inquiries</strong></td>
                <td>{{new_inquiries}}</td>
            </tr>
            <tr>
                <td><strong>Viewing Bookings</strong></td>
                <td>{{viewing_bookings}}</td>
            </tr>
            <tr>
                <td><strong>HeyGen Sessions</strong></td>
                <td>{{heygen_sessions}}</td>
            </tr>
            <tr>
                <td><strong>New User Registrations</strong></td>
                <td>{{new_users}}</td>
            </tr>
        </table>
        
        <h2>Top Performing Properties</h2>
        {{#each top_properties}}
        <div class="property-card">
            <div class="property-title">{{title}}</div>
            <div class="property-details">{{views}} views • {{inquiries}} inquiries</div>
        </div>
        {{/each}}
        
        <a href="{{admin_dashboard_url}}" class="btn">View Full Dashboard</a>
        
        <p>Have a great day!</p>
        
        <p>The VirtualEstate Analytics Team</p>
    </div>
    
    <div class="footer">
        <p>© 2024 VirtualEstate. All rights reserved.</p>
    </div>
</div>`
};

// Text versions for better deliverability
export const EmailTemplateText = {
  WELCOME: `
Welcome to VirtualEstate, {{user_name}}!

We're thrilled to have you join our community of property seekers. Your account is now active and you can start exploring properties with our cutting-edge 3D tours and AI assistants.

What's Next:
- AI-Powered Search: Find your perfect property with intelligent recommendations
- Virtual 3D Tours: Experience properties from anywhere in the world  
- AI Voice Assistant: Ask questions about any property in real-time
- Easy Scheduling: Book viewings directly with verified agents
- Live Video Consultations: Connect with real estate experts instantly

Start exploring properties: {{website_url}}/properties

Best regards,
The VirtualEstate Team

---
© 2024 VirtualEstate. All rights reserved.
Unsubscribe: {{unsubscribe_url}}
`,

  INQUIRY_CONFIRMATION: `
Hi {{user_name}},

Thank you for your interest in {{property_title}}. We've received your inquiry and are excited to help you with your property search.

Property: {{property_title}}
Price: {{property_price}}
Address: {{property_address}}

Inquiry Reference: #{{inquiry_id}}
Status: Under Review

What Happens Next:
1. Our AI system will match you with the best agent for this property
2. A qualified agent will review your inquiry within 2 hours
3. You'll receive a personalized response with detailed information
4. Schedule a virtual or in-person tour at your convenience

View property details: {{property_url}}

Need immediate assistance? Contact {{support_email}} with reference #{{inquiry_id}}

Best regards,
The VirtualEstate Team
`,

  VIEWING_CONFIRMATION: `
Hi {{user_name}},

Your property viewing has been confirmed!

Property: {{property_title}}
Address: {{property_address}}
Date & Time: {{viewing_date}} at {{viewing_time}}
Duration: {{viewing_duration}} minutes
Agent: {{broker_name}} ({{broker_phone}})

Confirmation Code: {{confirmation_code}}

Before Your Viewing:
- Bring a valid photo ID
- Arrive 5 minutes early
- Have your confirmation code ready: {{confirmation_code}}

Add to calendar: {{calendar_link}}

Need to make changes? Contact {{broker_name}} at {{broker_phone}} or use confirmation code {{confirmation_code}}.

Best regards,
The VirtualEstate Team
`,

  PASSWORD_RESET: `
Reset Your VirtualEstate Password

We received a request to reset your account password. If you made this request, use this link to create a new password:

{{reset_url}}

This link expires in {{expiry_hours}} hours for security.

If you didn't request this reset, please ignore this email.

Best regards,
The VirtualEstate Security Team
`
}; 