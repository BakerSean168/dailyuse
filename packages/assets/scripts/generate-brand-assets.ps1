Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

function New-DirectoryIfMissing {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path | Out-Null
  }
}

function Write-PngResized {
  param(
    [Parameter(Mandatory = $true)]
    [System.Drawing.Image]$SourceImage,
    [Parameter(Mandatory = $true)]
    [int]$Size,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImage($SourceImage, 0, 0, $Size, $Size)
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

function New-PointF {
  param(
    [Parameter(Mandatory = $true)]
    [double]$X,
    [Parameter(Mandatory = $true)]
    [double]$Y
  )

  return New-Object System.Drawing.PointF([single]$X, [single]$Y)
}

function Write-TrayGlyphPng {
  param(
    [Parameter(Mandatory = $true)]
    [int]$Size,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
  )

  $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

  $mainPen = $null
  $accentPen = $null
  $guidePen = $null
  $highlightBrush = $null

  try {
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.Clear([System.Drawing.Color]::Transparent)

    $mainPen = New-Object System.Drawing.Pen(
      [System.Drawing.Color]::FromArgb(255, 244, 170, 36),
      [single]([Math]::Max(2.2, $Size * 0.18))
    )
    $accentPen = New-Object System.Drawing.Pen(
      [System.Drawing.Color]::FromArgb(255, 255, 244, 214),
      [single]([Math]::Max(1.4, $Size * 0.10))
    )
    $guidePen = New-Object System.Drawing.Pen(
      [System.Drawing.Color]::FromArgb(230, 210, 128, 24),
      [single]([Math]::Max(1.2, $Size * 0.09))
    )
    $highlightBrush = New-Object System.Drawing.SolidBrush(
      [System.Drawing.Color]::FromArgb(255, 255, 247, 227)
    )

    foreach ($pen in @($mainPen, $accentPen, $guidePen)) {
      $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
      $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
      $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
    }

    $graphics.DrawBezier(
      $guidePen,
      (New-PointF ($Size * 0.12) ($Size * 0.52)),
      (New-PointF ($Size * 0.28) ($Size * 0.42)),
      (New-PointF ($Size * 0.55) ($Size * 0.40)),
      (New-PointF ($Size * 0.86) ($Size * 0.20))
    )

    $graphics.DrawBezier(
      $mainPen,
      (New-PointF ($Size * 0.10) ($Size * 0.70)),
      (New-PointF ($Size * 0.26) ($Size * 0.48)),
      (New-PointF ($Size * 0.54) ($Size * 0.56)),
      (New-PointF ($Size * 0.88) ($Size * 0.18))
    )

    $graphics.DrawBezier(
      $accentPen,
      (New-PointF ($Size * 0.36) ($Size * 0.60)),
      (New-PointF ($Size * 0.42) ($Size * 0.88)),
      (New-PointF ($Size * 0.66) ($Size * 0.88)),
      (New-PointF ($Size * 0.82) ($Size * 0.48))
    )

    $highlightSize = [Math]::Max(2.4, $Size * 0.16)
    $highlightX = ($Size * 0.42) - ($highlightSize / 2)
    $highlightY = ($Size * 0.62) - ($highlightSize / 2)
    $graphics.FillEllipse($highlightBrush, $highlightX, $highlightY, $highlightSize, $highlightSize)

    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  }
  finally {
    if ($highlightBrush) { $highlightBrush.Dispose() }
    if ($guidePen) { $guidePen.Dispose() }
    if ($accentPen) { $accentPen.Dispose() }
    if ($mainPen) { $mainPen.Dispose() }
    $graphics.Dispose()
    $bitmap.Dispose()
  }
}

function ConvertTo-Ico {
  param(
    [Parameter(Mandatory = $true)]
    [int[]]$Sizes,
    [Parameter(Mandatory = $true)]
    [string]$SourceDirectory,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
  )

  $entries = @()
  foreach ($size in $Sizes) {
    $pngPath = Join-Path $SourceDirectory "Memoflow-$size.png"
    $bytes = [System.IO.File]::ReadAllBytes($pngPath)
    $entries += [pscustomobject]@{
      Size = $size
      Bytes = $bytes
      Length = $bytes.Length
    }
  }

  $stream = [System.IO.File]::Create($OutputPath)
  $writer = New-Object System.IO.BinaryWriter($stream)
  try {
    $writer.Write([UInt16]0)
    $writer.Write([UInt16]1)
    $writer.Write([UInt16]$entries.Count)

    $offset = 6 + (16 * $entries.Count)
    foreach ($entry in $entries) {
      $dimension = if ($entry.Size -ge 256) { 0 } else { [byte]$entry.Size }
      $writer.Write([byte]$dimension)
      $writer.Write([byte]$dimension)
      $writer.Write([byte]0)
      $writer.Write([byte]0)
      $writer.Write([UInt16]1)
      $writer.Write([UInt16]32)
      $writer.Write([UInt32]$entry.Length)
      $writer.Write([UInt32]$offset)
      $offset += $entry.Length
    }

    foreach ($entry in $entries) {
      $writer.Write($entry.Bytes)
    }
  }
  finally {
    $writer.Dispose()
    $stream.Dispose()
  }
}

function Write-BigEndianUInt32 {
  param(
    [Parameter(Mandatory = $true)]
    [System.IO.BinaryWriter]$Writer,
    [Parameter(Mandatory = $true)]
    [UInt32]$Value
  )

  $bytes = [BitConverter]::GetBytes($Value)
  if ([BitConverter]::IsLittleEndian) {
    [Array]::Reverse($bytes)
  }
  $Writer.Write($bytes)
}

function ConvertTo-Icns {
  param(
    [Parameter(Mandatory = $true)]
    [hashtable]$SizeMap,
    [Parameter(Mandatory = $true)]
    [string]$SourceDirectory,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
  )

  $blocks = New-Object System.Collections.Generic.List[object]
  $totalLength = 8

  foreach ($size in ($SizeMap.Keys | Sort-Object {[int]$_})) {
    $typeCode = [string]$SizeMap[$size]
    $pngPath = Join-Path $SourceDirectory "Memoflow-$size.png"
    $bytes = [System.IO.File]::ReadAllBytes($pngPath)
    $blockLength = 8 + $bytes.Length
    $blocks.Add([pscustomobject]@{
      TypeCode = $typeCode
      Bytes = $bytes
      Length = $blockLength
    }) | Out-Null
    $totalLength += $blockLength
  }

  $stream = [System.IO.File]::Create($OutputPath)
  $writer = New-Object System.IO.BinaryWriter($stream)
  try {
    $writer.Write([System.Text.Encoding]::ASCII.GetBytes('icns'))
    Write-BigEndianUInt32 -Writer $writer -Value ([UInt32]$totalLength)

    foreach ($block in $blocks) {
      $writer.Write([System.Text.Encoding]::ASCII.GetBytes($block.TypeCode))
      Write-BigEndianUInt32 -Writer $writer -Value ([UInt32]$block.Length)
      $writer.Write($block.Bytes)
    }
  }
  finally {
    $writer.Dispose()
    $stream.Dispose()
  }
}

function Write-EmbeddedSvg {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePngPath,
    [Parameter(Mandatory = $true)]
    [string]$OutputPath
  )

  $base64 = [Convert]::ToBase64String([System.IO.File]::ReadAllBytes($SourcePngPath))
  $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-labelledby="memoflowTitle memoflowDesc">
  <title id="memoflowTitle">知行 (Memoflow)</title>
  <desc id="memoflowDesc">知行 Memoflow application icon with a dark field, warm glow, and flowing amber-white strands that gather and streamline into motion.</desc>
  <image width="1024" height="1024" href="data:image/png;base64,$base64" />
</svg>
"@
  [System.IO.File]::WriteAllText($OutputPath, $svg, [System.Text.Encoding]::UTF8)
}

function Copy-Asset {
  param(
    [Parameter(Mandatory = $true)]
    [string]$SourcePath,
    [Parameter(Mandatory = $true)]
    [string]$DestinationPath
  )

  $destinationDirectory = Split-Path -Parent $DestinationPath
  New-DirectoryIfMissing -Path $destinationDirectory
  Copy-Item -LiteralPath $SourcePath -Destination $DestinationPath -Force
}

$workspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..')).Path
$logosDirectory = Join-Path $workspaceRoot 'packages\assets\src\images\logos'
$sourcePngPath = Join-Path $logosDirectory 'Memoflow-Icon.png'
$sourcePng = [System.Drawing.Image]::FromFile($sourcePngPath)

try {
  $pngSizes = @(16, 24, 32, 48, 64, 72, 96, 128, 180, 192, 256, 512, 1024)
  foreach ($size in $pngSizes) {
    $outputPath = Join-Path $logosDirectory "Memoflow-$size.png"
    Write-PngResized -SourceImage $sourcePng -Size $size -OutputPath $outputPath
  }

  Write-TrayGlyphPng -Size 16 -OutputPath (Join-Path $logosDirectory 'Memoflow-Tray-Windows-16.png')
  Write-TrayGlyphPng -Size 32 -OutputPath (Join-Path $logosDirectory 'Memoflow-Tray-Windows-32.png')

  Write-EmbeddedSvg -SourcePngPath $sourcePngPath -OutputPath (Join-Path $logosDirectory 'Memoflow.svg')
  ConvertTo-Ico `
    -Sizes @(16, 24, 32, 48, 64, 128, 256) `
    -SourceDirectory $logosDirectory `
    -OutputPath (Join-Path $logosDirectory 'Memoflow.ico')
  ConvertTo-Icns `
    -SizeMap @{
      16 = 'icp4'
      32 = 'icp5'
      64 = 'icp6'
      128 = 'ic07'
      256 = 'ic08'
      512 = 'ic09'
      1024 = 'ic10'
    } `
    -SourceDirectory $logosDirectory `
    -OutputPath (Join-Path $logosDirectory 'Memoflow.icns')
}
finally {
  $sourcePng.Dispose()
}

$webPublicDirectory = Join-Path $workspaceRoot 'apps\web\public'
New-DirectoryIfMissing -Path $webPublicDirectory
Copy-Asset -SourcePath (Join-Path $logosDirectory 'Memoflow.ico') -DestinationPath (Join-Path $webPublicDirectory 'favicon.ico')
Copy-Asset -SourcePath (Join-Path $logosDirectory 'Memoflow-16.png') -DestinationPath (Join-Path $webPublicDirectory 'favicon-16x16.png')
Copy-Asset -SourcePath (Join-Path $logosDirectory 'Memoflow-32.png') -DestinationPath (Join-Path $webPublicDirectory 'favicon-32x32.png')
Copy-Asset -SourcePath (Join-Path $logosDirectory 'Memoflow-180.png') -DestinationPath (Join-Path $webPublicDirectory 'apple-touch-icon.png')
Copy-Asset -SourcePath (Join-Path $logosDirectory 'Memoflow-192.png') -DestinationPath (Join-Path $webPublicDirectory 'icon-192.png')
Copy-Asset -SourcePath (Join-Path $logosDirectory 'Memoflow-512.png') -DestinationPath (Join-Path $webPublicDirectory 'icon-512.png')

$manifest = @'
{
  "name": "知行 (Memoflow)",
  "short_name": "知行",
  "description": "将知识转化为行动的流式个人工作台。",
  "theme_color": "#181A1F",
  "background_color": "#181A1F",
  "display": "standalone",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
'@
[System.IO.File]::WriteAllText(
  (Join-Path $webPublicDirectory 'site.webmanifest'),
  $manifest.TrimStart(),
  [System.Text.Encoding]::UTF8
)

$desktopBuildDirectory = Join-Path $workspaceRoot 'apps\desktop\build'
New-DirectoryIfMissing -Path $desktopBuildDirectory
Copy-Asset -SourcePath (Join-Path $logosDirectory 'Memoflow.ico') -DestinationPath (Join-Path $desktopBuildDirectory 'icon.ico')
Copy-Asset -SourcePath (Join-Path $logosDirectory 'Memoflow.icns') -DestinationPath (Join-Path $desktopBuildDirectory 'icon.icns')
Copy-Asset -SourcePath (Join-Path $logosDirectory 'Memoflow-512.png') -DestinationPath (Join-Path $desktopBuildDirectory 'icon.png')

$mobileBrandDirectory = Join-Path $workspaceRoot 'apps\mobile\assets\brand'
New-DirectoryIfMissing -Path $mobileBrandDirectory
Copy-Asset -SourcePath (Join-Path $logosDirectory 'Memoflow-32.png') -DestinationPath (Join-Path $mobileBrandDirectory 'favicon.png')
Copy-Asset -SourcePath (Join-Path $logosDirectory 'Memoflow-512.png') -DestinationPath (Join-Path $mobileBrandDirectory 'logo-512.png')
Copy-Asset -SourcePath (Join-Path $logosDirectory 'Memoflow-512.png') -DestinationPath (Join-Path $mobileBrandDirectory 'splash-icon.png')
Copy-Asset -SourcePath (Join-Path $logosDirectory 'Memoflow-1024.png') -DestinationPath (Join-Path $mobileBrandDirectory 'icon-1024.png')
Copy-Asset -SourcePath (Join-Path $logosDirectory 'Memoflow-1024.png') -DestinationPath (Join-Path $mobileBrandDirectory 'adaptive-icon-foreground.png')

Write-Host 'Memoflow brand assets generated successfully.'
