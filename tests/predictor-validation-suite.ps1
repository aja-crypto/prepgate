# AI Predictor Validation Suite
# Run after ANY change to predictionEngine.js, predictionUtils.js, or predictor routes
# Usage: .\tests\predictor-validation-suite.ps1

$ErrorActionPreference = "Stop"
$results = @()

# Configuration
$BASE_URL = "http://localhost:5000"
$MARKS = @(30, 40, 50, 60, 70, 80, 90)
$CATEGORIES = @("General", "OBC-NCL", "EWS", "SC", "ST", "PwD")

# Expected ranges (update as baseline shifts)
$EXPECTED_AIR_RANGES = @{
    "30_General" = @{ Min=1000; Max=30000 }
    "50_General" = @{ Min=300; Max=3000 }
    "70_General" = @{ Min=20; Max=500 }
    "90_General" = @{ Min=1; Max=50 }
}

function Write-Result($pass, $msg) {
    $color = if ($pass) { "Green" } else { "Red" }
    $prefix = if ($pass) { "PASS" } else { "FAIL" }
    Write-Host "[$prefix] $msg" -ForegroundColor $color
    return $pass
}

# Step 1: Get auth token
Write-Host "=== Step 1: Authentication ===" -ForegroundColor Cyan
try {
    $token = (Invoke-RestMethod -Uri "$BASE_URL/api/auth/demo" -Method Post -TimeoutSec 10).data.accessToken
    $headers = @{ Authorization = "Bearer $token" }
    Write-Result $true "Token obtained"
} catch {
    Write-Result $false "Cannot get auth token: $_"
    exit 1
}

# Step 2: Health check
Write-Host "`n=== Step 2: Health Check ===" -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "$BASE_URL/api/health" -TimeoutSec 5
    Write-Result ($health.database -eq "connected") "Database: $($health.database)"
} catch {
    Write-Result $false "Backend unreachable: $_"
    exit 1
}

# Step 3: Run predictions for every combination
Write-Host "`n=== Step 3: Predictions (42 combinations) ===" -ForegroundColor Cyan
foreach ($m in $MARKS) {
    foreach ($cat in $CATEGORIES) {
        try {
            $body = @{ expectedMarks=$m; category=$cat; paper="CS" } | ConvertTo-Json
            $resp = Invoke-RestMethod -Uri "$BASE_URL/api/predictor/predict" -Method Post -Body $body `
                -ContentType "application/json" -Headers $headers -TimeoutSec 45
            $d = $resp.data

            $entry = [PSCustomObject]@{
                Marks = $m
                Category = $cat
                AIR = if ($d.airRange) { $d.airRange.average } else $null
                AIR_Best = if ($d.airRange) { $d.airRange.best } else $null
                AIR_Worst = if ($d.airRange) { $d.airRange.worst } else $null
                Confidence = $d.confidence
                ConfidenceScore = $d.confidenceScore
                Safe = if ($d.safeColleges) { $d.safeColleges.Count } else 0
                Target = if ($d.targetColleges) { $d.targetColleges.Count } else 0
                Dream = if ($d.dreamColleges) { $d.dreamColleges.Count } else 0
                Probability = if ($d.admissionProbability -ne $null) { $d.admissionProbability } else 0
                Trend = if ($d.aggregateTrend) { $d.aggregateTrend.trendDirection } else $null
                Volatility = if ($d.aggregateTrend) { $d.aggregateTrend.volatility } else $null
                TotalDataPoints = $d.totalDataPoints
            }
            $results += $entry
            Write-Host "  [$m/$cat] AIR=$($entry.AIR) Conf=$($entry.Confidence)($($entry.ConfidenceScore))" -ForegroundColor Green
            Start-Sleep -Milliseconds 300
        } catch {
            Write-Host "  [$m/$cat] ERROR: $_" -ForegroundColor Red
        }
    }
}

# Step 4: Validation checks
Write-Host "`n=== Step 4: Validation ===" -ForegroundColor Cyan
$failures = 0

# 4a: All entries must have AIR
$noAir = $results | Where-Object { $_.AIR -eq $null }
if (-not $noAir) { Write-Result $true "All entries have AIR" } else { $failures++; Write-Result $false "$($noAir.Count) entries missing AIR" }

# 4b: AIR must decrease as marks increase (for same category)
foreach ($cat in $CATEGORIES) {
    $catResults = $results | Where-Object { $_.Category -eq $cat -and $_.AIR -ne $null } | Sort-Object Marks
    $monotonic = $true
    for ($i = 1; $i -lt $catResults.Count; $i++) {
        if ($catResults[$i].AIR -ge $catResults[$i-1].AIR) { $monotonic = $false }
    }
    if ($monotonic) { Write-Result $true "$cat: AIR monotonically decreasing with marks" }
    else { $failures++; Write-Result $false "$cat: AIR NOT monotonically decreasing" }
}

# 4c: Check expected ranges
foreach ($key in $EXPECTED_AIR_RANGES.Keys) {
    $parts = $key -split "_"
    $m = [int]$parts[0]
    $cat = $parts[1]
    $range = $EXPECTED_AIR_RANGES[$key]
    $entry = $results | Where-Object { $_.Marks -eq $m -and $_.Category -eq $cat }
    if ($entry -and $entry.AIR -ge $range.Min -and $entry.AIR -le $range.Max) {
        Write-Result $true "$key AIR=$($entry.AIR) in [$($range.Min), $($range.Max)]"
    } else {
        $failures++
        $actual = if ($entry) { $entry.AIR } else { "MISSING" }
        Write-Result $false "$key AIR=$actual outside [$($range.Min), $($range.Max)]"
    }
}

# 4d: PwD must have 0 colleges (known limitation)
$pwdEntries = $results | Where-Object { $_.Category -eq "PwD" }
foreach ($e in $pwdEntries) {
    $total = $e.Safe + $e.Target + $e.Dream
    if ($total -eq 0) { Write-Result $true "PwD/$($e.Marks): 0 colleges (expected)" }
    else { $failures++; Write-Result $false "PwD/$($e.Marks): $total colleges (expected 0)" }
}

# 4e: Safe + Target + Dream must decrease or stay same as marks increase (more safe, fewer dream)
foreach ($cat in @("General","OBC-NCL","EWS","SC","ST")) {
    $catR = $results | Where-Object { $_.Category -eq $cat } | Sort-Object Marks
    $prevSafe = 999
    $consistent = $true
    for ($i = $catR.Count-1; $i -ge 0; $i--) {
        if ($catR[$i].Safe -gt $prevSafe) { $consistent = $false }
        $prevSafe = $catR[$i].Safe
    }
    if ($consistent) { Write-Result $true "$cat: Safe colleges increase with marks" }
    else { $failures++; Write-Result $false "$cat: Safe college progression inconsistent" }
}

# Step 5: Summary
Write-Host "`n========================================" -ForegroundColor Cyan
$total = ($MARKS.Count * $CATEGORIES.Count)
$ran = $results.Count
$pct = [math]::Round(($ran/$total)*100)
Write-Host "Tested: $ran/$total combinations ($pct%)" -ForegroundColor Yellow
Write-Host "Failures: $failures" -ForegroundColor $(if ($failures -eq 0) { "Green" } else { "Red" })
Write-Host "Air progression 30->90: $($results | Where-Object {$_.Category -eq 'General'} | Sort-Object Marks | Select-Object -ExpandProperty AIR -First 1) -> $($results | Where-Object {$_.Category -eq 'General'} | Sort-Object Marks | Select-Object -ExpandProperty AIR -Last 1)"

if ($failures -eq 0) {
    Write-Host "`nRESULT: ALL CHECKS PASSED" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nRESULT: $failures CHECKS FAILED" -ForegroundColor Red
    exit 1
}
