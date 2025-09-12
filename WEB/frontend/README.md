🌊 OceanAlly – Frontend

This is the frontend of the OceanAlly project, built with React, Vite, TypeScript, Tailwind CSS, and shadcn-ui.
It provides a modern, responsive, and interactive interface for citizens, analysts, and admins.

🚀 Getting Started
## Clone the repository
git clone https://github.com/Radi8ion/OceanAlly.git
cd OceanAlly/WEB/frontend


## Install dependencies

Make sure you have Node.js (>=18) and npm installed.
Then run:
npm install

## Run the development server
npm run dev

## Build for production
npm run build
This will create an optimized production build inside the dist/ folder.

## Preview the production build
npm run preview

🛠️ Tech Stack

React (UI library)
Vite (bundler & dev server)
TypeScript (type safety)
Tailwind CSS (utility-first styling)
shadcn-ui (accessible UI components)
React-i18next (multilingual support)

📂 Project Structure
frontend/
 ├── public/            # Static assets
 ├── src/               # React components, pages, hooks
 │   ├── components/    # Reusable UI components
 │   ├── pages/         # Route-based pages
 │   ├── i18n/          # Translations & multilingual setup
 │   └── utils/         # Helpers
 ├── package.json
 ├── vite.config.ts
 └── tailwind.config.ts

🌍 Features Implemented

Landing page with INCOIS branding
Real-time hazard dashboard with interactive maps & heatmaps
Awareness Hub with multilingual resources
Citizen report submission portal (photo/video upload)
Role-based dashboards (citizens, analysts, officials)
AI-powered situational analysis console

👨‍💻 Development Notes

Do not commit node_modules – dependencies are installed via npm install.
Use feature branches (e.g., frontend-ui) and open a Pull Request for merging.

Follow the commit style:

feat: added citizen report form
fix: resolved map rendering issue
docs: updated README with setup steps
