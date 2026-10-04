-- Sunset Valley+ | Strafenkatalog - Server

-- Liefert die Behörden, auf die der Spieler Zugriff hat
local function allowedAgencies(src)
    local list = {}
    for _, a in ipairs(Config.Agencies) do
        if not Config.UseAce or IsPlayerAceAllowed(src, a.ace) then
            list[#list + 1] = { id = a.id, short = a.short, name = a.name, color = a.color }
        end
    end
    return list
end

RegisterNetEvent('svp_chp:requestOpen', function()
    local src = source
    local agencies = allowedAgencies(src)
    if #agencies == 0 then
        TriggerClientEvent('svp_chp:denied', src)
        return
    end
    TriggerClientEvent('svp_chp:open', src, GetPlayerName(src), agencies)
end)
