# DigiSakhi (डिजी सखी) — 5 Master Viva Questions (Super Simple Language)

> **Database:** Local File-Based SQLite (`digisakhi.db`) — Zero Cloud Dependency, 100% Offline  
> **ORM & Viewer:** Drizzle ORM + Drizzle Studio (`pnpm drizzle-kit studio`)  
> **GitHub Repository:** [https://github.com/sachin-saroj/digisakhi](https://github.com/sachin-saroj/digisakhi)  

---

## 🎯 5 Master Questions Jo External Examiner Puchega:

---

### ❓ QUESTION 1: "Database Kaunsa Hai Aur Kahan Hai?" (Where is the Database?)

#### 👶 Simple Example:
Jaise ek diary ya register aapke bag ke andar rehta hai aur bina internet ke bhi aap usme likh sakte ho, bilkul waise hi hamara database kisi doosri website ya cloud par nahi hai. Hamara database project folder ke andar **`digisakhi.db`** file ke roop mein **SQLite Database** hai!

#### 📁 Project Mein Kahan Hai?
VS Code mein file explorer dekhiye:
- File Name: **`digisakhi.db`** (Root directory)
- Engine: **SQLite (via better-sqlite3)**

#### 🗣️ External Ko Yeh Bolo (Word-to-Word):
> *"Sir, hamara database lightweight, high-performance file-based **SQLite** hai jo project ke root folder mein `digisakhi.db` file ke roop mein save hota hai. Iske liye kisi 2nd website ya external cloud server ki zaroorat nahi padti — yeh 100% offline aur standalone chalta hai."*

---

### ❓ QUESTION 2: "Code Mein Kahan Hai? Aur Data Save Kaise Ho Raha Hai?"

#### 👶 Register (Diary) Example:
1. **Register ka Format (Columns):** Kisne banaya? ➔ **`drizzle/schema.ts`** ne!
2. **Pen se entry kisne ki (Save kiya):** ➔ **`server/db.ts`** ne!
3. **Diary kahan store hui:** ➔ **`digisakhi.db`** file ke andar!

#### 📁 Code Ki 3 Main Files:

1. **`drizzle/schema.ts` — Tables Ka Design (Blueprint):**  
   Yahan sabhi 8 tables (`users`, `incident_reports`, `modules`, `learning_progress`, etc.) SQLite schema ke roop mein define hain.

2. **`server/db.ts` — ACTUAL SAVE CODE:**  
   ```ts
   const [created] = await db.insert(incidentReports).values(input).returning();
   ```
   👉 Examiner ko dikhana: *"Sir, yeh dekhiye `db.insert(incidentReports).values(input).returning()` — yahi code frontend ke form data ko `digisakhi.db` file mein save karta hai."*

3. **`server/routers/digisakhi.ts` — tRPC API Router:**  
   Frontend se aane wale data ko Zod schema se validate karke `server/db.ts` ke functions ko bhejta hai.

---

### ❓ QUESTION 3: "Data Flow Kaise Karta Hai?" (Workflow)

```
[1. User Form] ➔ Sakhis ne incident report ka form bhara
       ↓
[2. tRPC Router] ➔ Input data validate hua (Validation via Zod)
       ↓
[3. Drizzle ORM] ➔ TypeScript object SQL Query mein convert hua
       ↓
[4. digisakhi.db] ➔ Local SQLite database file mein instantly write ho gaya!
```

#### 🗣️ External Ko Yeh Bolo:
> *"Sir, workflow yeh hai: React Frontend Form ➔ tRPC Type-safe Router ➔ Express Validation ➔ Drizzle ORM ➔ `digisakhi.db` SQLite File. Poora flow type-safe hai aur 0 millisecond latency ke sath locally save hota hai."*

---

### ❓ QUESTION 4: "Database Mein Kitne Tables Hain Aur Kya Kaam Hai?"

Total **8 Normalized Tables** hain jo 3 aasan groups mein aate hain:

| Category | Tables | Kaam Kya Hai? |
| :--- | :--- | :--- |
| **1. Education** | `users`, `modules`, `learning_progress`, `quiz_attempts` | Sakhis ki profile, cyber safety ke lessons, score aur quiz history track karna. |
| **2. Reporting** | `incident_reports` | Cyber fraud aur scam ki gupt (anonymous) shikayatein darj karna. |
| **3. Community** | `forum_posts`, `forum_replies`, `announcements` | Sakhis ke aapsi sawaal-jawab aur Admin dwara emergency security alerts. |

---

### ❓ QUESTION 5: "Screen Par Live Data Save Karke Dikhao!" (The Live Demo)

Jab examiner kahe: *"Mujhe database open karke dikhao aur data save hota hua dikhao"*:

#### 1️⃣ Terminal Mein Command Chalao:
```bash
pnpm drizzle-kit studio
```

#### 2️⃣ Browser Mein Drizzle Studio Kholo:
URL: `https://local.drizzle.studio`  
Left panel mein `incident_reports` table par click karo. Saari rows Excel sheet ki tarah dikhengi.

#### 3️⃣ Website Par Ek Nayi Report Submit Karo:
Website par "Report Incident" form bharo aur Submit dabao.

#### 4️⃣ Drizzle Studio Refresh Karo:
Refresh button dabate hi naya record instantly screen par #1 par add ho jayega!

#### 🗣️ Winning Line:
> *"Sir dekhiye, jaise hi website se form submit hua, Drizzle ORM ne us data ko seedha local `digisakhi.db` SQLite database file mein save kar diya aur Drizzle Studio ne use real-time display kar diya!"*
