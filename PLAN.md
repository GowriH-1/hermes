# Gift Portal - Architectural Review & Refined Plan

## Hackathon Context
- **Event**: Agent Glow Up Hackathon (1 day)
- **Judging Criteria**:
  1. ✨ Aesthetics (Usability & Interface Quality) - PRIMARY
  2. 🧠 Intelligence (Agent Design & Orchestration)
  3. ⚙️ Reliability (Workflow Clarity & Stability)
- **Key Requirement**: "Agentic UI" - NOT a chatbot!
- **Partner Integration**: Exa (must feature prominently)

---

## Architecture Overview

### Tech Stack

#### Backend
- **FastAPI** - Fast, modern Python web framework
- **SQLite** - Zero-setup database for hackathon speed
- **SQLAlchemy** - ORM for database operations
- **Pydantic V2** - Data validation
- **Python 3.11+**

#### Frontend
- **React 18 + Vite** - Fast development, modern React
- **Shadcn/ui** - Premium component library for beautiful UI
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations for "agentic" feel
- **Recharts** - Beautiful data visualizations
- **React Query** - Real-time data management

#### Integrations
- **Exa API** - Product discovery (sponsor partner!)
- **FastMCP** - Multi-agent tool interface

---

## Database Schema (8 Tables)

### Core Tables

```sql
-- Users with demographic data
users (
  id, email, password_hash, full_name, username,
  age_group TEXT,  -- '18-24', '25-34', etc.
  interests JSONB, -- ['tech', 'gaming', 'books']
  created_at
)

-- Events (hackathons, birthdays, etc.)
events (
  id, name, description, event_type, event_date,
  created_by, invite_code TEXT UNIQUE,
  created_at
)

-- Event participation + roles
event_participants (
  id, event_id, user_id,
  role TEXT,  -- 'participant' | 'sponsor'
  joined_at
)

-- User wishlists
wishlists (
  id, user_id, name, description,
  is_default BOOLEAN,
  created_at
)

-- Wishlist items with simplified privacy
wishlist_items (
  id, wishlist_id, title, description,
  url, image_url, price_min, price_max,
  category TEXT, priority INTEGER,  -- 1-5
  privacy_level TEXT,  -- 'public' | 'event_only'
  exa_metadata JSONB,  -- Store Exa product data
  is_fulfilled BOOLEAN,
  created_at
)

-- Link items to specific events
wishlist_item_events (
  wishlist_item_id, event_id,
  PRIMARY KEY (wishlist_item_id, event_id)
)

-- Gifts (simplified status)
gifts (
  id, wishlist_item_id, sponsor_id, event_id,
  status TEXT,  -- 'claimed' | 'fulfilled'
  notes TEXT,
  claimed_at, fulfilled_at
)

-- Sponsor preferences per event
sponsor_preferences (
  id, user_id, event_id,
  budget_min, budget_max,
  preferred_categories JSONB,
  target_age_groups JSONB,
  UNIQUE(user_id, event_id)
)
```

---

## Core Features (MVP)

### Must-Have (P0) (80% of time)

#### 1. Beautiful Product Discovery (Exa Integration) ⭐⭐⭐
- Search bar with real-time Exa product suggestions
- Gorgeous product cards with images, prices, links
- One-click add to wishlist
- Show Exa logo/branding

#### 2. Smart Matching Engine ⭐⭐⭐
- Sponsors set: budget, categories, age preferences
- Algorithm scores items (0-100) on 4 factors:
  - Budget fit (40 pts)
  - Category match (30 pts)
  - Demographics (20 pts)
  - Priority (10 pts)
- **Visual breakdown** of each score with animated bars
- AI-generated explanation: "Great match because..."

#### 3. Agentic UI - Dynamic Sponsor Dashboard ⭐⭐⭐
- Real-time filtering with animated transitions
- Match cards that flip/expand to show details
- Live updating as preferences change
- "Agent thinking" loader when matching runs
- Confetti animation when gift is claimed

#### 4. Event-Based Wishlists
- Create event with invite code
- Join as participant or sponsor
- Participants add wishlist items linked to event
- Event-only privacy respected

#### 5. Minimal Auth
- Quick signup (email + password)
- JWT tokens
- No email verification

### High Priority (P1) (Glow Up Enhancements)

#### 1. Sponsor Branding Agent (A2UI) ⭐⭐⭐
- **Concept**: The Sponsor's Agent uses A2UI to "skin" the interface dynamically.
- **Implementation**:
    - **Dynamic Theming**: SurfaceUpdate pushes primary colors, logos, and typography to match the active sponsor (e.g., "Google" blue vs. "Vercel" black).
    - **Direct-to-Website Bridge**: Render a custom "Gift Gallery" using A2UI components pulling live data from the sponsor's site or Exa search filtered to their products.
    - **Agent Pitch**: "I'm the TechCorp Agent. Based on your wishlist, I think you'd love these items..." rendered in a branded, interactive card.

#### 2. Exa-Powered "Sponsor Intelligence" Dashboard ⭐⭐⭐
- **Concept**: Market Analyst agent for the sponsor.
- **Implementation**:
    - **Insight Scan**: Agent uses Exa to scan all participant wishlists and interests in the event.
    - **Sponsor Insights View**: "20% of hackers are looking for 4k monitors. Based on your $200 budget, here are 3 top-rated options from Exa that would make you the most popular sponsor."
    - **Visual**: Recharts-powered "Interest Map" showing crowd demand vs. sponsor supply.

#### 3. Interactive "Gift Unwrapping" Experience ⭐⭐⭐
- **Concept**: Make the finality of a gift a "moment" rather than just a notification.
- **Implementation**:
    - **Gift Box Surface**: When a sponsor claims a gift, the participant receives an A2UI "Gift Box".
    - **Interactive Reveal**: "Scratch to reveal" or "Solve a mini-puzzle" (using Framer Motion) to see which sponsor fulfilled it.
    - **Personalized Message**: Explanation Agent generates a personalized message explaining why they chose that specific person.

### Nice-to-Have (if time permits)
- Gift claiming with status tracking
- User profile pages
- Wishlist sharing via link
- 2-3 MCP tools

### Cut for Hackathon
- Friends system entirely
- Complex gift lifecycle
- Multiple wishlists per user
- Advanced privacy levels
- 9 MCP tools (too many)

---

## Multi-Agent System (Intelligence Factor)

### Agent 1: Discovery Agent (Exa-Powered)
**Role**: Find and enrich products
- User types query → Agent searches Exa in real-time
- Returns top products with images, prices, reviews
- Auto-fills wishlist item fields

### Agent 2: Matching Agent (Scoring Engine)
**Role**: Score sponsor-item compatibility
- Takes sponsor preferences
- Evaluates each visible wishlist item
- Assigns 0-100 score with factor breakdown
- Runs in <500ms for snappy UX

### Agent 3: Explanation Agent (LLM-Powered)
**Role**: Generate human-readable reasons
- For high-scoring matches (>70), generate explanation
- Use natural language to explain why it's a good match
- Show demographic fit, budget alignment, priority

### Agent 4: Branding Agent (A2UI Specialist) - NEW (P1)
**Role**: Dynamic UI skinning and custom surfaces
- Manages the visual "skin" of the sponsor zone
- Injects branded A2UI components (Gift Gallery, Pitch cards)

### Agent 5: Intelligence Agent (Market Analyst) - NEW (P1)
**Role**: Strategic advisor for sponsors
- Scans event-wide wishlists via Exa
- Identifies trends and high-impact gift opportunities
- Provides data-driven recommendations to sponsors

---

## Implementation Timeline (1-Day Hackathon)

### Hour 0-2: Foundation ⚡
- Setup FastAPI project structure
- Create all 8 database tables with SQLAlchemy
- Implement JWT auth
- Test with curl/Postman

### Hour 2-4: Core Backend Logic 🧠
- Exa service integration
- **Matching service** (scoring algorithm) ⭐ CRITICAL
- API routes for all features

### Hour 4-5: Frontend Foundation 🎨
- Create Vite + React project
- Install Shadcn/ui, Framer Motion, Recharts
- Setup routing and auth

### Hour 5-7: Key UI Pages 🎯
- Wishlist Builder (Exa search)
- **Sponsor Matching Dashboard** ⭐⭐⭐ (hero page)
- Event Dashboard

### Hour 7-8: Polish & Agent Features ✨
- Animations with Framer Motion
- Agent visibility in UI
- Exa branding
- Responsive design

### Hour 8-9: MCP Server (Optional) 🤖
- 2-3 core tools
- Test with Claude Desktop

### Hour 9-10: Demo Prep 🎬
- Deploy (Railway + Vercel)
- Create demo data
- Practice pitch

---

## Competitive Advantages

1. **Visual Intelligence** ⭐
   - NOT a chatbot (as required)
   - Real UI with visual agent outputs
   - Score breakdowns show AI "thinking"

2. **Exa Showcase** ⭐
   - Prominent feature placement
   - Beautiful product search
   - Partner integration

3. **Real User Value**
   - Solves actual gift-giving pain
   - Usable immediately

4. **Design Quality** ⭐
   - Shadcn/ui + Framer Motion = professional
   - Designer judges will notice

5. **Agent Orchestration**
   - Clear agent separation
   - Visible in UI (not black box)

---

## Project Structure

```
hermes/
├── backend/
│   ├── main.py              # FastAPI app + routes
│   ├── models.py            # SQLAlchemy models (8 tables)
│   ├── schemas.py           # Pydantic schemas
│   ├── database.py          # SQLite connection
│   ├── auth.py              # JWT utilities
│   ├── exa_service.py       # Exa API integration
│   ├── matching_service.py  # Scoring algorithm ⭐
│   ├── requirements.txt
│   └── gift.db              # SQLite database
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── WishlistBuilder.jsx
│   │   │   ├── SponsorDashboard.jsx  ⭐ CRITICAL
│   │   │   └── EventDashboard.jsx
│   │   ├── components/
│   │   │   ├── MatchCard.jsx  ⭐
│   │   │   └── ExaSearch.jsx
│   │   └── services/
│   │       └── api.js
│   └── package.json
└── mcp_server/
    └── server.py            # FastMCP tools
```

---

## Success Criteria

✅ **Aesthetics** (40% weight):
- Shadcn/ui premium components
- Smooth Framer Motion animations
- Beautiful score visualizations
- Responsive design
- No UI bugs

✅ **Intelligence** (35% weight):
- Matching algorithm works correctly
- Exa integration finds relevant products
- AI explanations are coherent
- MCP tools work

✅ **Reliability** (25% weight):
- No crashes during demo
- API responds in <500ms
- Privacy filtering works correctly
- Clear error messages
- Successfully deployed

---

## Key Implementation Notes

### Do ✅
- Start with UI mockups
- Use Shadcn/ui from Day 1
- Test matching algorithm early
- Deploy by Hour 7
- Allocate 3+ hours to frontend polish
- Feature Exa prominently
- Practice demo pitch

### Don't ❌
- Don't build a chatbot
- Don't over-engineer backend
- Don't skip animations
- Don't implement friends system
- Don't wait until Hour 9 to deploy
- Don't ignore mobile responsive
- Don't hide agent collaboration

---

## Demo Flow (End-to-End Test)

### Setup
1. Create event "SF Tech Meetup"
2. Create user Alice (participant)
3. Create user TechCorp (sponsor)

### Participant Flow
1. Alice logs in
2. Searches "mechanical keyboard" in Exa
3. Adds "Keychron K2" ($89) to wishlist
   - Priority: 5/5
   - Privacy: event-only
   - Links to SF Tech Meetup

### Sponsor Flow
1. TechCorp logs in
2. Joins SF Tech Meetup as sponsor
3. Sets filters: $50-$100, Tech, Age 18-24
4. Clicks "Match Now"
5. Sees: 🎯 **92/100** - Alice's Keychron K2
6. Clicks "Claim Gift"
7. Confetti animation plays
8. Success!

---

## Risk Mitigation

1. **Exa API Issues**: Cache results, use mock data fallback
2. **Matching Too Slow**: Limit to 50 items, add loading state
3. **UI Not Polished**: Use Shadcn/ui from start, allocate 3+ hours
4. **Deployment Issues**: Deploy early (Hour 6-7), test live
5. **MCP Doesn't Work**: Skip if needed, focus on web UI

---

## Confirmed Requirements

- ✅ Exa API Access - implement real integration
- ✅ MCP Server - MUST-HAVE (1.5-2 hours, 3-4 tools)
- ✅ Run locally for now
- ✅ Generic events (hackathons, birthdays, etc.)

---

**Estimated Total Time**: 8-10 hours

**Key Success Factor**: Prioritize aesthetics and agent visibility over feature completeness. A beautiful, working demo of 3 features beats an ugly, buggy demo of 10 features.
