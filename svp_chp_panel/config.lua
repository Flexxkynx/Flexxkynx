Config = {}

Config.ServerName   = 'Sunset Valley+'

-- Behörden, die den Strafenkatalog nutzen dürfen.
-- Jede Behörde hat eine eigene ACE-Permission (siehe README).
Config.Agencies = {
    { id = 'chp',  short = 'CHP',  name = 'California Highway Patrol',     ace = 'svp.mdt.chp',  color = '#c9a227' },
    { id = 'lspd', short = 'LSPD', name = 'Los Santos Police Department',  ace = 'svp.mdt.lspd', color = '#2f6fdb' },
    { id = 'lssd', short = 'LSSD', name = "Los Santos Sheriff's Department", ace = 'svp.mdt.lssd', color = '#3c8d4a' },
    { id = 'usms', short = 'USMS', name = 'United States Marshals Service', ace = 'svp.mdt.usms', color = '#a8b2c1' },
    { id = 'doj',  short = 'DOJ',  name = 'Department of Justice',         ace = 'svp.mdt.doj',  color = '#8e44ad' },
}

-- Obergrenze für Haftzeit (Hafteinheiten = Minuten im Gefängnis-Script)
Config.MaxJail      = 120

-- Befehl + Standard-Taste zum Öffnen des Strafenkatalogs
Config.Command      = 'chp'
Config.DefaultKey   = 'F6'

-- Zugriff über die ACE-Permissions der Behörden (Config.Agencies).
-- Auf false setzen, damit jeder den Katalog öffnen kann (z.B. zum Testen)
Config.UseAce       = true
