# Theme and Workbench Enhancement Suggestions

## Goal
Improve the current editor-style interface to feel more complete, interactive, and production-ready while preserving the existing light/dark theme architecture.

## Suggested Enhancements

### 1. Real Draggable Splitters
- Convert visual split handles into functional drag-resize for:
  - Explorer and editor
  - Editor and right auxiliary pane
  - Editor and bottom panel
- Persist split sizes in local storage.

### 2. Workbench State Persistence
- Remember and restore:
  - Open tabs
  - Active route
  - Auxiliary pane collapsed state
  - Active bottom panel tab
  - Theme selection

### 3. Command Palette
- Add a `Ctrl/Cmd+Shift+P` command palette with fuzzy search for:
  - Route navigation
  - Theme toggle
  - Auxiliary pane toggle
  - Layout tuner open/close
  - Common quick actions

### 4. Keyboard Shortcut Layer
- Add common IDE shortcuts:
  - `Ctrl/Cmd+B`: toggle explorer
  - `Ctrl/Cmd+J`: toggle bottom panel
  - `Ctrl/Cmd+Alt+B`: toggle right auxiliary pane
  - `Ctrl/Cmd+1..9`: switch tabs

### 5. Tab System Upgrades
- Add:
  - Dirty state indicators
  - Close buttons
  - Pinned tabs
  - Tab overflow menu
  - MRU tab switching (`Ctrl+Tab` behavior)

### 6. Explorer Improvements
- Add:
  - Collapsible folders
  - Context menu (new, rename, delete)
  - Active file/route syncing
  - Inline filter/search

### 7. Integrated Terminal Improvements
- Multi-tab terminal panel with:
  - Command history
  - Clear/copy actions
  - Theme-aware ANSI colors
- Optionally trigger app tasks (typecheck, lint, test) from terminal actions.

### 8. Right Auxiliary (Copilot-like) Enhancements
- Add:
  - Streaming responses
  - Markdown rendering
  - Code block actions (copy/insert)
  - Conversation history
  - Prompt templates

### 9. Accessibility Hardening
- Improve:
  - ARIA semantics for split views and panel regions
  - Keyboard-only resizing/navigation
  - Focus trapping for command palette and chat composer

### 10. Motion and Interaction Polish
- Add:
  - Pane open/close motion refinement
  - Tab transition cues
  - Hover-intent delays where appropriate
  - Loading skeletons for async panel content

### 11. Theme System Maturity
- Extend theme support with:
  - High-contrast theme
  - Expanded semantic tokens (focus/warning/success/neutral surfaces)
  - User preference + system preference synchronization

### 12. Performance and Architecture
- Optimize by:
  - Memoizing heavy panes
  - Lazy-loading terminal and auxiliary components
  - Reducing unnecessary full-shell rerenders on route changes

## Recommended Implementation Order
1. Real draggable splitters and persistence
2. Command palette and keyboard shortcuts
3. Explorer interactions and tab management
4. Right auxiliary pane conversation enhancements
5. Accessibility hardening
6. Performance optimization pass

## Optional Immediate Next Step
Implement draggable splitters end-to-end with persisted widths/heights and keyboard-accessible handle controls.
