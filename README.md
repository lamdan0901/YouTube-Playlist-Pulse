# YouTube Playlist Pulse

A modern Next.js web application that automatically generates YouTube playlists from your subscribed channels' recent videos. Built with React 19, Nextjs 15, TypeScript, and the YouTube Data API v3.

## 🚀 Features

- **Automatic Playlist Generation**: Creates playlists from recent videos across all your subscribed channels
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
     - `http://localhost:3000` (for development)
     - Your production domain(s)
   - Add authorized redirect URIs:
     - `http://localhost:3000` (for development)
     - Your production domain(s)

### 4. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Google OAuth (Client-side)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Google OAuth (Server-side)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Production URL (for OAuth redirects)
PRODUCTION_URL=https://your-production-domain.com
```

For development, the OAuth redirect will default to `http://localhost:3000`.

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

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

1. **Authentication**: Click "Sign in with YouTube" to authenticate with your Google account
2. **Generate Playlist**: Click "Create New Playlist" to start the automated process
3. **Monitor Progress**: Watch real-time progress as the app:
   - Fetches your subscribed channels
   - Processes each channel's recent uploads (max 5 videos per channel)
   - Filters videos by duration (1-20 minutes)
   - Creates and populates your playlist
4. **View Results**: Click "Open playlist" to access your new private playlist on YouTube
5. **Error Review**: Check any videos that failed to be added to the playlist
6. **Cancel Operation**: Use the cancel button to stop playlist creation if needed

## 🏗️ Architecture

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── exchange/route.ts    # OAuth token exchange
│   │   │   └── refresh/route.ts     # Token refresh
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

- `POST /api/auth/exchange` - Exchange authorization code for access tokens
- `POST /api/auth/refresh` - Refresh expired access tokens
- `GET /api/health` - Health check endpoint

### Key Features Implementation

- **OAuth Flow**: Secure token exchange and refresh handling with localStorage persistence
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
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `PRODUCTION_URL`
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
- **Token Refresh Issues**: Clear localStorage and re-authenticate if refresh tokens fail

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
