Config = {}

Config.ServerName = 'Sunset Valley+'

-- Behörden: id muss zu den IDs in html/script.js passen (chp, lspd, lssd, usms, doj).
-- Jede Behörde hat eine eigene ACE-Permission.
Config.Agencies = {
    { id = 'chp',  short = 'CHP',  name = 'California Highway Patrol',       ace = 'svp.mdt.chp',  color = '#c9a227' },
    { id = 'lspd', short = 'LSPD', name = 'Los Santos Police Department',    ace = 'svp.mdt.lspd', color = '#2f6fdb' },
    { id = 'lssd', short = 'LSSD', name = "Los Santos Sheriff's Department", ace = 'svp.mdt.lssd', color = '#3c8d4a' },
    { id = 'usms', short = 'USMS', name = 'U.S. Marshals Service',           ace = 'svp.mdt.usms', color = '#a8b2c1' },
    { id = 'doj',  short = 'DOJ',  name = 'Department of Justice',           ace = 'svp.mdt.doj',  color = '#8e44ad' },
}

-- Obergrenze für Haft in Hafteinheiten (HE)
Config.MaxJail    = 120

-- Befehl + Standard-Taste
Config.Command    = 'strafen'
Config.DefaultKey = 'F6'

-- false = jeder darf den Katalog öffnen (zum Testen)
Config.UseAce     = true
