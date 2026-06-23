$content = Get-Content "C:\Users\purru\OneDrive\GATE 2026\gate2027\backend\src\data\mockTestSeed.js" -Raw
$lines = $content -split "`n"
$subjects = @{}
foreach ($l in $lines) {
    if ($l -match '^\s*\{ subject:\s*[\'"]([A-Z]+)[\'"]') {
        $s = $matches[1]
        $subjects[$s] = ($subjects[$s] + 1)
    }
}
$subjects.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { 
    Write-Host "$($_.Key): $($_.Value)" 
}
$total = ($subjects.Values | Measure-Object -Sum).Sum
Write-Host "Total: $total"