$content = Get-Content "C:\Users\purru\OneDrive\GATE 2026\gate2027\backend\src\store\localDataStore.js" -Raw
$inSeed = $false
$count = 0
foreach ($l in $content -split "`n") {
    if ($l -match 'localMockQuestions\s*=\s*seedData\.questions') { $inSeed = $true; continue }
    if ($inSeed -and $l -match '^\s*\}') { $inSeed = $false; continue }
    if ($inSeed -and $l.Trim() -match '^\{ subject:') { $count++ }
}
Write-Host "localMockQuestions seeded: $count"