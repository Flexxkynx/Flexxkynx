-- Sunset Valley+ | Strafenkatalog - Client
local isOpen = false

local function close()
    isOpen = false
    SetNuiFocus(false, false)
    SendNUIMessage({ action = 'close' })
end

RegisterCommand(Config.Command, function()
    if isOpen then close() return end
    TriggerServerEvent('svp_chp:requestOpen')
end, false)

RegisterKeyMapping(Config.Command, 'Strafenkatalog öffnen', 'keyboard', Config.DefaultKey)

RegisterNetEvent('svp_chp:open', function(officer, agencies)
    isOpen = true
    SetNuiFocus(true, true)
    SendNUIMessage({
        action = 'open',
        officer = officer,
        agencies = agencies,
        serverName = Config.ServerName,
        maxJail = Config.MaxJail
    })
end)

RegisterNetEvent('svp_chp:denied', function()
    BeginTextCommandThefeedPost('STRING')
    AddTextComponentSubstringPlayerName('~r~Kein Zugriff:~s~ Nur für Beamte der Behörden.')
    EndTextCommandThefeedPostTicker(false, true)
end)

RegisterNUICallback('close', function(_, cb) close() cb('ok') end)
