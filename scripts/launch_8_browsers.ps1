# 皇室對決 3D - 8 帳號 Chrome 多開分屏測試啟動腳本
# 為 8 個帳號分別建立獨立的 Profile 目錄與視窗座標

$chromePath = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chromePath)) {
    $chromePath = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
}
if (-not (Test-Path $chromePath)) {
    Write-Host "未找到 Google Chrome，請確認安裝路徑！" -ForegroundColor Red
    exit 1
}

$baseTemp = "$env:LOCALAPPDATA\Temp\RoyalClash8Test"
if (-not (Test-Path $baseTemp)) {
    New-Item -ItemType Directory -Path $baseTemp -Force | Out-Null
}

$baseUrl = "http://localhost:5173"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "🚀 正在為 8 個帳號啟動獨立 Chrome 瀏覽器視窗 (多開分屏實況)..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Cyan

# 計算分屏網格 (例如 4 欄 x 2 列)
$winW = 460
$winH = 460

$accounts = @(
    @{ id = 1; name = "領主1號·藍龍"; col = 0; row = 0; url = "$baseUrl?user=test_blue&brawl=982713&side=blue" },
    @{ id = 2; name = "領主2號·烈焰"; col = 1; row = 0; url = "$baseUrl?user=test_red&brawl=982713&side=red" },
    @{ id = 3; name = "領主3號·翡翠"; col = 2; row = 0; url = "$baseUrl?user=test_green&brawl=982713&side=green" },
    @{ id = 4; name = "領主4號·虛空"; col = 3; row = 0; url = "$baseUrl?user=test_purple&brawl=982713&side=purple" },
    @{ id = 5; name = "領主5號·天梯神"; col = 0; row = 1; url = "$baseUrl?user=test_ladder" },
    @{ id = 6; name = "領主6號·守護者"; col = 1; row = 1; url = "$baseUrl?user=test_coop" },
    @{ id = 7; name = "領主7號·泰坦獵人"; col = 2; row = 1; url = "$baseUrl?user=test_boss" },
    @{ id = 8; name = "領主8號·聖水狂人"; col = 3; row = 1; url = "$baseUrl?user=test_7x" }
)

foreach ($acc in $accounts) {
    $profileDir = "$baseTemp\profile_$($acc.id)"
    $posX = $acc.col * $winW
    $posY = $acc.row * $winH

    Write-Host "▶ 正在啟動 [$($acc.name)] (視窗位址: $posX, $posY)..." -ForegroundColor Green
    
    $args = @(
        "--user-data-dir=`"$profileDir`"",
        "--window-size=$winW,$winH",
        "--window-position=$posX,$posY",
        "--no-first-run",
        "--no-default-browser-check",
        "`"$($acc.url)`""
    )
    
    Start-Process -FilePath $chromePath -ArgumentList ($args -join " ")
    Start-Sleep -Milliseconds 350
}

Write-Host "`n✨ 8 個獨立測試帳號已全部在您的螢幕上展開！" -ForegroundColor Cyan
