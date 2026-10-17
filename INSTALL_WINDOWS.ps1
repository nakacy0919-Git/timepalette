# TimePalette Mission Creator - Reviewed Safe Windows Installer v2 (2026-10-17)
# Usage (from extracted ZIP): powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\INSTALL_WINDOWS.ps1
# Optional: -RepoPath "C:\path\to\timepalette" -NoStart -Push
[CmdletBinding()]
param(
    [string] $RepoPath = '',
    [switch] $NoStart,
    [switch] $Push
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$repositoryName = 'nakacy0919-Git/timepalette'
$expectedOrigin = '(?i)(?:github\.com[:/])nakacy0919-Git/timepalette(?:\.git)?/?$'
$preferredBranch = 'feat/mission-creator-mvp-20261017'
$packageRoot = $PSScriptRoot
$copied = @()
$backedUp = @()
$installStarted = $false
$installVerified = $false

function Step([string] $Message) {
    Write-Host "`n[TimePalette] $Message" -ForegroundColor Cyan
}
function Require-Program([string] $Name) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "'$Name' が見つかりません。Git for Windows と Node.js をインストールして、PowerShellを開き直してください。"
    }
}
function Git-Text([string] $Root, [string[]] $Arguments) {
    $value = (& git -C $Root @Arguments 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) { throw "Git操作に失敗しました: git $($Arguments -join ' ')`n$value" }
    return $value
}
function Test-Repo([string] $Candidate) {
    if (-not $Candidate -or -not (Test-Path -LiteralPath $Candidate -PathType Container)) { return $false }
    try {
        $top = Git-Text $Candidate @('rev-parse', '--show-toplevel')
        $origin = Git-Text $Candidate @('remote', 'get-url', 'origin')
        return (($origin -match $expectedOrigin) -and ($top -ne ''))
    } catch { return $false }
}
function Find-Repo([string] $Requested) {
    if ($Requested) {
        $expanded = [Environment]::ExpandEnvironmentVariables($Requested)
        if (-not (Test-Repo $expanded)) { throw "指定フォルダがTimePaletteのGitリポジトリではありません: $expanded" }
        return (Git-Text $expanded @('rev-parse', '--show-toplevel'))
    }
    $desktop = [Environment]::GetFolderPath('Desktop')
    $candidates = @(
        (Get-Location).Path,
        (Join-Path $HOME 'Desktop\timepalette'),
        (Join-Path $HOME 'OneDrive\Desktop\timepalette'),
        (Join-Path $HOME 'OneDrive\デスクトップ\timepalette'),
        (Join-Path $HOME 'Documents\timepalette')
    )
    if ($desktop) { $candidates += (Join-Path $desktop 'timepalette') }
    foreach ($candidate in ($candidates | Select-Object -Unique)) {
        if (Test-Repo $candidate) { return (Git-Text $candidate @('rev-parse', '--show-toplevel')) }
    }
    Step 'ローカルのTimePaletteが見つからないため、GitHubから取得します'
    if (-not $desktop) { $desktop = Join-Path $HOME 'Desktop' }
    if (-not (Test-Path -LiteralPath $desktop)) { throw "デスクトップが見つかりません。-RepoPath でGitリポジトリを指定してください。" }
    $destination = Join-Path $desktop 'timepalette'
    if (Test-Path -LiteralPath $destination) {
        throw "'$destination' が既に存在しますが、対象のGitリポジトリとして確認できません。既存フォルダは変更しません。-RepoPath を指定してください。"
    }
    & git clone "https://github.com/$repositoryName.git" $destination
    if ($LASTEXITCODE -ne 0) { throw 'GitHubからの取得に失敗しました。インターネット接続とGit認証を確認してください。' }
    return $destination
}

try {
    Step '前提ツールを確認します'
    Require-Program 'git'
    Require-Program 'node'
    Require-Program 'npm.cmd'
    $nodeVersion = (& node -p 'process.versions.node').Trim()
    $major = [int]($nodeVersion.Split('.')[0])
    if ($major -lt 22) { throw "Node.js $nodeVersion です。TimePalette（Vite 8）にはNode.js 22.12以上または24系を推奨します。" }
    if (($major -eq 22) -and ([version]$nodeVersion -lt [version]'22.12.0')) {
        throw "Node.js $nodeVersion は古いため、Node.js 22.12以降に更新してください。"
    }
    $repo = Find-Repo $RepoPath
    Step "対象リポジトリ: $repo"
    if (-not (Test-Path -LiteralPath (Join-Path $repo 'package.json'))) { throw 'package.json がありません。' }
    $package = Get-Content -LiteralPath (Join-Path $repo 'package.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($package.name -ne 'timepalette') { throw "TimePalette以外のプロジェクトです: $($package.name)" }

    $workingChanges = Git-Text $repo @('status','--porcelain','--untracked-files=normal')
    if ($workingChanges) {
        throw "作業途中の変更があります。上書き防止のため停止します。VS Codeでコミットまたはstash後、再実行してください。`n$workingChanges"
    }

    $branch = Git-Text $repo @('branch','--show-current')
    if ($branch -notlike 'feat/mission-creator-*') {
        $base = Git-Text $repo @('rev-parse','--verify','refs/heads/main')
        if (-not $base) { throw 'ローカルのmainブランチが見つかりません。' }
        $branch = $preferredBranch
        $existing = & git -C $repo show-ref --verify --quiet "refs/heads/$branch"
        if ($LASTEXITCODE -eq 0) {
            $branch = "$preferredBranch-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        }
        Step "安全な作業ブランチを作成: $branch"
        & git -C $repo switch -c $branch main
        if ($LASTEXITCODE -ne 0) { throw '開発ブランチを作成できませんでした。' }
    } else {
        Step "既存のMission Creator作業ブランチを使います: $branch"
    }

    $paths = @(
        'vite.config.js',
        'mission-creator.html',
        'src/mission-creator/MissionCreator.jsx',
        'src/mission-creator/missionCreator.css',
        'src/mission-creator/main.jsx',
        'src/mission-creator/api.js',
        'src/mission-creator/image.js',
        'api/mission-creator.js',
        'gas/mission-creator/Code.gs',
        '.env.mission-creator.example',
        'MISSION_CREATOR_SETUP.md',
        'PATCH_FILES.txt',
        'tests/missionCreator-gas.test.cjs',
        'tests/missionCreator-api.test.mjs',
        'INSTALL_WINDOWS.ps1'
    )
    foreach ($path in $paths) {
        if (-not (Test-Path -LiteralPath (Join-Path $packageRoot $path) -PathType Leaf)) {
            throw "インストールパッケージが不完全です。次のファイルがありません: $path"
        }
    }
    # Verify complete package hashes before modifying any files.
    $manifestFile = Join-Path $packageRoot 'PACKAGE_SHA256.txt'
    if (-not (Test-Path -LiteralPath $manifestFile -PathType Leaf)) {
        throw 'ハッシュ一覧 PACKAGE_SHA256.txt がありません。修正版パッケージをダウンロードしてください。'
    }
    $expectedHashes = @{}
    foreach ($line in (Get-Content -LiteralPath $manifestFile -Encoding UTF8)) {
        if (-not $line.Trim()) { continue }
        $pieces = $line -split '\|', 2
        if ($pieces.Count -ne 2 -or $pieces[0] -notmatch '^[a-f0-9]{64}$') {
            throw 'パッケージのハッシュ一覧が不正です。'
        }
        $expectedHashes[$pieces[1]] = $pieces[0].ToUpperInvariant()
    }
    foreach ($path in $paths) {
        $filePath = Join-Path $packageRoot $path
        $hash = (Get-FileHash -LiteralPath $filePath -Algorithm SHA256).Hash.ToUpperInvariant()
        if (-not $expectedHashes.ContainsKey($path) -or $hash -ne $expectedHashes[$path]) {
            throw "パッケージの検証に失敗しました: $path。ZIPを再ダウンロードしてください。"
        }
    }
    Step 'ZIP内のすべての導入ファイルをSHA256で検証しました'
    $backup = Join-Path $repo ('.dev-backups\mission-creator-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
    New-Item -ItemType Directory -Path $backup -Force | Out-Null
    Step "既存ファイルをバックアップ: $backup"
    foreach ($path in $paths) {
        $dest = Join-Path $repo $path
        if (Test-Path -LiteralPath $dest -PathType Leaf) {
            $copy = Join-Path $backup $path
            New-Item -ItemType Directory -Path (Split-Path -Parent $copy) -Force | Out-Null
            Copy-Item -LiteralPath $dest -Destination $copy -Force
            $backedUp += $path
        }
    }
    $installStarted = $true
    Step 'Mission Creatorのファイルを安全に配置します'
    foreach ($path in $paths) {
        $source = Join-Path $packageRoot $path
        $dest = Join-Path $repo $path
        New-Item -ItemType Directory -Path (Split-Path -Parent $dest) -Force | Out-Null
        Copy-Item -LiteralPath $source -Destination $dest -Force
        $copied += $path
        Write-Host "  + $path"
    }

    Step 'GASとAPIの自動テストを実行します'
    Push-Location $repo
    try {
        & node --test tests/missionCreator-api.test.mjs tests/missionCreator-gas.test.cjs
        if ($LASTEXITCODE -ne 0) { throw '自動テストに失敗しました。' }
        if (-not (Test-Path -LiteralPath (Join-Path $repo 'node_modules\vite'))) {
            Step 'npm依存パッケージをインストールします（初回のみ）'
            & npm.cmd ci --no-audit --no-fund
            if ($LASTEXITCODE -ne 0) { throw 'npm ci に失敗しました。ネットワークとNode.jsのバージョンを確認してください。' }
        }
        Step 'TimePalette全体の本番ビルドを確認します'
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw 'ビルドに失敗しました。変更を元に戻します。' }
    } finally { Pop-Location }
    $installVerified = $true

    Step '導入と検証が完了しました'
    Write-Host "開発ブランチ: $branch" -ForegroundColor Green
    Write-Host "ローカルページ: Vite起動後の表示URL（ポート5173～5182）/mission-creator.html" -ForegroundColor Green
    Write-Host '※ デモ画面はすぐ確認できます。実保存にはGASデプロイと環境変数設定が必要です。' -ForegroundColor Yellow
    Write-Host "セットアップ手順: $(Join-Path $repo 'MISSION_CREATOR_SETUP.md')"
    if ($Push) {
        Step '指定されたため、開発ブランチのみコミットしてGitHubにPushします'
        & git -C $repo add -- $paths
        if ($LASTEXITCODE -ne 0) { throw 'git add に失敗しました。' }
        & git -C $repo commit -m 'feat: add TimePalette Mission Creator MVP'
        if ($LASTEXITCODE -ne 0) { throw 'git commit に失敗しました。Gitのユーザー名・メール設定を確認してください。' }
        & git -C $repo push -u origin $branch
        if ($LASTEXITCODE -ne 0) { throw 'git push に失敗しました。GitHubの認証を確認してください。ローカルの変更は保持されています。' }
        Write-Host "GitHubの開発ブランチへPush済み: $branch" -ForegroundColor Green
    } else {
        Write-Host 'GitHubへは未Pushです。確認後にこの開発ブランチをcommit/pushできます。'
    }
    if (-not $NoStart) {
        Step '空いているローカルポートを探して開発サーバーを起動します'
        $port = $null
        foreach ($candidatePort in 5173..5182) {
            $listener = $null
            try {
                $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $candidatePort)
                $listener.Start()
                $port = $candidatePort
                break
            } catch {
                # Another application is using this port. Try the next port.
            } finally {
                if ($null -ne $listener) { $listener.Stop() }
            }
        }
        if ($null -eq $port) {
            Write-Warning '5173～5182のポートが使用中です。ファイル導入とビルドは成功しました。既存の開発サーバーを停止して npm.cmd run dev を実行してください。'
        } else {
            $safeRepo = $repo.Replace("'", "''")
            $line = "Set-Location -LiteralPath '$safeRepo'; npm.cmd run dev -- --host 127.0.0.1 --port $port --strictPort"
            $argString = '-NoProfile -NoExit -Command "' + $line.Replace('"', '\"') + '"'
            $child = Start-Process -FilePath 'powershell.exe' -ArgumentList $argString -WorkingDirectory $repo -PassThru
            $url = "http://127.0.0.1:$port/mission-creator.html"
            $ready = $false
            for ($i = 0; $i -lt 30; $i++) {
                Start-Sleep -Milliseconds 600
                try {
                    $result = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
                    if ($result.StatusCode -eq 200 -and $result.Content -match 'Mission Creator') {
                        $ready = $true
                        break
                    }
                } catch {
                    # Vite is still starting; try again.
                }
                if ($child.HasExited) { break }
            }
            if ($ready) {
                Start-Process $url
                Write-Host "画面: $url" -ForegroundColor Green
                Write-Host '新しいPowerShellウィンドウは開いたままにしてください。' -ForegroundColor Yellow
            } else {
                Write-Warning "ファイルの導入・テスト・ビルドは成功しましたが、ブラウザの自動起動を確認できません。新しいPowerShellウィンドウのエラーを確認してください。URL: $url"
            }
        }
    }

} catch {
    $err = $_.Exception.Message
    Write-Host "`n[TimePalette] 失敗: $err" -ForegroundColor Red
    if ($installStarted -and -not $installVerified) {
        Write-Host 'コピーしたファイルを自動的に元へ戻しています…' -ForegroundColor Yellow
        foreach ($path in $copied) {
            $dest = Join-Path $repo $path
            if ($path -in $backedUp) {
                Copy-Item -LiteralPath (Join-Path $backup $path) -Destination $dest -Force
            } elseif (Test-Path -LiteralPath $dest -PathType Leaf) {
                Remove-Item -LiteralPath $dest -Force
            }
        }
        Write-Host 'ファイルの復元が完了しました。' -ForegroundColor Yellow
    }
    exit 1
}
