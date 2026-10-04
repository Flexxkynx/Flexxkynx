-- Sunset Valley+ | CHP Panel - Client
local isOpen = false

local function getLocation()
    local coords = GetEntityCoords(PlayerPedId())
    local s1, s2 = GetStreetNameAtCoord(coords.x, coords.y, coords.z)
    local street = GetStreetNameFromHashKey(s1)
    local cross = s2 ~= 0 and GetStreetNameFromHashKey(s2) or nil
    local zone = GetLabelText(GetNameOfZone(coords.x, coords.y, coords.z))
    local loc = street
    if cross and cross ~= '' then loc = loc .. ' / ' .. cross end
    if zone and zone ~= 'NULL' then loc = loc .. ', ' .. zone end
    return loc
end

local function close()
    isOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
end

RegisterCommand(Config.Command, function()
    if isOpen then close() return end
    TriggerServerEvent('svp_chp:requestOpen')
end, false)

RegisterKeyMapping(Config.Command, 'Behörden-Panel / Strafenkatalog öffnen', 'keyboard', Config.DefaultKey)

RegisterNetEvent('svp_chp:open', function(me, agencies)
    isOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'open',
        me = me,
        location = getLocation(),
        serverName = Config.ServerName,
        department = Config.Department,
        agencies = agencies,
        maxJail = Config.MaxJail,
        statuses = Config.Statuses
    })
end)

RegisterNetEvent('svp_chp:denied', function()
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName('~r~Kein Zugriff:~s~ Nur für Beamte der Behörden.')
    EndTextCommandThefeedPostTicker(false, true)
end)

RegisterNetEvent('svp_chp:units', function(list)
    SendNUIMessage({ action = 'units', units = list })
end)

RegisterNetEvent('svp_chp:radio', function(callsign, msg, time)
    SendNUIMessage({ action = 'radio', callsign = callsign, msg = msg, time = time })
end)

RegisterNetEvent('svp_chp:panic', function(callsign, location)
    PlaySoundFrontend(-1, 'TIMER_STOP', 'HUD_MINI_GAME_SOUNDSET', true)
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName(('~r~11-99~s~ | %s braucht Hilfe!~n~%s'):format(callsign, location or ''))
    EndTextCommandThefeedPostTicker(true, true)
    SendNUIMessage({ action = 'panic', callsign = callsign, location = location })
end)

RegisterNUICallback('close', function(_, cb) close() cb('ok') end)

RegisterNUICallback('update', function(data, cb)
    data.location = getLocation()
    TriggerServerEvent('svp_chp:update', data)
    cb('ok')
end)

RegisterNUICallback('dispatch', function(data, cb)
    TriggerServerEvent('svp_chp:dispatch', data.msg)
    cb('ok')
end)

RegisterNUICallback('record', function(data, cb)
    TriggerServerEvent('svp_chp:record', data)
    cb('ok')
end)

RegisterNUICallback('getRecords', function(data, cb)
    TriggerServerEvent('svp_chp:getRecords', data.query)
    cb('ok')
end)

RegisterNetEvent('svp_chp:records', function(list)
    SendNUIMessage({ action = 'records', records = list })
end)

RegisterNetEvent('svp_chp:recordSaved', function(id)
    SendNUIMessage({ action = 'recordSaved', id = id })
end)

-- Standort regelmäßig aktualisieren, solange man im Dienst ist
CreateThread(function()
    while true do
        Wait(30000)
        if isOpen then
            TriggerServerEvent('svp_chp:update', { location = getLocation() })
        end
    end
end)
