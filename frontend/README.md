# Gift Portal Frontend

React + TypeScript frontend for the Gift Portal smart gift matching platform.

## Features

- ✅ Modern React 18 + TypeScript + Vite
- ✅ Tailwind CSS for styling
- ✅ React Router for navigation
- ✅ React Query for data fetching
- ✅ Framer Motion for animations
- ✅ Recharts for visualizations
- ✅ JWT authentication
- ✅ Responsive design

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env if needed (defaults to http://localhost:8000)
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   └── ui/           # Reusable UI components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── Input.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx  # Authentication state
│   ├── lib/
│   │   └── utils.ts      # Utility functions
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── WishlistBuilder.tsx   # Exa product search
│   │   ├── SponsorDashboard.tsx  # ⭐ Matching dashboard
│   │   └── EventDashboard.tsx
│   ├── services/
│   │   └── api.ts        # API client
│   ├── App.tsx           # Main app with routing
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── tailwind.config.js
├── vite.config.ts
└── package.json
```

## Key Pages

### Authentication
- **Login** (`/login`) - Sign in with email/password
- **Register** (`/register`) - Create new account with profile

### User Pages
- **Dashboard** (`/dashboard`) - Overview of events and quick actions
- **Wishlist Builder** (`/wishlist`) - Add items with Exa product search
- **Event Dashboard** (`/events/:id`) - Manage specific event

### Sponsor Pages
- **Sponsor Dashboard** (`/sponsor/:eventId`) - ⭐ **HERO PAGE**
  - Smart matching with score breakdowns
  - Real-time filtering (budget, category, age)
  - Animated match cards
  - AI-generated explanations
  - Gift claiming

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **React Query** - Server state management
- **Framer Motion** - Animations
- **Recharts** - Charts and visualizations
- **Axios** - HTTP client
- **Lucide React** - Icons

## Design System

### Colors
- **Primary**: Purple (#8B5CF6) - Gift magic theme
- **Secondary**: Pink (#EC4899) - Glow up accent
- **Accent**: Cyan (#06B6D4) - Smart AI highlight

### Components
All components use Tailwind CSS with consistent design patterns:
- Cards with shadows and borders
- Buttons with hover states and focus rings
- Inputs with validation states
- Responsive breakpoints

## Development

The app uses:
- Hot Module Replacement (HMR) for fast development
- TypeScript for type safety
- ESLint for code quality
- Dark mode support (via Tailwind)

## API Integration

The frontend communicates with the FastAPI backend via REST API:
- Base URL: `http://localhost:8000` (configurable via `VITE_API_URL`)
- Authentication: JWT tokens in `Authorization` header
- Automatic token refresh on 401 errors

See `src/services/api.ts` for all API methods.

## Next Steps

1. Implement full Wishlist Builder with Exa search
2. Build complete Sponsor Matching Dashboard with animations
3. Add Event management features
4. Implement MCP integration
5. Polish UI/UX and add more animations
