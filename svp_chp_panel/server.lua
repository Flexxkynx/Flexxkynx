-- Sunset Valley+ | CHP / Behörden Panel - Server
local units = {}   -- [src] = { name, agency, callsign, status, location, updated }
local records = {}

if Config.SaveRecords then
    local raw = LoadResourceFile(GetCurrentResourceName(), 'records.json')
    records = raw and json.decode(raw) or {}
end

local function saveRecords()
    if not Config.SaveRecords then return end
    while #records > Config.MaxRecords do table.remove(records, 1) end
    SaveResourceFile(GetCurrentResourceName(), 'records.json', json.encode(records), -1)
end

-- Liefert die Behörden, auf die der Spieler Zugriff hat
local function allowedAgencies(src)
    local list = {}
    for _, a in ipairs(Config.Agencies) do
        if not Config.UseAce or IsPlayerAceAllowed(src, a.ace) then
            list[#list + 1] = a
        end
    end
    return list
end

local function canUseAgency(src, id)
    for _, a in ipairs(allowedAgencies(src)) do
        if a.id == id then return true end
    end
    return false
end

local function broadcast()
    local list = {}
    for src, u in pairs(units) do
        list[#list + 1] = {
            id = src, name = u.name, agency = u.agency, callsign = u.callsign,
            status = u.status, location = u.location, updated = u.updated
        }
    end
    table.sort(list, function(a, b) return a.callsign < b.callsign end)
    for src in pairs(units) do
        TriggerClientEvent('svp_chp:units', src, list)
    end
end

RegisterNetEvent('svp_chp:requestOpen', function()
    local src = source
    local agencies = allowedAgencies(src)
    if #agencies == 0 then
        TriggerClientEvent('svp_chp:denied', src)
        return
    end
    if not units[src] or not canUseAgency(src, units[src].agency) then
        units[src] = {
            name = GetPlayerName(src),
            agency = agencies[1].id,
            callsign = Config.DefaultCallsign,
            status = '10-7',
            location = 'Unbekannt',
            updated = os.time()
        }
    end
    TriggerClientEvent('svp_chp:open', src, units[src], agencies)
    broadcast()
end)

RegisterNetEvent('svp_chp:update', function(data)
    local src = source
    local u = units[src]
    if not u or type(data) ~= 'table' then return end

    if type(data.callsign) == 'string' and #data.callsign > 0 and #data.callsign <= 10 then
        u.callsign = data.callsign:upper():gsub('[^%w%-]', '')
    end
    if type(data.agency) == 'string' and canUseAgency(src, data.agency) then
        u.agency = data.agency
    end
    if type(data.status) == 'string' and Config.Statuses[data.status] then
        local prev = u.status
        u.status = data.status
        if data.status == '11-99' and prev ~= '11-99' then
            for other in pairs(units) do
                TriggerClientEvent('svp_chp:panic', other, u.callsign, u.location)
            end
        end
    end
    if type(data.location) == 'string' then
        u.location = data.location:sub(1, 64)
    end
    u.updated = os.time()
    broadcast()
end)

RegisterNetEvent('svp_chp:dispatch', function(msg)
    local src = source
    local u = units[src]
    if not u or type(msg) ~= 'string' or #msg == 0 then return end
    msg = msg:sub(1, 200)
    for other in pairs(units) do
        TriggerClientEvent('svp_chp:radio', other, u.callsign, msg, os.time())
    end
end)

-- Strafe / Akte speichern
RegisterNetEvent('svp_chp:record', function(rec)
    local src = source
    local u = units[src]
    if not u or type(rec) ~= 'table' or type(rec.charges) ~= 'table' then return end

    local entry = {
        id = #records > 0 and (records[#records].id + 1) or 1,
        time = os.time(),
        agency = u.agency,
        officer = ('%s (%s)'):format(u.callsign, u.name),
        suspect = tostring(rec.suspect or 'Unbekannt'):sub(1, 64),
        plate = tostring(rec.plate or ''):sub(1, 12),
        notes = tostring(rec.notes or ''):sub(1, 500),
        charges = {},
        fine = math.max(0, math.floor(tonumber(rec.fine) or 0)),
        jail = math.min(Config.MaxJail, math.max(0, math.floor(tonumber(rec.jail) or 0))),
        points = math.max(0, math.floor(tonumber(rec.points) or 0)),
    }
    for i = 1, math.min(#rec.charges, 30) do
        entry.charges[i] = tostring(rec.charges[i]):sub(1, 120)
    end
    records[#records + 1] = entry
    saveRecords()

    print(('[SVP-MDT] Akte #%d | %s -> %s | $%d | %d HE | %d Pkt.'):format(
        entry.id, entry.officer, entry.suspect, entry.fine, entry.jail, entry.points))
    TriggerClientEvent('svp_chp:recordSaved', src, entry.id)
end)

RegisterNetEvent('svp_chp:getRecords', function(query)
    local src = source
    if not units[src] then return end
    query = type(query) == 'string' and query:lower() or ''
    local out = {}
    for i = #records, 1, -1 do
        local r = records[i]
        if query == '' or r.suspect:lower():find(query, 1, true) or r.plate:lower():find(query, 1, true) then
            out[#out + 1] = r
            if #out >= 50 then break end
        end
    end
    TriggerClientEvent('svp_chp:records', src, out)
end)

AddEventHandler('playerDropped', function()
    if units[source] then
        units[source] = nil
        broadcast()
    end
end)
