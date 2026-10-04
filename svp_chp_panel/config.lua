Config = {}

Config.ServerName   = 'Sunset Valley+'
Config.Department   = 'California Highway Patrol'

-- Behörden, die das Panel / den Strafenkatalog nutzen dürfen.
-- Jede Behörde hat eine eigene ACE-Permission (siehe README).
Config.Agencies = {
    { id = 'chp',  short = 'CHP',  name = 'California Highway Patrol',     ace = 'svp.mdt.chp',  color = '#c9a227' },
    { id = 'lspd', short = 'LSPD', name = 'Los Santos Police Department',  ace = 'svp.mdt.lspd', color = '#2f6fdb' },
    { id = 'lssd', short = 'LSSD', name = "Los Santos Sheriff's Department", ace = 'svp.mdt.lssd', color = '#3c8d4a' },
    { id = 'doj',  short = 'DOJ',  name = 'Department of Justice',         ace = 'svp.mdt.doj',  color = '#8e44ad' },
}

-- Obergrenze für Haftzeit (Hafteinheiten = Minuten im Gefängnis-Script)
Config.MaxJail      = 120

-- Akten (ausgestellte Strafen) in records.json im Resource-Ordner speichern
Config.SaveRecords  = true
Config.MaxRecords   = 500

-- Befehl + Standard-Taste zum Öffnen des Panels
Config.Command      = 'chp'
Config.DefaultKey   = 'F6'

-- Zugriff über die ACE-Permissions der Behörden (Config.Agencies).
-- Auf false setzen, damit jeder das Panel öffnen kann (z.B. zum Testen)
Config.UseAce       = true

-- Standard-Callsign-Format (CHP: Beat-Nummer + Einheit, z.B. "12-A7")
Config.DefaultCallsign = '00-A0'

-- Status, die eine Einheit setzen kann (Schlüssel = CHP-Code)
Config.Statuses = {
    ['10-8']  = { label = 'Im Dienst / Verfügbar', color = '#2ecc71' },
    ['10-6']  = { label = 'Beschäftigt',           color = '#f1c40f' },
    ['10-97'] = { label = 'Am Einsatzort',         color = '#3498db' },
    ['10-15'] = { label = 'Gefangener an Bord',    color = '#9b59b6' },
    ['Code 7']= { label = 'Pause',                 color = '#95a5a6' },
    ['11-99'] = { label = 'BEAMTER BRAUCHT HILFE', color = '#e74c3c' },
    ['10-7']  = { label = 'Außer Dienst',          color = '#7f8c8d' },
}
