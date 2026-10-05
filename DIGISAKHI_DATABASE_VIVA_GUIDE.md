# DigiSakhi (डिजी सखी) — Complete Database & Viva Master Guide

> **Live Production Website:** [https://digisakhi-32j7.onrender.com](https://digisakhi-32j7.onrender.com)  
> **GitHub Repository:** [https://github.com/sachin-saroj/digisakhi](https://github.com/sachin-saroj/digisakhi)  
> **Printable PDF Version:** Open `DIGISAKHI_DATABASE_VIVA_GUIDE.html` in Chrome and press `Ctrl + P`.

---

## 💡 Viva Dene Se Pehle Yeh Baat Yaad Rakho (Confidence Booster)
Bhai, tumhara project **100% complete aur internet par live** hai!
- Database **AWS Cloud (Tokyo)** par 24/7 chal raha hai.
- Website **Render.com** par live globally accessible hai.
- **Drizzle Studio** tumhare laptop me chal raha hai jahan live rows refresh hoti hain.
- Tumhare paas 21/21 passing automated tests hain.

Ma'am jo bhi puchein, tumhare paas screen pe dikhane ke liye real proof hai. Darna bilkul nahi hai!

![Live Website](./images/live_website.png)
*Screenshot 1: Live DigiSakhi Website on Render (https://digisakhi-32j7.onrender.com)*

---

## 1. Sabse Bada Sawal: "Database Kahan Hai?"

College students aksar sochte hain ki database unke laptop ke kisi folder me hoga (jaise `C:\digisakhi\database.sql`). **Lekin modern web applications mein aisa nahi hota!**

### ❓ Concept: DigiSakhi Ka Database Kahan Rehta Hai?
* **Simple Bhasha:** Hamara database hamare laptop me nahi hai. Hamara database **Amazon Web Services (AWS)** ke **Tokyo (Japan)** data center mein **TiDB Cloud** par 24/7 live chal raha hai.
* **English Answer:** *"Our database is not stored on localhost. It is a cloud-hosted Serverless MySQL cluster managed on TiDB Cloud within the AWS Tokyo (ap-northeast-1) region."*

![TiDB Cluster Overview](./images/media_1791209274061.png)
*Screenshot 2: TiDB Cloud Cluster Overview — AWS Tokyo (ap-northeast-1), Status: Active*

### 🤔 Agar Ma'am puchein: "Cloud database kyun use kiya? Local MySQL kyun nahi?"
* **Aapka Jawab:** *"Ma'am, local MySQL sirf mere laptop pe chalta. Kyunki hamara project Render par live deployed hai (`https://digisakhi-32j7.onrender.com`), agar koi SHG member apne mobile se login karegi ya scam report karegi, toh local database access nahi ho sakta. TiDB Cloud ki wajah se data kisi bhi device se instantly AWS Cloud par save hota hai."*

![TiDB Connection Parameters](./images/media_1791209468836.png)
*Screenshot 3: TiDB Cloud Database Connection Parameters (Host, Port 4000, Username)*

---

## 2. Ma'am Ke 4 Sabse Important Sawal & Exact Script (Word-to-Word)

### 📌 Sawal 1: "Database kahan hai? Mujhe samne live dikhao!"
* **Aap kya karoge:** Browser me Drizzle Studio tab khologe (`https://local.drizzle.studio`).
* **Aap bologe:**  
  > *"Ma'am, hamara database **TiDB Cloud (AWS Tokyo)** par hosted hai. Aur usko visual inspect karne ke liye hum **Drizzle Studio** use karte hain. Dekhiye, yeh hamare database ke saare 8 tables hain: `users`, `modules`, `incident_reports`, `learning_progress`, `quiz_attempts`, `forum_posts`, `forum_replies`, aur `announcements`."*

*(Agar Drizzle Studio terminal me band ho gaya ho, to yeh command chalao: `pnpm drizzle-kit studio`)*

---

### 📌 Sawal 2: "Data frontend se database tak kaise pahuchta hai? Workflow samjhao."
* **Aap bologe:**  
  > *"Ma'am, data 5 simple steps mein frontend se cloud database tak travel karta hai:*  
  > *1. **User Action (Frontend):** User website pe form bharta hai (e.g. Incident Report ya Quiz).*  
  > *2. **tRPC Mutation:** React app type-safe tRPC procedure call karti hai (`trpc.digisakhi.submitIncident`).*  
  > *3. **Express Server:** Hamara Node.js server request receive karta hai aur Zod schema se input validate karta hai.*  
  > *4. **Drizzle ORM:** Drizzle ORM JavaScript function ko parameterized SQL INSERT query me convert karta hai.*  
  > *5. **TiDB Cloud:** Query TLS/SSL encrypted connection ke through AWS Tokyo database me execute hoti hai aur row save ho jati hai."*

---

### 📌 Sawal 3: "Database me kaun-kaun se tables hain aur kisme kya store hota hai?"

| Table Name | Kisme Kya Save Hota Hai | Real Example |
| :--- | :--- | :--- |
| `users` | User account, role, SHG group name, language | Role: 'user' / 'admin', Lang: 'hi' |
| `modules` | Cyber awareness lessons & quizzes (Hindi + English) | UPI Security, Phishing Scam lessons |
| `learning_progress` | Har user ne kaunsa module complete kiya aur score | userId: 1, moduleId: 'upi-safety', score: 3 |
| `quiz_attempts` | User ke quiz answers ka poora audit log | userId: 1, answers: '[{"q1": "A"}]' |
| `incident_reports` | Cyber fraud/harassment complaints (Anonymous) | category: 'UPI Scam', status: 'New' |
| `forum_posts` | SHG members ke questions aur safety warnings | "Gaon me naya fake lottery message aaya hai" |
| `forum_replies` | Forum posts par dusri sakhis ke replies | "Is number ko block kar do" |
| `announcements` | Admin / Coordinator dwara urgent alerts | "Warning: Bank kabhi OTP nahi mangta" |

---

## 3. The 2-Minute Killer Live Demo (Full Marks Guaranteed!)

Jab Ma'am kahein **"Mujhe live data save karke dikhao"**, toh yeh 5 steps follow karo:

1. **Tab 1 Kholo: Drizzle Studio**  
   Browser me jao: `https://local.drizzle.studio`  
   Left sidebar me se `incident_reports` table par click karo. Dikhayein ki abhi kya data hai.

2. **Tab 2 Kholo: DigiSakhi Live Website**  
   Browser me new tab kholo: [https://digisakhi-32j7.onrender.com](https://digisakhi-32j7.onrender.com) (ya apne phone me khol ke dikhao!).

3. **Live Form Bharo (Report an Incident)**  
   Home page par **"Safety Toolkit"** section me jao ➔ **"Report an Incident"** par click karo.  

![Incident Modal](./images/report_modal.png)
*Screenshot 4: Incident Reporting Dialog on Live Website*

   - Category: `Fake UPI QR / Payment Request`  
   - Description: `Received fake 500 cashback QR on WhatsApp`  
   - Anonymous: Checked (Yes)  
   - Click **"Submit report"**  
   *(Website par popup aayega: "Report Submitted Successfully!")*

4. **Tab 1 (Drizzle Studio) Par Wapas Aao**  
   Top-right me **Refresh (गोल तीर 🔄)** icon par click karo.  
   ⚡ **BOOM!** Table me nayi row add ho chuki hai! Category: `Fake UPI QR / Payment Request`, Status: `New`, Timestamp: Current Time!

5. **Ma'am Ko Yeh Line Bolo:**  
   > *"Dekhiye Ma'am, jaise hi maine Render par live website se incident report submit kiya, Drizzle ORM ne use hamare TiDB Cloud cluster me instantly write kar diya aur hume bina page reload kiye naya record yahan display ho gaya!"*

![Member Sign In](./images/signin_modal.png)
*Screenshot 5: Member & Admin Authentication Modal*

---

## 4. VS Code Mein Kaunsi File Kholkar Kya Dikhana Hai?

| File Path | Is File Mein Kya Hai? | Ma'am Ko Kya Line Dikhani Hai? |
| :--- | :--- | :--- |
| `.env` | Database Connection String | Line 2: `DATABASE_URL="mysql://3iybbhkz3wcgD4S.root:***@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test"` |
| `drizzle/schema.ts` | Database Schema & Tables | Line 16: `export const users = mysqlTable(...)`<br>Line 71: `export const incidentReports = mysqlTable(...)` |
| `server/db.ts` | SSL Cloud Connection Pool | Line 21: `drizzle({ connection: { uri, ssl } })` (TLS encryption for cloud) |
| `server/routers/digisakhi.ts` | Data Save Karne Ka Backend Code | Line 144: `db.insert(incidentReports).values(...)`<br>Line 115: `db.insert(learningProgress).values(...)` |

![Render Deploys](./images/media_1791212610676.png)
*Screenshot 6: Render.com Cloud Deployment Dashboard for DigiSakhi*

---

## 5. Quick Technical Cheat Sheet (5-Minute Viva Revision)

* **Database Name:** TiDB Serverless (MySQL 8.0 compatible distributed database)
* **Cloud Provider:** AWS (Amazon Web Services), Region: Tokyo (`ap-northeast-1`)
* **ORM Library:** Drizzle ORM (TypeScript-first type-safe ORM)
* **Backend Framework:** Express 4 + tRPC v11 (Type-safe RPC API)
* **Frontend:** React 19 + Vite + TailwindCSS
* **Deployment:** Render.com (Web Service, auto-deploy from GitHub)
* **Total Tables:** 8 Tables (`users`, `modules`, `learning_progress`, `quiz_attempts`, `incident_reports`, `forum_posts`, `forum_replies`, `announcements`)
