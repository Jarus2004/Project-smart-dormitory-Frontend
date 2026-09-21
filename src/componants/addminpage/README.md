# Admin Dashboard Module

This folder contains the Dormitory Management System admin dashboard UI built with React, TypeScript, Vite, React Router, CSS Modules, Recharts, and TanStack Table.

## Purpose

The admin dashboard provides a modern management interface for:

- Dashboard analytics and financial summaries
- Room occupancy management
- Maintenance request tracking
- Student management and search
- Admin panel settings and activity logs
- Dormitory agreement overview

## Folder Structure

```text
addminpage/
├── components/       # Reusable UI components such as cards, tables, badges, modal, and filters
├── context/          # Global dashboard state using Context API
├── layouts/          # Main dashboard shell and sidebar layout
├── pages/            # Feature pages for Dashboard, Rooms, Maintenance, Students, Admin Panel, and Agreements
├── router/           # Route configuration for the dashboard
├── styles/           # Global theme and layout styles
└── types/            # TypeScript interfaces for rooms, students, maintenance, users, and activities
```

## Main Features

- Responsive layout for desktop, tablet, and mobile
- Sidebar navigation with mobile drawer support
- Backend data-driven UI with loading and empty states
- Recharts-based income and expense visualization
- TanStack Table-based data tables with pagination and filtering
- Reusable components for badges, modals, search bars, and filters

## Data Flow

- Global state is provided by `context/DashboardContext.tsx`
- Pages consume the shared context and render UI components from `components/`

## Development Notes

- Use TypeScript for all new components and data models
- Keep UI logic separated from page-level business logic
- Follow the existing modular structure when adding new screens or widgets
- Use CSS Modules for styling to keep component styles scoped
