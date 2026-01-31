# Prompt: Build “Work For All” — A Community-Based Job Platform for the Homeless

You are an all-knowing AI software architect, designer, and engineer. Create **the entire production-ready web application** described below from this single prompt. Deliver a complete, secure, scalable, and accessible solution with clean code, documentation, and deployment instructions.

---

## App Name
**Work For All**

## Mission
Create a **simple, community-based job website** that helps homeless or underemployed individuals find **local, real-world work opportunities**, reducing reliance on panhandling or recycling cans. The platform must prioritize **ease of use, low friction, and accessibility for non-tech-savvy users**.

---

## Core Principles
- Extremely simple UI/UX
- Minimal required steps to get started
- Mobile-first, responsive design
- No platform-handled payments
- Community trust through reviews
- Privacy-respectful, low-barrier onboarding

---

## Primary User Types
1. **Workers** (people looking for work)
2. **Employers** (people offering jobs)

---

## Entry Flow (No Account Required Initially)
When a user first visits the website, show:

**Prompt:**  
> *“Are you looking for:”*  
> **[ Work ] [ Workers ]**

Next:
- Ask for location
  - Option A: Browser location permission popup
  - Option B: Manual location entry (city / ZIP)
- Continue without creating an account

---

## Worker Flow
### Browsing Jobs
- Workers can browse job listings **without an account**
- Jobs are filtered by location automatically
- Job listings show:
  - Job title
  - Pay rate
  - Duration
  - Number of workers needed
  - Date & time
  - Location
  - Tags (e.g. painting, moving, cleaning)
  - Transportation info:
    - “Provides Transportation” or
    - “Does Not Provide Transportation”

### Profile Creation (Required to Apply)
Workers must create a profile **only when applying**.

**Worker Profile Fields**
- Name or nickname
- Optional phone number
- Optional email
- Skills (selectable tags)
- Transportation tag:
  - Needs Transportation
  - Has Transportation
- Past ratings & reviews

### Personalized Job Feed
If a worker has a profile:
- Show **best-matching jobs first** based on:
  - Skill tags
  - Transportation compatibility
  - Distance
- Less relevant jobs appear lower

---

## Employer Flow
### Posting a Job
Employers select “Looking for Workers” and can post a job.

**Job Posting Fields**
- Job title
- Description
- Pay (e.g. $25/hr)
- Duration (hours/days)
- Date & time
- Location
- Number of workers needed
- Category tags (painting, moving, cleaning, etc.)
- Transportation:
  - Provides Transportation
  - Does Not Provide Transportation

### Employer Profile
- Required phone number
- Optional email
- Past ratings & reviews

---

## Job Interaction Lifecycle
1. Employer posts job
2. Worker applies
3. Employer accepts worker
4. In-platform messaging enabled
5. Job is completed offline
6. Employer pays worker directly (outside platform)
7. Mutual reviews are submitted

---

## Messaging
- Secure in-platform messaging between accepted workers and employers
- Simple, text-only interface
- No external contact shown until acceptance

---

## Reviews & Ratings
- After job completion:
  - Worker rates employer (1–5 stars + written review)
  - Employer rates worker (1–5 stars + written review)
- Reviews are public and visible on profiles
- Design similar in spirit to Airbnb reviews

---

## Tags & Matching
### Job Tags
- Painting
- Moving
- Cleaning
- Yard work
- Construction
- General labor
- Custom tags allowed

### Worker Tags
- Skill categories
- Transportation status:
  - Needs Transportation
  - Has Transportation

Matching logic must consider:
- Skill overlap
- Transportation compatibility
- Location proximity

---

## Teli AI Integration (Prepare, Do NOT Activate)
Do **NOT** integrate Teli API yet, but architect the system so it can be added easily.

### Required Readiness
- Abstract notification system
- Worker contact records compatible with Teli
- Event triggers for:
  - New job postings matching worker skills
  - Job acceptance
  - Pending job decisions

### Intended Future Behavior
- Teli voice agent automatically calls workers when new matching jobs appear
- Workers can talk naturally to the Teli agent
- Via voice, workers can:
  - Ask for job details
  - Apply to jobs
  - Accept or decline job offers
- Any data available on the site must also be available to the Teli agent

Reference Teli docs for structure only:
https://docs.teli.ai/llms.txt

---

## Technical Requirements
- Full-stack web app
- Responsive (desktop + mobile)
- Accessible (WCAG-aware)
- Secure authentication for profiles
- Scalable database schema
- Clean separation of concerns
- Ready for future SMS/voice automation

---

## Deliverables
1. Complete frontend
2. Complete backend
3. Database schema
4. Matching & ranking logic
5. Review system
6. Messaging system
7. Deployment instructions
8. Clear documentation
9. Teli-ready integration layer (disabled)

---

## Success Criteria
The final app should feel:
- Friendly
- Trustworthy
- Extremely easy to use
- Built for real people in difficult situations

Build **everything** needed for this app from scratch.
