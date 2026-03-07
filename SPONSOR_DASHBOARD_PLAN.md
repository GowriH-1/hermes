# Sponsor Matching Dashboard - Implementation Plan

**Assignee**: Claude Agent (Main)
**Branch**: `feature/sponsor-dashboard` (recommended)
**Priority**: P0 (Critical - Hero Feature for Judging!)
**Estimated Time**: 4-5 hours

---

## 🎯 Objective

Build the **HERO FEATURE** of Gift Portal - a stunning Sponsor Matching Dashboard that showcases:
- Real-time smart matching with 4-factor scoring (0-100 points)
- Animated match cards with score breakdowns
- AI-generated explanations
- Beautiful visualizations with Recharts
- Confetti animation on gift claim
- Real-time filtering

**This page wins or loses the hackathon!** (Aesthetics is 40% of judging)

---

## 📁 Files to Create/Modify

### New Files to Create:
```
frontend/src/
├── components/
│   ├── MatchCard.tsx           # Individual match card with animations
│   ├── ScoreBreakdown.tsx      # Animated score bars (Recharts)
│   ├── FilterPanel.tsx         # Sponsor preference filters
│   └── ConfettiEffect.tsx      # Celebration animation
└── pages/
    └── SponsorDashboard.tsx    # Main page (replace placeholder)
```

### Files to Modify:
```
frontend/src/
├── pages/SponsorDashboard.tsx  # Replace placeholder
└── services/api.ts             # Already has all methods
```

### Files NOT to Touch:
```
frontend/src/
├── pages/
│   ├── WishlistBuilder.tsx     # Being built by wishlist team
│   ├── EventDashboard.tsx      # Being built by event team
│   └── Dashboard.tsx           # Being modified by event team
└── contexts/AuthContext.tsx    # Don't modify
```

---

## 🎨 Design Specifications

### Hero Layout: Filter + Match Cards

```
┌─────────────────────────────────────────────────────────────────┐
│  Sponsor Matching for: Tech Hackathon 2026          [Logout]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────────────────────┐   │
│  │ FILTER PANEL     │  │ MATCH RESULTS                     │   │
│  │                  │  │                                    │   │
│  │ Budget Range     │  │ ┌────────────────────────────────┐│   │
│  │ [$50] to [$100] │  │ │ 🎯 97/100                      ││   │
│  │                  │  │ │ Keychron K2 Mechanical Keyboard││   │
│  │ Categories       │  │ │ Alice Johnson • 18-24 • Tech   ││   │
│  │ ☑ Tech           │  │ │                                 ││   │
│  │ ☑ Books          │  │ │ ▓▓▓▓▓▓▓▓░░ Budget (37/40)     ││   │
│  │ ☐ Gaming         │  │ │ ▓▓▓▓▓▓▓▓▓▓ Category (30/30)   ││   │
│  │                  │  │ │ ▓▓▓▓▓▓▓▓▓▓ Demographics (20/20)││   │
│  │ Age Groups       │  │ │ ▓▓▓▓▓▓▓▓▓▓ Priority (10/10)   ││   │
│  │ ☑ 18-24          │  │ │                                 ││   │
│  │ ☐ 25-34          │  │ │ 💡 "Perfect match! Alice is a  ││   │
│  │                  │  │ │ 18-24 year old interested in   ││   │
│  │ [Match Now] 🎯   │  │ │ tech. They want this $89       ││   │
│  │                  │  │ │ keyboard. Fits your budget!"   ││   │
│  │                  │  │ │                                 ││   │
│  │                  │  │ │ [Claim Gift 🎁]  [View on Exa] ││   │
│  └──────────────────┘  │ └────────────────────────────────┘│   │
│                        │                                     │   │
│                        │ ┌────────────────────────────────┐│   │
│                        │ │ 🎯 87/100                      ││   │
│                        │ │ Clean Code Book                ││   │
│                        │ │ Alice Johnson • 18-24 • Books  ││   │
│                        │ │ ...score bars...               ││   │
│                        │ └────────────────────────────────┘│   │
│                        └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Integration (Already Implemented!)

```typescript
// Get Smart Match Suggestions (THE CORE API!)
apiClient.getMatchSuggestions({
  event_id: number,
  budget_min?: number,
  budget_max?: number,
  categories?: string[],
  age_groups?: string[],
  min_score?: number
})
// Returns: {
//   matches: MatchSuggestion[],
//   total_count: number
// }

// MatchSuggestion structure:
{
  wishlist_item: WishlistItem,
  user: User,
  score_breakdown: {
    budget_score: number,      // 0-40
    category_score: number,    // 0-30
    demographics_score: number,// 0-20
    priority_score: number,    // 0-10
    total_score: number        // 0-100
  },
  explanation: string // AI-generated!
}

// Claim a Gift
apiClient.claimGift({
  wishlist_item_id: number,
  event_id: number,
  notes?: string
})

// Get/Set Sponsor Preferences
apiClient.saveSponsorPreferences({
  event_id: number,
  budget_min: number,
  budget_max: number,
  preferred_categories: string[],
  target_age_groups: string[]
})
```

---

## 📋 Step-by-Step Implementation

### Step 1: Create FilterPanel Component (45 min)

**File**: `frontend/src/components/FilterPanel.tsx`

**Requirements**:
- Budget range slider (or two number inputs)
- Category checkboxes (tech, books, gaming, fashion, sports, other)
- Age group checkboxes (18-24, 25-34, 35-44, 45-54, 55+)
- "Match Now" button (prominent, animated)
- Save preferences checkbox

**State Management**:
```typescript
interface FilterPanelProps {
  eventId: number;
  onFilter: (filters: MatchFilters) => void;
}

const [budgetMin, setBudgetMin] = useState(50);
const [budgetMax, setBudgetMax] = useState(200);
const [categories, setCategories] = useState<string[]>(['tech']);
const [ageGroups, setAgeGroups] = useState<string[]>(['18-24']);
const [savePreferences, setSavePreferences] = useState(true);

const handleMatch = async () => {
  if (savePreferences) {
    await apiClient.saveSponsorPreferences({
      event_id: eventId,
      budget_min: budgetMin,
      budget_max: budgetMax,
      preferred_categories: categories,
      target_age_groups: ageGroups
    });
  }

  onFilter({
    event_id: eventId,
    budget_min: budgetMin,
    budget_max: budgetMax,
    categories,
    age_groups: ageGroups,
    min_score: 50
  });
};
```

**Styling**:
- Sticky sidebar (stays visible while scrolling)
- Card with shadow
- Purple accent for selected items
- Animated button with pulse effect

---

### Step 2: Create ScoreBreakdown Component (45 min)

**File**: `frontend/src/components/ScoreBreakdown.tsx`

**Requirements**:
- 4 animated progress bars (one for each scoring factor)
- Different colors for each factor
- Count-up animation when loaded
- Tooltips explaining each factor

**Using Recharts**:
```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface ScoreBreakdownProps {
  scores: {
    budget_score: number;
    category_score: number;
    demographics_score: number;
    priority_score: number;
  };
}

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({ scores }) => {
  const data = [
    { name: 'Budget', value: scores.budget_score, max: 40, color: '#8B5CF6' },
    { name: 'Category', value: scores.category_score, max: 30, color: '#EC4899' },
    { name: 'Demographics', value: scores.demographics_score, max: 20, color: '#06B6D4' },
    { name: 'Priority', value: scores.priority_score, max: 10, color: '#10B981' },
  ];

  return (
    <div className="space-y-2">
      {data.map((item) => (
        <div key={item.name} className="flex items-center gap-2">
          <span className="text-sm w-24">{item.name}</span>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / item.max) * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          </div>
          <span className="text-sm font-medium">{item.value}/{item.max}</span>
        </div>
      ))}
    </div>
  );
};
```

**Alternative**: Custom animated bars with Framer Motion (if Recharts too heavy)

---

### Step 3: Create MatchCard Component (60 min)

**File**: `frontend/src/components/MatchCard.tsx`

**Requirements**:
- Card with hover animation (lift + shadow)
- Total score badge (large, colored by score)
- Product image or placeholder
- User info (name, age, interests)
- Score breakdown component
- AI explanation text
- Claim Gift button (primary CTA)
- View on Exa link (secondary)

**Score Colors**:
```typescript
const getScoreColor = (score: number) => {
  if (score >= 85) return 'bg-green-500 text-white'; // Excellent
  if (score >= 70) return 'bg-blue-500 text-white';  // Great
  if (score >= 60) return 'bg-yellow-500 text-white';// Good
  return 'bg-gray-500 text-white';                    // Fair
};
```

**Card Structure**:
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
  className="bg-white rounded-lg shadow-lg overflow-hidden"
>
  {/* Score Badge - Top Right */}
  <div className="absolute top-4 right-4">
    <div className={cn("px-3 py-1 rounded-full font-bold", getScoreColor(match.score_breakdown.total_score))}>
      🎯 {match.score_breakdown.total_score}/100
    </div>
  </div>

  {/* Product Image */}
  <img src={match.wishlist_item.image_url || placeholder} />

  {/* Card Body */}
  <div className="p-6">
    <h3 className="text-xl font-bold">{match.wishlist_item.title}</h3>
    <p className="text-sm text-gray-600">
      {match.user.full_name} • {match.user.age_group} •
      {match.wishlist_item.category}
    </p>
    <p className="text-lg font-semibold text-primary mt-2">
      ${match.wishlist_item.price_min}
    </p>

    {/* Score Breakdown */}
    <ScoreBreakdown scores={match.score_breakdown} />

    {/* AI Explanation */}
    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
      <p className="text-sm">{match.explanation}</p>
    </div>

    {/* Actions */}
    <div className="mt-4 flex gap-2">
      <Button
        onClick={() => onClaim(match)}
        className="flex-1"
      >
        Claim Gift 🎁
      </Button>
      <Button
        variant="outline"
        onClick={() => window.open(match.wishlist_item.url, '_blank')}
      >
        View on Exa
      </Button>
    </div>
  </div>
</motion.div>
```

---

### Step 4: Create ConfettiEffect Component (30 min)

**File**: `frontend/src/components/ConfettiEffect.tsx`

**Requirements**:
- Trigger on successful gift claim
- Full-screen overlay
- Auto-dismiss after 3 seconds
- Multiple colors (purple, pink, cyan)

**Using react-confetti or custom**:
```typescript
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

interface ConfettiEffectProps {
  active: boolean;
  onComplete: () => void;
}

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ active, onComplete }) => {
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (active) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [active]);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <Confetti
        width={width}
        height={height}
        colors={['#8B5CF6', '#EC4899', '#06B6D4', '#10B981']}
        recycle={false}
        numberOfPieces={500}
      />
    </div>
  );
};
```

**Alternative**: Use Framer Motion for custom particle animations

---

### Step 5: Build Main SponsorDashboard Page (90 min)

**File**: `frontend/src/pages/SponsorDashboard.tsx`

**Requirements**:
- Get eventId from URL params: `/sponsor/:eventId`
- Load event details on mount
- Load saved preferences (if any)
- Show filter panel (sticky sidebar)
- Show match results grid
- Handle claiming gifts with confetti
- Loading states + empty states
- Agent thinking indicator ("Matching Agent analyzing...")

**State Management**:
```typescript
const { eventId } = useParams<{ eventId: string }>();
const [event, setEvent] = useState<Event | null>(null);
const [matches, setMatches] = useState<MatchSuggestion[]>([]);
const [loading, setLoading] = useState(false);
const [matching, setMatching] = useState(false);
const [showConfetti, setShowConfetti] = useState(false);

useEffect(() => {
  loadEventAndPreferences();
}, [eventId]);

const loadEventAndPreferences = async () => {
  const eventData = await apiClient.getEvent(Number(eventId));
  setEvent(eventData);

  // Try to load saved preferences
  try {
    const prefs = await apiClient.getSponsorPreferences(Number(eventId));
    // Auto-run matching with saved preferences
    handleFilter({ ... });
  } catch {
    // No saved preferences yet
  }
};

const handleFilter = async (filters: MatchFilters) => {
  setMatching(true);
  try {
    const response = await apiClient.getMatchSuggestions(filters);
    setMatches(response.matches);
  } finally {
    setMatching(false);
  }
};

const handleClaimGift = async (match: MatchSuggestion) => {
  try {
    await apiClient.claimGift({
      wishlist_item_id: match.wishlist_item.id,
      event_id: Number(eventId),
      notes: `Claimed via smart matching (Score: ${match.score_breakdown.total_score}/100)`
    });

    // Show success + confetti!
    setShowConfetti(true);

    // Remove claimed item from results
    setMatches(matches.filter(m => m.wishlist_item.id !== match.wishlist_item.id));

    // Show success message
    alert(`Gift claimed! ${match.user.full_name} will be notified.`);
  } catch (error) {
    alert('Error claiming gift. Please try again.');
  }
};
```

**Layout**:
```tsx
<div className="min-h-screen bg-gray-50">
  {/* Nav Bar */}
  <nav className="bg-white shadow">
    <div className="max-w-7xl mx-auto px-4">
      <h1>Sponsor Matching for: {event?.name}</h1>
    </div>
  </nav>

  {/* Main Content */}
  <div className="max-w-7xl mx-auto p-6">
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left: Filter Panel (1/4 width) */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <FilterPanel
            eventId={Number(eventId)}
            onFilter={handleFilter}
          />
        </div>
      </div>

      {/* Right: Match Results (3/4 width) */}
      <div className="lg:col-span-3">
        {matching && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-gray-600">Matching Agent analyzing...</p>
          </div>
        )}

        {!matching && matches.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No matches found. Adjust your filters and try again.</p>
          </div>
        )}

        {!matching && matches.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-6">
              Found {matches.length} Perfect Matches 🎯
            </h2>
            <div className="space-y-6">
              {matches.map((match, index) => (
                <motion.div
                  key={match.wishlist_item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MatchCard
                    match={match}
                    onClaim={handleClaimGift}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  </div>

  {/* Confetti Effect */}
  <ConfettiEffect
    active={showConfetti}
    onComplete={() => setShowConfetti(false)}
  />
</div>
```

---

## 🎨 Animation Specifications

### Card Entrance (Framer Motion):
```typescript
// Stagger cards on load
{matches.map((match, index) => (
  <motion.div
    key={match.wishlist_item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
  >
    <MatchCard match={match} onClaim={handleClaimGift} />
  </motion.div>
))}
```

### Score Bar Animation:
```typescript
// Count up from 0 to final score
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${percentage}%` }}
  transition={{ duration: 1, ease: "easeOut" }}
  className="score-bar"
/>
```

### Hover Effects:
```typescript
// Card lift on hover
<motion.div
  whileHover={{
    scale: 1.02,
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)"
  }}
  transition={{ duration: 0.2 }}
>
```

### Button Pulse (CSS):
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.match-button {
  animation: pulse 2s infinite;
}
```

---

## 🧪 Testing Checklist

### Functionality:
- [ ] Load event details from URL param
- [ ] Filter panel updates state correctly
- [ ] Match Now button triggers API call
- [ ] Match cards render with correct data
- [ ] Score breakdowns animate on load
- [ ] Claim Gift button works
- [ ] Confetti shows on successful claim
- [ ] Claimed items removed from list
- [ ] Empty state shows when no matches
- [ ] Loading state shows during API call

### Visual Polish:
- [ ] Cards have hover animations
- [ ] Score bars animate smoothly
- [ ] Colors match theme (purple/pink/cyan)
- [ ] Responsive on mobile/tablet/desktop
- [ ] Sticky sidebar on desktop
- [ ] Smooth transitions everywhere

### Edge Cases:
- [ ] Invalid event ID redirects to dashboard
- [ ] Network errors handled gracefully
- [ ] Already claimed items marked
- [ ] Score of 100 renders correctly
- [ ] Long explanations don't break layout

---

## 🚨 Important Notes

### Backend Mock Data:
- Use `/backend/test_e2e.sh` to create test data
- Or manually create via API:
  - Register users
  - Create event
  - Add wishlist items
  - Get matches

### Score Interpretation:
- 90-100: Perfect match (green badge)
- 70-89: Great match (blue badge)
- 60-69: Good match (yellow badge)
- <60: Fair match (gray badge)

### AI Explanations:
- Generated by backend matching service
- Format: "🎯 **Perfect match!** [Name] is a [age] year old interested in [interests]..."
- Already includes emoji and markdown
- Render with `dangerouslySetInnerHTML` or markdown parser

---

## 🎯 Success Criteria

### Must Have (P0):
- ✅ Filter panel with budget, categories, age groups
- ✅ Match cards with score breakdowns
- ✅ AI explanations displayed
- ✅ Animated score bars
- ✅ Claim gift functionality
- ✅ Confetti on success
- ✅ Responsive design

### Nice to Have (P1):
- ⭐ Save preferences checkbox
- ⭐ "Powered by Exa" badge
- ⭐ Export matches to CSV
- ⭐ Sort by score/price
- ⭐ Filter by min score slider

### Stretch Goals (P2):
- 🚀 Compare multiple matches side-by-side
- 🚀 "Why not matched" for filtered items
- 🚀 Real-time updates (websockets)

---

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/sponsor-dashboard

# Commit components individually
git add src/components/FilterPanel.tsx
git commit -m "feat(sponsor): Add filter panel with budget and category filters"

git add src/components/ScoreBreakdown.tsx
git commit -m "feat(sponsor): Add animated score breakdown component"

git add src/components/MatchCard.tsx
git commit -m "feat(sponsor): Create match card with hover animations"

git add src/components/ConfettiEffect.tsx
git commit -m "feat(sponsor): Add confetti celebration effect"

git add src/pages/SponsorDashboard.tsx
git commit -m "feat(sponsor): Build complete sponsor matching dashboard"

# Push and create PR
git push origin feature/sponsor-dashboard
```

---

## 🤝 Coordination

### Won't Touch:
- WishlistBuilder.tsx (wishlist team)
- EventDashboard.tsx (event team)
- Dashboard.tsx (event team for modals)

### May Need from Others:
- Event creation to test with real events
- Wishlist items to have matches show up

### Others May Need from This:
- Shared animation utilities
- Score visualization components

---

## 🎉 Demo Script

Perfect demo flow:

1. User logs in as sponsor
2. Navigates to `/sponsor/1`
3. Sees filter panel on left
4. Sets budget $50-$100
5. Selects "Tech" and "Books"
6. Selects age "18-24"
7. Clicks "Match Now" 🎯
8. **"Matching Agent analyzing..."** appears
9. Cards fade in with stagger effect
10. First card shows 97/100 score
11. Score bars animate (budget 37/40, category 30/30, etc.)
12. AI explanation: "Perfect match! Alice..."
13. Clicks "Claim Gift" button
14. **CONFETTI EXPLOSION** 🎉
15. Success message shows
16. Card removed from list
17. Next match ready to review

**This is the WOW moment for judges!**

---

**Estimated Time**: 4-5 hours
**Priority**: P0 - CRITICAL HERO FEATURE
**Impact**: 40% of judging score (aesthetics) + 35% (intelligence)

Let's make this AMAZING! 🚀
