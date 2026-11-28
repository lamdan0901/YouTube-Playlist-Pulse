# Playlist Pulse

A modern Next.js web application that automatically generates YouTube playlists from your subscribed channels' recent videos. Built with React 19, Nextjs 15, TypeScript, and the YouTube Data API v3.

## 🚀 Features

- **Automatic Playlist Generation**: Creates playlists from recent videos across all your subscribed channels
- **Create from Links**: Create a new playlist from a list of YouTube video links
- **Smart Filtering**: Only includes videos between 1-20 minutes in duration
- **OAuth Authentication**: Secure Google/YouTube authentication with automatic token refresh
- **Progress Tracking**: Real-time progress updates during playlist creation
- **Error Handling**: Graceful handling of failed video additions with detailed reporting
- **Recent Content Focus**: Prioritizes the most recently published videos (up to 5 videos per channel)
- **Private Playlists**: Generated playlists are created as private by default
- **Cancellation Support**: Cancel playlist creation mid-process
- **Modern UI**: Clean, responsive interface built with Tailwind CSS

## 🛠️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4
- **Authentication**: Google OAuth 2.0 with refresh token support
- **API**: YouTube Data API v3
- **Development**: Turbopack for fast development builds

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm, yarn, pnpm, or bun
- Google Cloud Platform account
- YouTube Data API v3 enabled
- Google OAuth 2.0 credentials

## ⚙️ Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd yt-playlist-pulse
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Google API Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the YouTube Data API v3
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add authorized origins:
     - `http://localhost:3001` (for development)
     - Your production domain(s)
   - Add authorized redirect URIs:
     - `http://localhost:3001` (for development)
     - Your production domain(s)

### 4. Environment Configuration

Create a `.env.local` file in the root directory:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_random_32_byte_base64url_key
PRODUCTION_URL=https://your-production-domain.com
SUPPORT_EMAIL=your_privacy_support_email
```

Generate SESSION_SECRET with the command below. Keep this key and the Google client secret server-side. Use a separate key for each environment. Set PRODUCTION_URL to the exact authorized production origin. The development server uses http://localhost:3001. Set SUPPORT_EMAIL to a monitored address before building the public site.

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

## 🚀 Development

### Start Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001) with your browser to see the application.

### Available Scripts

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## 📱 Usage

1. **Authentication**: Accept the Privacy Policy and Terms of Service, then click "Continue to Google"
2. **Generate Playlist**: Click "Create New Playlist" to start the automated process
3. **Monitor Progress**: Watch real-time progress as the app:
   - Fetches your subscribed channels
   - Processes each channel's recent uploads (max 5 videos per channel)
   - Filters videos by duration (1-20 minutes)
   - Creates and populates your playlist
4. **Create from Links**: 
   - Click "Create from Links" to show the text area.
   - Paste your YouTube video links (one per line).
   - Click "Create Playlist" to generate a new playlist with the provided links.
5. **View Results**: Click "Open playlist" to access your new private playlist on YouTube
6. **Error Review**: Check any videos that failed to be added to the playlist
7. **Cancel Operation**: Use the cancel button to stop playlist creation if needed

## 🏗️ Architecture

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── start/route.ts       # Start OAuth and set browser-bound state
│   │   │   ├── callback/route.ts    # Validate the callback and exchange the code
│   │   │   ├── refresh/route.ts     # Return a short-lived access token
│   │   │   └── disconnect/route.ts  # Sign out or revoke Google access
│   │   └── health/route.ts          # Health check endpoint
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Main application page
│   └── globals.css                  # Global styles
└── hooks/
    ├── useYouTubeAuth.ts            # Google OAuth with token management
    ├── useYouTubeApi.ts             # YouTube API operations
    └── index.ts                     # Hook exports
```

### API Routes

- `POST /api/auth/start` - Start consent and set the short-lived state cookie
- `GET /` with a Google OAuth response - Handle the callback server-side and redirect to a clean URL
- `POST /api/auth/refresh` - Get a short-lived access token from the encrypted session cookie
- `DELETE /api/auth/disconnect` - Sign out locally
- `POST /api/auth/disconnect` - Revoke Google access and clear the session
- `GET /api/health` - Health check endpoint

### Key Features Implementation

- **OAuth Flow**: Server-side code exchange with state and PKCE. The encrypted, HTTP-only session cookie holds the refresh token. The browser holds short-lived access tokens in memory.
- **Rate Limiting**: Built-in delays between API calls to respect YouTube quotas
- **Batch Processing**: Efficient video metadata fetching in batches of 50
- **Error Recovery**: Continues processing even if individual channels fail
- **Progress Tracking**: Real-time updates throughout the playlist creation process
- **Token Management**: Automatic token validation and refresh
- **Cancellation**: AbortController for stopping operations mid-process

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Set the required environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SESSION_SECRET`
   - `PRODUCTION_URL`
   - `SUPPORT_EMAIL`
4. Deploy automatically

### Other Platforms

For deployment on other platforms (Netlify, Railway, etc.):

1. Build the project:

   ```bash
   npm run build
   ```

2. Set the required environment variables

3. Deploy the generated `.next` folder

## 🔧 Configuration

### Development Configuration

- **Turbopack**: Enabled by default for faster development builds
- **Hot Reload**: Automatic reloading for both client and server changes
- **TypeScript**: Full TypeScript support with strict type checking
- **Tailwind CSS**: Utility-first styling with v4 features

### Production Configuration

- **Static Optimization**: Automatic static optimization for better performance
- **Image Optimization**: Built-in Next.js image optimization
- **Bundle Analysis**: Optimized bundles with code splitting

## 🔒 Security Considerations

- OAuth tokens are handled securely with proper expiration and refresh
- Environment variables protect sensitive API credentials
- Client-side and server-side validation for all API calls
- Private playlist creation by default protects user privacy
- Token validation ensures authentication integrity
- Automatic token cleanup on logout

## 📝 API Limitations

- **YouTube API Quota**: The app respects YouTube API quotas with built-in rate limiting
- **Video Duration Filter**: Only includes videos between 1-20 minutes
- **Channel Processing**: Processes up to 5 recent videos per subscribed channel
- **Authentication**: Requires YouTube scope permissions for playlist management

## 🐛 Troubleshooting

### Common Issues

- **Authentication Errors**: Verify OAuth credentials and authorized domains in Google Cloud Console
- **API Quota Exceeded**: Wait for quota reset (daily) or request quota increase from Google
- **Empty Playlists**: Check if subscribed channels have recent videos in the 1-20 minute range
- **Failed Video Additions**: Review the failed videos list for specific error details
- **Token Refresh Issues**: Sign in again if the session expires or Google access is revoked.

### OAuth Regression Checks

Run `npm run build` followed by `node --test test/auth.test.mjs`. The tests start the production build locally and use a mocked Google token endpoint.

### Development Issues

- **Build Failures**: Check TypeScript errors with `npm run build`
- **Environment Variables**: Verify `.env.local` file exists and contains required variables
- **OAuth Redirect**: Ensure redirect URI matches exactly in Google Cloud Console

### Support

For issues and questions, please open an issue on the GitHub repository.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ using Next.js and the YouTube Data API
