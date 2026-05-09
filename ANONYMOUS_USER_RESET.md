# Anonymous User Session Reset Feature

## Overview

Anonymous (non-signed-in) users now have their progress reset to **Level 1** at the start of each new session, while **preserving their question history** to prevent repetitive questions.

## How It Works

### 1. Session Detection

When a user returns to the app:
- If they are **signed in**: Their full progress (level, XP, lives, etc.) is restored from Firestore
- If they are **not signed in** but have previous progress: They are identified as an anonymous user

### 2. Progress Reset Logic

For anonymous users with existing progress:
- **Level**: Reset to 1
- **XP**: Reset to 0
- **Lives**: Reset to 5
- **Streak**: Reset to 0
- **Badges**: Reset to empty
- **Best Quiz**: Reset to 0
- **Seen Questions**: **PRESERVED** ✅

This ensures:
- Users start fresh each session (no saved progress)
- Users don't see repetitive questions (question history is maintained)

### 3. Question History Preservation

The `seenQuestions` array is **never reset** for anonymous users. This means:
- If a user saw questions Q1, Q2, Q3 yesterday
- Today they start at Level 1, but the system knows they've seen Q1, Q2, Q3
- New questions are selected from the unseen pool first
- Only after all questions are exhausted does repetition begin

## Implementation Details

### File: `lib/useGameState.ts`

```typescript
// Step 2: when auth state resolves, fetch + merge from Firestore
useEffect(() => {
  if (!hydrated || authLoading) return;

  // Signed out: reset anonymous users to level 1 but preserve seenQuestions
  if (!user) {
    lastUidRef.current = null;
    setState((current) => {
      // If they have progress but no user, they're an anonymous user
      // Reset to level 1 but keep seenQuestions so they don't see repeated questions
      if (current.xp > 0 || current.level > 1) {
        return {
          ...defaultState,
          seenQuestions: current.seenQuestions,
        };
      }
      return current;
    });
    return;
  }
  // ... rest of auth logic
}, [user, authLoading, hydrated]);
```

### File: `app/page.tsx`

A banner is displayed to anonymous users:

```
Playing as guest: Your progress resets each session. [Sign in to save your progress]
```

This banner:
- Appears only for non-signed-in users
- Explains that progress is temporary
- Provides a quick link to sign in
- Disappears once the user signs in

### File: `components/AuthButton.tsx`

Added `data-auth-button` attribute to the sign-in button so the banner can trigger it.

## User Experience Flow

### Anonymous User - Day 1

1. User plays without signing in
2. Reaches Level 2, sees 20 questions
3. `seenQuestions` = [Q1, Q2, ..., Q20]
4. Closes browser

### Anonymous User - Day 2

1. User returns to the app
2. System detects: `!user && level > 1` → Anonymous user
3. Progress reset: Level 1, XP 0, Lives 5
4. Question history preserved: Still knows about Q1-Q20
5. Next game session picks from unseen questions
6. Banner shown: "Playing as guest: Your progress resets each session. Sign in to save your progress"

### Anonymous User Signs In

1. User clicks "Sign in to save your progress"
2. Completes Google sign-in
3. System merges:
   - Cloud progress (if any from previous sign-in)
   - Local progress (Level 2, 20 questions seen)
4. All data now persists to Firestore
5. Future sessions restore full progress

## Benefits

✅ **Fair Gameplay**: Anonymous users start fresh each day (no unfair advantage from previous sessions)  
✅ **No Repetition**: Question history is maintained across sessions  
✅ **Clear Communication**: Banner explains the reset behavior  
✅ **Incentive to Sign In**: Users see the value of signing in to save progress  
✅ **Seamless Upgrade**: Existing progress is merged when user signs in  

## Technical Notes

### localStorage Structure

For anonymous users, localStorage contains:
```json
{
  "kanun.v1": {
    "xp": 0,
    "level": 1,
    "lives": 5,
    "streak": 0,
    "badges": [],
    "seenQuestions": ["q1", "q2", "q3", ...],
    "tier": "free",
    "premium": false
  }
}
```

### Firestore Structure

Signed-in users have this in `users/{uid}`:
```json
{
  "xp": 150,
  "level": 3,
  "lives": 4,
  "streak": 2,
  "badges": ["first", "rising"],
  "seenQuestions": ["q1", "q2", "q3", ...],
  "tier": "pro",
  "premium": true,
  "purchasedAt": "2026-05-09T10:30:00Z"
}
```

## Testing Checklist

- [ ] Anonymous user plays → reaches Level 2
- [ ] Close browser completely
- [ ] Return to app → Level resets to 1
- [ ] Play again → No repeated questions from previous session
- [ ] Anonymous user sees banner: "Playing as guest..."
- [ ] Click "Sign in" button in banner → Auth dialog opens
- [ ] Sign in → Progress is saved, banner disappears
- [ ] Return next day signed in → Full progress restored
- [ ] Return next day anonymous → Level 1, questions preserved

## Edge Cases Handled

1. **User clears browser cache**: localStorage is empty, treated as new user (Level 1, no history)
2. **User signs in from anonymous**: Local progress merged with cloud
3. **User signs out after signing in**: Returns to anonymous mode, progress resets next session
4. **Multiple browsers**: Each browser has independent localStorage, so each has independent question history
5. **Private/Incognito mode**: Works normally, but localStorage is cleared when window closes
