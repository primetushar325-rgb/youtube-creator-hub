# Termux-e pura project replace korar exact command (copy-paste korun)

## Step 1: Proyojon hole install korun (ekbar e enough)
```bash
pkg update -y && pkg upgrade -y
pkg install git nodejs unzip -y
npm install -g vercel
```

## Step 2: New zip download korar por ei command gula exact copy paste korun
(Purono sob code replace hobe, notun code boshe jabe)

```bash
cd ~
rm -rf yt-hub youtube-creator-hub
mkdir -p yt-hub && cd yt-hub
cp /sdcard/Download/youtube-creator-hub.zip ./
unzip -o youtube-creator-hub.zip
ls
# Ekhon ei file gula dekhabe: index.html  youtube-hub/  README/guides
```

## Step 3: Git-e push (sob code replace)
```bash
# Jodi age theke git kora thake (folder-e .git ache)
git add .
git commit -m "update: direct tools view + menu fixes"
git push origin main
```

---
### Jodi first time push koren (Notun project ba repo delete kore felchilen):
```bash
cd ~/yt-hub
rm -rf .git
git init
git branch -M main
git config --global user.name "ApnarName"
git config --global user.email "apnarEmail@gmail.com"
git remote add origin https://github.com/APNAR-USERNAME/youtube-creator-hub.git
git add .
git commit -m "YouTube Creator Hub v2 - fixed & clean"
git push -u origin main
```
*Username/password token dekhabe — PAT token use korben.*

---
## Step 4: Vercel-e live update (auto or manual)
GitHub-e push korlei Vercel auto-deploy hoy (1-2 min).
Jodi auto na hoy browser-e Vercel project-e giye "Redeploy" click korun.

Ba CLI diye direct deploy (optional):
```bash
cd ~/yt-hub
vercel --prod
```

---
## Verification (check!)
Push er por browser-e:
- https://youtube-creator-hub-gray.vercel.app  (apnar link) refresh korun
- 1. Shudhu search/ask/fav/3-dot dekhabe upore (boro menu nai)
- 2. Hub khullei sob tools chole ashe
- 3. Tool-e click korle tool page khulche
- 4. 3-dot menu click korle shudhu tokhoni khulche

---
## Jodi kono error ashe:
```bash
# Check kore dekhi file gula ok ache kina
cd ~/yt-hub && ls
cat /sdcard/Download/youtube-creator-hub.zip | head -c 20
# Jodi zip corrupted hoy, abar download korun
```
