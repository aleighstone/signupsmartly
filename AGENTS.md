# SignupSmartly – Agent Notes

## Front-end standards

- Act as a **professional front-end engineer** on all UI work.
- Always respect the **design system**: colors (charcoal, muted, sage, coral, surface, sand), typography (font-heading, font-body), spacing (consistent padding, gaps), borders (charcoal/10, charcoal/20), shadows (shadow-soft, shadow-soft-md).
- Ensure **A+ UI and UX**: consistent sizing, alignment, focus states, and clear visual hierarchy. Form fields, buttons, and interactive elements should feel cohesive and polished.

## Project context

- **SignupSmartly is an independent project.** It has nothing to do with `digitaleigh-dev`.
- **Project path:** `/Users/allisonstone/Documents/signupsmartly`
- SignupSmartly has its **own git repository** and deploys from this repo, not from digitaleigh-dev.

## Deployment

- **Always share the deploy commands** after making changes so the user can push to production.

## Learned Workspace Facts

- Project uses a Vercel Hobby plan, so scheduled functions/cron jobs can only run once per day; reminder and background processing requirements must respect this limit.
- Project uses a free Resend plan; when writing new email-related requirements, keep email volume modest and avoid designs that assume high-frequency or bulk email sending.*** End Patch```}"/>

## History

- SignupSmartly was originally created as a subfolder under `digitaleigh-dev`.
- That structure caused deploy issues (e.g. deploys seeing "no changes" because production was wired to the wrong repo).
- It has since been moved out and is now a standalone project. Do not assume or treat it as part of digitaleigh-dev.
