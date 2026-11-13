# 发布本项目到 GitHub（XXiaer/huanyiquan）
#
# 任何 agent 在完成一个小版本后调用即可，不需要了解底层怎么接的。
#
#   pwsh scripts/publish-github.ps1 -Message "改了什么的简短说明"
#   pwsh scripts/publish-github.ps1 -Message "..." -NoPush     # 只提交不推送
#
# 脚本自适应两种目录结构：
#   1) 本项目是大仓 F:\ai-projects 的子目录（当前主力形态）
#      → 用 git subtree 把本目录历史抽成导出分支，再推成 GitHub 的 main
#   2) 本项目是独立仓库（有人直接 clone 了 GitHub 仓库）
#      → 普通 git commit + push
#
# 只提交本目录内的改动，不会扫到大仓里的其他项目。

param(
    [Parameter(Mandatory = $true)]
    [string]$Message,

    [switch]$NoPush
)

# 中文路径与注释需要 PowerShell 7；低于 7 时用 pwsh 重新执行自己
if ($PSVersionTable.PSVersion.Major -lt 7) {
    $pwsh = (Get-Command pwsh -ErrorAction SilentlyContinue).Source
    if (-not $pwsh) {
        throw '本脚本需要 PowerShell 7+（pwsh）。请改用 pwsh 运行，或安装 PowerShell 7。'
    }
    $fwd = @('-NoProfile', '-File', $PSCommandPath, '-Message', $Message)
    if ($NoPush) { $fwd += '-NoPush' }
    & $pwsh @fwd
    exit $LASTEXITCODE
}

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

# git-subtree 在中文路径上会因路径转义断言失败，这两项必需
$env:LC_ALL = 'C.UTF-8'

$proj = Split-Path $PSScriptRoot -Parent          # ...\项目二
$top  = (git -C $proj rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $top) {
    throw "无法定位 git 仓库根目录：$proj 不在任何 git 仓库内。"
}
$top = $top.Trim() -replace '\\', '/'
$projNorm = $proj.Trim() -replace '\\', '/'

function Write-Step($text) { Write-Host ''; Write-Host "== $text ==" }

# 用 -F 传提交信息，避免 PowerShell 5/7 与 git 之间的中文编码差异
function Invoke-Commit([string]$msg, [string]$repoRoot) {
    $msgFile = Join-Path $env:TEMP ("publish-msg-{0}.txt" -f [guid]::NewGuid().ToString('N'))
    try {
        [IO.File]::WriteAllText($msgFile, $msg, (New-Object Text.UTF8Encoding($false)))
        git -C $repoRoot commit -F $msgFile
        if ($LASTEXITCODE -ne 0) { throw 'git commit 失败' }
    }
    finally {
        Remove-Item $msgFile -Force -ErrorAction SilentlyContinue
    }
}

if ($top -eq $projNorm) {
    # ---------- 模式 2：本项目自己就是仓库 ----------
    Write-Step '独立仓库模式'
    $dirty = @(git -C $proj status --porcelain)
    if ($dirty.Count -eq 0) {
        Write-Host '没有未提交改动，仓库已是最新。'
        exit 0
    }
    Write-Host "提交 $($dirty.Count) 个文件"
    git -C $proj add -A
    Invoke-Commit $Message $proj

    if ($NoPush) { Write-Host '已提交（-NoPush，未推送）'; exit 0 }

    Write-Step '推送到 GitHub'
    git -C $proj push --progress origin HEAD
    if ($LASTEXITCODE -ne 0) { throw '推送失败' }
    Write-Host ''
    Write-Host '完成。https://github.com/XXiaer/huanyiquan' -ForegroundColor Green
    exit 0
}

# ---------- 模式 1：大仓的子目录 ----------
$subdir = $projNorm.Substring($top.Length).TrimStart('/')
Write-Step "子目录模式（大仓 $top ，子目录 $subdir）"

$remotes = @(git -C $top remote)
if (-not ($remotes -contains 'github')) {
    throw "大仓里没有名为 github 的 remote。请先执行：git -C `"$top`" remote add github git@github.com:XXiaer/huanyiquan.git"
}

# 1. 只提交本项目目录内的改动
$dirty = @(git -C $top status --porcelain -- $subdir)
if ($dirty.Count -gt 0) {
    Write-Step "提交 $($dirty.Count) 个改动"
    git -C $top add -- $subdir
    Invoke-Commit $Message $top
}
else {
    Write-Host '本项目目录没有未提交改动，将推送当前 HEAD 的内容。'
}

# 2. 抽取本目录历史
Write-Step '抽取子目录历史'
# 注意：subtree 的进度信息会混进输出流，只认 40 位十六进制那一行
$raw = git -C $top -c core.quotepath=false subtree split -P $subdir 2>$null
if ($LASTEXITCODE -ne 0) { throw 'subtree split 失败' }
$commit = $raw | Where-Object { $_ -match '^[0-9a-f]{40}$' } | Select-Object -First 1
if (-not $commit) { throw "未能从 subtree split 输出解析 commit hash：$raw" }
Write-Host "export commit: $commit"

$branch = 'project2-export'
$previous = git -C $top rev-parse --verify $branch 2>$null
git -C $top branch -f $branch $commit | Out-Null

if ($previous -eq $commit -and -not $NoPush) {
    Write-Host ''
    Write-Host '导出内容与上次一致，无需重复推送。' -ForegroundColor Yellow
    exit 0
}

if ($NoPush) { Write-Host '已提交并生成导出分支（-NoPush，未推送）'; exit 0 }

# 3. 推送
Write-Step '推送到 GitHub'
git -C $top push --progress github "${branch}:main"
if ($LASTEXITCODE -ne 0) { throw '推送失败。网络不稳时直接重跑本脚本即可，已推送的对象不会重传。' }

Write-Host ''
Write-Host '完成。https://github.com/XXiaer/huanyiquan' -ForegroundColor Green
