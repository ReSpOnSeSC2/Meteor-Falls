Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$characterDir = Join-Path $root 'assets/art/characters'
$masterDir = Join-Path $root 'assets/art/masters/characters/animation'
$reviewDir = Join-Path $root 'assets/art/review'

$frameW = 24
$frameH = 32
$cols = 4
$rows = 12
$runtimeW = $frameW * $cols
$runtimeH = $frameH * $rows
$masterScale = 4

New-Item -ItemType Directory -Force -Path $masterDir | Out-Null
New-Item -ItemType Directory -Force -Path $reviewDir | Out-Null

function Color-Luma([System.Drawing.Color]$c) {
  return (0.2126 * $c.R) + (0.7152 * $c.G) + (0.0722 * $c.B)
}

function Stable-Variant([string]$name) {
  [uint32]$hash = 2166136261
  foreach ($ch in $name.ToCharArray()) {
    $hash = [uint32]($hash -bxor [uint32][char]$ch)
    $hash = [uint32](([uint64]$hash * 16777619) % 4294967296)
  }
  return [int]($hash % 3)
}

function Find-CommonColor([System.Drawing.Bitmap]$bmp, [int]$fx, [int]$fy, [int]$x0, [int]$y0, [int]$w, [int]$h, [double]$minLuma, [double]$maxLuma) {
  $counts = @{}
  for ($y = $fy + $y0; $y -lt $fy + $y0 + $h; $y++) {
    for ($x = $fx + $x0; $x -lt $fx + $x0 + $w; $x++) {
      $c = $bmp.GetPixel($x, $y)
      if ($c.A -lt 64) { continue }
      $l = Color-Luma $c
      if ($l -lt $minLuma -or $l -gt $maxLuma) { continue }
      $key = "$($c.A),$($c.R),$($c.G),$($c.B)"
      if ($counts.ContainsKey($key)) { $counts[$key] += 1 } else { $counts[$key] = 1 }
    }
  }
  if ($counts.Count -eq 0) { return $null }
  $best = $counts.GetEnumerator() | Sort-Object -Property Value -Descending | Select-Object -First 1
  $parts = $best.Key.Split(',') | ForEach-Object { [int]$_ }
  return [System.Drawing.Color]::FromArgb($parts[0], $parts[1], $parts[2], $parts[3])
}

function Find-Dark([System.Drawing.Bitmap]$bmp, [int]$fx, [int]$fy) {
  $best = [System.Drawing.Color]::FromArgb(255, 18, 25, 38)
  $bestL = 9999
  for ($y = $fy + 4; $y -lt $fy + 22; $y++) {
    for ($x = $fx + 4; $x -lt $fx + 20; $x++) {
      $c = $bmp.GetPixel($x, $y)
      if ($c.A -lt 64) { continue }
      $l = Color-Luma $c
      if ($l -lt $bestL) {
        $bestL = $l
        $best = $c
      }
    }
  }
  return $best
}

function Find-Light([System.Drawing.Bitmap]$bmp, [int]$fx, [int]$fy) {
  $best = [System.Drawing.Color]::FromArgb(255, 248, 242, 214)
  $bestL = -1
  for ($y = $fy + 7; $y -lt $fy + 21; $y++) {
    for ($x = $fx + 5; $x -lt $fx + 19; $x++) {
      $c = $bmp.GetPixel($x, $y)
      if ($c.A -lt 64) { continue }
      $l = Color-Luma $c
      if ($l -gt $bestL) {
        $bestL = $l
        $best = $c
      }
    }
  }
  return $best
}

function Find-BodyColors([System.Drawing.Bitmap]$bmp, [int]$fx, [int]$fy) {
  $dark = Find-Dark $bmp $fx $fy
  $skin = Find-CommonColor $bmp $fx $fy 5 9 14 12 70 245
  $shirt = Find-CommonColor $bmp $fx $fy 5 15 14 8 45 220
  $lower = Find-CommonColor $bmp $fx $fy 6 21 12 8 35 210
  $light = Find-Light $bmp $fx $fy
  $skinColor = if ($null -ne $skin) { $skin } else { $light }
  $shirtColor = if ($null -ne $shirt) { $shirt } else { $skinColor }
  $lowerColor = if ($null -ne $lower) { $lower } else { $shirtColor }
  return @{
    dark = $dark
    skin = $skinColor
    shirt = $shirtColor
    lower = $lowerColor
    light = $light
  }
}

function Set-PixelSafe([System.Drawing.Bitmap]$bmp, [int]$x, [int]$y, [System.Drawing.Color]$color) {
  if ($x -lt 0 -or $y -lt 0 -or $x -ge $bmp.Width -or $y -ge $bmp.Height) { return }
  $hasBody = $false
  for ($oy = -1; $oy -le 1; $oy++) {
    for ($ox = -1; $ox -le 1; $ox++) {
      $nx = $x + $ox
      $ny = $y + $oy
      if ($nx -lt 0 -or $ny -lt 0 -or $nx -ge $bmp.Width -or $ny -ge $bmp.Height) { continue }
      if ($bmp.GetPixel($nx, $ny).A -gt 64) { $hasBody = $true }
    }
  }
  if ($hasBody) { $bmp.SetPixel($x, $y, $color) }
}

function Stroke([System.Drawing.Bitmap]$bmp, [int]$fx, [int]$fy, [array]$points, [System.Drawing.Color]$color) {
  foreach ($p in $points) {
    Set-PixelSafe $bmp ($fx + $p[0]) ($fy + $p[1]) $color
  }
}

function Shift-Region([System.Drawing.Bitmap]$bmp, [int]$fx, [int]$fy, [int]$x0, [int]$y0, [int]$w, [int]$h, [int]$dx, [int]$dy) {
  $pixels = @()
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $px = $fx + $x0 + $x
      $py = $fy + $y0 + $y
      $c = $bmp.GetPixel($px, $py)
      if ($c.A -gt 0) {
        $pixels += ,@($x, $y, $c)
        $bmp.SetPixel($px, $py, [System.Drawing.Color]::Transparent)
      }
    }
  }
  foreach ($p in $pixels) {
    $tx = $fx + $x0 + $p[0] + $dx
    $ty = $fy + $y0 + $p[1] + $dy
    if ($tx -lt $fx -or $tx -ge ($fx + $frameW) -or $ty -lt $fy -or $ty -ge ($fy + $frameH)) { continue }
    $bmp.SetPixel($tx, $ty, $p[2])
  }
}

function Lean-RunHead([System.Drawing.Bitmap]$bmp, [int]$index, [int]$dx, [int]$dy) {
  $fx = ($index % $cols) * $frameW
  $fy = [Math]::Floor($index / $cols) * $frameH
  Shift-Region $bmp $fx $fy 4 2 16 15 $dx $dy
}

function Draw-FrontRunBody([System.Drawing.Bitmap]$bmp, [int]$index, [int]$phase) {
  $fx = ($index % $cols) * $frameW
  $fy = [Math]::Floor($index / $cols) * $frameH
  $c = Find-BodyColors $bmp $fx $fy
  if ($phase -eq 0) {
    Stroke $bmp $fx $fy @(@(6,17),@(7,18),@(7,19),@(8,20),@(8,21)) $c.dark
    Stroke $bmp $fx $fy @(@(7,18),@(8,19),@(8,20)) $c.shirt
    Stroke $bmp $fx $fy @(@(17,17),@(16,18),@(16,19),@(15,20),@(15,21)) $c.dark
    Stroke $bmp $fx $fy @(@(16,18),@(15,19),@(15,20)) $c.skin
    Stroke $bmp $fx $fy @(@(9,23),@(8,24),@(8,25),@(7,26),@(7,27),@(6,28)) $c.dark
    Stroke $bmp $fx $fy @(@(9,24),@(8,25),@(8,26),@(7,27)) $c.lower
    Stroke $bmp $fx $fy @(@(14,23),@(15,24),@(15,25),@(16,26),@(16,27),@(17,28)) $c.dark
    Stroke $bmp $fx $fy @(@(14,24),@(15,25),@(15,26),@(16,27)) $c.lower
  } else {
    Stroke $bmp $fx $fy @(@(6,17),@(8,18),@(8,19),@(9,20),@(9,21)) $c.dark
    Stroke $bmp $fx $fy @(@(8,18),@(9,19),@(9,20)) $c.skin
    Stroke $bmp $fx $fy @(@(17,17),@(15,18),@(15,19),@(14,20),@(14,21)) $c.dark
    Stroke $bmp $fx $fy @(@(15,18),@(14,19),@(14,20)) $c.shirt
    Stroke $bmp $fx $fy @(@(9,23),@(10,24),@(10,25),@(11,26),@(11,27),@(12,28)) $c.dark
    Stroke $bmp $fx $fy @(@(9,24),@(10,25),@(10,26),@(11,27)) $c.lower
    Stroke $bmp $fx $fy @(@(14,23),@(13,24),@(13,25),@(12,26),@(12,27),@(11,28)) $c.dark
    Stroke $bmp $fx $fy @(@(14,24),@(13,25),@(13,26),@(12,27)) $c.lower
  }
}

function Draw-FrontWalkBody([System.Drawing.Bitmap]$bmp, [int]$index, [int]$phase) {
  $fx = ($index % $cols) * $frameW
  $fy = [Math]::Floor($index / $cols) * $frameH
  $c = Find-BodyColors $bmp $fx $fy
  if ($phase -eq 0) {
    Stroke $bmp $fx $fy @(@(8,18),@(7,19),@(7,20)) $c.dark
    Stroke $bmp $fx $fy @(@(7,19),@(7,20)) $c.skin
    Stroke $bmp $fx $fy @(@(15,18),@(16,19),@(16,20)) $c.dark
    Stroke $bmp $fx $fy @(@(16,19),@(16,20)) $c.shirt
    Stroke $bmp $fx $fy @(@(10,23),@(9,24),@(9,25),@(8,26)) $c.dark
    Stroke $bmp $fx $fy @(@(9,24),@(9,25)) $c.lower
    Stroke $bmp $fx $fy @(@(13,23),@(14,24),@(14,25),@(15,26)) $c.dark
    Stroke $bmp $fx $fy @(@(14,24),@(14,25)) $c.lower
  } else {
    Stroke $bmp $fx $fy @(@(8,18),@(9,19),@(9,20)) $c.dark
    Stroke $bmp $fx $fy @(@(9,19),@(9,20)) $c.shirt
    Stroke $bmp $fx $fy @(@(15,18),@(14,19),@(14,20)) $c.dark
    Stroke $bmp $fx $fy @(@(14,19),@(14,20)) $c.skin
    Stroke $bmp $fx $fy @(@(10,23),@(11,24),@(11,25),@(12,26)) $c.dark
    Stroke $bmp $fx $fy @(@(11,24),@(11,25)) $c.lower
    Stroke $bmp $fx $fy @(@(13,23),@(12,24),@(12,25),@(11,26)) $c.dark
    Stroke $bmp $fx $fy @(@(12,24),@(12,25)) $c.lower
  }
}

function Draw-SideRunBody([System.Drawing.Bitmap]$bmp, [int]$index, [bool]$left, [int]$phase) {
  $fx = ($index % $cols) * $frameW
  $fy = [Math]::Floor($index / $cols) * $frameH
  $c = Find-BodyColors $bmp $fx $fy
  $dir = if ($left) { -1 } else { 1 }
  $frontX = if ($left) { 8 } else { 16 }
  $backX = if ($left) { 15 } else { 9 }
  if ($phase -eq 0) {
    Stroke $bmp $fx $fy @(@($frontX,17),@(($frontX + $dir),18),@(($frontX + $dir),19),@(($frontX + (2 * $dir)),20)) $c.dark
    Stroke $bmp $fx $fy @(@(($frontX + $dir),18),@(($frontX + (2 * $dir)),19)) $c.skin
    Stroke $bmp $fx $fy @(@($backX,17),@(($backX - $dir),18),@(($backX - $dir),19),@(($backX - (2 * $dir)),20)) $c.dark
    Stroke $bmp $fx $fy @(@(($backX - $dir),18),@(($backX - (2 * $dir)),19)) $c.shirt
    Stroke $bmp $fx $fy @(@($frontX,23),@(($frontX + $dir),24),@(($frontX + (2 * $dir)),25),@(($frontX + (3 * $dir)),26),@(($frontX + (4 * $dir)),27)) $c.dark
    Stroke $bmp $fx $fy @(@(($frontX + $dir),24),@(($frontX + (2 * $dir)),25),@(($frontX + (3 * $dir)),26)) $c.lower
    Stroke $bmp $fx $fy @(@($backX,23),@(($backX - $dir),24),@(($backX - (2 * $dir)),25),@(($backX - (2 * $dir)),26)) $c.dark
    Stroke $bmp $fx $fy @(@(($backX - $dir),24),@(($backX - (2 * $dir)),25)) $c.lower
  } else {
    Stroke $bmp $fx $fy @(@($frontX,17),@(($frontX - $dir),18),@(($frontX - $dir),19),@(($frontX - (2 * $dir)),20)) $c.dark
    Stroke $bmp $fx $fy @(@(($frontX - $dir),18),@(($frontX - (2 * $dir)),19)) $c.shirt
    Stroke $bmp $fx $fy @(@($backX,17),@(($backX + $dir),18),@(($backX + $dir),19),@(($backX + (2 * $dir)),20)) $c.dark
    Stroke $bmp $fx $fy @(@(($backX + $dir),18),@(($backX + (2 * $dir)),19)) $c.skin
    Stroke $bmp $fx $fy @(@($frontX,23),@(($frontX - $dir),24),@(($frontX - (2 * $dir)),25),@(($frontX - (2 * $dir)),26)) $c.dark
    Stroke $bmp $fx $fy @(@(($frontX - $dir),24),@(($frontX - (2 * $dir)),25)) $c.lower
    Stroke $bmp $fx $fy @(@($backX,23),@(($backX + $dir),24),@(($backX + (2 * $dir)),25),@(($backX + (3 * $dir)),26),@(($backX + (4 * $dir)),27)) $c.dark
    Stroke $bmp $fx $fy @(@(($backX + $dir),24),@(($backX + (2 * $dir)),25),@(($backX + (3 * $dir)),26)) $c.lower
  }
}

function Draw-SideWalkBody([System.Drawing.Bitmap]$bmp, [int]$index, [bool]$left, [int]$phase) {
  $fx = ($index % $cols) * $frameW
  $fy = [Math]::Floor($index / $cols) * $frameH
  $c = Find-BodyColors $bmp $fx $fy
  $dir = if ($left) { -1 } else { 1 }
  $frontX = if ($left) { 8 } else { 16 }
  $backX = if ($left) { 15 } else { 9 }
  if ($phase -eq 0) {
    Stroke $bmp $fx $fy @(@($frontX,18),@(($frontX + $dir),19),@(($frontX + $dir),20)) $c.dark
    Stroke $bmp $fx $fy @(@(($frontX + $dir),19),@(($frontX + $dir),20)) $c.skin
    Stroke $bmp $fx $fy @(@($backX,18),@(($backX - $dir),19),@(($backX - $dir),20)) $c.dark
    Stroke $bmp $fx $fy @(@(($backX - $dir),19),@(($backX - $dir),20)) $c.shirt
    Stroke $bmp $fx $fy @(@($frontX,23),@(($frontX + $dir),24),@(($frontX + (2 * $dir)),25),@(($frontX + (2 * $dir)),26)) $c.dark
    Stroke $bmp $fx $fy @(@(($frontX + $dir),24),@(($frontX + (2 * $dir)),25)) $c.lower
    Stroke $bmp $fx $fy @(@($backX,23),@(($backX - $dir),24),@(($backX - $dir),25)) $c.dark
  } else {
    Stroke $bmp $fx $fy @(@($frontX,18),@(($frontX - $dir),19),@(($frontX - $dir),20)) $c.dark
    Stroke $bmp $fx $fy @(@(($frontX - $dir),19),@(($frontX - $dir),20)) $c.shirt
    Stroke $bmp $fx $fy @(@($backX,18),@(($backX + $dir),19),@(($backX + $dir),20)) $c.dark
    Stroke $bmp $fx $fy @(@(($backX + $dir),19),@(($backX + $dir),20)) $c.skin
    Stroke $bmp $fx $fy @(@($frontX,23),@(($frontX - $dir),24),@(($frontX - $dir),25)) $c.dark
    Stroke $bmp $fx $fy @(@($backX,23),@(($backX + $dir),24),@(($backX + (2 * $dir)),25),@(($backX + (2 * $dir)),26)) $c.dark
    Stroke $bmp $fx $fy @(@(($backX + $dir),24),@(($backX + (2 * $dir)),25)) $c.lower
  }
}

function Draw-UpRunBody([System.Drawing.Bitmap]$bmp, [int]$index, [int]$phase) {
  $fx = ($index % $cols) * $frameW
  $fy = [Math]::Floor($index / $cols) * $frameH
  $c = Find-BodyColors $bmp $fx $fy
  if ($phase -eq 0) {
    Stroke $bmp $fx $fy @(@(7,17),@(6,18),@(6,19),@(5,20)) $c.dark
    Stroke $bmp $fx $fy @(@(6,18),@(5,19)) $c.shirt
    Stroke $bmp $fx $fy @(@(16,17),@(17,18),@(17,19),@(18,20)) $c.dark
    Stroke $bmp $fx $fy @(@(17,18),@(18,19)) $c.skin
    Stroke $bmp $fx $fy @(@(9,23),@(8,24),@(8,25),@(7,26),@(7,27)) $c.dark
    Stroke $bmp $fx $fy @(@(14,23),@(15,24),@(15,25),@(16,26),@(16,27)) $c.dark
  } else {
    Stroke $bmp $fx $fy @(@(7,17),@(8,18),@(8,19),@(9,20)) $c.dark
    Stroke $bmp $fx $fy @(@(8,18),@(9,19)) $c.skin
    Stroke $bmp $fx $fy @(@(16,17),@(15,18),@(15,19),@(14,20)) $c.dark
    Stroke $bmp $fx $fy @(@(15,18),@(14,19)) $c.shirt
    Stroke $bmp $fx $fy @(@(9,23),@(10,24),@(10,25),@(11,26),@(11,27)) $c.dark
    Stroke $bmp $fx $fy @(@(14,23),@(13,24),@(13,25),@(12,26),@(12,27)) $c.dark
  }
}

function Draw-UpWalkBody([System.Drawing.Bitmap]$bmp, [int]$index, [int]$phase) {
  $fx = ($index % $cols) * $frameW
  $fy = [Math]::Floor($index / $cols) * $frameH
  $c = Find-BodyColors $bmp $fx $fy
  if ($phase -eq 0) {
    Stroke $bmp $fx $fy @(@(8,18),@(7,19),@(7,20)) $c.dark
    Stroke $bmp $fx $fy @(@(15,18),@(16,19),@(16,20)) $c.dark
    Stroke $bmp $fx $fy @(@(10,23),@(9,24),@(9,25),@(8,26)) $c.dark
    Stroke $bmp $fx $fy @(@(13,23),@(14,24),@(14,25),@(15,26)) $c.dark
  } else {
    Stroke $bmp $fx $fy @(@(8,18),@(9,19),@(9,20)) $c.dark
    Stroke $bmp $fx $fy @(@(15,18),@(14,19),@(14,20)) $c.dark
    Stroke $bmp $fx $fy @(@(10,23),@(11,24),@(11,25),@(12,26)) $c.dark
    Stroke $bmp $fx $fy @(@(13,23),@(12,24),@(12,25),@(11,26)) $c.dark
  }
}

function Draw-DownExpression([System.Drawing.Bitmap]$bmp, [int]$index, [int]$variant) {
  $fx = ($index % $cols) * $frameW
  $fy = [Math]::Floor($index / $cols) * $frameH
  $dark = Find-Dark $bmp $fx $fy
  $light = Find-Light $bmp $fx $fy
  $mouth = if ($variant % 3 -eq 1) { [System.Drawing.Color]::FromArgb(255, 112, 47, 58) } else { $dark }

  # Lowered, sharper brows.
  foreach ($p in @(@(8,10),@(9,10),@(14,10),@(15,10),@(9,11),@(14,11))) {
    Set-PixelSafe $bmp ($fx + $p[0]) ($fy + $p[1]) $dark
  }

  if ($variant % 3 -eq 2) {
    # Clenched-teeth read.
    foreach ($p in @(@(10,17),@(11,17),@(12,17),@(13,17))) {
      Set-PixelSafe $bmp ($fx + $p[0]) ($fy + $p[1]) $dark
    }
    Set-PixelSafe $bmp ($fx + 11) ($fy + 18) $light
    Set-PixelSafe $bmp ($fx + 12) ($fy + 18) $light
    Set-PixelSafe $bmp ($fx + 10) ($fy + 18) $dark
    Set-PixelSafe $bmp ($fx + 13) ($fy + 18) $dark
  } else {
    # Open exertion mouth with one light tooth pixel.
    foreach ($p in @(@(11,16),@(12,16),@(10,17),@(13,17),@(10,18),@(13,18),@(11,19),@(12,19))) {
      Set-PixelSafe $bmp ($fx + $p[0]) ($fy + $p[1]) $dark
    }
    Set-PixelSafe $bmp ($fx + 11) ($fy + 17) $light
    Set-PixelSafe $bmp ($fx + 12) ($fy + 18) $mouth
  }
}

function Draw-DownWalkExpression([System.Drawing.Bitmap]$bmp, [int]$index) {
  $fx = ($index % $cols) * $frameW
  $fy = [Math]::Floor($index / $cols) * $frameH
  $dark = Find-Dark $bmp $fx $fy
  foreach ($p in @(@(9,11),@(14,11),@(10,17),@(11,18),@(12,18),@(13,17))) {
    Set-PixelSafe $bmp ($fx + $p[0]) ($fy + $p[1]) $dark
  }
}

function Draw-SideExpression([System.Drawing.Bitmap]$bmp, [int]$index, [bool]$left, [int]$variant) {
  $fx = ($index % $cols) * $frameW
  $fy = [Math]::Floor($index / $cols) * $frameH
  $dark = Find-Dark $bmp $fx $fy
  $light = Find-Light $bmp $fx $fy
  $dir = if ($left) { -1 } else { 1 }
  $eyeX = if ($left) { 8 } else { 15 }
  $mouthX = if ($left) { 7 } else { 16 }
  $cheekX = if ($left) { 9 } else { 14 }

  foreach ($p in @(@($eyeX,10),@(($eyeX + $dir),11),@($eyeX,12))) {
    Set-PixelSafe $bmp ($fx + $p[0]) ($fy + $p[1]) $dark
  }

  if ($variant % 2 -eq 0) {
    Set-PixelSafe $bmp ($fx + $mouthX) ($fy + 17) $dark
    Set-PixelSafe $bmp ($fx + ($mouthX + $dir)) ($fy + 18) $dark
    Set-PixelSafe $bmp ($fx + ($mouthX + $dir)) ($fy + 17) $light
  } else {
    Set-PixelSafe $bmp ($fx + $mouthX) ($fy + 17) $dark
    Set-PixelSafe $bmp ($fx + ($mouthX + $dir)) ($fy + 17) $dark
    Set-PixelSafe $bmp ($fx + ($mouthX + (2 * $dir))) ($fy + 18) $dark
  }
  Set-PixelSafe $bmp ($fx + $cheekX) ($fy + 15) $light
}

function Draw-SideWalkExpression([System.Drawing.Bitmap]$bmp, [int]$index, [bool]$left) {
  $fx = ($index % $cols) * $frameW
  $fy = [Math]::Floor($index / $cols) * $frameH
  $dark = Find-Dark $bmp $fx $fy
  $dir = if ($left) { -1 } else { 1 }
  $eyeX = if ($left) { 8 } else { 15 }
  $mouthX = if ($left) { 7 } else { 16 }
  foreach ($p in @(@($eyeX,11),@($eyeX,12),@($mouthX,17),@(($mouthX + $dir),18))) {
    Set-PixelSafe $bmp ($fx + $p[0]) ($fy + $p[1]) $dark
  }
}

function Draw-UpEnergy([System.Drawing.Bitmap]$bmp, [int]$index) {
  $fx = ($index % $cols) * $frameW
  $fy = [Math]::Floor($index / $cols) * $frameH
  $dark = Find-Dark $bmp $fx $fy
  foreach ($p in @(@(8,12),@(15,12),@(9,13),@(14,13))) {
    Set-PixelSafe $bmp ($fx + $p[0]) ($fy + $p[1]) $dark
  }
}

function Draw-Expressions([System.Drawing.Bitmap]$bmp, [string]$name) {
  $variant = Stable-Variant $name
  Draw-FrontWalkBody $bmp 1 0
  Draw-FrontWalkBody $bmp 3 1
  Draw-DownWalkExpression $bmp 1
  Draw-DownWalkExpression $bmp 3

  Draw-SideWalkBody $bmp 5 $true 0
  Draw-SideWalkBody $bmp 7 $true 1
  Draw-SideWalkExpression $bmp 5 $true
  Draw-SideWalkExpression $bmp 7 $true

  Draw-SideWalkBody $bmp 9 $false 0
  Draw-SideWalkBody $bmp 11 $false 1
  Draw-SideWalkExpression $bmp 9 $false
  Draw-SideWalkExpression $bmp 11 $false

  Draw-UpWalkBody $bmp 13 0
  Draw-UpWalkBody $bmp 15 1
  Draw-UpEnergy $bmp 13
  Draw-UpEnergy $bmp 15

  Draw-FrontRunBody $bmp 16 0
  Draw-FrontRunBody $bmp 17 1
  Draw-DownExpression $bmp 16 $variant
  Draw-DownExpression $bmp 17 ($variant + 1)

  Draw-SideRunBody $bmp 18 $true 0
  Draw-SideRunBody $bmp 19 $true 1
  Draw-SideExpression $bmp 18 $true $variant
  Draw-SideExpression $bmp 19 $true ($variant + 1)

  Draw-SideRunBody $bmp 20 $false 0
  Draw-SideRunBody $bmp 21 $false 1
  Draw-SideExpression $bmp 20 $false $variant
  Draw-SideExpression $bmp 21 $false ($variant + 1)

  Draw-UpRunBody $bmp 22 0
  Draw-UpRunBody $bmp 23 1
  Draw-UpEnergy $bmp 22
  Draw-UpEnergy $bmp 23

  Draw-SideRunBody $bmp 36 $false 0
  Draw-SideRunBody $bmp 37 $false 1
  Draw-SideExpression $bmp 36 $false $variant
  Draw-SideExpression $bmp 37 $false ($variant + 1)

  Draw-SideRunBody $bmp 38 $true 0
  Draw-SideRunBody $bmp 39 $true 1
  Draw-SideExpression $bmp 38 $true $variant
  Draw-SideExpression $bmp 39 $true ($variant + 1)

  Draw-UpRunBody $bmp 40 0
  Draw-UpRunBody $bmp 41 1
  Draw-UpRunBody $bmp 42 0
  Draw-UpRunBody $bmp 43 1
  foreach ($i in @(40,41,42,43)) { Draw-UpEnergy $bmp $i }

  # Run-only head lean: the whole head tucks into the motion after expressions
  # are painted, so the face and hair travel together.
  foreach ($i in @(16,17)) { Lean-RunHead $bmp $i 0 1 }
  foreach ($i in @(18,19)) { Lean-RunHead $bmp $i -1 0 }
  foreach ($i in @(20,21)) { Lean-RunHead $bmp $i 1 0 }
  foreach ($i in @(22,23)) { Lean-RunHead $bmp $i 0 -1 }
  foreach ($i in @(36,37)) { Lean-RunHead $bmp $i 1 1 }
  foreach ($i in @(38,39)) { Lean-RunHead $bmp $i -1 1 }
  foreach ($i in @(40,41)) { Lean-RunHead $bmp $i 1 -1 }
  foreach ($i in @(42,43)) { Lean-RunHead $bmp $i -1 -1 }

  Draw-SideWalkBody $bmp 25 $false 0
  Draw-SideWalkBody $bmp 26 $false 1
  Draw-SideExpression $bmp 25 $false $variant
  Draw-SideExpression $bmp 26 $false ($variant + 1)

  Draw-SideWalkBody $bmp 28 $true 0
  Draw-SideWalkBody $bmp 29 $true 1
  Draw-SideExpression $bmp 28 $true $variant
  Draw-SideExpression $bmp 29 $true ($variant + 1)

  Draw-UpWalkBody $bmp 31 0
  Draw-UpWalkBody $bmp 32 1
  Draw-UpWalkBody $bmp 34 0
  Draw-UpWalkBody $bmp 35 1
  foreach ($i in @(31,32,34,35)) { Draw-UpEnergy $bmp $i }
}

function Save-BitmapPng([System.Drawing.Bitmap]$bmp, [string]$path) {
  $tmp = "$path.tmp.png"
  $bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
  if (Test-Path -LiteralPath $path) {
    Remove-Item -Force -LiteralPath $path
  }
  Move-Item -Force -LiteralPath $tmp -Destination $path
}

function Write-Master([System.Drawing.Bitmap]$src, [string]$path) {
  $master = [System.Drawing.Bitmap]::new($src.Width * $masterScale, $src.Height * $masterScale, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  try {
    for ($y = 0; $y -lt $src.Height; $y++) {
      for ($x = 0; $x -lt $src.Width; $x++) {
        $c = $src.GetPixel($x, $y)
        for ($sy = 0; $sy -lt $masterScale; $sy++) {
          for ($sx = 0; $sx -lt $masterScale; $sx++) {
            $master.SetPixel(($x * $masterScale) + $sx, ($y * $masterScale) + $sy, $c)
          }
        }
      }
    }
    Save-BitmapPng $master $path
  } finally {
    $master.Dispose()
  }
}

$files = Get-ChildItem -LiteralPath $characterDir -Filter '*_anim_46_24x32.png' | Sort-Object Name
foreach ($file in $files) {
  $loaded = [System.Drawing.Bitmap]::new($file.FullName)
  $bmp = [System.Drawing.Bitmap]::new($loaded)
  $loaded.Dispose()
  try {
    if ($bmp.Width -ne $runtimeW -or $bmp.Height -ne $runtimeH) {
      throw "$($file.Name) is $($bmp.Width)x$($bmp.Height), expected ${runtimeW}x${runtimeH}"
    }
    $id = $file.BaseName -replace '_anim_46_24x32$', ''
    Draw-Expressions $bmp $id
    Save-BitmapPng $bmp $file.FullName
    Write-Master $bmp (Join-Path $masterDir "${id}_anim_46_4x_master.png")
  } finally {
    $bmp.Dispose()
  }
}

$reviewScale = 2
$labelW = 112
$reviewFrames = @(0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43)
$rowH = ($frameH * $reviewScale) + 8
$reviewW = $labelW + ($reviewFrames.Count * $frameW * $reviewScale) + 16
$reviewH = 24 + ($files.Count * $rowH)
$review = [System.Drawing.Bitmap]::new($reviewW, $reviewH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($review)
try {
  $g.Clear([System.Drawing.Color]::FromArgb(255, 30, 36, 44))
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $font = [System.Drawing.Font]::new('Consolas', 10)
  $brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
  $g.DrawString('walk/run motion frames: 0-43', $font, $brush, 8, 4)
  for ($r = 0; $r -lt $files.Count; $r++) {
    $file = $files[$r]
    $id = $file.BaseName -replace '_anim_46_24x32$', ''
    $bmp = [System.Drawing.Bitmap]::new($file.FullName)
    try {
      $y = 24 + ($r * $rowH)
      $g.DrawString($id, $font, $brush, 8, $y + 22)
      for ($f = 0; $f -lt $reviewFrames.Count; $f++) {
        $index = $reviewFrames[$f]
        $sx = ($index % $cols) * $frameW
        $sy = [Math]::Floor($index / $cols) * $frameH
        $srcRect = [System.Drawing.Rectangle]::new($sx, $sy, $frameW, $frameH)
        $dstRect = [System.Drawing.Rectangle]::new($labelW + ($f * $frameW * $reviewScale), $y, $frameW * $reviewScale, $frameH * $reviewScale)
        $g.DrawImage($bmp, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
      }
    } finally {
      $bmp.Dispose()
    }
  }
  $font.Dispose()
  $brush.Dispose()
  Save-BitmapPng $review (Join-Path $reviewDir 'character_walk_run_motion_review.png')
} finally {
  $g.Dispose()
  $review.Dispose()
}

Write-Host "Updated $($files.Count) character animation sheets with authored walk/run motion and run expressions."
