$content = Get-Content "C:\Users\purru\OneDrive\GATE 2026\gate2027\backend\src\data\mockTestSeed.js" -Raw
$subjects = @{}

# Count AL
$al = [regex]::Matches($content, "subject: 'AL'").Count
$subjects['AL'] = $al

# Count DS
$ds = [regex]::Matches($content, "subject: 'DS'").Count
$subjects['DS'] = $ds

# Count CD
$cd = [regex]::Matches($content, "subject: 'CD'").Count
$subjects['CD'] = $cd

# Count CN
$cn = [regex]::Matches($content, "subject: 'CN'").Count
$subjects['CN'] = $cn

# Count CO
$co = [regex]::Matches($content, "subject: 'CO'").Count
$subjects['CO'] = $co

# Count DB
$db = [regex]::Matches($content, "subject: 'DB'").Count
$subjects['DB'] = $db

# Count DL
$dl = [regex]::Matches($content, "subject: 'DL'").Count
$subjects['DL'] = $dl

# Count EM
$em = [regex]::Matches($content, "subject: 'EM'").Count
$subjects['EM'] = $em

# Count OS
$os = [regex]::Matches($content, "subject: 'OS'").Count
$subjects['OS'] = $os

# Count TOC
$toc = [regex]::Matches($content, "subject: 'TOC'").Count
$subjects['TOC'] = $toc

$subjects.GetEnumerator() | Sort-Object Value -Descending | ForEach-Object { 
    Write-Host "$($_.Key): $($_.Value)" 
}
$total = ($subjects.Values | Measure-Object -Sum).Sum
Write-Host "Total: $total"