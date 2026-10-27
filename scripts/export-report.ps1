param([string]$ReportPath = (Join-Path $PSScriptRoot '../docs/reports/FaultNet-final-report.docx'))
$reportSource = (Resolve-Path -LiteralPath $ReportPath).Path
$reportPdf = [IO.Path]::ChangeExtension($reportSource, '.pdf')
$reportWord = New-Object -ComObject Word.Application
$reportWord.Visible = $false
$reportWord.DisplayAlerts = 0
$reportDocument = $null
try {
    $reportDocument = $reportWord.Documents.Open($reportSource, $false, $false, $false)
    1..3 | ForEach-Object {
        $reportDocument.Repaginate()
        $null = $reportDocument.Fields.Update()
        foreach ($reportContents in $reportDocument.TablesOfContents) { $reportContents.Update() }
    }
    $reportDocument.Repaginate()
    $reportDocument.Save()
    $reportDocument.ExportAsFixedFormat($reportPdf, 17)
    if (-not (Test-Path -LiteralPath $reportPdf)) { throw 'PDF export was not created.' }
    Write-Output ('Pages: ' + $reportDocument.ComputeStatistics(2))
    Write-Output $reportPdf
} finally {
    if ($null -ne $reportDocument) {
        $reportDocument.Close(0)
        $null = [Runtime.InteropServices.Marshal]::FinalReleaseComObject($reportDocument)
    }
    $reportWord.Quit()
    $null = [Runtime.InteropServices.Marshal]::FinalReleaseComObject($reportWord)
}
