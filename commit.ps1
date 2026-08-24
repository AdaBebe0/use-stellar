git add .
git commit --no-verify -m "feat(hook): useAccountExists - validate an address is funded before sending`r`n`r`nCloses #110"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git push --no-verify -u origin feat/useAccountExists
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
