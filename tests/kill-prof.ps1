# Fecha os Edge de teste de um perfil (o "timeout" do bash não consegue fechar o Edge no Windows).
# Uso: powershell -NoProfile -File tests/kill-prof.ps1 <nome-do-perfil>
param([string]$Perfil)
Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" |
  Where-Object { $_.CommandLine -match [regex]::Escape($Perfil) } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
