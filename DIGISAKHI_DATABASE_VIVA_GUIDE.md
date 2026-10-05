# DigiSakhi (डिजी सखी) — 5 Master Viva Questions (10 Saal Ke Bachhe Jaisi Simple Language)

> **Live Production URL:** [https://digisakhi-32j7.onrender.com](https://digisakhi-32j7.onrender.com)  
> **GitHub Repository:** [https://github.com/sachin-saroj/digisakhi](https://github.com/sachin-saroj/digisakhi)  
> **Printable PDF Version:** Open `DIGISAKHI_DATABASE_VIVA_GUIDE.html` in Chrome and press `Ctrl + P`.

---

## 🎯 5 Master Questions Jo Ma'am Puchegi:

---

### ❓ QUESTION 1: "Database Kahan Hai?" (Where is the Database?)

#### 👶 10 Saal Ke Bachhe Jaisa Example:
Jaise tumhare phone ki photos tumhare phone ke tootne par bhi delete nahi hoti kyunki wo **Google Drive / Cloud** par save rehti hain, bilkul waise hi hamara database laptop ke kisi folder me nahi hai. Hamara database **AWS (Amazon)** ke **Tokyo (Japan)** cloud data center mein **TiDB Cloud** par 24/7 chal raha hai!

#### 📁 Code Mein Kahan Hai?
VS Code mein `.env` file kholo aur Line 2 dikhao:
```env
DATABASE_URL="mysql://3iybbhkz3wcgD4S.root:***@gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/test"
```
👉 Yahan dekho: `gateway01.ap-northeast-1.prod.aws.tidbcloud.com` ka matlab hai **AWS Tokyo (ap-northeast-1)**. Port: `4000`.

#### 📸 Proof Screenshots:
![TiDB Cloud Cluster Overview](./images/media_1791209274061.png)
*TiDB Cloud: Cluster 'digisakhi' | Cloud: AWS | Region: Tokyo (ap-northeast-1) | Status: Active*

![TiDB Cloud Parameters](./images/media_1791209468836.png)
*TiDB Connect Popup: Host, Port 4000, Username matching Line 2 of .env.*

#### 🗣️ Ma'am Ko Yeh Bolo (Word-to-Word):
> *"Ma'am, hamara database local computer par nahi hai. Hamara database **Amazon Web Services (AWS)** ke **Tokyo region** mein **TiDB Cloud Serverless** par hosted hai. Humne cloud database isliye use kiya kyunki hamari website Render par globally live hai (`https://digisakhi-32j7.onrender.com`), taaki koi bhi Sakhi apne phone se report submit kare toh data instantly cloud database me save ho sake."*

---

### ❓ QUESTION 2: "File Mein Kahan Hai Code? Aur Data Save Kahan Ho Raha Hai?"

#### 👶 10 Saal Ke Bachhe Jaisa Example:
Socho school mein ek **Register (Diary)** hoti hai:
1. Diary ka layout/columns (Roll No, Name, Fees) kisne banaya? ➔ **`schema.ts`** ne!
2. Diary mein pen se naam kisne likha (save kiya)? ➔ **`server/db.ts`** ne!
3. Aur likhne ke baad diary kahan rakhi gayi? ➔ **TiDB Cloud ke AWS Tokyo locker** mein!

#### 📁 Code Ki 3 Files Aur Unki Exact Lines:

1. **`drizzle/schema.ts` (Line 16 & Line 71) — Table Ka Design (Blueprint):**  
   Line 71 par `incidentReports = mysqlTable("incident_reports", { ... })` likha hai. Yeh batata hai ki table mein `id`, `description`, `category`, `anonymous`, aur `status` ke columns honge.

2. **`server/db.ts` (Line 160) — 👈 ACTUAL SAVE LINE!**  
   Yahan data actually database mein insert hota hai:
   ```ts
   const result = await db.insert(incidentReports).values(input);
   ```
   👉 Ma'am ko dikhana: *"Ma'am, yeh line 160 dekhiye: `db.insert(incidentReports).values(...)` — yahi wo code hai jo website ke form data ko SQL query bana kar TiDB Cloud database ke andar save karta hai!"*

3. **`server/routers/digisakhi.ts` (Line 202-223) — tRPC API Route:**  
   Line 202 par `reportIncident` procedure hai jo frontend se data receive karke `server/db.ts` ke function ko deta hai.

#### 📸 Code Proof Screenshot:
![Exact Code Flow](./images/step_code_insert.png)
*Top: Table Definition in schema.ts | Bottom: Actual Save line db.insert() in server/db.ts Line 160.*

#### 🗣️ Ma'am Ko Yeh Bolo (Word-to-Word):
> *"Ma'am, code 3 files mein divide hai:  
> 1. `drizzle/schema.ts` mein humne saare tables ka structure define kiya hai.  
> 2. `server/routers/digisakhi.ts` tRPC API route hai jo frontend se data receive karta hai.  
> 3. `server/db.ts` ke Line 160 par `db.insert(incidentReports).values(input)` function data ko permanently cloud database mein insert karta hai."*

---

### ❓ QUESTION 3: "Workflow Kya Hai? Frontend Se Database Tak Data Kaise Jata Hai?"

#### 👶 10 Saal Ke Bachhe Jaisa Example:
Socho tumne Zomato par pizza order kiya:
1. Tumne phone mein button dabaya (Frontend)
2. Zomato ke office message gaya (Backend Express API)
3. Delivery boy kitchen se nikal gaya (Drizzle ORM)
4. Pizza plate mein aa kar save ho gaya (TiDB Cloud Database)

#### 🔄 The 5-Step Exact Technical Pipeline:
1. **Step 1 (User Action):** Sakhi website par "Report an incident" form bharti hai aur "Submit report" dabati hai.
2. **Step 2 (tRPC Call):** React frontend `trpc.digisakhi.reportIncident.useMutation()` call karta hai.
3. **Step 3 (Server Validation):** Express server request receive karke Zod schema se text aur category validate karta hai.
4. **Step 4 (ORM Translation):** `server/db.ts` mein Drizzle ORM JavaScript object ko SQL query banata hai: `INSERT INTO incident_reports...`
5. **Step 5 (Cloud Storage):** Query internet par travel karke **AWS Tokyo TiDB Cloud** ke disk par permanently save ho jati hai aur auto-incremented ID return hoti hai!

#### 🗣️ Ma'am Ko Yeh Bolo (Word-to-Word):
> *"Ma'am, data ka workflow yeh hai: React Frontend Form ➔ tRPC Type-safe Client ➔ Express Node.js Server (Validation) ➔ Drizzle ORM (SQL Query Generator) ➔ TiDB Cloud (AWS Tokyo). Yeh poora pipeline encrypted TLS/SSL connection par chalta hai."*

---

### ❓ QUESTION 4: "Database Kaise Use Ho Raha Hai? All 8 Tables Ka Kya Kaam Hai?"

#### 👶 10 Saal Ke Bachhe Jaisa Example:
Jaise ek school mein alag-alag registers hote hain: ek Attendance ka, ek Marks ka, ek Complaint box ka, aur ek Notice board ka — waise hi hamare database mein alag-alag kaam ke liye **8 alag-alag tables** bane hain!

| Table Name | Kisme Kya Save Hota Hai? | Real Life Example |
| :--- | :--- | :--- |
| `users` | User profile, role ('user'/'admin'), SHG group, language | Radha Devi (Member), Sakhi Coordinator (Admin) |
| `modules` | Cyber awareness lessons & quiz questions | UPI Safety, Phishing Scams, Privacy |
| `learning_progress` | Kis user ne kaunsa module complete kiya aur score | User 1 ne UPI Safety complete kiya, Score: 3/3 |
| `quiz_attempts` | Har quiz attempt ke detailed answers ka audit log | Q1: Option B, Q2: Option A (Timestamp ke sath) |
| `incident_reports` | Cyber fraud/scam complaints (Anonymous) | "Fake 500 cashback QR mila WhatsApp par" |
| `forum_posts` | Sakhis ke sawaal aur scam warnings | "Gaon me naya electricity bill scam chal raha hai" |
| `forum_replies` | Posts par dusri sakhis ke helpful answers | "Kisi ko OTP mat dena, 1930 pe call karo" |
| `announcements` | Admin dwara bheje gaye urgent security alerts | "Urgent Alert: Fake PM Awas Yojana links se bachein" |

#### 🗣️ Ma'am Ko Yeh Bolo (Word-to-Word):
> *"Ma'am, database mein 8 normalized tables hain. Education ke liye `modules` aur `learning_progress` hai, incident tracking ke liye `incident_reports` hai, community support ke liye `forum_posts` aur `replies` hai, aur admin broadcasting ke liye `announcements` table use hota hai."*

---

### ❓ QUESTION 5: "Khol Ke Dikhao Sab Kuch Live! (The Live Demonstration)"

Jab Ma'am kahein **"Mujhe samne screen par sab kuch dikhao aur live data save karke dikhao"**, toh yeh 4 windows kholna:

#### 1️⃣ Window 1: Terminal Kholkar Command Run Karo
VS Code me Terminal kholo aur likho: `pnpm drizzle-kit studio`  
![Terminal Output](./images/step1_terminal.png)

#### 2️⃣ Window 2: Chrome Mein Drizzle Studio Kholo
URL: `https://local.drizzle.studio` ➔ Left side mein `incident_reports` table par click karo.  
![Drizzle Studio](./images/step2_drizzle_studio.png)

#### 3️⃣ Window 3: Live Website Kholkar Form Submit Karo
URL: [https://digisakhi-32j7.onrender.com](https://digisakhi-32j7.onrender.com) ➔ "Report an Incident" form bharo aur submit karo.  
![Incident Report Modal](./images/report_modal.png)

#### 4️⃣ Window 4: Drizzle Studio Par Wapas Aao Aur Refresh (🔄) Dabao!
Top-right me Refresh button dabao. Table mein instantly naya row #1 highlight ho jayega!  
![Drizzle Studio Live Row](./images/step2_drizzle_studio.png)

#### 🗣️ Ma'am Ko Yeh Bolo (The Full Marks Dialogue):
> *"Dekhiye Ma'am, jaise hi maine Render par live chal rahi website se form submit kiya, Drizzle ORM ne `server/db.ts` ke through us data ko seedha **AWS Tokyo TiDB Cloud cluster** mein write kar diya. Aur Drizzle Studio ne refresh karte hi bina laptop restart kiye naya record screen par display kar diya. This proves our cloud database integration is 100% active and functioning!"*
