import { files } from "../config"
import { IApiResponse, ISha256Values, IUpdateResult, ISyncResponse } from "../interfaces"
import ofac, { IOfacFiles } from '../readers/ofac'
import blacklist from "../helpers/blacklist"
import { sha256 } from "../helpers/crypto"
import dbWriter from '../writers/db'
import dbReader from '../readers/db'
import discord from '../writers/discord'
import smartContract from "../writers/smartContract"
import cloudStorage from "../writers/cloudStorage"

const noChanges: IUpdateResult = {
    updated: false,
    actions: {
        add: [],
        delete: []
    }
}

async function execute(): Promise<IApiResponse> {
    try {
        await validateAndWriteRemoteFiles()
        const _blacklist = await blacklist.generate(files)
        if (await hasChanged(_blacklist)) {
            const result = await sync(_blacklist)
            await discord.sendBlacklistUpdatedNotification(result)
            return {
                success: true,
                data: result
            }
        } else {
            return {
                success: true,
                data: {
                    cloudStorage: noChanges,
                    db: noChanges,
                    smartContract: noChanges
                }
            }
        }
    } catch (error) {
        console.log(JSON.stringify({
            module: 'sync',
            action: 'execute',
            error: error instanceof Error ? error.message : error
        }))
        await discord.sendErrorNotification()
        return {
            success: false,
            error: "check logs for details",
            data: undefined
        }
    }
}

async function hasChanged(blacklist: string[]): Promise<boolean> {
    const newHash = sha256(JSON.stringify(blacklist), 'new - blacklist')
    const gsBlacklist = await cloudStorage.getBlacklist()
    const gsHash = sha256(JSON.stringify(gsBlacklist), 'gs - blacklist')
    const dbBlacklist = await dbReader.getBlacklist()
    const dbHash = sha256(JSON.stringify(dbBlacklist), 'db - blacklist')
    const scBlacklist = await smartContract.getBlacklist()
    const scHash = sha256(JSON.stringify(scBlacklist), 'smartContract - blacklist')
    const hashes = [newHash, gsHash, dbHash, scHash]
    const uniqueHashes = [...new Set(hashes)]
    if (uniqueHashes.length > 1) {
        console.log(JSON.stringify({
            class: 'sync',
            action: 'hasChanged',
            result: true,
        }))
        return true
    } else {
        console.log(JSON.stringify({
            class: 'sync',
            action: 'hasChanged',
            result: false
        }))
        return false
    }
}

async function validateAndWriteRemoteFiles(): Promise<IOfacFiles> {
    const remoteHashes: ISha256Values = await ofac.getChecksumValues()
    const remoteFiles: IOfacFiles = await ofac.getFiles(files)
    files.map((file) => {
        const latestFileHash = sha256(remoteFiles[file.name], file.name)
        if (remoteHashes[file.name] !== latestFileHash) {
            throw new Error(`assurance hash mismatch for file: ${file.name} - source: ${remoteHashes[file.name]} - latest pull: ${latestFileHash}`)
        }
    })
    console.log(JSON.stringify({
        class: 'sync',
        action: 'validateAndWriteRemoteFiles',
        note: `${files.length} files passed assurance validation`
    }))
    const writeFilePromises: Promise<void>[] = []
    for (const _file of files) {
        const responseText = remoteFiles[_file.name]
        _file.contents = responseText
        writeFilePromises.push(cloudStorage.writeContents(_file.name, responseText))
    }
    await Promise.all(writeFilePromises)
    return remoteFiles
}

async function sync(blacklist: string[]): Promise<ISyncResponse> {
    const updateSources: Promise<any>[] = []
    updateSources.push(cloudStorage.update(blacklist))
    updateSources.push(dbWriter.update(blacklist))
    updateSources.push(smartContract.update(blacklist))
    const results = await Promise.all(updateSources)
    return {
        cloudStorage: results[0],
        db: results[1],
        smartContract: results[2]
    }
}

export default { execute }