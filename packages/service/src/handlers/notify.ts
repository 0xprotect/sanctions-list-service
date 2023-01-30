import fetch from "node-fetch"
import { IApiResponse } from "../interfaces"
import discord, { ITransaction } from '../writers/discord'
import { blacklistApiUrl } from '../config'

async function checkAndNotify(builder: string, dayDelta: number): Promise<IApiResponse> {
    const response = await fetch(`${blacklistApiUrl}/builder/${builder}/${dayDelta}`)
    if (!response.ok) {
        return {
            success: false,
            error: `Error fetching blacklist from ${blacklistApiUrl}`,
            data: undefined
        }
    }
    const blacklistedTransactions: ITransaction[] = await response.json()
    if (blacklistedTransactions.length > 0) {
        await discord.sendBlacklistedTxNotifications(builder, dayDelta, blacklistedTransactions)
    } else {
        await discord.sendAllGoodNotification(builder, dayDelta)
    }

    return {
        success: true,
        data: {
            blacklistedTxsFound: blacklistedTransactions.length
        }
    }
}

export default { checkAndNotify }