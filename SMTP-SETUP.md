# SMTP Configuration for OTP Login

The OTP-based login system requires SMTP configuration to send emails. Currently, the system is running in **development mode** which displays the OTP in the console and browser for testing.

## For Testing (Current Mode)
- The system automatically detects missing SMTP configuration
- OTP is displayed in the backend console and browser notifications
- You can use this for immediate testing without email setup

## For Production (Email Setup Required)

### Step 1: Create .env file in backend folder
```bash
cd backend
cp .env.example .env  # If .env.example exists, or create new .env file
```

### Step 2: Configure Gmail SMTP
Add these lines to your `backend/.env` file:

```env
MONGODB_URI=mongodb://localhost:27017/msquare-expense
JWT_KEY=your_jwt_secret_key_here
PORT=3000

# SMTP Configuration
SMTP_EMAIL=your-gmail@gmail.com
SMTP_PASSWORD=your-16-character-app-password
NODE_ENV=production
```

### Step 3: Generate Gmail App Password
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification** (enable if not already)
3. Scroll down to **App passwords**
4. Click **Select app** → Choose **Mail**
5. Click **Select device** → Choose **Other** → Enter "Msquare App"
6. Click **Generate**
7. Copy the **16-character password** (like: `abcd efgh ijkl mnop`)

### Step 4: Update .env file
```env
SMTP_EMAIL=youremail@gmail.com
SMTP_PASSWORD=abcdefghijklmnop  # 16-character app password without spaces
```

### Step 5: Restart Backend
```bash
cd backend
npm start
```

## Testing the Setup
1. Try logging in with a valid email
2. Check if OTP email is received
3. If emails aren't working, check backend console for error messages

## Development vs Production
- **Development**: OTP shown in console/browser (current mode)
- **Production**: OTP sent via email (requires SMTP setup)

The system automatically switches modes based on SMTP configuration availability. 