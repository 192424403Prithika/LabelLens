# LabelLens — Deployment Guide: Render (Backend) & Vercel (Frontend)

This guide walks you through deploying **LabelLens** with:
- **Backend**: Hosted on [Render](https://render.com) (FastAPI + RapidOCR ONNX Deep Learning + MongoDB/Persistent Storage)
- **Frontend**: Hosted on [Vercel](https://vercel.com) (Vite + React 19 + TypeScript SPA)

---

## 📋 Prerequisites
1. A [GitHub](https://github.com) account with this repository pushed.
2. A free account on [Render](https://render.com).
3. A free account on [Vercel](https://vercel.com).
4. *(Optional)* A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI (if not using the built-in persistent storage).

---

## Part 1: Push Code to GitHub

Open PowerShell in the project directory (`c:\Users\Patan Afrin\Downloads\Prithi files\LabelLens`):

```powershell
# 1. Create a new repository on github.com (e.g. "LabelLens")
# 2. Link your local git repository to GitHub:
git remote add origin https://github.com/<your-username>/LabelLens.git
git branch -M main
git push -u origin main
```

---

## Part 2: Deploy Backend to Render

### Method A: 1-Click Render Blueprint (Recommended)
Because the repository includes `render.yaml`, Render can set up everything automatically:

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** in the top navigation bar and select **Blueprint**.
3. Connect your `LabelLens` GitHub repository.
4. Render will read `render.yaml` and configure:
   - **Service Name**: `labellens-backend`
   - **Runtime**: `Docker` (installs OCR dependencies `libgl1`, `libglib2.0`, RapidOCR ONNX)
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: Enabled on Git push
5. Click **Apply**.
6. Once deployed, note down your backend URL (e.g., `https://labellens-backend-xxxx.onrender.com`).

---

### Method B: Manual Web Service Creation on Render
If you prefer configuring through the Render UI:

1. Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Web Service**.
2. Select your `LabelLens` repository.
3. Configure the settings:
   - **Name**: `labellens-backend`
   - **Region**: Choose closest to you (e.g., Frankfurt or Oregon)
   - **Root Directory**: `backend`
   - **Runtime**: **Docker** *(Recommended for OCR/ONNX dependencies)*
     - Dockerfile Path: `Dockerfile`
     - Context: `.`
   - *(Alternative Runtime: Python)*:
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables**:
   | Key | Value | Description |
   |---|---|---|
   | `PORT` | `8000` | Port variable auto-assigned by Render |
   | `JWT_SECRET` | *(Generate a random 32-char string)* | Token encryption secret |
   | `MONGODB_URI` | *(Optional)* `mongodb+srv://...` | MongoDB Atlas URI (or leave blank for persistent JSON storage) |
5. Click **Create Web Service**.
6. After the build completes (1-3 minutes), verify your service by visiting:
   ```
   https://<your-render-app>.onrender.com/health
   ```
   You should see: `{"status": "healthy", "service": "LabelLens Backend", ...}`.

---

## Part 3: Deploy Frontend to Vercel

### Method A: Vercel Web Dashboard (Recommended)

1. Log in to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your `LabelLens` GitHub repository.
4. In the **Configure Project** screen:
   - **Framework Preset**: `Vite` (Auto-detected)
   - **Root Directory**: Click *Edit* and select **`frontend`**
   - **Build Command**: `npm run build` (Default)
   - **Output Directory**: `dist` (Default)
5. Expand **Environment Variables** and add:
   | Name | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://<your-render-app>.onrender.com` |
   *(Replace with your actual Render URL from Part 2)*
6. Click **Deploy**.
7. In ~30-60 seconds, your site will be live at `https://labellens-xxxx.vercel.app`!

---

### Method B: Deploying via Vercel CLI

You can also deploy directly from PowerShell:

```powershell
cd frontend

# Run Vercel CLI
npx vercel

# Follow the interactive prompts:
# ? Set up and deploy? [Y]
# ? Which scope? [Your Account]
# ? Link to existing project? [N]
# ? Project name? [labellens]
# ? In which directory is your code located? [./]

# Set the production environment variable:
npx vercel env add VITE_API_BASE_URL production
# Paste your Render URL: https://<your-render-app>.onrender.com

# Deploy to production:
npx vercel --prod
```

---

## Part 4: Verification Checklist

Once both services are deployed:

1. **Verify Backend**:
   - Open `https://<your-render-app>.onrender.com/health` in your browser.
   - Open `https://<your-render-app>.onrender.com/docs` to see the live Swagger UI.
2. **Verify Frontend**:
   - Open your Vercel URL: `https://<your-vercel-app>.vercel.app`.
   - The landing page and dashboard will load live data from your Render backend.
   - Navigate to **Scan**, upload a food label image, and verify the deep learning OCR pipeline processes it and populates the nutrient cards.
   - Test **Barcode Search** (e.g. `3017620422003` for Nutella) to verify live Open Food Facts integration.
   - Test **Compare** to inspect multi-product nutrition side-by-side.

---

## 💡 Key Technical Details Configured

- **Dynamic Port Binding**: `backend/Dockerfile` and `backend/main.py` dynamically bind to Render's assigned `$PORT`.
- **CORS Permissive**: `backend/main.py` allows requests from any Vercel domain (`allow_origins=["*"]`).
- **Client-Side Routing**: `frontend/vercel.json` contains SPA rewrite rules so deep links (e.g. `/compare`, `/scan`) don't 404 on page refresh.
- **Dynamic Asset Base**: `frontend/src/api.ts` automatically prepends `VITE_API_BASE_URL` to API calls and uploaded images.
