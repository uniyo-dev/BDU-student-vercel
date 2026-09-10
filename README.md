# 🎓 BD Buddy

**Your BDU Academic Companion**

An unofficial, student-built viewer for the Bahir Dar University student portal — clean, fast, and mobile-friendly.

---

## 📖 What is BD Buddy?

BD Buddy is an **unofficial, student-built web application** that gives Bahir Dar University students a cleaner, faster, mobile-friendly way to view their academic data — without the clutter and complexity of the official portal.

It doesn't replace the official portal — it's a **viewer** that fetches your real data directly from studentportal.bdu.edu.et and presents it in a modern interface.

---

## ⚡ Why BD Buddy Exists

The official BDU portal works, but many students find it:

- Hard to read on phones
- Slow to navigate
- Confusing for finding specific information
- Missing a clean GPA overview
- Difficult for viewing placement results
- Not showing grade breakdowns clearly

**BD Buddy solves all of that.**

---

## 🎯 Features

### Academic Dashboard
- Total semesters, credits, and CGPA at a glance
- Grade breakdown (A+, A, B+, B, etc.)
- Rank score calculation
- Semester-by-semester progress

### Course Details
- All registered courses with codes and titles
- Letter grades and grade points
- Credit hours per course
- Percentage scores where available
- Organized by semester and academic year

### Placement Results
- Department placement outcomes
- Priority ranking
- Score breakdown
- Application status tracking
- All-student placement list

### Student Profile
- Full name in English and Amharic
- Student ID, gender, birth date
- Contact information
- Enrollment details
- High school stream

### Progressive Web App (PWA)
- Installable on your phone
- Works like a native app
- Fast and responsive
- Mobile-first design

### Additional Pages
- Help & FAQ — Searchable answers
- About — Learn about BD Buddy
- Privacy Policy — Data handling transparency
- Terms of Use — Usage rules

---

## 🔒 Security First

Your credentials never leave your device except to authenticate with BDU's official portal:

1. You enter your BDU username and password
2. BD Buddy forwards them directly to studentportal.bdu.edu.et
3. BDU verifies your credentials
4. BD Buddy receives and displays your data
5. Nothing is stored on our servers

### BD Buddy does NOT:
- Store your password
- Cache your data on the server
- Share your information with third parties
- Send your credentials anywhere except BDU

---

## ⚠️ Important Disclaimer

BD Buddy is an **unofficial, student-built tool**. It is **NOT** affiliated with, endorsed by, or operated by Bahir Dar University.

All academic data is fetched directly from the official BDU portal at studentportal.bdu.edu.et. If you notice any discrepancy, always trust the official portal.

---

## 🔐 Demo Credentials (For Testing)

Username: bdu10460670
Password: @Chalie/2026

Note: These are test credentials for demonstration. Do not use in production.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

git clone https://github.com/uniyo-dev/BDU-Student-Portal-Render.git
cd BDU-Student-Portal-Render
npm install
node server.js

Server starts on http://localhost:3000

---

## 📁 Project Structure

BDU-Student-Portal-Render/
├── public/
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   ├── css/
│   ├── js/
│   ├── images/
│   └── pages/
│       ├── about.html
│       ├── dashboard.html
│       ├── grade-report.html
│       ├── help.html
│       ├── placement.html
│       ├── placement-guide.html
│       ├── privacy.html
│       ├── profile.html
│       ├── rankings.html
│       ├── results.html
│       ├── terms.html
│       └── transcript.html
├── server.js
├── package.json
└── README.md

---

## 🛠️ Built With

| Layer | Technology |
|-------|-----------|
| Backend | Node.js |
| Frontend | Vanilla JS + Modern CSS |
| Data | BDU Portal API |
| Hosting | Render.com |
| PWA | Service Worker |

---

## 🚀 Features Roadmap

### Available
- [x] Secure login with BDU credentials
- [x] Academic summary with GPA
- [x] Course registration details
- [x] Placement results
- [x] PWA (installable)
- [x] Help & FAQ
- [x] Privacy Policy
- [x] Terms of Use
- [x] About page

### Coming Soon
- [ ] Grade report PDF export
- [ ] Transcript viewer
- [ ] Multi-language (Amharic)
- [ ] Offline mode
- [ ] Dark mode toggle

### Future Ideas
- [ ] GPA calculator
- [ ] Grade simulator
- [ ] Course planning tool
- [ ] Graduation requirement checker

---

## 🤝 Contributing

Contributions are welcome!

1. Report a bug
2. Suggest a feature
3. Submit a PR

---

## 📜 Legal & Ethics

1. Transparency — Open about what it does
2. Privacy — Never stores student data
3. Respect — Respects BDU's systems
4. Non-commercial — Free, no ads
5. Student-first — Built by students

---

## 📄 License

MIT License

---

## 🏫 About Bahir Dar University

Bahir Dar University (BDU) is one of Ethiopia's leading higher education institutions.

Official portal: studentportal.bdu.edu.et

---

## 🎯 Vision

Every BDU student should be able to check their academic progress in under 10 seconds, from any device, with a beautiful interface.

---

## 💙 Acknowledgments

- Bahir Dar University — For the official student portal
- BDU IT Department — For API infrastructure
- Fellow Students — For testing and feedback

---

## 👨‍💻 Author

Chalie

- Purpose: Making student life easier
- Motto: Your academic companion

---

**🎓 BD Buddy — Your BDU Academic Companion**

Made with 💜 by Chalie

Not affiliated with Bahir Dar University
