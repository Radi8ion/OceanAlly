# OceanAlly – Frontend  

This is the **frontend** of the OceanAlly project (SIH).  
It is built with **React, Vite, Tailwind CSS, and Shadcn UI**.  

---

## 🚀 Features
- Modern UI with clean design  
- Responsive (works on desktop and mobile)  
- Built using **React + Vite** for fast development  
- Styled with **Tailwind CSS** and **Shadcn UI** components  

---

## 📂 Project Structure
WEB/frontend/
├── public/ # Static assets
├── src/ # React components, pages, styles
├── package.json # Dependencies & scripts
├── vite.config.js # Vite configuration
└── README.md # Project documentation


---

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
cd WEB/frontend
npm install
```

## Run Development Server
npm run dev
Now open http://localhost:5173
 in your browser.

 ## Build for Production
 npm run build

⚠️ Notes

node_modules is not pushed to GitHub (use npm install to generate it).
If an .env file is required (API keys, backend URLs), create it in WEB/frontend/:
```VITE_API_URL=http://localhost:5000 ```
Works best with Node.js v18+.
