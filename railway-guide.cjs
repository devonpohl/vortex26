const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, LevelFormat, BorderStyle, PageBreak } = require('docx');
const fs = require('fs');

const FONT = "Arial";
const TITLE_COLOR = "1A1A2E";
const ACCENT_COLOR = "2563EB";
const MUTED_COLOR = "64748B";

const doc = new Document({
  styles: {
    default: { document: { run: { font: FONT, size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: FONT, color: TITLE_COLOR },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: FONT, color: ACCENT_COLOR },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: FONT, color: TITLE_COLOR },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "steps",
        levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets2",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets3",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets4",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets5",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets6",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "bullets7",
        levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // Title
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "Deploying a Node.js App to Railway", size: 48, bold: true, font: FONT, color: TITLE_COLOR })]
      }),
      new Paragraph({
        spacing: { after: 400 },
        children: [new TextRun({ text: "A practical guide with lessons learned from the Pohler Vortex 2026 reunion site", size: 24, color: MUTED_COLOR, font: FONT })]
      }),

      // Section 1: Prerequisites
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Prerequisites")] }),
      p("Before you begin, make sure you have:"),
      bullet("bullets", "A GitHub repository with your Node.js project pushed to it"),
      bullet("bullets", "A Railway account (railway.com) \u2014 free tier works to start"),
      bullet("bullets", "A working build script in package.json (e.g., tsc for TypeScript projects)"),
      bullet("bullets", "GitHub CLI (gh) installed and authenticated, or a personal access token"),

      // Section 2: Initial Setup
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Initial Railway Setup")] }),
      step("steps", "Create a new project in Railway and select \u201CDeploy from GitHub repo.\u201D"),
      step("steps", "Connect your GitHub account and select your repository."),
      step("steps", "Railway will automatically detect your Node.js project and attempt a build."),
      step("steps", "Once deployed, Railway gives you a generated URL (e.g., your-app.up.railway.app). Click it to verify the site loads."),

      // Section 3: Environment Variables
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Environment Variables")] }),
      p("Your .env file is gitignored (as it should be), so any secrets need to be added manually in Railway."),
      step("steps", "In your Railway project, click on your service."),
      step("steps", "Go to the Variables tab."),
      step("steps", "Add each variable your app needs. For the reunion site, this included:"),
      bullet("bullets2", "SITE_PASSWORD \u2014 the shared login password"),
      bullet("bullets2", "SESSION_SECRET \u2014 for express-session"),
      bullet("bullets2", "NODE_ENV=production \u2014 to enable secure cookies"),
      bullet("bullets2", "DATABASE_PATH \u2014 see the Database Persistence section below"),

      new Paragraph({ children: [new PageBreak()] }),

      // Section 4: Database Persistence
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Database Persistence with Volumes")] }),
      p("This is the single most important thing to get right. Without a volume, your SQLite database resets on every deploy."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("The Problem")] }),
      p("Railway containers are ephemeral. Every deployment spins up a fresh container, so any files written to the local filesystem (including your SQLite .db file) are destroyed. If you store your database at a relative path like data/reunion.db, it lives inside the container and vanishes on redeploy."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("The Fix: Attach a Volume")] }),
      step("steps", "In your Railway service, go to Settings."),
      step("steps", "Under Volumes, click Add Volume."),
      step("steps", "Set the mount path to /data."),
      step("steps", "In the Variables tab, set DATABASE_PATH to /data/reunion.db (absolute path)."),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Critical: Use an Absolute Path")] }),
      p("This tripped us up multiple times. The DATABASE_PATH must be an absolute path pointing to the volume mount:"),
      code("/data/reunion.db      \u2705 Correct \u2014 points to the volume"),
      code("data/reunion.db       \u274C Wrong \u2014 relative path, writes inside the container"),
      p("Your code should also create the directory if it doesn\u2019t exist:"),
      code("const dataDir = path.dirname(dbPath);\nif (!fs.existsSync(dataDir)) {\n  fs.mkdirSync(dataDir, { recursive: true });\n}"),

      new Paragraph({ children: [new PageBreak()] }),

      // Section 5: Auth Behind a Reverse Proxy
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Authentication Behind Railway\u2019s Reverse Proxy")] }),
      p("Railway sits behind a reverse proxy, which causes two common issues with cookie-based auth:"),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Login Loop (Secure Cookies)")] }),
      p("If your session cookie is set to secure: true (which it should be in production), Express needs to know the connection is actually HTTPS. But from Express\u2019s perspective, the connection from Railway\u2019s proxy arrives over HTTP. Fix: tell Express to trust the proxy."),
      code("app.set('trust proxy', 1);"),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Auth Bypass via Static Files")] }),
      p("If you use express.static(public) before your auth middleware, Express will serve your HTML files (including index.html) to unauthenticated users. Fix: only serve CSS, JS, and images as static assets, and route HTML through auth-protected handlers."),
      code("// Don\u2019t do this:\napp.use(express.static('public'));\n\n// Do this instead:\napp.use('/css', express.static('public/css'));\napp.use('/js', express.static('public/js'));\napp.use('/img', express.static('public/img'));"),

      // Section 6: Custom Domain
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Custom Domain Setup")] }),
      step("steps", "Buy a domain from a registrar (e.g., Porkbun, Namecheap, Cloudflare)."),
      step("steps", "In Railway, go to your service \u2192 Settings \u2192 Custom Domain. Add your domain."),
      step("steps", "Railway gives you a CNAME target (e.g., b5r80nvo.up.railway.app)."),
      step("steps", "In your registrar\u2019s DNS settings, add a CNAME record pointing @ (or your subdomain) to Railway\u2019s target."),
      step("steps", "Wait for DNS propagation (usually minutes, sometimes up to 48 hours)."),
      step("steps", "Railway will automatically provision a TLS certificate once DNS resolves."),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("DNS Tips")] }),
      bullet("bullets3", "Some registrars (like Porkbun) support ALIAS records for root domains, which work like CNAME but are technically valid at the zone apex."),
      bullet("bullets3", "If your site shows a 404 or certificate error, DNS may still be propagating. Give it time."),
      bullet("bullets3", "You can check propagation with: dig yourdomain.com +short"),

      new Paragraph({ children: [new PageBreak()] }),

      // Section 7: Deployment Workflow
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Day-to-Day Deployment Workflow")] }),
      p("Railway auto-deploys from your GitHub repo\u2019s main branch. The workflow is:"),
      step("steps", "Make your changes locally."),
      step("steps", "Build: npx tsc (if TypeScript)."),
      step("steps", "Commit: git add -A && git commit -m \"your message\""),
      step("steps", "Push: git push"),
      step("steps", "Railway detects the push and rebuilds automatically. Watch the Deployments tab for status."),

      new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun("Seeded Data vs. User Data")] }),
      p("If your app seeds data on startup (like our suggested events list), make sure you only refresh seeded/curated content, never user-generated content. The reunion site uses DELETE FROM suggested_events on every boot followed by re-inserts, but never touches user-created events, households, or other tables."),

      // Section 8: Debugging on Railway
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Debugging on Railway")] }),
      p("Railway doesn\u2019t give you easy shell access like a traditional VPS. Here\u2019s how to work around that:"),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Reading Data")] }),
      p("Hit your API endpoints directly in the browser while logged in. For example, visiting /api/households returns the JSON for all households. This is the fastest way to inspect your database."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Modifying Data")] }),
      p("Open your browser\u2019s developer console (Cmd+Option+C in Safari, Cmd+Option+J in Chrome) while on your site, and use fetch:"),
      code("// Delete a record\nfetch('/api/households/5', { method: 'DELETE' })\n  .then(r => console.log(r.status))\n\n// Update a record\nfetch('/api/households/2', {\n  method: 'PUT',\n  headers: {'Content-Type':'application/json'},\n  body: JSON.stringify({ name: 'New Name', ... })\n}).then(r => r.json()).then(console.log)"),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("SSH Access")] }),
      p("For full shell access, install the Railway CLI and use railway ssh. See docs.railway.com/cli#ssh for setup instructions."),

      new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("Logs")] }),
      p("The Deployments tab in Railway shows build and runtime logs. Check here first when something breaks after a push."),

      new Paragraph({ children: [new PageBreak()] }),

      // Section 9: Key Takeaways
      new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Key Takeaways")] }),
      p("Lessons learned the hard way from deploying the reunion site:"),

      bullet("bullets4", "DATABASE_PATH must be absolute (/data/reunion.db, not data/reunion.db). This caused multiple data wipes before we caught it."),
      bullet("bullets4", "Always attach a volume before your first real deploy. Without it, every push destroys your database."),
      bullet("bullets4", "Add trust proxy immediately. Without app.set('trust proxy', 1), secure cookies fail behind Railway\u2019s reverse proxy, causing login loops."),
      bullet("bullets4", "Split static file serving. Don\u2019t use a blanket express.static('public') or unauthenticated users can access your HTML pages directly."),
      bullet("bullets4", "Set all env vars in Railway. Your .env file is gitignored (correctly), so SITE_PASSWORD, SESSION_SECRET, etc. must be added in Railway\u2019s Variables tab."),
      bullet("bullets4", "Seed data carefully. Only auto-refresh curated content on startup. Never delete and re-insert user data."),
      bullet("bullets4", "Use your API for data fixes. Without easy shell access, your REST API endpoints are your primary tool for inspecting and modifying production data."),
      bullet("bullets4", "Test mobile separately. Features like the Fullscreen API and touch events behave differently on iOS Safari vs. desktop browsers. CSS position:fixed is more reliable than the Fullscreen API on mobile."),
      bullet("bullets4", "DNS propagation takes time. Don\u2019t panic if your custom domain shows a 404 right after setup. TLS certificates are provisioned automatically once DNS resolves."),

      // Footer
      new Paragraph({ spacing: { before: 600 }, children: [
        new TextRun({ text: "\u2014", color: MUTED_COLOR }),
      ]}),
      p("Generated from the Pohler Vortex 2026 deployment experience, February 2026."),
    ]
  }]
});

function p(text) {
  return new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: 22, font: FONT })] });
}

function bullet(ref, text) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, font: FONT })]
  });
}

function step(ref, text) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, font: FONT })]
  });
}

function code(text) {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    indent: { left: 360 },
    border: { left: { style: BorderStyle.SINGLE, size: 6, color: "E2E8F0", space: 8 } },
    children: text.split('\n').flatMap((line, i, arr) => {
      const parts = [new TextRun({ text: line, font: "Courier New", size: 20, color: "334155" })];
      if (i < arr.length - 1) parts.push(new TextRun({ break: 1 }));
      return parts;
    })
  });
}

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("/sessions/laughing-trusting-bohr/mnt/reunion-site/railway-deployment-guide.docx", buffer);
  console.log("Done!");
});
