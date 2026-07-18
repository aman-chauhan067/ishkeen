# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.0.0-rc1] - 2026-07-18

### Added
- **Machine Learning**: Integrated deterministic evidence graph for clinical recommendations.
- **Frontend**: Premium editorial design system with bespoke typography and glassmorphism UI.
- **Authentication**: Google OAuth 2.0 and HttpOnly session cookies.
- **Admin Portal**: Fully functional back-office telemetry, logging, and dataset export (V2) endpoints.
- **Background System**: Subtle, sketchy SVG doodles dynamically placed across the UI using Framer Motion.
- **History Logs**: Full user chronological history for past clinical analyses.
- **Responsive Layout**: Fluid breakpoints covering mobile, tablet, and widescreen.

### Changed
- **Typography & UI**: Upgraded global visual rhythm and alignment across all button instances.
- **System Logging**: Re-enabled middleware to capture and persist backend request telemetry.

### Fixed
- Fixed z-index layering conflicts across layout wrappers.
- Fixed infinite loading spinner during the dataset export workflow.
- Repositioned the "Sign Out" button to a permanent location within the User Settings view to resolve disappearing UI behaviors.
- Eliminated all TypeScript compilation errors and dead code blocks.
- Stripped arbitrary development secrets and temporary scratch files.
