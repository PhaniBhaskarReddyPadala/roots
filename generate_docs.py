import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

doc = docx.Document()

# 1 inch margins all around
for s in doc.sections:
    s.top_margin = Inches(1)
    s.bottom_margin = Inches(1)
    s.left_margin = Inches(1)
    s.right_margin = Inches(1)

# Color constants
PRIMARY_HEX = "1B4D3E"      # Forest Green
SECONDARY_HEX = "2C5E43"    # Sage Dark
ACCENT_HEX = "B45309"       # Deep Amber
DARK_TEXT_HEX = "1F2937"    # Slate 800
LIGHT_BG_HEX = "F3F4F6"     # Gray 100
BORDER_HEX = "D1D5DB"       # Gray 300

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
        run.font.color.rgb = RGBColor(27, 77, 62)
        h.paragraph_format.space_before = Pt(16)
        h.paragraph_format.space_after = Pt(6)
    elif level == 2:
        run.font.size = Pt(13.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(44, 94, 67)
        h.paragraph_format.space_before = Pt(12)
        h.paragraph_format.space_after = Pt(4)
    elif level == 3:
        run.font.size = Pt(11.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(31, 41, 55)
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
        r_pre.font.color.rgb = RGBColor(27, 77, 62)
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
        r_pre.font.color.rgb = RGBColor(27, 77, 62)
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
        bg_col = "FFFFFF" if r_idx % 2 == 0 else "F9FAFB"
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

# ==================== COVER PAGE ====================
p_top = doc.add_paragraph()
p_top.paragraph_format.space_before = Pt(40)
r_pretitle = p_top.add_run("COMPLETE PROJECT REFERENCE & IMPLEMENTATION GUIDE")
r_pretitle.font.name = 'Calibri'
r_pretitle.font.size = Pt(11)
r_pretitle.font.bold = True
r_pretitle.font.color.rgb = RGBColor(180, 83, 9)

p_title = doc.add_paragraph()
p_title.paragraph_format.space_before = Pt(6)
p_title.paragraph_format.space_after = Pt(8)
r_title = p_title.add_run("ROOTS: FAMILY SOCIAL NETWORK")
r_title.font.name = 'Calibri'
r_title.font.size = Pt(30)
r_title.font.bold = True
r_title.font.color.rgb = RGBColor(27, 77, 62)

p_sub = doc.add_paragraph()
p_sub.paragraph_format.space_after = Pt(24)
r_sub = p_sub.add_run("Comprehensive Architectural Analysis, 5-Stage Core Lineage Foundation, and Advanced Feature Specification")
r_sub.font.name = 'Calibri'
r_sub.font.size = Pt(13)
r_sub.font.italic = True
r_sub.font.color.rgb = RGBColor(75, 85, 99)

add_p("This exhaustive document serves as the master engineering and functional specification for the Roots Family Social Network. It details both the foundational 5-Stage Core Lineage Engine (specified in the project design document) and all advanced capabilities implemented across the full-stack codebase (including the Family Timeline, Milestones, Gathering Events, RSVP Analytics, BFS Kinship Path Highlighting, and Graph-based Suggestions).", "Executive Notice: ")

doc.add_page_break()

# ==================== SECTION 1: EXECUTIVE SUMMARY ====================
add_header("1. Executive Summary & Core Purpose", level=1)
add_p("Roots is an enterprise-grade, culturally contextualized family social networking platform designed to solve a fundamental deficiency in modern social media. Mainstream platforms (such as Facebook, Instagram, X, or LinkedIn) operate on unconstrained, broadcast-oriented social graphs optimized for viral content distribution, public following, and ad monetization. In contrast, Roots is built around private, verified, bidirectional kinship structures that preserve generational heritage, ethnolinguistic memory, and genealogical continuity.")
add_p("Unlike basic family tree software that stores static ancestor trees with rigid foreign-key attributes (e.g., fatherId, motherId), Roots treats every family connection as an edge in a dynamic mathematical graph. This enables automated inverse synthesis, real-time kinship path discovery ('How Are We Related?'), automated relationship conflict detection, representation of offline or deceased ancestors through dummy profiles, and milestone archiving.")

# ==================== SECTION 2: ARCHITECTURE & TECH STACK ====================
add_header("2. System Architecture & Technical Stack", level=1)
add_p("Roots follows a decoupled client-server architecture built entirely in TypeScript to ensure end-to-end type safety, deterministic schemas, and maintainability.")

t_headers = ["Layer", "Technology", "Version / Package", "Role & Engineering Rationale"]
t_rows = [
    ["Frontend Framework", "React 19 & TypeScript", "react v19.2.8", "Modern concurrent rendering, hooks-based architecture, and strict TypeScript types."],
    ["Frontend Build Tool", "Vite 8", "vite v8.3.0", "Lightning-fast HMR (Hot Module Replacement) and optimized tree-shaken production bundles."],
    ["UI & Design System", "Tailwind CSS v4 & Lucide Icons", "tailwindcss v4.3.3, lucide-react", "Curated warm heritage color palette, responsive glassmorphic cards, and crisp micro-icons."],
    ["Client State Stores", "Zustand & TanStack Query v5", "zustand v5, @tanstack/react-query v5", "Zustand for JWT auth persistence; React Query for declarative server-state caching and deduplication."],
    ["Graph Rendering", "@xyflow/react (React Flow)", "@xyflow/react v12.12.0", "Canvas-based dynamic family tree visualization with custom interactive node cards, zooming, and panning."],
    ["Backend Runtime", "Node.js & Express 5", "express v5.2.1, tsx runtime", "High-throughput asynchronous REST server with modern router middleware pipelines."],
    ["Database & ORM", "PostgreSQL & Prisma ORM", "prisma v6.19.3, @prisma/client", "Relational schema enforcement, transactional integrity for graph edges, and automatic database migrations."],
    ["Security & Crypto", "JWT & BcryptJS", "jsonwebtoken v9, bcryptjs v3", "Stateless bearer token authentication (7-day validity) and cryptographically salted 12-round password hashing."],
    ["Schema Validation", "Zod", "zod v4.6.5", "Runtime input validation on request bodies, queries, and parameters with clear error messages."]
]
create_table(t_headers, t_rows)

# ==================== SECTION 3: THE 5-STAGE CORE FOUNDATION ====================
add_header("3. The 5-Stage Core Lineage Foundation (Detailed Specification)", level=1)
add_p("The foundational family network is structured into 5 cohesive, sequential stages as defined in the official project architecture. Each stage represents a critical milestone in lineage verification and graph formation:")

add_header("3.1 Stage 1: Authentication & Cultural Heritage User Profiles", level=2)
add_p("Stage 1 establishes the digital identity foundation required before any user can form or request family connections.")
add_bullet("Stateless JWT Authentication", "Provides robust /auth/register and /auth/login endpoints with 12-round bcrypt password hashing. Unauthenticated requests to protected endpoints return standard 401 Unauthorized responses.")
add_bullet("Cultural Heritage Attributes", "Captures vital ethnolinguistic markers including region of origin, mother tongue, native family surname, and surname origin history.")
add_bullet("Private Caste/Subcaste Handling", "Allows capturing caste/subcaste as an optional, strictly private field that is never exposed publicly or used to artificially infer family connections.")
add_bullet("Profile Separation", "Ensures personal identity data is decoupled from relationship records, providing stable internal user IDs for graph vertices.")
add_bullet("Account States", "Built-in tracking of ACTIVE, INACTIVE, and CLAIMED account lifecycle states.")

add_header("3.2 Stage 2: Family Relationship Requests & Verification", level=2)
add_p("Stage 2 implements the protocol for proposing, validating, and establishing family ties across the user network.")
add_bullet("13 Distinct Kinship Types", "Strictly defines FATHER, MOTHER, PARENT, SON, DAUGHTER, BROTHER, SISTER, UNCLE, AUNT, GRANDFATHER, GRANDMOTHER, SPOUSE, HUSBAND, and WIFE.")
add_bullet("Proposal & Notification Protocol", "User A searches for User B, selects the intended kinship type, and sends a request. The system emits an immediate RELATIONSHIP_REQUEST in-app notification to User B.")
add_bullet("Bidirectional Inverse Synthesis", "Accepting a request automatically instantiates the mathematical inverse edge using the system's INVERSE_MAP (e.g., User A as FATHER to User B creates an inverse edge of User B as SON/DAUGHTER to User A).")
add_bullet("Verification Elevation", "Allows mutually confirmed ties to transition from ACCEPTED to VERIFIED status, signifying elevated network confidence.")
add_bullet("Rejection Handling", "Declined requests trigger appropriate notification updates without establishing graph edges.")

add_header("3.3 Stage 3: Dummy Profiles & Conflict Resolution Engine", level=2)
add_p("Stage 3 resolves two critical real-world realities: offline/elderly relatives without smartphones, and conflicting or duplicate lineage claims.")
add_bullet("Placeholder Dummy Accounts", "Users can generate dummy profiles representing offline, deceased, or elderly relatives. The creator assigns cultural identity details and establishes immediate verified kinship edges.")
add_bullet("Dummy Account Restrictions", "Dummy profiles are structurally restricted: they cannot publish posts, submit relationship requests, or join social events independently.")
add_bullet("Digital Profile Claiming Workflow", "When the real relative eventually joins Roots, they can claim their existing placeholder profile via /dummy-profiles/:id/claim.")
add_bullet("Atomic Relationship Migration", "Under an ACID database transaction, all established graph edges pointing to or originating from the dummy profile are instantly transferred to the claiming user. The dummy profile is marked INACTIVE/CLAIMED, and the original creator is notified.")
add_bullet("Exclusivity Rules & Conflict Detection", "Biological exclusivity constraints prevent silent overwriting. For instance, if a user already has an established biological FATHER or MOTHER, an incoming conflicting claim is detected and marked with a DISPUTED status, preventing data loss.")

add_header("3.4 Stage 4: Dynamic Family Graph & Interactive Family Tree", level=2)
add_p("Stage 4 translates discrete relationship records into an interconnected mathematical graph and renders it as an interactive visual tree.")
add_bullet("Derived Graph Architecture", "The platform avoids rigid database tree columns (e.g., fatherId, motherId). Instead, the relationship graph acts as the single source of truth, and tree visualizations are dynamically derived on demand.")
add_bullet("BFS Family Graph Engine (buildFamilyGraph)", "A server-side Breadth-First Search traversal mechanism exploring connected family networks up to 6 depths, assembling nodes, edges, and dual-directed adjacency maps.")
add_bullet("Interactive React Flow Canvas", "Renders family nodes with pan, zoom, expand/collapse branch controls, custom cards displaying cultural surnames, and animated edges for disputed ties.")
add_bullet("Explore Family Navigation", "Enables users to pivot between relatives, inspect ancestral branches, and open detailed family member profiles directly from canvas nodes.")

add_header("3.5 Stage 5: 'How Are We Related?' & Path Highlighting", level=2)
add_p("Stage 5 provides graph-intelligence calculations to explain the exact kinship path between any two individuals in the network.")
add_bullet("Shortest-Path BFS Traversal (findRelationshipPath)", "Calculates the minimal connecting path between the authenticated user and any selected relative node.")
add_bullet("Natural Kinship Translation", "Converts multi-hop edge sequences into intuitive cultural terminology (e.g., Father -> Brother -> Son translates to 'Cousin'; Mother -> Brother translates to 'Uncle'; Parent -> Parent translates to 'Grandparent').")
add_bullet("Interactive Path Highlighting", "When a user views a connection in the family tree, the canvas dynamically highlights the exact sequence of connecting nodes and relational edges while dimming unrelated family branches.")

# ==================== SECTION 4: ADVANCED FEATURES (PHASE 3 & BEYOND) ====================
add_header("4. Advanced Social & Heritage Features (Phase 3)", level=1)
add_p("Beyond the core 5-stage lineage engine, Roots implements advanced social collaboration, shared timelines, and gathering coordination modules:")

add_header("4.1 Family Timeline & Generational Milestones", level=2)
add_bullet("Three Dedicated Entry Types", "Distinguishes between everyday social POSTS, generational MILESTONES (births, graduations, weddings, anniversaries), and EVENT_MEMORIES (multimedia gathering recaps).")
add_bullet("Historical Date Chronology", "Users can assign historical dates (spanning years 1900 to 2100) independent of the database upload timestamp, allowing authentic chronological sorting of family history.")
add_bullet("Relative Tagging", "Enables tagging multiple connected relatives in specific milestone cards and photographs.")
add_bullet("Aggregated Me-Timeline", "An intelligent feed aggregator that merges personal updates, milestones from all connected graph relatives (up to depth 10), and participated family events into one chronological stream.")
add_bullet("Granular Visibility", "Supports FAMILY (lineage restricted) and PUBLIC visibility scopes.")

add_header("4.2 Family Gathering Events & RSVP Coordination", level=2)
add_bullet("Event Creation & Host Controls", "Family hosts can schedule gatherings with date, human-readable time strings (e.g., '7:00 PM'), venue/location, and descriptive agendas.")
add_bullet("Direct Relative Invitations", "Hosts can invite any number of connected relatives from their family tree, triggering instant EVENT_INVITATION notifications.")
add_bullet("4-Tier RSVP Protocol", "Invitees can declare attendance as GOING, INTERESTED, CANT_GO, or leave as PENDING.")
add_bullet("Live RSVP Headcount Analytics", "Event detail dashboards display real-time attendee tallies across all 4 categories with dedicated attendee rosters.")
add_bullet("Event Memories Integration", "Allows attaching timeline posts and reunion memories directly to completed family events.")

add_header("4.3 Graph-Powered Family Suggestions ('People You May Know')", level=2)
add_bullet("Graph Proximity Discovery", "Scans the family graph from topological depth 2 to 4 to identify distant relatives who do not yet have direct relationship edges.")
add_bullet("Kinship Reasoning Explanation", "Provides human-readable justifications explaining why the suggestion was made (e.g., 'Your father's brother's son') along with intermediate relative names.")
add_bullet("Proximity Ranking", "Ranks recommendations so that closer relatives (2 hops away) appear before distant extended family (4 hops away).")

add_header("4.4 Social Interaction & Notification Engine", level=2)
add_bullet("Activity Feed Interactions", "Supports full post publishing, image attachment previews, threaded comments, and toggleable likes with unique per-user persistence.")
add_bullet("9 In-App Notification Triggers", "Covers relationship requests, acceptances, declines, verifications, dispute alerts, dummy profile claims, and event invitations/RSVP updates.")
add_bullet("Member Search Directory", "Real-time query bar filtering active platform members by personal name and ancestral family surname.")

# ==================== SECTION 5: COMPLETE DATABASE SCHEMA ====================
add_header("5. Comprehensive Database Schema (Prisma Models & Enums)", level=1)
add_p("The database architecture consists of 10 primary models and 7 enums in PostgreSQL, maintained through Prisma ORM:")

db_t_headers = ["Model Name", "Primary / Unique Keys", "Key Fields & Enumerations", "Relationships & Integrity Rules"]
db_t_rows = [
    ["User", "id (CUID), unique email", "name, passwordHash, regionOfOrigin, motherTongue, familySurname, surnameOrigin, casteSubcaste, accountType ('REAL'|'DUMMY'), accountState ('ACTIVE'|'INACTIVE'|'CLAIMED')", "1-N Requests (Sent/Received), 1-N Relationships (From/To), 1-N Posts, 1-N Comments, 1-N Likes, 1-N Events."],
    ["DummyProfileMeta", "id (CUID), unique userId", "userId, createdById, claimState ('UNCLAIMED'|'CLAIMED')", "1-1 relation with User (Cascade Delete), 1-N relation with User as creator."],
    ["RelationshipRequest", "id (CUID)", "requesterId, recipientId, relationshipType (13 types), status ('PENDING'|'ACCEPTED'|'REJECTED'), message", "References requester User and recipient User."],
    ["Relationship", "id (CUID), Unique [userId, relatedUserId, relationshipType]", "userId, relatedUserId, relationshipType, status ('ACCEPTED'|'VERIFIED'|'DISPUTED')", "Direct edge and reverse edge between two User nodes."],
    ["Notification", "id (CUID), recipientId idx", "recipientId, type (9 types), title, body, entityId, entityType, read (boolean)", "Belongs to recipient User; tracks read/unread states."],
    ["Post", "id (CUID), authorId idx", "authorId, content, imageUrl, entryType ('POST'|'MILESTONE'|'EVENT_MEMORY'), title, eventDate, visibility ('FAMILY'|'PUBLIC'), taggedUserIds", "References author User, 1-N Comments, 1-N Likes, Optional relation with FamilyEvent."],
    ["Comment", "id (CUID)", "postId, authorId, content, createdAt", "Cascade delete with Post, belongs to author User."],
    ["Like", "id (CUID), Unique [postId, userId]", "postId, userId, createdAt", "Composite unique key prevents multiple likes per user per post."],
    ["FamilyEvent", "id (CUID), hostId idx", "hostId, title, eventDate, eventTime, location, description", "Host references User, 1-N EventInvitee (Cascade Delete), 1-N Post (Attached Memories)."],
    ["EventInvitee", "id (CUID), Unique [eventId, userId]", "eventId, userId, rsvpStatus ('PENDING'|'GOING'|'INTERESTED'|'CANT_GO')", "Cascade delete with FamilyEvent, references invited User."]
]
create_table(db_t_headers, db_t_rows)

# ==================== SECTION 6: COMPLETE REST API DIRECTORY ====================
add_header("6. Complete RESTful API Endpoint Directory", level=1)
add_p("The backend exposes 28 structured, authenticated REST endpoints across 10 functional route controllers:")

api_t_headers = ["Router", "Method", "Endpoint Path", "Auth", "Functionality & Payload Details"]
api_t_rows = [
    ["Auth", "POST", "/auth/register", "No", "Registers a real user account with cultural attributes; returns user and JWT."],
    ["Auth", "POST", "/auth/login", "No", "Validates email and passwordHash; returns user object and signed 7-day JWT."],
    ["Auth", "POST", "/auth/logout", "Yes", "Stateless logout acknowledgment endpoint."],
    ["Auth", "GET", "/auth/me", "Yes", "Retrieves current authenticated user's session profile."],
    ["Users", "GET", "/users/me", "Yes", "Fetches full profile attributes including cultural heritage fields."],
    ["Users", "PATCH", "/users/me", "Yes", "Updates cultural origins, mother tongue, native surname, and bio."],
    ["Users", "GET", "/users/search", "Yes", "Query param ?q= searches users by personal name or family surname."],
    ["Users", "GET", "/users/:id", "Yes", "Fetches another family member's public profile information."],
    ["Relationships", "POST", "/relationships/requests", "Yes", "Sends connection request; runs biological exclusivity conflict detection."],
    ["Relationships", "GET", "/relationships/requests", "Yes", "Retrieves incoming (?type=received) or outgoing (?type=sent) requests."],
    ["Relationships", "PATCH", "/relationships/requests/:id", "Yes", "Accepts/rejects request; auto-creates bidirectional inverse edges under transaction."],
    ["Relationships", "GET", "/relationships", "Yes", "Lists all active confirmed relationship edges for the logged-in user."],
    ["Relationships", "GET", "/relationships/:id", "Yes", "Retrieves single relationship detail with user verification checks."],
    ["Relationships", "PATCH", "/relationships/:id/verify", "Yes", "Upgrades relationship status from ACCEPTED to VERIFIED; notifies relative."],
    ["Relationships", "GET", "/relationships/path/:userId", "Yes", "Runs BFS to compute shortest connecting path and natural language label."],
    ["Family", "GET", "/family", "Yes", "Assembles full family graph and serializes into React Flow nodes and edges."],
    ["Dummy Profiles", "POST", "/dummy-profiles", "Yes", "Creates placeholder relative with immediate verified bidirectional edges."],
    ["Dummy Profiles", "GET", "/dummy-profiles/:id", "Yes", "Fetches dummy profile details and creator metadata."],
    ["Dummy Profiles", "POST", "/dummy-profiles/:id/claim", "Yes", "Transfers dummy edges to claimant under ACID transaction; deactivates dummy."],
    ["Posts", "GET", "/posts", "Yes", "Fetches community feed posts with hasLiked booleans and like/comment counts."],
    ["Posts", "POST", "/posts", "Yes", "Publishes a new community post with optional imageUrl."],
    ["Posts", "DELETE", "/posts/:id", "Yes", "Deletes a post (restricted to author)."],
    ["Posts", "POST", "/posts/:id/like", "Yes", "Toggles like state on a post."],
    ["Posts", "GET", "/posts/:id/comments", "Yes", "Retrieves threaded comments for a post."],
    ["Posts", "POST", "/posts/:id/comments", "Yes", "Publishes a comment on a post."],
    ["Timeline", "POST", "/timeline", "Yes", "Creates milestone or memory entry with custom historical eventDate."],
    ["Timeline", "GET", "/timeline/me", "Yes", "Aggregates personal posts, connected graph relatives' updates, and family events."],
    ["Timeline", "GET", "/timeline/user/:userId", "Yes", "Fetches another relative's timeline milestone entries."],
    ["Timeline", "DELETE", "/timeline/:id", "Yes", "Deletes timeline entry (restricted to author)."],
    ["Timeline", "POST", "/timeline/:id/like", "Yes", "Toggles like state on a timeline milestone."],
    ["Timeline", "GET", "/timeline/:id/comments", "Yes", "Retrieves comments on a timeline milestone."],
    ["Timeline", "POST", "/timeline/:id/comments", "Yes", "Publishes a comment on a timeline milestone."],
    ["Events", "POST", "/events", "Yes", "Creates family gathering and dispatches EVENT_INVITATION to invitees."],
    ["Events", "GET", "/events", "Yes", "Retrieves hosted and invited events with categorized RSVP counts."],
    ["Events", "GET", "/events/:id", "Yes", "Fetches event detail, attendee roster, and attached timeline memories."],
    ["Events", "PATCH", "/events/:id/rsvp", "Yes", "Updates attendee RSVP (GOING, INTERESTED, CANT_GO) and notifies host."],
    ["Suggestions", "GET", "/suggestions", "Yes", "Runs 2-to-4 hop BFS to discover distant relatives with kinship explanations."],
    ["Notifications", "GET", "/notifications", "Yes", "Lists user notifications sorted chronologically with unread counters."],
    ["Notifications", "PATCH", "/notifications/:id/read", "Yes", "Marks a specific notification as acknowledged."]
]
create_table(api_t_headers, api_t_rows)

# ==================== SECTION 7: FRONTEND PAGE DIRECTORY ====================
add_header("7. Frontend Views & Interactive Page Directory", level=1)
add_p("The frontend application includes 19 dedicated views organized within the unified AppLayout navigation shell:")

fe_t_headers = ["View Component", "URL Route Path", "Key Functionality & User Experience"]
fe_t_rows = [
    ["LoginPage.tsx", "/login", "Credential entry form with client-side validation, error banners, and Zustand auth dispatch."],
    ["RegisterPage.tsx", "/register", "Full registration with multi-attribute cultural heritage inputs (region, tongue, surname)."],
    ["AppLayout.tsx", "Global Shell", "Responsive sidebar navigation, user badge, and live unread notification badge."],
    ["FeedPage.tsx", "/feed", "Main activity feed with post publisher, image preview, comments drawer, and likes."],
    ["FamilyTreePage.tsx", "/family-tree", "Interactive React Flow canvas displaying family nodes, relational edges, and status badges."],
    ["RelationshipsPage.tsx", "/relationships", "Active connections directory with verification badges and how-related shortcuts."],
    ["RelationshipRequestsPage.tsx", "/relationships/requests", "Tabbed interface for incoming and outgoing connection requests with accept/reject buttons."],
    ["HowRelatedPage.tsx", "/how-related/:userId", "Visual path breakdown showing intermediate nodes and relationship explanation."],
    ["FamilyTimelinePage.tsx", "/timeline", "Interactive heritage timeline filtering milestones, memories, and event records."],
    ["FamilyEventsPage.tsx", "/events", "Card grid of upcoming and past family reunions with RSVP selectors and creation modal."],
    ["EventDetailPage.tsx", "/events/:id", "Full event itinerary, participant roster categorized by RSVP, and attached memories."],
    ["DummyProfilesPage.tsx", "/dummy-profiles", "Directory of offline family profiles with creation form and claim action."],
    ["FamilySuggestionsPage.tsx", "Tab / Standalone", "Card grid of graph-recommended relatives with kinship path explanations."],
    ["ProfilePage.tsx", "/profile", "Personal profile overview with ancestral identity summary."],
    ["EditProfilePage.tsx", "/profile/edit", "Form for editing cultural roots, mother tongue, and native regions."],
    ["UserProfilePage.tsx", "/users/:id", "Public view of a family member's lineage and heritage attributes."],
    ["SearchPage.tsx", "/search", "Real-time query bar filtering platform users by name and ancestral surname."],
    ["NotificationsPage.tsx", "/notifications", "Notification list with read-filtering and direct links to relevant entities."],
    ["ActivityFeedPage.tsx", "Alternative Feed", "Detailed audit and activity stream for family updates."]
]
create_table(fe_t_headers, fe_t_rows)

# ==================== SECTION 8: ROADMAP & FUTURE EXPANSION ====================
add_header("8. Roadmap & Phased Implementation Status", level=1)
add_bullet("Phase 1: Core Family Network (COMPLETE)", "Authentication, cultural profiles, 13 relationship types, requests, inverse mapping, verification, dummy profiles, claim flow, React Flow tree, BFS path finder, path highlighting, and notifications.")
add_bullet("Phase 2: Relational Graph Governance (COMPLETE)", "Exclusivity conflict resolution, disputed relationship tracking, and bidirectional edge consistency under ACID transactions.")
add_bullet("Phase 3: Shared Heritage & Event Coordination (COMPLETE)", "Family timeline, generational milestones, custom historical dates (1900-2100), family gathering events, 4-tier RSVP engine, and graph-powered kinship suggestions.")
add_bullet("Phase 4: Media Vault & Family Archives (ROADMAP)", "Direct S3/Cloudinary multi-photo and video uploads, family photo albums, genealogical document archival (birth/marriage certificates), and automated face tagging.")
add_bullet("Phase 5: Real-Time Communication & Native Mobile (ROADMAP)", "WebSocket-based live group family chat, real-time push notifications, native iOS/Android applications built with React Native, and family video calls.")

# Save document
output_path = r"c:\Users\reddy\0projects\Roots\Family_Social_Network_Complete_Project_Specification.docx"
doc.save(output_path)
print(f"Master DOCX successfully written to: {output_path}")
