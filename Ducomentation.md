# ClinicCare Pro - System Documentation

Wll Mahad, halkan waa warbixin kooban oo ku saabsan sida loo isticmaalo system-ka iyo dhammaan sifooyinka (features) uu leeyahay.

---

## 1. Sida loo kiciyo System-ka (Getting Started)
1.  **Start Server:** Terminal-ka ku qor `npm start`. Markaad aragto "🚀 CLINIC DIGITAL SERVER STARTED", system-ku waa diyaar.
2.  **Access:** Browser-ka ka furi `http://localhost:3005`.
3.  **Login:** Riix "Launch System" oo geli:
    - **Username:** `mahad_analyst`
    - **Password:** `password123`

---3

## 2. Features-ka Muhiimka ah (Core Features)

### A. Dashboard (Maamulka Tooska ah)
- Waxaad ka arki kartaa xogta guud ee maanta (Bukaannada cusub, ballamaha maanta, iyo inta qof ee safka ugu jirta dhakhtarka).
- **Live Queue:** Wuxuu kuu muujinayaa dadka hadda safka ku jira iyo xaaladdooda (Waiting, Processing, Completed).

### B. Patient Management (Maamulka Bukaannada)
- **Diiwaangelin:** Waxaad ku dari kartaa bukaan cusub adigoo isticmaalaya badanka "New Patient".
- **Search:** Waxaad si degdeg ah u raadin kartaa bukaan horey u diiwaangashnaa adigoo isticmaalaya magaca ama ID-ga.

### C. Appointment Scheduling (Ballamaha)
- Waxaad u ballamin kartaa bukaanka dhakhtarka uu u baahan yahay, taariikhda iyo waqtiga uu imaanayo.
- System-ku wuxuu si otomaatig ah u kala saaraa ballamaha maanta iyo kuwa soo socda.

### D. Billing & Finance (Lacag bixinta)
- Qaybtan waxay maamushaa qaansheegta (Invoices).
- Waxaad arki kartaa dakhliga soo galay (Revenue) iyo lacagaha dhiman (Pending).

### E. Inventory & Pharmacy (Daawooyinka)
- Waxaad ku kormeeri kartaa daawooyinka yaalla pharmacy-ga iyo qalabka caafimaad.
- **Alerts:** System-ku wuxuu ku siinayaa digniin haddii daawadu ay gabaabsi tahay (Low Stock).

### F. Lab & Blood Bank (Sheybaarka)
- **Lab:** Waxaad ka maamulaysaa baaritaannada dhiigga iyo natiijooyinka kasoo baxa.
- **Blood Bank:** Waxaad ku socon kartaa dhiigga yaalla kaydka iyo dadka dhiigga bixiya (Donors).

### G. Emergency & ER (Xaaladaha Degdegga ah)
- Qaybtan waxaa loogu talagalay dispatch-ka ambalaasta iyo maamulka xaaladaha degdegga ah ee ER-ka.

### H. Audit Logs (Amniga)
- System-ku wuxuu kaydiyaa dhaqdhaqaaq kasta oo laga sameeyo (Ciddii gashay, xogta la beddelay, iyo waqtiga). Tani waxay hubinaysaa amniga xogta.

---

## 3. Maxaa System-kan ka dhigaya mid "Level Sare" ah?
1.  **Vanilla Performance:** Uma baahna internet ama modules dibadda ah si uu u shaqeeyo (Zero Dependencies).
2.  **Modern UI:** Design-ka wuxuu isticmaalayaa "Glassmorphism" iyo "Inter Font" oo ah qaabka ugu casrisan web-ka.
3.  **Full-Stack:** Xogtaadu way kaydsan tahay mar kasta (Local Database).
4.  **Security:** Waxay leedahay maamul login iyo audit trail lagu kalsoonaan karo.

---
© 2026 ClinicCare Pro. Developed by **Mahad Ali Nuur**.
