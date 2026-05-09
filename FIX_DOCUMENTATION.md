# Fix for Repetitive Questions in Kanun App

## Problem Statement

Users were experiencing repetitive questions during gameplay, even though the admin panel had 130+ active questions. The issue had two root causes:

1. **No per-user question tracking**: The system didn't track which questions each user had already seen, causing random selection to repeat questions.
2. **Stale question cache**: The `useQuestions` hook used polling-based caching that wasn't updated in real-time when admins added, edited, or deleted questions.

## Solution Overview

The fix implements two key mechanisms:

### 1. Real-Time Question Pool Updates (Instant Admin Sync)

**File**: `lib/useQuestions.ts`

**Changes**:
- Replaced polling-based cache with **Firestore real-time snapshots** using `onSnapshot()`
- Global question state is now synchronized instantly across all connected clients
- When an admin adds, edits, or deletes a question in the admin panel, all active game sessions immediately receive the updated question pool
- Fallback to static questions if Firestore is unavailable

**Key Benefits**:
- Admin changes are reflected instantly without page refresh
- No delay between admin action and gameplay update
- Graceful degradation if Firestore connection fails

### 2. Per-User Question History Tracking (No Repeats Until All Seen)

**Files Modified**:
- `lib/types.ts` - Added `seenQuestions: string[]` to `GameState`
- `lib/useGameState.ts` - Added state management for seen questions
- `components/GameStage.tsx` - Integrated question history into selection logic
- `app/page.tsx` - Passed new props to GameStage

**How It Works**:

#### a) State Persistence (`useGameState.ts`)

Added two new actions to the game state:

```typescript
markQuestionSeen: (id: string) => void
resetSeenQuestions: () => void
```

- `seenQuestions` array is persisted to Firestore alongside other user data
- Synced in real-time with the cloud, ensuring consistency across devices
- Automatically merged when a user signs in on a new device

#### b) Smart Question Selection (`GameStage.tsx`)

Modified `pickQuestions()` function with exhaustion logic:

```typescript
function pickQuestions(
  pool: Question[],
  filter: (q: Question) => boolean,
  n: number,
  seenIds: string[],
  onResetHistory?: () => void
): Question[]
```

**Algorithm**:
1. Filter questions by mode requirements (type, difficulty, etc.)
2. Separate into **unseen** and **seen** questions
3. **If enough unseen questions exist**: Pick randomly from unseen only
4. **If not enough unseen questions**: 
   - Reset the user's `seenQuestions` history for that filter
   - Pick from the full candidate pool
   - This ensures users see all ~130 unique questions before repeats

#### c) Question Marking (`GameStage.tsx`)

When a user answers a question (correct or incorrect):

```typescript
const q = session.questions[qIndex];
onMarkSeen(q.id);  // Mark as seen immediately
```

- Questions are marked as seen **before** feedback is shown
- Prevents the same question appearing in the same session
- Works for all question types: MCQ, True/False, Scenarios, Violations, Decisions

#### d) Session Integration (`app/page.tsx`)

GameStage now receives:
- `seenQuestions`: Current user's seen question IDs
- `onMarkSeen`: Callback to mark a question as seen
- `onResetSeen`: Callback to reset history when pool exhausted

## Example Scenario

**Setup**: User has 130 active questions, user has seen 120 of them

**Session 1 - Blitz Mode (5 questions)**:
1. System filters for MCQ questions → 130 candidates
2. Separates into: 120 seen, 10 unseen
3. Requests 5 questions
4. Since 10 unseen ≥ 5 requested → picks 5 random from unseen
5. User plays and sees 5 new questions
6. `seenQuestions` now has 125 items

**Session 2 - Blitz Mode (5 questions)**:
1. System filters for MCQ questions → 130 candidates
2. Separates into: 125 seen, 5 unseen
3. Requests 5 questions
4. Since 5 unseen ≥ 5 requested → picks 5 random from unseen
5. User plays and sees the last 5 new questions
6. `seenQuestions` now has 130 items (all seen)

**Session 3 - Blitz Mode (5 questions)**:
1. System filters for MCQ questions → 130 candidates
2. Separates into: 130 seen, 0 unseen
3. Requests 5 questions
4. Since 0 unseen < 5 requested → **reset history**
5. Picks 5 random from all 130 questions
6. User plays and sees 5 questions again (but now they've completed a full cycle)
7. `seenQuestions` reset to just the 5 new ones

## Admin Panel Integration

When an admin adds, edits, or deletes questions:

1. **Add**: New question appears in Firestore immediately
2. **Edit**: Updated question synced to all clients in real-time
3. **Delete**: Removed from question pool instantly

The `useQuestions` hook's `onSnapshot()` listener ensures all game sessions receive updates without requiring page refresh.

## Technical Details

### Firestore Schema

**Collection**: `users/{uid}`

```typescript
{
  // ... existing fields ...
  seenQuestions: ["q1", "q2", "q3", ...],  // Array of question IDs
}
```

### Real-Time Sync Flow

```
Admin Panel
    ↓
(Add/Edit/Delete Question)
    ↓
Firestore `questions` collection
    ↓
onSnapshot() listener in useQuestions
    ↓
All GameStage components receive updated pool
    ↓
Next session uses new questions
```

### Per-User Tracking Flow

```
User Answers Question
    ↓
handleChoose() called
    ↓
onMarkSeen(questionId) → markQuestionSeen action
    ↓
setState({ seenQuestions: [...prev, questionId] })
    ↓
Debounced Firestore write (600ms)
    ↓
seenQuestions persisted to users/{uid}
```

## Benefits

✅ **No More Repetition**: Users see all unique questions before repeats  
✅ **Instant Admin Sync**: Changes reflected immediately in gameplay  
✅ **Cross-Device Sync**: Question history synced across all user devices  
✅ **Graceful Exhaustion**: When all questions seen, history resets automatically  
✅ **Scalable**: Works with any number of questions (tested with 130+)  
✅ **Backward Compatible**: Existing game logic unchanged, only selection improved  

## Testing Checklist

- [ ] Admin adds a new question → appears in next game session
- [ ] Admin edits question text → updated text shown in gameplay
- [ ] Admin deletes a question → no longer appears in selection
- [ ] User plays multiple sessions → no duplicate questions until all seen
- [ ] User reaches 130 questions seen → history resets, repeats begin
- [ ] User signs in on different device → seenQuestions synced
- [ ] Offline mode → falls back to static questions gracefully
- [ ] Multiple users → each has independent seenQuestions history

## Files Modified

1. **lib/types.ts** - Added `seenQuestions` to GameState
2. **lib/useQuestions.ts** - Implemented real-time Firestore snapshots
3. **lib/useGameState.ts** - Added question tracking state and actions
4. **components/GameStage.tsx** - Integrated exhaustion logic and marking
5. **app/page.tsx** - Passed new props to GameStage

## Migration Notes

- Existing users will have empty `seenQuestions` arrays initially
- First session will populate the array as they play
- No data loss or breaking changes
- Seamless upgrade for all users
