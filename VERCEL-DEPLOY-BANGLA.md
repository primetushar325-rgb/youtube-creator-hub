# Vercel-এ Termux দিয়ে YouTube Creator Hub ডিপ্লয় গাইড (বাংলা)

## প্রয়োজন হবে কী কী?
- **কোনো extra API লাগবে না** — পুরো Hub offline এ চলবে, শুধু static HTML/CSS/JS
- শুধু দরকার:
  1. একটা **GitHub** অ্যাকাউন্ট (ফ্রি)
  2. **Vercel** অ্যাকাউন্ট (GitHub দিয়ে লগইন করলেই ফ্রি)
  3. **Termux** অ্যাপ (Android ফোন)
  4. আপনার প্রজেক্টের zip ফাইল

---

## ধাপ ১: Termux-এ প্রয়োজনীয় টুল ইনস্টল

Termux খুলে এক এক করে এই কমান্ডগুলো দিন:

```bash
pkg update && pkg upgrade -y
pkg install git nodejs nano unzip zip -y
npm install -g vercel
```

চেক করুন সব ঠিকমতো ইনস্টল হয়েছে কিনা:

```bash
git --version
node -v
vercel --version
```

---

## ধাপ ২: GitHub-এ নতুন রিপোজিটরি তৈরি

1. ব্রাউজারে github.com-এ গিয়ে লগইন করুন
2. **New Repository**-তে ক্লিক করুন
3. নাম দিন: `youtube-creator-hub`
4. **Public** রাখুন, তারপর **Create repository** ক্লিক করুন
5. রিপোর HTTPS লিঙ্কটা কপি করুন, যেমন:
   `https://github.com/আপনারUsername/youtube-creator-hub.git`

---

## ধাপ ৩: Termux-এ Zip থেকে প্রজেক্ট বের করা

Zip ফাইলটা ফোনের Internal Storage-এ রাখুন, তারপর:

```bash
# Storage অ্যাকসেস দিন (প্রথমবার):
termux-setup-storage
# Allow করে দিন পপ-আপ এলে

# Zip কপি করুন Termux-এ
cp /sdcard/Download/youtube-creator-hub.zip ~/
cd ~
unzip youtube-creator-hub.zip -d yt-hub
cd yt-hub
ls
# index.html  youtube-hub/  ফোল্ডার দেখা যাবে
```

---

## ধাপ ৪: Git দিয়ে GitHub-এ পুশ

```bash
cd ~/yt-hub
git config --global user.name "আপনার নাম"
git config --global user.email "আপনারইমেইল@gmail.com"
git init
git add .
git commit -m "Initial upload - YouTube Creator Hub with VIP Profile"
git branch -M main
git remote add origin https://github.com/আপনারUsername/youtube-creator-hub.git
git push -u origin main
```

প্রথমবার পুশ করার সময় GitHub login চাইবে:
- Username দিন
- Password এর জায়গায় **Personal Access Token (PAT)** দিতে হবে (GitHub Settings > Developer Settings > Personal access tokens > Generate new token, repo-তে tick দিন)

পুশ শেষে `https://github.com/আপনারUsername/youtube-creator-hub` এ গিয়ে ফাইলগুলো দেখা গেলে সফল!

---

## ধাপ ৫: Vercel CLI দিয়ে ডিপ্লয় (সোজা পদ্ধতা)

Termux-এ প্রজেক্ট ফোল্ডারে থাকা অবস্থায়:

```bash
cd ~/yt-hub
vercel
```

এটা করলে কিছু প্রশ্ন আসবে:

```
? Set up and deploy "~/yt-hub"? [Y/n]  → Y
? Which scope?                          → আপনার অ্যাকাউন্ট সিলেক্ট করুন
? Link to existing project?             → N
? What's your project's name?           → youtube-creator-hub (এন্টার দিন)
? In which directory is your code?      → .  (শুধু এন্টার)
? Want to modify these settings?        → N
```

ব্যাস! কিছুক্ষণের মধ্যে লাইভ URL পেয়ে যাবেন, যেমন:
`https://youtube-creator-hub-আপনারuser.vercel.app`

লিংকটা ব্রাউজারে খুলুন — আপনার পুরো YouTube Creator Hub VIP সহ লাইভ হয়ে গেছে।

---

## ধাপ ৬: Production-এ ডিপ্লয় (সবার জন্য লাইভ)

```bash
vercel --prod
```

এবার final প্রোডাকশন URL পাবেন: `https://youtube-creator-hub.vercel.app` (আপনার নাম অনুযায়ী)।

---

## নতুন আপডেট পুশ করার নিয়ম

যখন Hub-এর কোনো ফাইল এডিট করবেন:

```bash
cd ~/yt-hub
git add .
git commit -m "update"
git push
vercel --prod
```

---

## Vercel Dashboard থেকে সেটআপ (কমান্ড ছাড়া বিকল্প)

1. vercel.com-এ লগইন করুন (GitHub দিয়ে)
2. **Add New → Project**
3. `youtube-creator-hub` রিপোজিটরিতে **Import** ক্লিক করুন
4. সবকিছু ডিফল্ট রেখে **Deploy** ক্লিক করুন
5. 30-60 সেকেন্ডে লাইভ হয়ে যাবে!

এই পদ্ধতিতে GitHub-এ পুশ করলে **auto-deploy** হবে — আর Termux-এ vercel কমান্ড লাগবে না।

---

## এক্সট্রা API লাগবে কি?

**না**, পুরো Hub:
- Static site (শুধু HTML + CSS + JS)
- Backend/database লাগবে না
- কোনো API key লাগবে না
- Vercel-এর **Free Hobby Plan**-এ চলবে কোনো limit ছাড়াই
- যদি ভবিষ্যতে AI key যোগ করতে চান (OpenAI/Gemini), Admin Panel-এর API Keys সেকশনে দিতে পারবেন — সেটা optional

---

## কমন সমস্যা ও সমাধান

**Q: `vercel login` টার্মাক্সে ব্রাউজার না খুললে?**
```bash
vercel login
# Email দিন, তারপর অন্য ডিভাইসে ভেরিফাই লিঙ্ক গেলে সেটা ক্লিক করুন
```

**Q: Git push রিজেক্ট করল?**
```bash
git pull origin main --rebase
git push -u origin main
```

**Q: Vercel 404 দিলে?**
নিশ্চিত করুন root ফোল্ডারে `index.html` আছে (youtube-hub ফোল্ডারের না — `zip` যেভাবে আমি দিয়েছি root-এ `index.html` আছে)।
Project Settings-এ Root Directory সঠিক দিন।

**Q: ফোনে কি ZIP বের করতে পারছি না?**
```bash
pkg install unzip -y
unzip youtube-creator-hub.zip
```

---

## ফাইনাল চেকলিস্ট

- [x] VIP Profile Creator টুল যোগ করা হয়েছে (Tool #51)
- [x] My VIP Profile ড্যাশবোর্ড পেজ যুক্ত হয়েছে
- [x] সেভ/ফেভ/হিস্ট্রিতে VIP কার্ড দেখা যাচ্ছে
- [x] পুরো Hub-এর প্রিমিয়াম VIP গোল্ড লুক
- [x] সব টুল মোবাইল রেসপন্সিভ
- [x] কোনো API/backend লাগবে না — শুধু static
- [x] Zip file প্রস্তুত
- [x] Vercel deploy guide
