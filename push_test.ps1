Set-Location "c:\Users\Pc\Desktop\pomodoro"
Write-Output "=== GIT STATUS ===" 
git status

Write-Output "`n=== GIT LOG ===" 
git log --oneline -10

Write-Output "`n=== GIT REMOTE ===" 
git remote -v

Write-Output "`n=== GIT BRANCH ===" 
git branch -a

Write-Output "`n=== PUSHING ===" 
git push origin main --verbose 2>&1

Write-Output "`nDone!"
