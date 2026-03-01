# Planning Guide

A web application that ranks YouTube playlist videos through pairwise comparison, where users repeatedly choose between two videos until a complete ranking emerges using a tournament-style algorithm.

**Experience Qualities**: 
1. **Decisive** - Clear, binary choices that feel satisfying to make with no ambiguity
2. **Progressive** - Visual feedback showing advancement toward completion with each comparison
3. **Revealing** - Surprising final rankings that uncover hidden preferences through the comparison process

**Complexity Level**: Light Application (multiple features with basic state)
This is a focused tool with a clear multi-step workflow: URL input → video loading → comparison rounds → final ranking display. It manages moderate state (playlist data, comparison history, rankings) but doesn't require complex navigation or advanced features.

## Essential Features

### Playlist URL Input
- **Functionality**: Accepts YouTube playlist URLs, extracts video data, and optionally limits the number of videos with shuffle
- **Purpose**: Entry point to start the ranking process with user control over scope
- **Trigger**: User pastes URL into input field, optionally sets video limit, and clicks submit
- **Progression**: Empty state → URL input → optional limit input → validation → video loading → shuffle if limited → comparison view
- **Success criteria**: Successfully parses playlist ID, fetches all videos from playlist, shuffles and limits videos if specified, displays error for invalid URLs or limits

### Pairwise Video Comparison
- **Functionality**: Presents two videos side-by-side for user to choose their preference
- **Purpose**: Core ranking mechanism using comparative judgment
- **Trigger**: After playlist loads, automatically presents first pair
- **Progression**: Display pair → user selects A or B → record choice → calculate next optimal pair → repeat until ranking complete
- **Success criteria**: Smooth transitions between pairs, progress indicator updates, no duplicate unnecessary comparisons

### Progress Tracking
- **Functionality**: Shows comparison count and estimated remaining comparisons
- **Purpose**: Manages user expectations and maintains engagement
- **Trigger**: Updates after each comparison
- **Progression**: Display fraction completed → update percentage bar → show "almost done" states
- **Success criteria**: Accurate count of comparisons, clear visual progress indicator

### Final Ranking Display
- **Functionality**: Shows ordered list of all videos from best to worst
- **Purpose**: Reveals the user's true preferences discovered through comparisons
- **Trigger**: Automatically displays when all necessary comparisons complete
- **Progression**: Final comparison → calculate Elo/ranking scores → animate ranking reveal → allow sharing/reset
- **Success criteria**: Clear ranking order, video thumbnails and titles visible, option to start over

## Edge Case Handling

- **Invalid URL**: Show friendly error message prompting user to check the URL format
- **Private/Deleted Playlist**: Display error explaining the playlist is inaccessible
- **Single Video Playlist**: Skip comparison, show message that ranking requires multiple videos
- **Very Large Playlists**: Allow user to limit number of videos with random shuffle
- **Invalid Video Limit**: Show error if limit is less than 2 or not a valid number
- **Identical Rankings**: Handle ties gracefully with equal positioning
- **Interrupted Session**: Auto-save progress using KV store, allow resume on return

## Design Direction

The design should evoke a sense of competitive energy and decisive action - like a tournament bracket or sports matchup. It needs to feel focused and purposeful, stripping away distractions to highlight the core choice between two options. Visual emphasis on the versus/battle dynamic while maintaining clean readability.

## Color Selection

A bold, high-contrast scheme inspired by competition and decision-making, with electric accents that make choices feel energized.

- **Primary Color**: Deep electric purple `oklch(0.35 0.15 290)` - Commands attention and conveys the focused, decisive nature of comparisons
- **Secondary Colors**: Rich dark navy `oklch(0.20 0.05 250)` for cards and containers - provides depth and structure
- **Accent Color**: Vibrant cyan `oklch(0.75 0.15 195)` for CTAs and selected states - creates electric energy for user actions
- **Foreground/Background Pairings**: 
  - Background (Deep black `oklch(0.12 0 0)`): Light text `oklch(0.97 0 0)` - Ratio 18.2:1 ✓
  - Primary (Electric purple `oklch(0.35 0.15 290)`): White text `oklch(1 0 0)` - Ratio 7.8:1 ✓
  - Accent (Vibrant cyan `oklch(0.75 0.15 195)`): Dark text `oklch(0.12 0 0)` - Ratio 11.5:1 ✓
  - Cards (Dark navy `oklch(0.20 0.05 250)`): Light text `oklch(0.97 0 0)` - Ratio 14.2:1 ✓

## Font Selection

Typefaces should feel bold and decisive with strong geometric forms that reinforce the competitive, binary-choice nature of the experience.

- **Typographic Hierarchy**: 
  - H1 (App Title): Space Grotesk Bold / 32px / tight letter spacing (-0.02em)
  - H2 (Section Headers): Space Grotesk SemiBold / 24px / normal spacing
  - H3 (Video Titles): Space Grotesk Medium / 18px / normal spacing
  - Body (Instructions): Inter Regular / 16px / relaxed line height (1.6)
  - UI Elements (Buttons, Labels): Inter Medium / 14px / slight letter spacing (0.01em)

## Animations

Animations should emphasize the decisive moment of choice with quick, snappy transitions that feel responsive to user input, plus celebratory moments for progress milestones.

- Comparison transitions: Quick fade-out of selected pair (150ms) → slide-in new pair from sides (250ms ease-out)
- Button interactions: Scale press effect (0.95) with 100ms duration
- Progress bar: Smooth width animation (300ms) with subtle elastic easing
- Final ranking reveal: Staggered cascade animation (100ms delay per item) from top to bottom
- Hover states: Subtle lift (2px translate) with shadow enhancement (200ms)

## Component Selection

- **Components**: 
  - Input + Button for URL entry (with loading state)
  - Card components for video display with hover states and selection feedback
  - Progress bar using Progress component
  - Badge for comparison counter
  - ScrollArea for final rankings list
  - Button with variants (primary for choices, secondary for actions)
  - Alert for error messages
  - Skeleton for loading states
  
- **Customizations**: 
  - Custom video comparison cards with A/B labels and hover/selection states
  - Custom progress indicator combining Progress + Badge
  - Custom ranking list items with position numbers and thumbnail layout
  
- **States**: 
  - Buttons: Hover with lift and glow effect, active with scale-down, disabled with opacity
  - Cards: Default with subtle border, hover with elevated shadow and scale, selected with accent border pulse
  - Input: Focus with accent ring, error with destructive border, success with subtle green indicator
  
- **Icon Selection**: 
  - Play (video indicator)
  - CheckCircle (selection confirmation)
  - ArrowRight (progression)
  - Trophy (winner/final ranking)
  - ArrowCounterClockwise (reset)
  - Lightning (for quick comparison emphasis)
  - Shuffle (for video randomization indicator)
  
- **Spacing**: 
  - Container padding: px-6 py-8 (md:px-12 md:py-12)
  - Card gaps: gap-4 for mobile, gap-8 for desktop
  - Section spacing: space-y-8
  - Inner card padding: p-6
  
- **Mobile**: 
  - Stack comparison cards vertically on mobile with full-width buttons
  - Reduce title font sizes by 25% on small screens
  - Collapse progress details, show only percentage
  - Single column ranking list with smaller thumbnails
  - Fixed bottom button bar for A/B choices on mobile for easy thumb access
