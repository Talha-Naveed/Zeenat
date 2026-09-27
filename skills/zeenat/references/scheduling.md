# Date windows and finite duration

Source: `src/core/schedule.ts` and `src/core/engine.ts` in 0.3.2.

`activeFrom` is inclusive and `activeUntil` exclusive. Either may be omitted.
When both are provided, `activeFrom` must be earlier. Use valid `Date` objects
or ISO date-time strings ending in `Z` or an explicit offset such as `+05:00`.
Plain dates and zone-less strings are rejected. Prefer zoned strings across
Next.js server/client boundaries.

For August 12 through the end of August 15 in Pakistan, use:

```tsx
<Zeenat
  preset="pakistan-independence-day"
  intensity="low"
  activeFrom="2027-08-12T00:00:00+05:00"
  activeUntil="2027-08-16T00:00:00+05:00"
/>
```

2027 is an example year, not an annual rule. Choose the user's intended year and
time zone. If a request leaves these material details ambiguous, clarify or state
the assumption. Fixed offsets do not encode daylight-saving rules; compute each
endpoint using the intended zone in the host app when DST matters.

The schedule uses the visitor's clock and browser timers. Before the start it is
stopped and waiting; at/after the end effects are removed. Opening the page during
the window starts immediately. Long waits are chunked for browser timer limits.
There is no recurrence engine, timezone-name prop, holiday lookup, server cron,
or background execution while the page is closed. Do not use decorative scheduling
for access control or authoritative business deadlines.

`duration={8_000}` is a positive finite millisecond duration from an effect start,
not a calendar end date and not seconds. Its wall-clock deadline keeps advancing
during manual or visibility pauses. A restart, intensity change, reduced-motion
change, or mobile-breakpoint rebuild can start a fresh duration. Remounting React
with changed scene props creates a fresh engine too. `activeUntil` remains the
calendar cutoff. Use the date window alone for an occasion that should remain
visible throughout the window; use duration for a short presentation.

`restart()` cannot bypass a date window, revive a destroyed controller, or enable
a scene initialized with `enabled: false`. A completed duration can be restarted
while the window is still open. For a new vanilla schedule/options, destroy the
old controller and create a new one; React can update its props.

Validate just before start, at start, just before end, and at end with the host's
clock-control testing tools. Also check a reload inside/after the window. Keep
this separate from a real-browser motion/interaction check.
