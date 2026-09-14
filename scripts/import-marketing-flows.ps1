param(
  [Parameter(Mandatory = $true)][string]$SourceHtml,
  [Parameter(Mandatory = $true)][string]$OutputJson,
  [ValidateSet("Marketing", "Sales", "CommercialLeader", "Administration", "Finance")][string]$Profile = "Marketing"
)

$ErrorActionPreference = "Stop"
$html = Get-Content -Raw -LiteralPath $SourceHtml
$decoder = [System.Net.WebUtility]
$subareas = if ($Profile -eq "Sales") {
  @{
    "01" = @{ code = "COM-S04"; name = "Jefatura de Ventas"; owner = "Jefe de Ventas" }
    "02" = @{ code = "COM-S04"; name = "Jefatura de Ventas"; owner = "Jefe de Ventas" }
    "03" = @{ code = "COM-S04"; name = "Jefatura de Ventas"; owner = "Jefe de Ventas" }
    "04" = @{ code = "COM-S04"; name = "Jefatura de Ventas"; owner = "Jefe de Ventas" }
    "05" = @{ code = "COM-S04"; name = "Jefatura de Ventas"; owner = "Jefe de Ventas" }
    "06" = @{ code = "COM-S04"; name = "Jefatura de Ventas"; owner = "Jefe de Ventas" }
    "07" = @{ code = "COM-S04"; name = "Jefatura de Ventas"; owner = "Jefe de Ventas" }
  }
} elseif ($Profile -eq "CommercialLeader") {
  @{
    "01" = @{ code = "COM-S05"; name = "Encargado / Líder Comercial"; owner = "Encargado / Líder Comercial" }
    "02" = @{ code = "COM-S05"; name = "Encargado / Líder Comercial"; owner = "Encargado / Líder Comercial" }
    "03" = @{ code = "COM-S05"; name = "Encargado / Líder Comercial"; owner = "Encargado / Líder Comercial" }
    "04" = @{ code = "COM-S05"; name = "Encargado / Líder Comercial"; owner = "Encargado / Líder Comercial" }
    "05" = @{ code = "COM-S05"; name = "Encargado / Líder Comercial"; owner = "Encargado / Líder Comercial" }
    "06" = @{ code = "COM-S05"; name = "Encargado / Líder Comercial"; owner = "Encargado / Líder Comercial" }
    "07" = @{ code = "COM-S05"; name = "Encargado / Líder Comercial"; owner = "Encargado / Líder Comercial" }
  }
} elseif ($Profile -eq "Administration") {
  @{
    "01" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "02" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "03" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "04" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "05" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "06" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "07" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "08" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "09" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "10" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "11" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "12" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "13" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "14" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "15" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "16" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
    "17" = @{ code = "GER-S02"; name = "Administración y Recursos Humanos"; owner = "Responsable de Recursos Humanos" }
  }
} elseif ($Profile -eq "Finance") {
  @{
    "01" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "02" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "03" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "04" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "05" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "06" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "07" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "08" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "09" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "10" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "11" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "12" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "13" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "14" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "15" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "16" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "17" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "18" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
    "19" = @{ code = "GER-S03"; name = "Contabilidad, Finanzas y Tesorería"; owner = "Responsable de Finanzas" }
  }
} else {
  @{
    JM = @{ code = "MKT-S01"; name = "Jefatura de Marketing"; owner = "Jefatura de Marketing" }
    CO = @{ code = "MKT-S02"; name = "Coordinación / Asistencia"; owner = "Coordinador / Asistente" }
    PE = @{ code = "MKT-S03"; name = "Traffic y Performance"; owner = "Traffic y Performance" }
    CM = @{ code = "MKT-S04"; name = "Community Manager"; owner = "Community Manager" }
    DG = @{ code = "MKT-S05"; name = "Diseño Gráfico"; owner = "Diseño Gráfico" }
    AV = @{ code = "MKT-S06"; name = "Producción Audiovisual"; owner = "Producción Audiovisual" }
    CRM = @{ code = "MKT-S07"; name = "CRM, Web y Automatización"; owner = "CRM, Web y Automatización" }
    RRPP = @{ code = "MKT-S08"; name = "RRPP, Campo y Alianzas"; owner = "RRPP, Campo y Alianzas" }
  }
}

function Decode([string]$value) {
  return $decoder::HtmlDecode(($value -replace '<[^>]+>', '')).Trim()
}

function BoundsFromPairs([double[]]$numbers) {
  $xs = @(); $ys = @()
  for ($index = 0; $index -lt $numbers.Count - 1; $index += 2) {
    $xs += $numbers[$index]; $ys += $numbers[$index + 1]
  }
  return @{ minX = ($xs | Measure-Object -Minimum).Minimum; maxX = ($xs | Measure-Object -Maximum).Maximum; minY = ($ys | Measure-Object -Minimum).Minimum; maxY = ($ys | Measure-Object -Maximum).Maximum }
}

$flows = @()
$sections = [regex]::Matches($html, '<section[^>]*class="[^"]*(?:flow-card|card)[^"]*"[^>]*>[\s\S]*?</section>')
foreach ($sectionMatch in $sections) {
  $section = $sectionMatch.Value
  $sectionId = [regex]::Match($section, 'id="([^"]+)"').Groups[1].Value
  $prefix = $sectionId.Split('_')[0]
  $subarea = $subareas[$prefix]
  if (-not $subarea) { continue }

  $flowNumber = if ($Profile -in @("Sales", "CommercialLeader", "Administration", "Finance")) { $prefix } else { [regex]::Match($sectionId, '^[A-Z]+_(\d+)').Groups[1].Value }
  $flowCode = switch ($Profile) {
    "Sales" { "COM-JV-$flowNumber" }
    "CommercialLeader" { "COM-LC-$flowNumber" }
    "Administration" { "GER-ARH-$flowNumber" }
    "Finance" { "GER-CFT-$flowNumber" }
    default { "MKT-$prefix-$flowNumber" }
  }
  $title = Decode ([regex]::Match($section, '<h2>([\s\S]*?)</h2>').Groups[1].Value)
  if ($Profile -in @("Administration", "Finance")) { $title = $title -replace '^\d+\.\s*', '' }
  $descriptionMatch = [regex]::Match($section, '<h2>[\s\S]*?</h2>\s*<p>([\s\S]*?)</p>')
  $description = if ($descriptionMatch.Success) { Decode $descriptionMatch.Groups[1].Value } elseif ($Profile -eq "Administration") { "Proceso documentado de Administración y Recursos Humanos con responsables funcionales y evidencia de cierre." } elseif ($Profile -eq "Finance") { "Proceso documentado de Contabilidad, Finanzas y Tesorería con responsables funcionales y evidencia de cierre." } else { "Flujograma institucional documentado para edición visual." }
  $svg = [regex]::Match($section, '<svg[\s\S]*?</svg>').Value
  $viewBoxNumbers = [regex]::Match($svg, 'viewBox="([^"]+)"').Groups[1].Value.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
  $transform = [regex]::Match($svg, 'translate\(([-\d.]+)\s+([-\d.]+)\)')
  $translateX = [double]$transform.Groups[1].Value
  $translateY = [double]$transform.Groups[2].Value
  $nodeLookup = @{}
  $nodes = @()

  foreach ($nodeMatch in [regex]::Matches($svg, '<g id="node\d+" class="node">[\s\S]*?</g>')) {
    $nodeSvg = $nodeMatch.Value
    $rawId = Decode ([regex]::Match($nodeSvg, '<title>([\s\S]*?)</title>').Groups[1].Value)
    $textMatches = [regex]::Matches($nodeSvg, '<text([^>]*)>([\s\S]*?)</text>')
    $textMatch = if ($textMatches.Count -gt 0) { $textMatches[0] } else { $null }
    $parts = @($textMatches | ForEach-Object { Decode $_.Groups[2].Value } | ForEach-Object { $_ -split '\\n' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    $role = ""
    if ($parts.Count -gt 1 -and $parts[0] -cmatch '^[A-ZÁÉÍÓÚÜÑ0-9 /,+.-]{2,}$') {
      $role = $parts[0]
      $label = ($parts[1..($parts.Count - 1)] -join "`n")
    } else {
      $label = ($parts -join "`n")
    }

    $shapeMatch = [regex]::Match($nodeSvg, '<(ellipse|path|polygon)\s+([^>]+)>')
    if (-not $shapeMatch.Success) { $shapeMatch = [regex]::Match($nodeSvg, '<(ellipse|path|polygon)\s+([^>]+)/>') }
    $shape = $shapeMatch.Groups[1].Value
    $attributes = $shapeMatch.Groups[2].Value
    $fill = [regex]::Match($attributes, 'fill="([^"]+)"').Groups[1].Value
    $stroke = [regex]::Match($attributes, 'stroke="([^"]+)"').Groups[1].Value
    $textAttributes = if ($textMatch) { $textMatch.Groups[1].Value } else { "" }
    $textColorMatch = [regex]::Match($textAttributes, 'fill="([^"]+)"')
    $textColor = if ($textColorMatch.Success) { $textColorMatch.Groups[1].Value } else { "#243447" }

    if ($shape -eq 'ellipse') {
      $cx = [double]([regex]::Match($attributes, 'cx="([-\d.]+)"').Groups[1].Value)
      $cy = [double]([regex]::Match($attributes, 'cy="([-\d.]+)"').Groups[1].Value)
      $rx = [double]([regex]::Match($attributes, 'rx="([-\d.]+)"').Groups[1].Value)
      $ry = [double]([regex]::Match($attributes, 'ry="([-\d.]+)"').Groups[1].Value)
      $bounds = @{ minX = $cx - $rx; maxX = $cx + $rx; minY = $cy - $ry; maxY = $cy + $ry }
    } elseif ($shape -eq 'polygon') {
      $pairs = [regex]::Matches([regex]::Match($attributes, 'points="([^"]+)"').Groups[1].Value, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
      $bounds = BoundsFromPairs $pairs
    } else {
      $pairs = [regex]::Matches([regex]::Match($attributes, 'd="([^"]+)"').Groups[1].Value, '-?\d+(?:\.\d+)?') | ForEach-Object { [double]$_.Value }
      $bounds = BoundsFromPairs $pairs
    }

    $kind = 'activity'
    if ($shape -eq 'ellipse') { $kind = if ($label -match '^Fin') { 'end' } else { 'start' } }
    elseif ($shape -eq 'polygon' -and [regex]::Matches([regex]::Match($attributes, 'points="([^"]+)"').Groups[1].Value, '-?\d+(?:\.\d+)?').Count -eq 10) { $kind = 'decision' }
    elseif ($nodeSvg -match '<polyline' -or $fill -eq '#f4f7fa') { $kind = 'evidence' }
    elseif ($fill -eq '#ffe7e7') { $kind = 'exception' }

    $width = [math]::Max(120, [math]::Round($bounds.maxX - $bounds.minX, 2))
    $height = [math]::Max(36, [math]::Round($bounds.maxY - $bounds.minY, 2))
    $node = [ordered]@{
      id = "$flowCode-$rawId"
      kind = $kind
      label = $label
      role = $role
      position = @{ x = [math]::Round($translateX + $bounds.minX, 2); y = [math]::Round($translateY + $bounds.minY, 2) }
      size = @{ width = $width; height = $height }
      fill = $fill
      stroke = $stroke
      textColor = $textColor
    }
    $nodeLookup[$rawId] = $node
    $nodes += $node
  }

  $edges = @()
  foreach ($edgeMatch in [regex]::Matches($svg, '<g id="edge\d+" class="edge">[\s\S]*?</g>')) {
    $edgeSvg = $edgeMatch.Value
    $edgeTitle = Decode ([regex]::Match($edgeSvg, '<title>([\s\S]*?)</title>').Groups[1].Value)
    $edgeParts = $edgeTitle -split '->'
    if ($edgeParts.Count -ne 2 -or -not $nodeLookup[$edgeParts[0]] -or -not $nodeLookup[$edgeParts[1]]) { continue }
    $edgeText = [regex]::Match($edgeSvg, '<text[^>]*>([\s\S]*?)</text>')
    $label = if ($edgeText.Success) { Decode $edgeText.Groups[1].Value } else { "" }
    $route = if ($edgeSvg -match 'stroke="#c0392b"') { 'return' } else { 'normal' }
    $sourceNode = $nodeLookup[$edgeParts[0]]
    $targetNode = $nodeLookup[$edgeParts[1]]
    $sourceCenterX = $sourceNode.position.x + ($sourceNode.size.width / 2)
    $sourceCenterY = $sourceNode.position.y + ($sourceNode.size.height / 2)
    $targetCenterX = $targetNode.position.x + ($targetNode.size.width / 2)
    $targetCenterY = $targetNode.position.y + ($targetNode.size.height / 2)
    $dx = $targetCenterX - $sourceCenterX
    $dy = $targetCenterY - $sourceCenterY
    if ([math]::Abs($dx) -gt [math]::Abs($dy)) { $sourceHandle = if ($dx -gt 0) { 'right' } else { 'left' } }
    else { $sourceHandle = if ($dy -gt 0) { 'bottom' } else { 'right' } }
    $edges += [ordered]@{
      id = "$flowCode-edge-$($edges.Count + 1)"
      source = $sourceNode.id
      target = $targetNode.id
      label = $label
      route = $route
      sourceHandle = $sourceHandle
    }
  }

  $flows += [ordered]@{
    code = $flowCode
    sourceId = $sectionId
    subareaCode = $subarea.code
    subareaName = $subarea.name
    owner = $subarea.owner
    title = $title
    description = $description
    canvas = @{ width = [double]$viewBoxNumbers[2]; height = [double]$viewBoxNumbers[3] }
    nodes = $nodes
    edges = $edges
  }
}

$flows | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $OutputJson -Encoding utf8
Write-Output "Imported $($flows.Count) flowcharts with $(($flows.nodes | Measure-Object).Count) node collections into $OutputJson"
