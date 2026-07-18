# 02 Dashboard — Build Checklist
claude --resume 3330deb4-4f1b-4d45-aa44-c5c06cdd1bd0 --dangerously-skip-permissions
Reference branch: `code-with-antonio/resonance` → `02-dashboard`

---

## 1. Install missing dependency

- [ ] `npm install simplex-noise` — required by `WavyBackground`

---

## 2. New files to create

### 2a. `src/features/text-to-speech/data/constants.ts`
```ts
export const TEXT_MAX_LENGTH = 5000;
```

---

### 2b. `src/features/dashboard/data/quick-actions.ts`

Define a `QuickAction` interface and export a `quickActions` array with 6 items:

| title | gradient | description |
|---|---|---|
| Narrate a Story | `from-cyan-400 to-cyan-50` | Bring characters to life with expressive AI narration |
| Record an Ad | `from-pink-400 to-pink-100` | Create professional advertisements with lifelike AI voices |
| Direct a Movie Scene | `from-violet-500 to-violet-100` | Generate dramatic dialogue for film and video |
| Voice a Game Character | `from-orange-400 to-orange-100` | Build immersive worlds with dynamic character voices |
| Introduce Your Podcast | `from-blue-500 to-blue-100` | Hook your listeners from the very first second |
| Guide a Meditation | `from-lime-400 to-lime-100` | Craft soothing, calming audio for wellness content |

Each item also has an `href` pointing to `/text-to-speech?text=<sample text>` (see reference for exact strings).

```ts
export interface QuickAction {
  title: string;
  description: string;
  gradient: string;
  href: string;
}

export const quickActions: QuickAction[] = [ /* ... */ ];
```

---

### 2c. `src/components/ui/wavy-background.tsx`

Animated canvas wave background component. Depends on `simplex-noise`.
Copy directly from reference — it's a canvas animation, not worth reinventing:
`gh api "repos/code-with-antonio/resonance/contents/src/components/ui/wavy-background.tsx?ref=02-dashboard" --jq '.content' | base64 -d`

Props: `colors`, `backgroundFill`, `blur`, `speed`, `waveOpacity`, `waveYOffset`, `containerClassName`, `className`, `children`.

---

### 2d. `src/components/page-header.tsx`

Reusable header bar used on every page (e.g. `/voices`, `/text-to-speech`).
- Left: `<SidebarTrigger />` + `<h1>` with page title
- Right: "Feedback" + "Need help?" buttons (both `mailto:` links, icon only on mobile)
- Accepts `title: string` and optional `className`

```tsx
export function PageHeader({ title, className }: { title: string; className?: string }) { ... }
```

---

### 2e. `src/features/dashboard/components/dashboard-header.tsx`

Top of the dashboard page. Client component.
- Left: greeting "Nice to see you" + `<h1>` with user's name via Clerk `useUser()`
  - Show `"..."` while loading, fall back to `user?.fullName ?? user?.firstName ?? "there"`
- Right (desktop only, `hidden lg:flex`): same Feedback + Need help buttons as `PageHeader`

---

### 2f. `src/features/dashboard/components/hero-pattern.tsx`

Decorative background for the dashboard page. Desktop only (`hidden lg:block`).

```tsx
import { WavyBackground } from "@/components/ui/wavy-background";

export function HeroPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
      <WavyBackground
        colors={["#2DD4BF", "#22D3EE", "#38BDF8", "#818CF8"]}
        backgroundFill="hsl(0 0% 100%)"
        blur={3}
        speed="slow"
        waveOpacity={0.1}
        waveWidth={60}
        waveYOffset={250}
        containerClassName="h-full"
        className="hidden"
      />
    </div>
  );
}
```

---

### 2g. `src/features/dashboard/components/quick-action-card.tsx`

Card layout: left side = coloured gradient rectangle (decorative, `h-31 w-41`), right side = title + description + "Try now →" button.

- Outer: `rounded-xl border bg-card p-3 flex gap-4`
- Gradient box: `relative h-31 w-41 rounded-xl bg-linear-to-br <gradient>` with a white circle and inset ring overlay
- Button: `variant="outline" size="xs"` linking to `href`

---

### 2h. `src/features/dashboard/components/quick-actions-panel.tsx`

Grid of `QuickActionCard`s:

```tsx
import { quickActions } from "@/features/dashboard/data/quick-actions";

export function QuickActionsPanel() {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Quick actions</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickActions.map((action) => (
          <QuickActionCard key={action.title} {...action} />
        ))}
      </div>
    </div>
  );
}
```

---

### 2i. `src/features/dashboard/components/text-input-panel.tsx`

The main input widget on the dashboard. Client component.

**Visual structure** (outermost → innermost):
1. Gradient border wrapper: `bg-linear-185 from-[#ff8ee3] from-15% via-[#57d7e0] via-39% to-[#dbf1f2] to-85% p-0.5 shadow-[0_0_0_4px_white] rounded-[22px]`
2. Middle layer: `rounded-[20px] bg-[#F9F9F9] p-1`
3. Inner card: `rounded-2xl bg-white p-4 drop-shadow-xs`
   - `<Textarea>` borderless, min-h-35, placeholder "Start typing or paste your text here...", `maxLength={TEXT_MAX_LENGTH}`
   - Bottom row:
     - Left: `<Badge variant="outline" className="gap-1.5 border-dashed">` with a Coins icon
       - If no text: "Start typing to estimate"
       - If text: `$${(text.length * 0.0003).toFixed(4)} estimated`
     - Right: `{text.length.toLocaleString()} / {TEXT_MAX_LENGTH.toLocaleString()} characters`
4. Action bar: `flex justify-end p-3`
   - "Generate speech" button, `size="sm"`, disabled when no text
   - On click: `router.push('/text-to-speech?text=' + encodeURIComponent(text.trim()))`

---

### 2j. `src/features/dashboard/views/dashboard-view.tsx`

Assembles the full dashboard page:

```tsx
export function DashboardView() {
  return (
    <div className="relative">
      <PageHeader title="Dashboard" className="lg:hidden" />
      <HeroPattern />
      <div className="relative space-y-8 p-4 lg:p-16">
        <DashboardHeader />
        <TextInputPanel />
        <QuickActionsPanel />
      </div>
    </div>
  );
}
```

---

## 3. Modify existing files

### 3a. `src/app/(dashboard)/page.tsx`

Replace entire file with:

```tsx
import { DashboardView } from "@/features/dashboard/views/dashboard-view";

export default function DashboardPage() {
  return <DashboardView />;
}
```

---

### 3b. `src/app/(dashboard)/layout.tsx`

Two small fixes:
- Remove the outer `<div>` wrapping `<SidebarProvider>` (reference has `SidebarProvider` as the root element)
- Add `className="flex min-h-0 flex-1 flex-col"` to `<main>`
- Cookie read: keep `sidebar_state` with `=== "true"` (not `!== "false"`) — matches reference

```tsx
return (
  <SidebarProvider defaultOpen={defaultOpen} className="h-svh">
    <DashboardSidebar />
    <SidebarInset className="min-h-0 min-w-0">
      <main className="flex min-h-0 flex-1 flex-col">
        {children}
      </main>
    </SidebarInset>
  </SidebarProvider>
);
```

---

### 3c. `src/features/dashboard/components/dashboard-sidebar.tsx`

This is the biggest diff. Current version is missing several things:

#### Header — add `OrganizationSwitcher` below logo row
After the logo/trigger div, add a `<SidebarMenu>` with one `<SidebarMenuItem>` containing `<OrganizationSwitcher>`:
- `hidePersonal`
- `fallback`: a `<Skeleton>` (`h-8.5 w-full`, collapses to `size-8` in icon mode)
- Custom `appearance` overrides to style the trigger as a white bordered pill that shrinks in icon mode

#### Dividers — add between header / content / footer
```tsx
<div className="border-b border-dashed border-border" />
```
— one after `</SidebarHeader>`, one after `</SidebarContent>`

#### `SidebarMenuButton` — add active state styling
Add to the `className` prop on every `SidebarMenuButton`:
```
h-9 px-3 py-2 text-[13px] tracking-tight font-medium border border-transparent
data-[active=true]:border-border
data-[active=true]:shadow-[0px_1px_1px_0px_rgba(44,54,53,0.03),inset_0px_0px_0px_2px_white]
```

#### Menu items — update
- Rename `"Home"` → `"Dashboard"`
- Remove `"Sign out"` item (handled by `UserButton` in footer)
- Remove `"Help & Support"` → rename to `"Help and support"`, keep `mailto:` href
- `Headphones` icon used twice — reference uses `Volume2` for "Voice cloning" (check your import)

#### Footer — add `SidebarFooter` with `UserButton`
```tsx
<SidebarFooter className="gap-3 py-3">
  <SidebarMenu>
    <SidebarMenuItem>
      <UserButton
        showName
        fallback={<Skeleton className="h-8.5 w-full ..." />}
        appearance={{ elements: { /* custom styling */ } }}
      />
    </SidebarMenuItem>
  </SidebarMenu>
</SidebarFooter>
```
The `UserButton` needs the same collapsible-icon responsive treatment as `OrganizationSwitcher`.
See reference file for the full `appearance` override strings.

#### Clean up unused imports
Remove: `FileAudio`, `PanelLeft` (if still present), `SidebarFooter` (only if you didn't add it), `Skeleton` (only if you didn't add it).
Add: `SidebarFooter`, `UserButton`, `OrganizationSwitcher`, `Skeleton` (if not already imported).

---

## Build order (suggested)

1. `constants.ts` + `quick-actions.ts` — pure data, no deps
2. `wavy-background.tsx` — install simplex-noise first
3. `page-header.tsx` — standalone UI component
4. `hero-pattern.tsx` — depends on `wavy-background`
5. `dashboard-header.tsx` — depends on Clerk
6. `quick-action-card.tsx` + `quick-actions-panel.tsx` — depends on `quick-actions.ts`
7. `text-input-panel.tsx` — depends on `constants.ts`
8. `dashboard-view.tsx` — assembles everything
9. Update `page.tsx` — swap in `DashboardView`
10. Update `layout.tsx` — minor structural fixes
11. Update `dashboard-sidebar.tsx` — biggest change, do last when the rest works
