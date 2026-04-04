param(
  [string]$EnvFile = ".env.production.local",
  [string]$Tag,
  [switch]$Push,
  [switch]$SkipEnvUpdate
)

$ErrorActionPreference = "Stop"

function Read-EnvFile {
  param([string]$Path)

  $result = [ordered]@{}

  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match '^\s*#' -or $line -match '^\s*$') {
      continue
    }

    if ($line -notmatch '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
      continue
    }

    $key = $Matches[1]
    $value = $Matches[2]

    if ($value -match '^(.*?)\s+#') {
      $value = $Matches[1]
    }

    $result[$key] = $value.Trim()
  }

  return $result
}

function Set-EnvValue {
  param(
    [string]$Path,
    [string]$Key,
    [string]$Value
  )

  $content = Get-Content -LiteralPath $Path -Raw
  $pattern = "(?m)^$([regex]::Escape($Key))=.*$"
  $replacement = "$Key=$Value"

  if ($content -match $pattern) {
    $content = [regex]::Replace($content, $pattern, $replacement)
  } else {
    if (-not $content.EndsWith([Environment]::NewLine)) {
      $content += [Environment]::NewLine
    }
    $content += $replacement + [Environment]::NewLine
  }

  Set-Content -LiteralPath $Path -Value $content
}

function Invoke-DockerBuild {
  param(
    [string]$Dockerfile,
    [string]$Image,
    [hashtable]$BuildArgs
  )

  $arguments = @("build", "-f", $Dockerfile, "-t", $Image)

  foreach ($entry in $BuildArgs.GetEnumerator()) {
    $arguments += "--build-arg"
    $arguments += "$($entry.Key)=$($entry.Value)"
  }

  $arguments += "."

  Write-Host ">> docker $($arguments -join ' ')"
  & docker @arguments
  if ($LASTEXITCODE -ne 0) {
    throw "docker build failed for $Image"
  }
}

function Invoke-WorkspaceBuild {
  param([string]$Command)

  Write-Host ">> $Command"
  & pwsh -Command $Command
  if ($LASTEXITCODE -ne 0) {
    throw "workspace build failed: $Command"
  }
}

function Invoke-DockerPush {
  param(
    [string]$Image,
    [string]$AliasTag
  )

  & docker push $Image
  if ($LASTEXITCODE -ne 0) {
    throw "docker push failed for $Image"
  }

  if ($AliasTag) {
    $repo = $Image.Substring(0, $Image.LastIndexOf(":"))
    $aliasImage = "${repo}:$AliasTag"
    & docker tag $Image $aliasImage
    if ($LASTEXITCODE -ne 0) {
      throw "docker tag failed for $aliasImage"
    }

    & docker push $aliasImage
    if ($LASTEXITCODE -ne 0) {
      throw "docker push failed for $aliasImage"
    }
  }
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Env file not found: $EnvFile"
}

$envMap = Read-EnvFile -Path $EnvFile
$packageJson = Get-Content -LiteralPath "package.json" -Raw | ConvertFrom-Json
$version = [string]$packageJson.version
$gitSha = (git rev-parse --short=12 HEAD).Trim()
$buildDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
$stamp = (Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")

if (-not $Tag) {
  $Tag = "v$version-prod.$stamp-$gitSha"
}

$registry = $envMap["REGISTRY"]
$namespace = $envMap["IMAGE_NAMESPACE"]

if ([string]::IsNullOrWhiteSpace($registry)) {
  throw "REGISTRY is required in $EnvFile"
}

if ([string]::IsNullOrWhiteSpace($namespace)) {
  throw "IMAGE_NAMESPACE is required in $EnvFile"
}

$commonArgs = @{
  BUILD_DATE = $buildDate
  VCS_REF    = $gitSha
  VERSION    = $Tag
}

$images = @(
  @{
    Name       = "api"
    Dockerfile = "Dockerfile.api"
    Repository = "$registry/$namespace/dailyuse-api"
    TagKey     = "API_TAG"
    BuildArgs  = @{}
  },
  @{
    Name       = "web"
    Dockerfile = "Dockerfile.web"
    Repository = "$registry/$namespace/dailyuse-web"
    TagKey     = "WEB_TAG"
    BuildArgs  = @{}
  },
  @{
    Name       = "ai-service"
    Dockerfile = "Dockerfile.ai-service"
    Repository = "$registry/$namespace/dailyuse-ai-service"
    TagKey     = "AI_SERVICE_TAG"
    BuildArgs  = @{}
  }
)

Invoke-WorkspaceBuild -Command "pnpm nx build api"
Invoke-WorkspaceBuild -Command "pnpm nx build web --configuration=production"

foreach ($image in $images) {
  $buildArgs = @{}
  foreach ($entry in $commonArgs.GetEnumerator()) {
    $buildArgs[$entry.Key] = $entry.Value
  }
  foreach ($entry in $image.BuildArgs.GetEnumerator()) {
    $buildArgs[$entry.Key] = $entry.Value
  }

  $fullImage = "$($image.Repository):$Tag"
  Invoke-DockerBuild -Dockerfile $image.Dockerfile -Image $fullImage -BuildArgs $buildArgs

  if (-not $SkipEnvUpdate) {
    Set-EnvValue -Path $EnvFile -Key $image.TagKey -Value $Tag
  }

  if ($Push) {
    Invoke-DockerPush -Image $fullImage -AliasTag "prod-latest"
  }
}

Write-Host ""
Write-Host "Release tag: $Tag"
Write-Host "Registry: $registry"
Write-Host "Namespace: $namespace"
Write-Host "Push: $Push"
