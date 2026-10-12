#requires -Version 5.1

<#
.SYNOPSIS
  Start, stop, restart or check the production `server.mjs` instance on a given port.

.DESCRIPTION
  `server.mjs` is an always-on HTTP server, so launching it from a short-lived shell
  must fully detach it from the shell's std handles. If the child keeps a handle on
  the parent's stdin/out pipes, a task runner that waits for EOF on those pipes will
  appear to hang forever even after the server answered HTTP 200.

  This script never waits on the server process. It:
    * refuses to start a duplicate when the port is already listening,
    * redirects stdin/stdout/stderr to files so no std handle is inherited, and records
      the PID so `stop`/`restart` only ever touch this project's own server,
    * waits for the listener with a bounded poll (no unbounded sleeps),
    * runs one bounded HTTP health request and exits with a clear code.

.PARAMETER Command
  status | start | restart | stop | check

.PARAMETER Port
  Port the production server listens on. Defaults to 3150.

.PARAMETER TimeoutSec
  Bound for the listener wait and the health request. Defaults to 30.

.EXAMPLE
  .\scripts\manage-server.ps1 start -Port 3150
.EXAMPLE
  .\scripts\manage-server.ps1 check -Port 3150
#>

param(
    [ValidateSet('status', 'start', 'restart', 'stop', 'check')]
    [string]$Command = 'status',

    [ValidateRange(1, 65535)]
    [int]$Port = 3150,

    [int]$TimeoutSec = 30
)

$ErrorActionPreference = 'Stop'
$pidFile = Join-Path $PSScriptRoot ('..\.next\server.' + $Port + '.pid')
$logDir = Join-Path $PSScriptRoot ('..\.next\logs')
$outLog = Join-Path $logDir ('server.' + $Port + '.out.log')
$errLog = Join-Path $logDir ('server.' + $Port + '.err.log')
$nullIn = Join-Path $logDir ('server.' + $Port + '.stdin')

function Write-Step([string]$Message) { Write-Host ("[{0}] {1}" -f (Get-Date -Format 'HH:mm:ss'), $Message) }

function Get-ListenerPid([int]$TargetPort) {
    $conn = Get-NetTCPConnection -State Listen -LocalPort $TargetPort -ErrorAction SilentlyContinue
    return ($conn | Select-Object -First 1).OwningProcess
}

function Wait-ForListener([int]$TargetPort, [int]$BudgetSec, [string]$Label) {
    $deadline = [DateTime]::UtcNow.AddSeconds($BudgetSec)
    do {
        # The only acceptable proof that the server is up is a bound listener: Next
        # takes a moment to prepare after the process spawns, so a mere alive PID or
        # a written PID file must NOT be treated as "listening".
        $pidOnPort = Get-ListenerPid $TargetPort
        if ($pidOnPort) { return $pidOnPort }
        Start-Sleep -Milliseconds 250
    } while ([DateTime]::UtcNow -lt $deadline)
    throw ("{0} did not start listening on port {1} within {2}s" -f $Label, $TargetPort, $BudgetSec)
}

function Invoke-HealthRequest([int]$TargetPort, [int]$BudgetSec) {
    $uri = "http://127.0.0.1:$TargetPort/products"
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri $uri -TimeoutSec $BudgetSec
        $sw.Stop()
        if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
            Write-Step ("HTTP {0} from {1} in {2}ms (bytes={3})" -f $response.StatusCode, $uri, $sw.ElapsedMilliseconds, $response.RawContentLength)
            return 0
        }
        throw ("HTTP {0} from {1}" -f $response.StatusCode, $uri)
    } finally {
        if ($sw.IsRunning) { $sw.Stop() }
    }
}

function Assert-NoListener([int]$TargetPort) {
    $pidOnPort = Get-ListenerPid $TargetPort
    if ($pidOnPort) {
        throw ("Port {0} is already in use by PID {1}. Use 'restart' to replace this project's server, " -f $TargetPort, $pidOnPort)
    }
}

function Remove-OnlyOurServer([int]$TargetPort) {
    if (Test-Path $pidFile) {
        $recorded = ((Get-Content $pidFile -ErrorAction SilentlyContinue) -join '').Trim()
        if ($recorded -match '^\d+$') {
            $proc = Get-Process -Id ([int]$recorded) -ErrorAction SilentlyContinue
            if ($proc -and $proc.ProcessName -eq 'node') {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                Write-Step ("Stopped recorded server PID {0}" -f $proc.Id)
            }
        }
        Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    }
    $pidOnPort = Get-ListenerPid $TargetPort
    if ($pidOnPort) {
        Write-Step ("Port {0} still listening (PID {1}); left untouched - not a process we recorded." -f $TargetPort, $pidOnPort)
        return $false
    }
    return $true
}

switch ($Command) {
    'status' {
        $pidOnPort = Get-ListenerPid $Port
        if ($pidOnPort) {
            Write-Step ("listening: pid={0} port={1}" -f $pidOnPort, $Port)
        } else {
            Write-Step ("not listening on port {0}" -f $Port)
            exit 1
        }
        exit 0
    }

    'check' {
        $pidOnPort = Get-ListenerPid $Port
        if (-not $pidOnPort) {
            Write-Step ("not listening on port {0}" -f $Port)
            exit 1
        }
        Write-Step ("pid={0} port={1}" -f $pidOnPort, $Port)
        exit (Invoke-HealthRequest $Port $TimeoutSec)
    }

    'start' {
        try {
            $pidOnPort = Get-ListenerPid $Port
            if ($pidOnPort) {
                Write-Step ("already listening on {0} (pid {1}); no duplicate started." -f $Port, $pidOnPort)
                exit 0
            }

            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
            if (-not (Test-Path $nullIn)) { New-Item -ItemType File -Path $nullIn -Force | Out-Null }

            # `server.mjs` reads the port from the PORT environment variable; it
            # has no CLI flag. Without this it always binds its default (3000),
            # so `-Port 3150` would silently start the wrong port and the caller
            # would poll a listener that never appears.
            $env:PORT = [string]$Port
            $process = Start-Process -FilePath 'node' `
                -ArgumentList @('server.mjs') `
                -WorkingDirectory (Join-Path $PSScriptRoot '..') `
                -RedirectStandardInput $nullIn `
                -RedirectStandardOutput $outLog `
                -RedirectStandardError $errLog `
                -WindowStyle Hidden `
                -PassThru

            $process.Id | Set-Content -Path $pidFile
            Write-Step ("started server pid {0} on port {1}" -f $process.Id, $Port)

            Wait-ForListener $Port $TimeoutSec 'server'
            exit (Invoke-HealthRequest $Port $TimeoutSec)
        } catch {
            Write-Host ("ERROR: {0}" -f $_.Exception.Message)
            exit 1
        }
    }

    'restart' {
        try {
            $removed = Remove-OnlyOurServer $Port
            if (-not $removed) {
                Write-Host ("Refusing to restart: port {0} is owned by another process." -f $Port)
                exit 1
            }
            $process = $null
            New-Item -ItemType Directory -Path $logDir -Force | Out-Null
            if (-not (Test-Path $nullIn)) { New-Item -ItemType File -Path $nullIn -Force | Out-Null }

            # See `start`: `server.mjs` takes the port from PORT, not argv.
            $env:PORT = [string]$Port
            $process = Start-Process -FilePath 'node' `
                -ArgumentList @('server.mjs') `
                -WorkingDirectory (Join-Path $PSScriptRoot '..') `
                -RedirectStandardInput $nullIn `
                -RedirectStandardOutput $outLog `
                -RedirectStandardError $errLog `
                -WindowStyle Hidden `
                -PassThru

            $process.Id | Set-Content -Path $pidFile
            Write-Step ("restarted server pid {0} on port {1}" -f $process.Id, $Port)

            Wait-ForListener $Port $TimeoutSec 'server'
            exit (Invoke-HealthRequest $Port $TimeoutSec)
        } catch {
            Write-Host ("ERROR: {0}" -f $_.Exception.Message)
            exit 1
        }
    }

    'stop' {
        $removed = Remove-OnlyOurServer $Port
        if (-not $removed) { exit 1 }
        Write-Step ("stopped; port {0} is free." -f $Port)
        exit 0
    }
}