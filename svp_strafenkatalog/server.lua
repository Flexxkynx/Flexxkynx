-- Sunset Valley+ | Strafenkatalog - Server

local function allowedAgencies(src)
    local list = {}
    for _, a in ipairs(Config.Agencies) do
        if not Config.UseAce or IsPlayerAceAllowed(src, a.ace) then
            list[#list + 1] = { id = a.id, short = a.short, name = a.name, color = a.color }
        end
    end
    return list
end

RegisterNetEvent('svp_strafenkatalog:requestOpen', function()
    local src = source
    local agencies = allowedAgencies(src)
    if #agencies == 0 then
        TriggerClientEvent('svp_strafenkatalog:denied', src)
        return
    end
    TriggerClientEvent('svp_strafenkatalog:open', src, GetPlayerName(src), agencies)
end)
