import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

doc = docx.Document()

# Page Margins
for s in doc.sections:
    s.top_margin = Inches(1)
    s.bottom_margin = Inches(1)
    s.left_margin = Inches(1)
    s.right_margin = Inches(1)

# Color Scheme: Professional Engineering Blue & Charcoal
PRIMARY_HEX = "1E3A8A"      # Deep Navy / Indigo
SECONDARY_HEX = "0D9488"    # Teal Accent
ACCENT_HEX = "D97706"       # Amber
DARK_TEXT_HEX = "111827"    # Near Black
LIGHT_BG_HEX = "F8FAFC"     # Slate 50
BORDER_HEX = "CBD5E1"       # Slate 300

def set_cell_background(cell, hex_color):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def add_header(title, level=1):
    h = doc.add_heading(level=level)
    run = h.add_run(title)
    run.font.name = 'Calibri'
    if level == 1:
        run.font.size = Pt(17)
        run.font.bold = True
        run.font.color.rgb = RGBColor(30, 58, 138)
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(6)
    elif level == 2:
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = RGBColor(13, 148, 136)
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
    elif level == 3:
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = RGBColor(17, 24, 39)
        h.paragraph_format.space_before = Pt(8)
        h.paragraph_format.space_after = Pt(2)
    return h

def add_p(text, bold_prefix="", italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix)
        r_pre.font.name = 'Calibri'
        r_pre.font.size = Pt(10.5)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(30, 58, 138)
    r = p.add_run(text)
    r.font.name = 'Calibri'
    r.font.size = Pt(10.5)
    r.font.italic = italic
    r.font.color.rgb = RGBColor(55, 65, 81)
    return p

def add_bullet(bold_prefix, text):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_pre = p.add_run(bold_prefix + ": ")
        r_pre.font.name = 'Calibri'
        r_pre.font.size = Pt(10)
        r_pre.font.bold = True
        r_pre.font.color.rgb = RGBColor(13, 148, 136)
    r = p.add_run(text)
    r.font.name = 'Calibri'
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(55, 65, 81)
    return p

def create_table(headers, rows):
    tbl = doc.add_table(rows=len(rows) + 1, cols=len(headers))
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tbl.autofit = False

    # Header Row
    hdr_cells = tbl.rows[0].cells
    for i, h in enumerate(headers):
        hdr_cells[i].text = h
        set_cell_background(hdr_cells[i], PRIMARY_HEX)
        set_cell_margins(hdr_cells[i], 120, 120, 140, 140)
        for p in hdr_cells[i].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for r in p.runs:
                r.font.name = 'Calibri'
                r.font.bold = True
                r.font.size = Pt(9.5)
                r.font.color.rgb = RGBColor(255, 255, 255)

    # Data Rows
    for r_idx, row_data in enumerate(rows):
        row_cells = tbl.rows[r_idx + 1].cells
        bg_col = "FFFFFF" if r_idx % 2 == 0 else "F8FAFC"
        for c_idx, cell_value in enumerate(row_data):
            row_cells[c_idx].text = str(cell_value)
            set_cell_background(row_cells[c_idx], bg_col)
            set_cell_margins(row_cells[c_idx], 80, 80, 120, 120)
            for p in row_cells[c_idx].paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT
                for r in p.runs:
                    r.font.name = 'Calibri'
                    r.font.size = Pt(9)
                    r.font.color.rgb = RGBColor(31, 41, 55)

    p_after = doc.add_paragraph()
    p_after.paragraph_format.space_before = Pt(2)
    p_after.paragraph_format.space_after = Pt(6)

# ==================== COVER BLOCK ====================
p_pre = doc.add_paragraph()
p_pre.paragraph_format.space_before = Pt(36)
r_pre = p_pre.add_run("TECHNICAL ARCHITECTURE & INTERVIEW MASTER GUIDE")
r_pre.font.name = 'Calibri'
r_pre.font.size = Pt(11)
r_pre.font.bold = True
r_pre.font.color.rgb = RGBColor(217, 119, 6)

p_title = doc.add_paragraph()
p_title.paragraph_format.space_before = Pt(4)
p_title.paragraph_format.space_after = Pt(8)
r_title = p_title.add_run("ROOTS: FULL-STACK TECHNICAL REFERENCE")
r_title.font.name = 'Calibri'
r_title.font.size = Pt(28)
r_title.font.bold = True
r_title.font.color.rgb = RGBColor(30, 58, 138)

p_sub = doc.add_paragraph()
p_sub.paragraph_format.space_after = Pt(20)
r_sub = p_sub.add_run("Technology-by-Technology Deep Dive, Exact Codebase Locations, Architectural Tradeoffs, and Interview Defense Cheat Sheet")
r_sub.font.name = 'Calibri'
r_sub.font.size = Pt(13)
r_sub.font.italic = True
r_sub.font.color.rgb = RGBColor(75, 85, 99)

add_p("This document is specifically curated as an interview preparation and technical defense guide for the Roots Family Social Network project. It details every library, framework, pattern, and algorithm used across the application, identifying exact file locations, implementation rationale, performance characteristics, and direct answers to tough interview questions.", "Interview Preparation Notice: ")

doc.add_page_break()

# ==================== SECTION 1: 30-SECOND ELEVATOR PITCH ====================
add_header("1. Project Elevator Pitch (For Technical Interviews)", level=1)
add_p("'Roots is a full-stack, culturally contextualized family social networking platform built with React 19, TypeScript, Node.js Express 5, Prisma ORM, and PostgreSQL. Unlike traditional social networks built on broadcast feeds or simple genealogy tools with rigid database columns, Roots treats familial connections as an interconnected mathematical graph. Using custom Breadth-First Search (BFS) graph traversal algorithms, the platform dynamically renders interactive visual family trees, computes shortest kinship paths to explain relationships in natural language (e.g., 'Father's Brother's Son -> Cousin'), detects biological exclusivity conflicts, and implements an atomic profile claiming engine that transfers relationship edges from offline placeholder accounts to real users upon registration.'", bold_prefix="The 30-Second Pitch: ")

# ==================== SECTION 2: TECHNOLOGY MATRIX & EXACT FILE LOCATIONS ====================
add_header("2. Complete Technology Stack Matrix & Codebase Locations", level=1)
add_p("The table below documents every single technology, package, and library in the Roots repository, its exact location in the codebase, and why it was chosen:")

tech_headers = ["Technology / Tool", "Exact File / Directory Location", "Category", "Why Chosen & Role in Architecture"]
tech_rows = [
    ["React 19 (v19.2.8)", "frontend/src/App.tsx, frontend/src/main.tsx, all pages/", "Frontend Framework", "Latest concurrent rendering capabilities, seamless hook integration, and reactive single-page application (SPA) state updates."],
    ["TypeScript (TS 6/7)", "frontend/tsconfig.json, backend/tsconfig.json, frontend/src/types.ts", "Language", "End-to-end type safety between database models, backend API payloads, and frontend state, eliminating runtime null-pointer bugs."],
    ["Vite 8 (v8.3.0)", "frontend/vite.config.ts, frontend/package.json", "Build Tool & Bundler", "Lightning-fast Hot Module Replacement (HMR) and optimized Rollup-based tree-shaking production bundling."],
    ["Node.js & Express 5 (v5.2.1)", "backend/src/index.ts, backend/src/routes/*", "Backend Runtime & Framework", "Express 5 provides modern native promise support in route handlers, high asynchronous I/O throughput, and streamlined middleware chains."],
    ["Prisma ORM (v6.19.3)", "backend/prisma/schema.prisma, backend/src/lib/prisma.ts", "Database ORM", "Type-safe database client generation, automated SQL migration management, and native support for multi-model ACID transactions."],
    ["PostgreSQL", "Database Connection string in backend/.env", "Relational Database", "ACID compliance for critical relationship transactions, relational foreign key constraints, composite unique indexes, and schema enforcement."],
    ["@xyflow/react (React Flow v12.12.0)", "frontend/src/pages/FamilyTreePage.tsx", "Interactive Canvas", "Hardware-accelerated infinite canvas for rendering family graph nodes, custom node cards, dynamic zoom/pan, and smooth animated edges."],
    ["Zustand (v5.0.15)", "frontend/src/stores/authStore.ts", "Client Auth Store", "Lightweight, boilerplate-free state manager utilizing the persist middleware to synchronize authentication tokens and user state with localStorage."],
    ["TanStack React Query (v5.104.0)", "frontend/src/main.tsx, frontend/src/pages/*", "Server State Manager", "Declarative server data fetching, automatic 2-minute stale-time caching, query invalidation, and background synchronization."],
    ["Axios (v1.20.0)", "frontend/src/lib/api.ts", "HTTP Client", "Centralized request interceptors to automatically inject Bearer JWT headers and response interceptors to catch 401s and redirect to /login."],
    ["Zod (v4.6.5)", "backend/src/routes/* (auth, relationships, events, etc.)", "Input Validation", "Compile-time schema definition and runtime payload validation for request bodies, enforcing bounds (e.g. event dates 1900-2100)."],
    ["JWT (jsonwebtoken v9.0.3)", "backend/src/routes/auth.ts, backend/src/middleware/authenticate.ts", "Authentication", "Stateless, cryptographically signed bearer tokens with 7-day expiration, eliminating server-side session memory overhead."],
    ["BcryptJS (v3.0.3)", "backend/src/routes/auth.ts", "Security & Hashing", "One-way cryptographic password hashing utilizing 12 salt rounds to defend against rainbow table and brute-force attacks."],
    ["Tailwind CSS v4 (v4.3.3)", "frontend/src/index.css, frontend/vite.config.ts", "Styling Engine", "High-performance CSS engine with curated HSL color tokens, dark mode classes, glassmorphism card surfaces, and responsive utility classes."],
    ["Lucide React (v1.48.0)", "frontend/src/components/*, frontend/src/pages/*", "Iconography", "Consistent, lightweight SVG micro-icons across navigation bars, family tree indicators, action buttons, and status alerts."],
    ["React Hot Toast (v2.6.1)", "frontend/src/main.tsx", "UI Notifications", "Non-intrusive asynchronous toast banners for instant success/error feedback on relationship requests, posts, and RSVP updates."],
    ["React Hook Form (v7.89.0)", "frontend/src/pages/RegisterPage.tsx, EditProfilePage.tsx", "Form Management", "Uncontrolled component form handling reducing unnecessary re-renders during high-volume cultural profile inputs."],
    ["React Router DOM (v7.18.4)", "frontend/src/App.tsx", "Client-Side Routing", "Nested layout routing with protected/public route wrappers and dynamic parameter passing (/how-related/:userId, /events/:id)."],
    ["TSX & Nodemon", "backend/package.json (dev script)", "Developer Experience", "Zero-config TypeScript execution engine with file-watching for instantaneous backend live-reload during development."]
]
create_table(tech_headers, tech_rows)

# ==================== SECTION 3: DEEP-DIVE INTO KEY TECHNICAL MODULES ====================
add_header("3. In-Depth Technical Module Breakdown", level=1)
add_p("This section breaks down the core technical challenges and how specific technologies were implemented to solve them.")

add_header("3.1 The Family Graph & Traversal Engine (graphService.ts)", level=2)
add_p("Location: backend/src/services/graphService.ts", italic=True)
add_bullet("Algorithmic Approach", "Employs Breadth-First Search (BFS) to explore undirected relationships up to depth 6 (or depth 10 for global feeds). Tracks visited node sets to prevent infinite loops caused by circular marriage ties.")
add_bullet("Adjacency List Construction", "Iteratively fetches active relationships from PostgreSQL, populating a dual-directed Map<string, { targetId, edge }[]> so graph traversal can traverse backwards and forwards across kinship edges.")
add_bullet("Kinship Path Reconstruction", "findRelationshipPath maintains a prev Map<string, { nodeId, edge }> to trace back the exact sequence of vertices from the target relative back to the source root.")
add_bullet("Natural Kinship Deduction", "Parses edge arrays into human labels (e.g. 2-hop [FATHER, BROTHER] -> 'Uncle'; 3-hop [FATHER, BROTHER, SON] -> 'Cousin').")

add_header("3.2 Atomic Dummy Profile Claim Engine (dummyProfiles.ts)", level=2)
add_p("Location: backend/src/routes/dummyProfiles.ts", italic=True)
add_bullet("The Problem", "Elderly or offline relatives cannot create digital accounts, yet their nodes and family ties must exist to connect living generations.")
add_bullet("ACID Transaction Solution", "When a real user signs up and claims a dummy account via /dummy-profiles/:id/claim, Prisma's prisma.$transaction(async (tx) => ...) executes 4 atomic operations:")
add_bullet("Step 1 (Inbound Edges)", "Updates all relationships where relatedUserId == dummyId to point to claimantId.")
add_bullet("Step 2 (Outbound Edges)", "Updates all relationships where userId == dummyId to point to claimantId.")
add_bullet("Step 3 (Meta Status)", "Updates DummyProfileMeta claimState to CLAIMED.")
add_bullet("Step 4 (Account Deactivation)", "Deactivates the dummy account (accountState = INACTIVE, claimedById = claimantId, claimedAt = now()).")
add_bullet("Guaranteed Consistency", "If any single step fails, the entire transaction rolls back, preventing dangling edges or corrupted family trees.")

add_header("3.3 Conflict Detection & Dispute State Engine (relationships.ts)", level=2)
add_p("Location: backend/src/routes/relationships.ts", italic=True)
add_bullet("The Problem", "A user cannot biologically possess multiple distinct fathers or mothers. Accepting a conflicting claim must not silently overwrite confirmed heritage.")
add_bullet("Pre-Request Conflict Check", "Before creating a request for exclusive types (FATHER, MOTHER, GRANDFATHER, GRANDMOTHER), the system queries PostgreSQL for existing ACCEPTED/VERIFIED ties. If one exists with a different individual, HTTP 409 Conflict is returned.")
add_bullet("Post-Acceptance Conflict Handling", "When accepting a request, if the recipient's side detects an existing inverse relationship (e.g., recipient already has a confirmed father), the relationship status is marked DISPUTED rather than ACCEPTED.")
add_bullet("Visual Canvas Feedback", "In the React Flow family tree, edges marked DISPUTED are dynamically styled with animated dashes and alert colors to prompt resolution.")

add_header("3.4 Authentication & Global Interceptors (authStore.ts & api.ts)", level=2)
add_p("Location: frontend/src/stores/authStore.ts & frontend/src/lib/api.ts", italic=True)
add_bullet("Zustand Persistence", "useAuthStore uses Zustand's persist middleware to serialize token, user object, and isAuthenticated boolean into localStorage key 'roots_user'.")
add_bullet("Axios Request Interceptor", "Intercepts every outgoing HTTP request, reads roots_token from localStorage, and injects Authorization: Bearer <token> into the headers.")
add_bullet("Axios Response Interceptor", "Globally intercepts 401 Unauthorized responses, wipes expired tokens from localStorage, resets auth state, and redirects the user to /login.")

add_header("3.5 Multi-Generational Timeline Aggregator (timeline.ts)", level=2)
add_p("Location: backend/src/routes/timeline.ts", italic=True)
add_bullet("Deep Graph Aggregation", "Calls buildFamilyGraph(userId, 10) to obtain the Set of all reachable family node IDs across the entire extended family network.")
add_bullet("Chronological Merge", "Fetches all posts from all graph family members, fetches all family gatherings/events joined by the user, normalizes events into timeline-entry shapes, and sorts the combined array chronologically by eventDate.")

# ==================== SECTION 4: INTERVIEW QUESTIONS & ANSWERS CHEAT SHEET ====================
add_header("4. Interview Questions & Model Answers Cheat Sheet", level=1)
add_p("Use these structured responses when asked about this project during technical interviews:")

add_header("Q1: 'Can you describe the overall architecture of your Roots project?'", level=2)
add_p("'Roots follows a modern, decoupled client-server architecture built entirely in TypeScript. The frontend is a React 19 single-page application bundled with Vite and styled with Tailwind CSS. We use Zustand for client-side authentication persistence and TanStack Query for server-state caching. The backend is an asynchronous Node.js Express 5 REST API using Prisma ORM connected to a PostgreSQL database. For the core domain, we implemented an in-memory graph service using Breadth-First Search (BFS) to traverse family relationships, derive dynamic tree structures, and highlight kinship paths.'", bold_prefix="Answer: ")

add_header("Q2: 'Why did you use graph algorithms instead of storing parent IDs in the User table?'", level=2)
add_p("'Traditional relational models store columns like fatherId, motherId, or spouseId directly on the user table. While simple, that approach fails to handle real-world complexities like multi-hop cousin relationships, circular family marriages, adoptive versus biological ties, and relationship disputes. By representing relationships as discrete, bidirectional edges in a graph with status metadata (ACCEPTED, VERIFIED, DISPUTED), the graph acts as our single source of truth. We can run BFS shortest-path algorithms to calculate kinship paths between any two people and dynamically generate tree hierarchies on demand without data duplication.'", bold_prefix="Answer: ")

add_header("Q3: 'How did you handle race conditions or data integrity when claiming dummy profiles?'", level=2)
add_p("'Claiming a dummy profile requires updating multiple relationship edges and account states across the database. If a failure occurred halfway through, you would end up with orphaned nodes or severed lineage. To prevent this, I encapsulated the entire claiming routine inside an ACID database transaction using Prisma's $transaction API. In a single atomic operation, we re-point all incoming edges, re-point all outgoing edges, update the dummy metadata to CLAIMED, deactivate the dummy account, and notify the original creator. If any update fails, the entire transaction automatically rolls back.'", bold_prefix="Answer: ")

add_header("Q4: 'How did you handle authentication and route protection across the stack?'", level=2)
add_p("'We implemented stateless JWT authentication. On the backend, passwords are encrypted using bcryptjs with 12 salt rounds. Upon login, we issue a signed JWT valid for 7 days. An Express middleware validates the token on protected routes, extracting the userId and attaching it to the request object. On the frontend, Axios request interceptors automatically inject the Bearer token into outgoing HTTP headers, while response interceptors catch 401 errors, clear localStorage, and redirect to the login screen. Route protection in React is handled via higher-order ProtectedRoute and PublicRoute wrappers.'", bold_prefix="Answer: ")

add_header("Q5: 'How did you render the family tree and handle canvas performance?'", level=2)
add_p("'I used @xyflow/react (React Flow) for rendering. The backend serializes graph nodes and deduplicated edges into React Flow format, positioning nodes programmatically based on generational rank. Custom React Flow node components were built to display cultural surnames, avatar initials, and root indicators. Edge connections use smoothstep bezier lines, with animated dashes for disputed relationships. Because React Flow uses canvas and hardware-accelerated transforms, panning and zooming remain smooth even as the family graph expands.'", bold_prefix="Answer: ")

add_header("Q6: 'If you had to scale this application to 1 million users, what would you optimize?'", level=2)
add_p("'First, the current BFS algorithm makes iterative Prisma database queries inside the traversal loop. At high scale, I would replace this with a single recursive Common Table Expression (CTE) in PostgreSQL or migrate the relationship subgraph to a dedicated graph database like Neo4j. Second, I would introduce Redis to cache family adjacency lists and user session tokens with cache invalidation on relationship changes. Third, I would offload image uploads to AWS S3 using presigned URLs and implement WebSockets via Socket.io for live notifications and instant chat.'", bold_prefix="Answer: ")

# ==================== SECTION 5: PERFORMANCE & OPTIMIZATION MATRIX ====================
add_header("5. Performance, Security & Architectural Decisions", level=1)
add_p("This section summarizes the intentional engineering decisions made in the codebase:")

opt_headers = ["Domain", "Architectural Decision", "Technical Implementation", "Benefit Achieved"]
opt_rows = [
    ["Security", "Stateless Token Auth", "jsonwebtoken + 12-round bcrypt", "No session database bottleneck; secure against brute-force attacks."],
    ["Data Integrity", "Atomic Transactions", "prisma.$transaction([ ... ])", "Guarantees zero orphaned edges during dummy profile claiming and inverse edge synthesis."],
    ["Performance", "Server-State Caching", "@tanstack/react-query (staleTime: 2m)", "Prevents redundant network round-trips for static graph data and relationship lists."],
    ["User Experience", "Global Interceptors", "Axios request & response interceptors", "Automatic token injection and unified 401 session expiration handling."],
    ["Visualization", "Hardware Canvas", "@xyflow/react (React Flow)", "Smooth 60 FPS panning, zooming, and interactive node selection."],
    ["Validation", "Runtime Schema Checks", "Zod schemas on all API routes", "Blocks malformed payloads before they reach database queries (e.g. invalid dates)."]
]
create_table(opt_headers, opt_rows)

# Save document
output_path = r"c:\Users\reddy\0projects\Roots\Family_Social_Network_Technical_Architecture_Guide.docx"
doc.save(output_path)
print(f"Technical DOCX successfully written to: {output_path}")
