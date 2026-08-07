# Update/Replace kora — Termux via Git (sohoj upay)

Ager zip delete kore new zip diye replace korar sohoj podhdoti:

## 1. New zip download kore phone-e rakho
- Download kore `/sdcard/Download/`-e rakho `youtube-creator-hub.zip` naam-e.

## 2. Termux-e purano folder delete kore notun extract korun

```bash
# Pothome jaben
cd ~

# Backup (iccha), then delete old project
rm -rf ~/yt-hub
mkdir -p ~/yt-hub
cd ~/yt-hub

# Notun zip copy kore extract
cp /sdcard/Download/youtube-creator-hub.zip ./
unzip -o youtube-creator-hub.zip
ls
# index.html  youtube-hub/
```

## 3. GitHub-e push (replace)

```bash
cd ~/yt-hub

# Jodi age theke git init kora thake:
git add .
git commit -m "fix menu + direct tools view"
git push origin main
```

*(Git setup na thakle, age initialize korun:)*
```bash
pkg install git -y
git config --global user.name "ApnarNam"
git config --global user.email "apnar@gmail.com"
git init
git branch -M main
git remote add origin https://github.com/APNAR-USERNAME/youtube-creator-hub.git
git add .
git commit -m "first upload"
git push -u origin main
```

## 4. Vercel-e auto update
GitHub-e push korar sathe sathei Vercel auto-deploy korbe.
1-2 minute wait korun, tarpor site refresh korun.

Jodi Vercel CLI use koren:
```bash
npm install -g vercel
cd ~/yt-hub
vercel --prod
```

## Ebar ki fixed ache?
- [x] Menu auto-open hoye thakar bug sorano hoyeche (3-dot "More" button-e sudhu dekhabe)
- [x] Homepage-e unnecessary boro landing page sorano — Hub khullei shob tools samne eshe jabe
- [x] Upor-e shudhu logo, Search, "Ask AI" yellow button, Favorites icon, 3-dot more menu
- [x] More menu-te: All Tools, Ask AI, Favorites, History, Saved, Admin, Back to Main Site — shob kichu ache
- [x] Dark-mode-e highlight/overlapping lekha fix kora
- [x] Search, menu, tool click sob correct vabe kaj korbe
- [x] "All Tools" er bodoley "YouTube Creator Hub" title — clean look
