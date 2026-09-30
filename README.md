# 2026-Fall-Amazon
Amazon Tech SIBC project

# Initializing
1) Log into Github <br>
2) Go to the file directory where you want the git to sit
3) Windows: click bar at the top and type "cmd". iOS: I'm not sure
4) git init <br>
5) git remote add origin https://github.com/2026-Fall-Amazon/Code <br>
6) git branch<br>

# Pushing YOUR work INTO Github (your computer -> shared space)
1) git switch -c "branch_name" : branch_name should be "week_last_first". You must begin indexing at 00. Ex. "00_Zhou_York" means Week 1 of our project. Do not just make changes to the master/main branch. It makes version history and version tracking extremely difficult. <br>
  1a) git switch "branch_name" : if you already created a branch and you want to make edits to that version <br>
2) git status : check what files are being tracked <br>
3) git add : add your files <br>
4) git commit -m "Descriptive message" : this helps us know what you changed or what you did<br>
5) git push : putting files on your computer to the shared Github space<br>
   5a) git push -u origin "branch-name" : first push to the branch<br>

# Pulling changes FROM Github to YOUR computer (shared space -> computer)
1) git switch main : go to the main branch to update your own branch <br>
2) git pull --rebase : only use if you want to pull changes (do not use the first time setting up Github. Only use for pulling changes)<br>
3) 


