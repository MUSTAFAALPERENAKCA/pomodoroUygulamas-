@echo off
cd /d "c:\Users\Pc\Desktop\pomodoro"
echo === GIT STATUS ===
git status
echo.
echo === GIT LOG ===
git log --oneline -10
echo.
echo === ADDING FILES ===
git add .
echo.
echo === COMMITTING ===
git commit -m "feat: v2.0 - Tum yeni ozellikler eklendi"
echo.
echo === GIT REMOTE ===
git remote -v
echo.
echo === PUSHING TO MAIN ===
git push origin main --force
echo.
echo === DONE ===
pause
