# Event Page (Public)

**Route:** `/event/[id]`

## Header (EventHeader)
- [Event title] (dynamic)
- [Date range] (dynamic)
- [Location] (dynamic, if present)
- [Description] (dynamic, if present)

## Coverage Meter
- Volunteer Coverage
- [X]% (dynamic)
- [filled] of [total] roles filled · [remaining] still needed

## Slot List - Still Needed
- Still Needed
- **Empty state:** All roles are filled. Thank you!
- **Per slot:** [role_name], [time or All day], [X] spot(s) remaining, Sign up
- **Instructions** (if present): [slot.instructions]

## Slot List - Filled Roles
- Filled Roles
- **Per slot:** [role_name], [time], [names]

## Footer
- Organized with SignupSmartly
