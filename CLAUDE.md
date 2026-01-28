# DB Monitor - AI Context Guide

## Project Overview
A **Next.js 14** production server monitoring dashboard for **DigitalOcean Droplet** with real-time system metrics and PostgreSQL database monitoring.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Auth**: JWT + HTTP-only Cookies
- **Database**: PostgreSQL (`pg` library)
- **Remote Metrics**: SSH-based commands to DigitalOcean server
- **Styling**: Tailwind CSS + Custom CSS

## Key Architecture Decisions

### Remote Metrics via SSH
- Uses `child_process.exec` with SSH to fetch real CPU/Memory/Disk from remote DO server
- SSH Key: `~/.ssh/crisp_do_key`
- Host: `root@206.189.36.199`

### Authentication Flow
1. Login POST `/api/auth/login` → validates against env credentials
2. JWT token stored in `auth-token` cookie (httpOnly)
3. Protected routes check via `isAuthenticated()` from `lib/auth.ts`
4. Dashboard layout validates auth on mount, redirects to `/login` if invalid

### Time Range Feature
- 5 presets: 5m, 10m, 30m, 1h, 24h
- Each has different polling intervals and data point limits
- History stored in state, not persisted

## File Structure
```
src/
├── app/
│   ├── api/
│   │   ├── auth/           # Login, logout, check endpoints
│   │   ├── metrics/        # SSH-based server metrics
│   │   ├── tables/         # Database table listing
│   │   └── query/          # SQL query runner (SELECT only)
│   ├── dashboard/
│   │   ├── layout.tsx      # Sidebar with collapsible DB submenu
│   │   ├── page.tsx        # Main dashboard with charts
│   │   ├── tables/[name]/  # Table data viewer
│   │   └── query/          # SQL query interface
│   └── login/page.tsx      # Login form
└── lib/
    ├── auth.ts             # JWT utils, session management
    └── db.ts               # PostgreSQL queries
```

## Environment Variables (Required)
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_SECRET=your-secret
ADMIN_USERNAME=username
ADMIN_PASSWORD=password
```

## Critical Code Patterns

### API Route Protection
```typescript
if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### SSH Command Execution
```typescript
const command = `ssh -i ~/.ssh/crisp_do_key -o StrictHostKeyChecking=no root@206.189.36.199 "..."`;
const { stdout } = await execAsync(command, { timeout: 15000 });
```

### Chart Rendering
- Uses HTML Canvas API (not Chart.js/Recharts)
- Device pixel ratio scaling for sharp text
- Gradient fills for visual appeal

## Security Notes
- SQL queries restricted to SELECT only (checked in API)
- JWT secret from environment, not hardcoded
- SSH key must exist on deployment server
- No exposed database credentials in client code

## Deployment Requirements
1. Node.js 18+
2. SSH key (`crisp_do_key`) accessible
3. Network access to DO server (206.189.36.199)
4. PostgreSQL connection allowed from deployment host
