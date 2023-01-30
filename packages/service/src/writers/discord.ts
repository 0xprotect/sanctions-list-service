import fetch from "node-fetch"
import { discordWebhook, blacklistSmartContractAddress, etherscanUrl, projectId, blacklistApiUrl, serviceName } from "../config"
import { ISyncResponse } from "../interfaces"
import { BigQueryDatetime } from "@google-cloud/bigquery"

export interface ITransaction {
    blockNumber: number,
    blockHash: string,
    blockTimestampUnix: number,
    blockTimestamp: BigQueryDatetime,
    builder: string,
    transactionHash: string,
    transactionLevelCount: number,
    tokenTransferLevelCount: number,
    traceLevelCount: number,
    levelOverview: {
        level: string,
        fromMatch: string,
        toMatch: string
    }[]
}

async function sendBlacklistedTxNotifications(builder: string, days: number, notifications: ITransaction[]): Promise<void> {
    if (notifications.length == 0) {
        throw new Error("expected notifications to send to discord but got 0")
    }

    var groupedTransactions = notifications.reduce((acc, elem, index) => {
        var groupNumber = Math.floor(index / 8)
        acc[groupNumber] = acc[groupNumber] || []
        acc[groupNumber].push(elem)
        return acc
    }, {})

    const messages: any[] = []
    const message = {
        "username": "Blacklist Bot",
        "avatar_url": "https://sbscyber.com/Portals/0/Images/blog-images/OFACLogo.png",
        "embeds": [
            {
                "author": {
                    "name": `${builder}: last ${days} days`,
                    "url": "https://github.com/0xprotect"
                },
                "color": 10038562
            }
        ]
    }

    for (const group in Object.keys(groupedTransactions)) {
        const fields = groupedTransactions[group].flatMap((notification: ITransaction) => {
            const dateIso = new Date(notification.blockTimestampUnix * 1000).toISOString()
            return [{
                "name": "tx | trace | xfer",
                "value": `[${notification.transactionLevelCount} | ${notification.traceLevelCount} | ${notification.tokenTransferLevelCount}](${blacklistApiUrl}/tx/${notification.transactionHash}/${notification.blockTimestampUnix})`,
                "inline": true
            },
            {
                "name": "block timestamp",
                "value": dateIso.includes('.') ? dateIso.split('.')[0] + 'Z' : dateIso,
                "inline": true
            },
            {
                "name": "bk : tx",
                "value": `[${notification.blockNumber}](${etherscanUrl}/block/${notification.blockNumber}) : [${notification.transactionHash.slice(0, 5)}...${notification.transactionHash.slice(-5)}](${etherscanUrl}/tx/${notification.transactionHash})`,
                "inline": true
            }]
        })
        const newMessage = JSON.parse(JSON.stringify(message))
        newMessage.embeds[0].fields = fields
        messages.push(newMessage)
    }

    const responses = await Promise.all(messages.map(async (message) => {
        const response = await fetch(discordWebhook, {
            method: 'POST',
            body: JSON.stringify(message),
            headers: { 'Content-Type': 'application/json' },
        })
        return response
    }))

    for (const response of responses) {
        console.log(JSON.stringify({
            class: "discord",
            action: "sendBlacklistedTxNotifications",
            status: response.status,
            note: response.statusText
        }))
    }
}

async function sendAllGoodNotification(builder, days): Promise<void> {
    const [date] = new Date().toISOString().split('T')
    const message = {
        "username": "Blacklist Bot",
        "avatar_url": "https://sbscyber.com/Portals/0/Images/blog-images/OFACLogo.png",
        "embeds": [
            {
                "author": {
                    "name": builder,
                    "url": "https://github.com/0xprotect"
                },
                "color": 5763719,
                "fields": [
                    {
                        "name": date,
                        "value": `0 ofac transactions found in the last ${days} days.`
                    }
                ]
            }
        ]
    }

    const response = await fetch(discordWebhook, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(message)
    })
    if (response.status !== 200) {
        console.log(JSON.stringify({
            class: "discord",
            action: "sendAllGoodNotification",
            status: response.status,
            message: response.statusText
        }))
    }
}

async function sendBlacklistUpdatedNotification(updateResult: ISyncResponse): Promise<void> {
    const message = {
        "username": "Blacklist Bot",
        "avatar_url": "https://sbscyber.com/Portals/0/Images/blog-images/OFACLogo.png",
        "embeds": [
            {
                "author": {
                    "name": "Blacklist updated"
                },
                "color": 5763719,
                "fields": [
                    {
                        "name": "on chain",
                        "value": `[+ ${updateResult.smartContract.actions.add.length}, - ${updateResult.smartContract.actions.delete.length}](${etherscanUrl}/address/${blacklistSmartContractAddress})`,
                        "inline": true
                    },
                    {
                        "name": "cloud storage",
                        "value": `[+ ${updateResult.cloudStorage.actions.add.length}, - ${updateResult.cloudStorage.actions.delete.length}](${blacklistApiUrl}/blacklist)`,
                        "inline": true
                    },
                    {
                        "name": "database",
                        "value": `+ ${updateResult.db.actions.add.length}, - ${updateResult.db.actions.delete.length}`,
                        "inline": true
                    }
                ]
            }
        ]
    }

    const response = await fetch(discordWebhook, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(message)
    })
    if (response.status !== 200) {
        console.log(JSON.stringify({
            class: "discord",
            action: "sendBlacklistUpdatedNotification",
            status: response.status,
            message: response.statusText
        }))
    }
}

async function sendErrorNotification(): Promise<void> {
    const message = {
        "username": "Blacklist Bot",
        "avatar_url": "https://sbscyber.com/Portals/0/Images/blog-images/OFACLogo.png",
        "embeds": [
            {
                "author": {
                    "name": "Error with sync"
                },
                "color": 10038562,
                "fields": [
                    {
                        "name": "message",
                        "value": `[check logs](https://console.cloud.google.com/logs/query;query=resource.type%20%3D%20%22cloud_run_revision%22%0Aresource.labels.service_name%20%3D%20%22${serviceName}%22%0Aresource.labels.location%20%3D%20%22us-central1%22%0A%20severity%3E%3DDEFAULT?authuser=1&project=${projectId})`
                    }
                ]
            }
        ]
    }

    const response = await fetch(discordWebhook, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(message)
    })
    if (response.status !== 200) {
        console.log(JSON.stringify({
            class: "discord",
            action: "sendErrorNotification",
            status: response.status,
            message: response.statusText
        }))
    }
}

export default { sendAllGoodNotification, sendBlacklistedTxNotifications, sendBlacklistUpdatedNotification, sendErrorNotification }