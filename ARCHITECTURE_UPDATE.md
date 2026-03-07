# Gift Portal - Updated Architecture: Separate Sponsor & Participant Views

## Problem Statement

The current implementation conflates sponsor and participant experiences:
- Dashboard shows both roles together in one list
- Wishlist builder is universal, not event-specific
- Event dashboard doesn't clearly differentiate between roles
- Navigation is confusing for users with multiple roles

## New Architecture: Fully Separated Views

### User Journey Split

#### Participant Journey
```
Login → Dashboard → Select Event (Participant) → Participant Event View
                                                    ├─ My Wishlist Items (for this event)
                                                    ├─ Add Items (Exa search)
                                                    ├─ Event Details
                                                    └─ Claimed Gifts Status
```

#### Sponsor Journey
```
Login → Dashboard → Select Event (Sponsor) → Sponsor Event View
                                              ├─ Smart Matching Dashboard
                                              ├─ Filter Panel (budget, categories, age)
                                              ├─ Match Suggestions
                                              ├─ My Claimed Gifts
                                              └─ Event Details
```

### Route Structure Changes

#### Current Routes (Conflated)
```
/dashboard                  # Shows ALL events together
/wishlist                   # Universal wishlist (not event-specific!)
/events/:eventId            # Generic event view (doesn't use role)
/sponsor/:eventId           # Only for sponsors
```

#### New Routes (Separated)
```
/dashboard                       # Landing: shows events grouped by role
/events/:eventId/participant     # Participant-only view of event
/events/:eventId/sponsor         # Sponsor-only view of event
```

Remove:
- `/wishlist` (universal) - replaced by event-specific participant view
- `/events/:eventId` (generic) - replaced by role-specific routes

### Component Organization

```
src/pages/
├── Dashboard.tsx                    # Landing page with role-separated event lists
├── ParticipantEventView.tsx        # NEW: Full participant experience for an event
│   ├── Wishlist management (event-specific)
│   ├── Exa product search
│   ├── Privacy settings per item
│   └── Gift status tracking
├── SponsorEventView.tsx            # RENAMED from SponsorDashboard.tsx
│   ├── Smart matching interface
│   ├── Filter panel
│   ├── Match suggestions
│   └── Claimed gifts management
└── [Remove] WishlistBuilder.tsx    # Functionality moved to ParticipantEventView
```

### Dashboard Changes

#### Current Dashboard
Shows mixed event list with conditional buttons:
```tsx
{events.map(event => (
  <Card>
    {event.role === 'sponsor' ? (
      <Link to={`/sponsor/${event.id}`}>Match Gifts</Link>
    ) : (
      <Link to="/wishlist">Add Items</Link>  // ❌ Not event-specific!
    )}
  </Card>
))}
```

#### New Dashboard
Two separate sections with clear visual separation:

```tsx
<Dashboard>
  {/* Participant Events Section */}
  <Section title="My Wishlists" icon="🎁">
    {participantEvents.map(event => (
      <Link to={`/events/${event.id}/participant`}>
        <EventCard role="participant">
          <h3>{event.name}</h3>
          <Stats>
            <Stat>5 wishlist items</Stat>
            <Stat>2 gifts claimed</Stat>
          </Stats>
          <Button>Manage Wishlist</Button>
        </EventCard>
      </Link>
    ))}
  </Section>

  {/* Sponsor Events Section */}
  <Section title="My Sponsored Events" icon="💝">
    {sponsorEvents.map(event => (
      <Link to={`/events/${event.id}/sponsor`}>
        <EventCard role="sponsor">
          <h3>{event.name}</h3>
          <Stats>
            <Stat>12 participants</Stat>
            <Stat>3 gifts given</Stat>
          </Stats>
          <Button>Find Matches</Button>
        </EventCard>
      </Link>
    ))}
  </Section>
</Dashboard>
```

### Participant Event View (New Component)

**File**: `src/pages/ParticipantEventView.tsx`

**Features**:
- Event-specific wishlist (only items for THIS event)
- Inline Exa product search
- Add/edit/delete wishlist items
- Set privacy per item (public vs event-only)
- See which items have been claimed (anonymously)
- Event invite code display
- Participant list

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ Navbar: {Event Name} | Role: Participant        │
└─────────────────────────────────────────────────┘

┌──────────────────────┬──────────────────────────┐
│ My Wishlist          │ Add Items (Search)       │
│                      │                          │
│ ┌──────────────────┐ │ ┌────────────────────┐   │
│ │ Item 1           │ │ │ Search: keyboard   │   │
│ │ $89 • Priority 5 │ │ └────────────────────┘   │
│ │ ✓ Claimed        │ │                          │
│ └──────────────────┘ │ [Exa Product Results]    │
│                      │ ┌──────────────────────┐ │
│ ┌──────────────────┐ │ │ Keychron K2 - $89  │ │
│ │ Item 2           │ │ │ [+ Add to Wishlist]│ │
│ │ $35 • Priority 4 │ │ └──────────────────────┘ │
│ └──────────────────┘ │                          │
│                      │ ┌──────────────────────┐ │
│ [+ Add Custom Item]  │ │ Logitech MX - $99   │ │
│                      │ │ [+ Add to Wishlist]│ │
└──────────────────────┴──────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Event Details                                   │
│ Invite Code: XYZ123 [Copy]                      │
│ Participants: 15 • Sponsors: 3                  │
└─────────────────────────────────────────────────┘
```

### Sponsor Event View (Renamed Component)

**File**: `src/pages/SponsorEventView.tsx` (rename from `SponsorDashboard.tsx`)

**Features** (keep existing):
- Smart matching algorithm interface
- Filter panel (budget, categories, age groups)
- Ranked match suggestions with scores
- Animated score breakdowns
- Gift claiming with confetti
- My claimed gifts list

**No structural changes needed** - just rename file and update imports.

### API Changes Required

#### New Endpoint: Get Event-Specific Wishlist
```python
@app.get("/api/events/{event_id}/wishlist-items")
def get_event_wishlist(event_id: int, current_user: User = Depends(get_current_user)):
    """Get wishlist items linked to this event for current user."""
    # Query wishlist_items joined with wishlist_item_events
    # Filter by user_id and event_id
    # Return only items for THIS event
```

#### Update Endpoint: Create Wishlist Item
Add `event_ids` parameter (already exists, just ensure it's working):
```python
@app.post("/api/wishlist-items")
def create_wishlist_item(
    item: schemas.WishlistItemCreate,
    current_user: User = Depends(get_current_user)
):
    # When creating, link to specific event(s)
    # Insert into wishlist_item_events table
```

### Migration Plan

#### Phase 1: Backend Adjustments (30 min)
1. ✅ Verify `/api/events/{event_id}/wishlist-items` endpoint exists
2. ✅ Ensure wishlist items are properly linked to events
3. ✅ Add event participant stats to event response

#### Phase 2: New Participant View (2 hours)
1. Create `ParticipantEventView.tsx`
2. Two-column layout: My Wishlist (left) + Add Items (right)
3. Event-specific wishlist loading
4. Inline Exa search integration
5. Add/edit/delete wishlist items
6. Link items to current event automatically

#### Phase 3: Dashboard Refactor (1 hour)
1. Split events by role: `participantEvents` vs `sponsorEvents`
2. Create two separate sections with distinct styling
3. Update links to point to role-specific routes
4. Add stats preview (item count, claimed count)

#### Phase 4: Routing Updates (30 min)
1. Add route: `/events/:eventId/participant`
2. Rename route: `/sponsor/:eventId` → `/events/:eventId/sponsor`
3. Remove route: `/wishlist` (redirect to dashboard)
4. Update all `Link` components

#### Phase 5: Component Cleanup (15 min)
1. Rename `SponsorDashboard.tsx` → `SponsorEventView.tsx`
2. Remove `WishlistBuilder.tsx` (functionality moved)
3. Update imports in App.tsx
4. Update plan documents

### Benefits of Separation

#### User Experience
- ✅ Clear mental model: "I'm a participant in Event A, sponsor in Event B"
- ✅ No confusion about which wishlist items belong to which event
- ✅ Dedicated workspace for each role
- ✅ Faster navigation (direct links to event-specific views)

#### Developer Experience
- ✅ Single responsibility per component
- ✅ Easier to add role-specific features without affecting other role
- ✅ Clear component naming: `ParticipantEventView` vs `SponsorEventView`
- ✅ Simpler state management (event-scoped data)

#### Demo Quality
- ✅ Shows understanding of user roles and permissions
- ✅ Professional separation of concerns
- ✅ Easier to explain: "This is the participant view, this is the sponsor view"
- ✅ Visually distinct interfaces (aesthetics judging criterion!)

## Updated File Structure

```
frontend/src/
├── pages/
│   ├── Dashboard.tsx                 # REFACTOR: Role-separated event lists
│   ├── ParticipantEventView.tsx     # NEW: Full participant experience
│   ├── SponsorEventView.tsx         # RENAME: From SponsorDashboard.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   └── [DELETE] WishlistBuilder.tsx
│   └── [DELETE] EventDashboard.tsx  # Redundant with role-specific views
├── components/
│   ├── CreateEventModal.tsx         # ✅ Already updated (invite code UI)
│   ├── JoinEventModal.tsx
│   ├── FilterPanel.tsx
│   ├── MatchCard.tsx
│   ├── ScoreBreakdown.tsx
│   └── ui/
└── App.tsx                          # UPDATE: New routes

backend/
├── main.py                          # ADD: Event-specific wishlist endpoint
├── models.py
├── schemas.py
└── matching_service.py
```

## Implementation Priority

### Must-Have (Core Functionality)
1. ✅ Backend endpoint: `/api/events/{event_id}/wishlist-items`
2. ✅ `ParticipantEventView.tsx` with event-specific wishlist
3. ✅ Dashboard split by role (two sections)
4. ✅ Update routing to role-specific paths

### Nice-to-Have (Polish)
1. Stats preview in dashboard cards (item counts, etc.)
2. Participant list in event views
3. Gift claim status indicators
4. Smooth transitions between views

### Can Skip (If Time Constrained)
1. Complex animations
2. Real-time updates
3. Advanced filtering in participant view
4. Duplicate detection for wishlist items

## Testing Checklist

### Participant Flow
- [ ] Create event as user A
- [ ] User A sees event in "My Wishlists" section
- [ ] Click "Manage Wishlist" → goes to `/events/{id}/participant`
- [ ] Add wishlist item via Exa search
- [ ] Item appears in "My Wishlist" (left panel)
- [ ] Item is linked to this event only
- [ ] Join another event → verify wishlist is separate

### Sponsor Flow
- [ ] Join event as sponsor (user B)
- [ ] User B sees event in "My Sponsored Events" section
- [ ] Click "Find Matches" → goes to `/events/{id}/sponsor`
- [ ] See matching interface (already working)
- [ ] Claim gift → verify it works
- [ ] Check that participant's wishlist item shows "Claimed"

### Cross-Role User
- [ ] User C joins Event 1 as participant, Event 2 as sponsor
- [ ] Dashboard shows Event 1 in "My Wishlists", Event 2 in "My Sponsored Events"
- [ ] Verify separate experiences for each event

## Documentation Updates Needed

1. **WISHLIST_FEATURE_PLAN.md**
   - Update to reference `ParticipantEventView` instead of `WishlistBuilder`
   - Clarify event-specific nature of wishlists
   - Update routing paths

2. **SPONSOR_DASHBOARD_PLAN.md**
   - Rename to `SPONSOR_VIEW_PLAN.md`
   - Update file references (SponsorEventView.tsx)
   - Update route paths

3. **README.md**
   - Add architecture diagram showing role separation
   - Update route documentation
   - Add user flow diagrams

## Questions for User

1. Should event creators be automatically assigned "participant" role, or should they choose?
2. Can users switch roles within an event (e.g., be both participant and sponsor)?
3. Should the universal `/wishlist` route redirect to dashboard, or to the most recent event?

## Summary

**Key Change**: Replace universal wishlist with event-specific participant views, fully separating sponsor and participant experiences.

**Impact**:
- Better UX (clear role separation)
- Simpler mental model
- Easier to demo
- Professional architecture

**Effort**: ~4 hours (2 hours participant view + 1 hour dashboard + 1 hour routing/cleanup)
