# Wishlist Feature - Implementation Plan

**Assignee**: Colleague Agent
**Branch**: `feature/wishlist-builder` (recommended)
**Priority**: P0 (Critical for demo)
**Estimated Time**: 3-4 hours

---

## 🎯 Objective

Build a beautiful Wishlist Builder page with Exa product search integration that allows users to:
1. Search for products using Exa API (with mock mode)
2. View product results with images, prices, descriptions
3. Add products to their wishlist
4. Manage wishlist items (edit priority, privacy, link to events)
5. View their complete wishlist

---

## 📁 Files to Create/Modify

### New Files to Create:
```
frontend/src/
├── components/
│   ├── ExaSearch.tsx          # Product search component
│   ├── ProductCard.tsx         # Individual product display
│   └── WishlistItemCard.tsx   # Wishlist item display
└── pages/
    └── WishlistBuilder.tsx     # Main page (replace placeholder)
```

### Files to Modify:
```
frontend/src/
├── pages/WishlistBuilder.tsx  # Replace placeholder content
└── services/api.ts            # Already has all needed methods
```

### Files NOT to Touch (Avoid Conflicts):
```
frontend/src/
├── pages/
│   ├── SponsorDashboard.tsx   # Being built by another agent
│   ├── EventDashboard.tsx     # Being built by event team
│   └── Dashboard.tsx          # Being modified by event team
├── components/ui/             # Shared components (okay to use, not modify)
└── contexts/AuthContext.tsx   # Don't modify
```

---

## 🎨 Design Specifications

### Layout: Two-Panel Design

```
┌─────────────────────────────────────────────────────────────┐
│  Wishlist Builder                                    [User] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────┐  ┌──────────────────────────────┐  │
│  │  LEFT PANEL        │  │  RIGHT PANEL                  │  │
│  │  Product Search    │  │  My Wishlist                  │  │
│  │                    │  │                                │  │
│  │  [Search Box]      │  │  ┌─────────────────────────┐ │  │
│  │  "mechanical       │  │  │ Keychron K2             │ │  │
│  │   keyboard"        │  │  │ $89 • Tech              │ │  │
│  │                    │  │  │ ⭐⭐⭐⭐⭐ Priority      │ │  │
│  │  ┌──────────────┐  │  │  │ 🔒 Event Only          │ │  │
│  │  │ Product 1    │  │  │  │ [Edit] [Delete]         │ │  │
│  │  │ $89          │  │  │  └─────────────────────────┘ │  │
│  │  │ [+ Add]      │  │  │                                │  │
│  │  └──────────────┘  │  │  ┌─────────────────────────┐ │  │
│  │                    │  │  │ Clean Code Book         │ │  │
│  │  ┌──────────────┐  │  │  │ $35 • Books             │ │  │
│  │  │ Product 2    │  │  │  │ ⭐⭐⭐⭐ Priority        │ │  │
│  │  │ $59          │  │  │  │ 🌍 Public               │ │  │
│  │  │ [+ Add]      │  │  │  │ [Edit] [Delete]         │ │  │
│  │  └──────────────┘  │  │  └─────────────────────────┘ │  │
│  │                    │  │                                │  │
│  └────────────────────┘  └──────────────────────────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Color Scheme (Already Defined in Tailwind Config):
- Primary: Purple `#8B5CF6`
- Secondary: Pink `#EC4899`
- Accent: Cyan `#06B6D4`
- Background: Gray-50 (light) / Gray-900 (dark)

---

## 🔌 API Integration (Already Implemented!)

All API methods are ready in `src/services/api.ts`:

```typescript
// Product Search (Exa)
apiClient.searchProducts(query, maxResults, priceMin, priceMax)
// Returns: { products: ExaProduct[], query: string, total_results: number }

// Get User's Wishlists
apiClient.getMyWishlists()
// Returns: Wishlist[]

// Get Items in Wishlist
apiClient.getWishlistItems(wishlistId)
// Returns: WishlistItem[]

// Create Wishlist Item
apiClient.createWishlistItem({
  wishlist_id: number,
  title: string,
  description?: string,
  url?: string,
  image_url?: string,
  price_min?: number,
  price_max?: number,
  category?: string,
  priority: 1-5,
  privacy_level: 'public' | 'event_only',
  event_ids: number[]
})

// Update Wishlist Item
apiClient.updateWishlistItem(itemId, { ...fields })

// Delete Wishlist Item
apiClient.deleteWishlistItem(itemId)
```

**Important**: Backend uses `MOCK_EXA=true` by default to save API credits. Real Exa only for final demo!

---

## 📋 Step-by-Step Implementation

### Step 1: Create ExaSearch Component (30 min)

**File**: `frontend/src/components/ExaSearch.tsx`

**Requirements**:
- Search input with debounce (500ms)
- Optional price range filters (min/max)
- Loading state while searching
- Grid of ProductCard components
- Empty state when no results

**Key Features**:
```typescript
interface ExaSearchProps {
  onAddToWishlist: (product: ExaProduct) => void;
}

// State management
const [query, setQuery] = useState('');
const [products, setProducts] = useState<ExaProduct[]>([]);
const [loading, setLoading] = useState(false);
const [priceMin, setPriceMin] = useState<number>();
const [priceMax, setPriceMax] = useState<number>();

// Debounced search
useEffect(() => {
  const timer = setTimeout(() => {
    if (query) {
      searchProducts();
    }
  }, 500);
  return () => clearTimeout(timer);
}, [query, priceMin, priceMax]);
```

**UI Elements**:
- Search input with icon (use `lucide-react` Search icon)
- Price filters (two number inputs side-by-side)
- Loading spinner (use existing from `AuthContext`)
- Product grid (2 columns, responsive)

---

### Step 2: Create ProductCard Component (20 min)

**File**: `frontend/src/components/ProductCard.tsx`

**Requirements**:
- Display product image (or placeholder if null)
- Show title, price, description
- "Powered by Exa" badge (pink)
- "+ Add to Wishlist" button

**Layout**:
```typescript
interface ProductCardProps {
  product: ExaProduct;
  onAdd: (product: ExaProduct) => void;
}

// Card structure:
<Card className="hover:shadow-lg transition-shadow">
  <img /> // or placeholder
  <CardHeader>
    <CardTitle>{title}</CardTitle>
    <p className="text-sm text-gray-500">${price}</p>
  </CardHeader>
  <CardContent>
    <p className="text-sm">{description}</p>
    <div className="flex items-center gap-1 mt-2">
      <span className="text-xs text-pink-500">Powered by Exa</span>
    </div>
  </CardContent>
  <CardFooter>
    <Button onClick={() => onAdd(product)}>+ Add</Button>
  </CardFooter>
</Card>
```

**Important**: Add Exa logo/branding (they're a sponsor partner!)

---

### Step 3: Create WishlistItemCard Component (30 min)

**File**: `frontend/src/components/WishlistItemCard.tsx`

**Requirements**:
- Display item details (title, price, category)
- Priority stars (1-5, editable)
- Privacy badge (🔒 Event Only / 🌍 Public)
- Edit and Delete buttons
- Optional: Link to events (dropdown)

**Interactive Elements**:
```typescript
interface WishlistItemCardProps {
  item: WishlistItem;
  events: Event[];
  onUpdate: (itemId: number, updates: Partial<WishlistItem>) => void;
  onDelete: (itemId: number) => void;
}

// Priority stars
const renderPriority = (priority: number) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map(i => (
      <Star
        key={i}
        className={i <= priority ? "fill-yellow-400" : ""}
        onClick={() => onUpdate(item.id, { priority: i })}
      />
    ))}
  </div>
);

// Privacy toggle
<Button
  variant="ghost"
  size="sm"
  onClick={() => onUpdate(item.id, {
    privacy_level: item.privacy_level === 'public' ? 'event_only' : 'public'
  })}
>
  {item.privacy_level === 'public' ? '🌍 Public' : '🔒 Event Only'}
</Button>
```

---

### Step 4: Build Main WishlistBuilder Page (60 min)

**File**: `frontend/src/pages/WishlistBuilder.tsx`

**Requirements**:
- Two-panel layout (search left, wishlist right)
- Fetch user's default wishlist on mount
- Fetch wishlist items on mount
- Handle adding products from search to wishlist
- Handle editing/deleting items
- Show Exa logo/branding prominently

**State Management**:
```typescript
const [wishlist, setWishlist] = useState<Wishlist | null>(null);
const [items, setItems] = useState<WishlistItem[]>([]);
const [events, setEvents] = useState<Event[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  // 1. Get user's wishlists
  const wishlists = await apiClient.getMyWishlists();
  const defaultWishlist = wishlists.find(w => w.is_default) || wishlists[0];
  setWishlist(defaultWishlist);

  // 2. Get wishlist items
  if (defaultWishlist) {
    const items = await apiClient.getWishlistItems(defaultWishlist.id);
    setItems(items);
  }

  // 3. Get user's events (for linking)
  const events = await apiClient.getMyEvents();
  setEvents(events);
};

const handleAddProduct = async (product: ExaProduct) => {
  if (!wishlist) return;

  const newItem = await apiClient.createWishlistItem({
    wishlist_id: wishlist.id,
    title: product.title,
    description: product.description || '',
    url: product.url,
    image_url: product.image_url,
    price_min: product.price,
    price_max: product.price,
    category: inferCategory(product.title), // helper function
    priority: 3, // default medium
    privacy_level: 'public',
    event_ids: [],
    exa_metadata: { /* store product data */ }
  });

  setItems([...items, newItem]);
  // Show success toast/notification
};
```

**Layout Structure**:
```tsx
<div className="min-h-screen bg-gray-50">
  <nav>/* Navigation bar with back button */</nav>

  <main className="max-w-7xl mx-auto p-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Panel: Search */}
      <div>
        <h2>Find Products</h2>
        <ExaSearch onAddToWishlist={handleAddProduct} />
      </div>

      {/* Right Panel: Wishlist */}
      <div>
        <h2>My Wishlist</h2>
        {items.map(item => (
          <WishlistItemCard
            key={item.id}
            item={item}
            events={events}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
          />
        ))}
      </div>
    </div>
  </main>
</div>
```

---

### Step 5: Add Polish & Error Handling (30 min)

**Error States**:
- API errors (network failures)
- Empty states (no results, no wishlist items)
- Loading states (skeleton UI)

**Success Feedback**:
- Toast notification when item added
- Smooth transitions when items update/delete
- Optimistic UI updates

**Accessibility**:
- Keyboard navigation for priority stars
- ARIA labels for buttons
- Focus management for modals

---

## 🧪 Testing Checklist

### Manual Testing:
- [ ] Search for "keyboard" shows mock results
- [ ] Add product to wishlist creates item
- [ ] Edit priority (1-5 stars) updates immediately
- [ ] Toggle privacy updates item
- [ ] Delete item removes from list
- [ ] Empty state shows when no items
- [ ] Loading states show during API calls
- [ ] Error handling works (disconnect wifi, test)
- [ ] Responsive design works (mobile, tablet, desktop)
- [ ] Exa branding is visible

### Integration Testing:
- [ ] Works with existing auth (user must be logged in)
- [ ] Navigates back to dashboard correctly
- [ ] Event linking dropdown shows user's events
- [ ] Items persist after page refresh

---

## 🔗 Dependencies & Shared Resources

### Already Available (Use These):
```typescript
// API Client
import { apiClient } from '../services/api';

// UI Components
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

// Auth
import { useAuth } from '../contexts/AuthContext';

// Icons
import { Search, Star, Trash, Edit } from 'lucide-react';

// Utils
import { cn } from '../lib/utils';
```

### Don't Modify:
- `AuthContext.tsx`
- `api.ts` (read-only, all methods ready)
- UI components in `components/ui/` (use but don't edit)

---

## 🚨 Important Notes

### Backend Configuration:
- **MOCK_EXA=true** is enabled by default (saves $10 API credits!)
- Mock data returns keyboards, books, and default products
- To test real Exa: Set `MOCK_EXA=false` in `backend/.env`

### Category Inference Helper:
```typescript
const inferCategory = (title: string): string => {
  const lower = title.toLowerCase();
  if (lower.includes('keyboard') || lower.includes('mouse') || lower.includes('monitor')) return 'tech';
  if (lower.includes('book')) return 'books';
  if (lower.includes('game')) return 'gaming';
  if (lower.includes('shirt') || lower.includes('jacket')) return 'fashion';
  return 'other';
};
```

### Priority Levels:
- 1 = Low (nice to have)
- 2 = Medium-Low
- 3 = Medium (default)
- 4 = High
- 5 = Critical (must have!)

---

## 🎯 Success Criteria

### Must Have (P0):
- ✅ Search products with Exa (mock or real)
- ✅ Display products in grid with images
- ✅ Add products to wishlist
- ✅ View wishlist items
- ✅ Edit priority (1-5 stars)
- ✅ Delete items
- ✅ Exa branding visible

### Nice to Have (P1):
- ⭐ Price range filters
- ⭐ Link items to specific events
- ⭐ Toggle privacy (public/event-only)
- ⭐ Drag-and-drop reordering
- ⭐ Image placeholders for products without images

### Stretch Goals (P2):
- 🚀 Auto-fill from product URL
- 🚀 Bulk import from wishlist sites
- 🚀 Categories auto-tagging with ML

---

## 🔄 Git Workflow

**Recommended Branch Strategy**:
```bash
# Create feature branch
git checkout -b feature/wishlist-builder

# Make changes and commit frequently
git add src/components/ExaSearch.tsx
git commit -m "Add Exa product search component"

# Push to branch
git push origin feature/wishlist-builder

# Create PR when ready
# Merge after review
```

**Commit Message Format**:
```
feat(wishlist): Add Exa product search component
feat(wishlist): Create wishlist item card with priority stars
fix(wishlist): Handle empty search results
style(wishlist): Add Exa branding to product cards
```

---

## 🤝 Coordination with Other Work

### What Others Are Building:
- **Event Team**: Event creation, joining with invite codes
- **Sponsor Dashboard Team**: Matching algorithm UI, score visualizations
- **Animations Team**: Framer Motion polish across all pages

### Potential Conflicts:
- `Dashboard.tsx` - Event team will add event creation modal
- `EventDashboard.tsx` - Event team is building this
- Shared components - Use but don't modify

### Communication:
- Post in team channel before modifying shared files
- Pull latest from main before starting each session
- Resolve conflicts by keeping both features

---

## 📞 Questions / Help

If you get stuck:

1. **API not working?**
   - Check backend is running: `curl http://localhost:8000/`
   - Verify auth token in localStorage: `localStorage.getItem('token')`

2. **Mock data not showing?**
   - Confirm `MOCK_EXA=true` in `backend/.env`
   - Restart backend server to pick up env changes

3. **Styling issues?**
   - All Tailwind utilities available
   - Use `cn()` helper to merge classes
   - Check `tailwind.config.js` for custom colors

4. **Type errors?**
   - All types defined in API responses
   - Use `apiClient` for type-safe calls
   - Check network tab for actual response shape

---

## 📚 Reference Links

- **Backend API Docs**: http://localhost:8000/docs
- **Exa Setup Guide**: `/PLAN.md` (in repo root)
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/icons

---

## 🎉 Demo Scenario

When complete, the demo flow should be:

1. User logs in
2. Clicks "Manage Wishlist" from dashboard
3. Searches for "mechanical keyboard under 100"
4. Sees 3 Exa results with images and prices
5. Clicks "+ Add" on Keychron K2
6. Item appears in right panel
7. Sets priority to 5 stars
8. Sets privacy to "Event Only"
9. Searches for "programming books"
10. Adds "Clean Code" book
11. Has 2 items in wishlist ready for matching!

This feeds perfectly into the Sponsor Matching Dashboard where sponsors will discover these items!

---

**Estimated Time**: 3-4 hours for full implementation
**Priority**: P0 - Critical for hackathon demo
**Reviewer**: Coordinate with team for PR review

Good luck! 🚀
