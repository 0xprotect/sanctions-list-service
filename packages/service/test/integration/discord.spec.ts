import { BigQueryDatetime } from '@google-cloud/bigquery'
import { expect } from 'chai'
import { ISyncResponse, IUpdateResult } from '../../src/interfaces'
import discord, { ITransaction } from '../../src/writers/discord'

const blacklistedTx: ITransaction = {
    blockNumber: 15817552,
    blockHash: "0x7e0ece6e6e0d45f25c47f513838e7408f442ba849e361d08bb4a236fc0db9bc7",
    blockTimestampUnix: 1630000000,
    blockTimestamp: new BigQueryDatetime("2022-10-24 11:05:11.000"),
    builder: "Generic: builder",
    transactionHash: "0xfc93e0f40549bac09728a2a30d37622f95a48b1727f296c594e92ec73ef1a388",
    transactionLevelCount: 1,
    tokenTransferLevelCount: 0,
    traceLevelCount: 0,
    levelOverview: [{
        level: "transaction",
        fromMatch: "0xa483254773cfe94d502557099945caf90725473f",
        toMatch: ""
    }]
}

describe('integration: builder blacklist txs', async function () {

    it('send 1 blacklisted transaction notification', async function () {
        const result = await discord.sendBlacklistedTxNotifications("Generic", 1, [blacklistedTx])
    })

    it('send 10 blacklisted transaction notification', async function () {
        const blacklistedTxs: ITransaction[] = Array.from({ length: 10 }, () => blacklistedTx)
        const result = await discord.sendBlacklistedTxNotifications("Generic", 1, blacklistedTxs)
    })

    it('send 15 blacklisted transaction notification', async function () {
        const blacklistedTxs: ITransaction[] = Array.from({ length: 15 }, () => blacklistedTx)
        const result = await discord.sendBlacklistedTxNotifications("Generic", 1, blacklistedTxs)
    })

    it('send 30 blacklisted transaction notification', async function () {
        const blacklistedTxs: ITransaction[] = Array.from({ length: 30 }, () => blacklistedTx)
        const result = await discord.sendBlacklistedTxNotifications("Generic", 1, blacklistedTxs)
    })

    it('send 0 blacklisted transaction notification', async function () {
        try {
            await discord.sendBlacklistedTxNotifications("Generic", 1, [])
            throw new Error('should not reach here')
        } catch (error: any) {
            expect(error.message).to.equal("expected notifications to send to discord but got 0")
        }
    })

    it('send correct 0 blacklisted transaction notification', async function () {
        try {
            await discord.sendAllGoodNotification("Generic", 1)
        } catch (error: any) {
            throw new Error('should not reach here')
        }
    })
})

const updateResult: IUpdateResult = {
    updated: true,
    actions: {
        add: ["0xa483254773cfe94d502557099945caf90725473f"],
        delete: ["0x098B716B8Aaf21512996dC57EB0615e2383E2f96, 0x53b6936513e738f44FB50d2b9476730C0Ab3Bfc1"]
    }
}

const syncResponse: ISyncResponse = {
    cloudStorage: updateResult,
    db: updateResult,
    smartContract: updateResult
}

describe('integration: blacklist updated', async function () {

    it('send notification', async function () {
        const result = await discord.sendBlacklistUpdatedNotification(syncResponse)
    })
})

describe('integration: sync error', async function () {

    it('send notification', async function () {
        const result = await discord.sendErrorNotification()
    })
})