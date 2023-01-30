import { Storage } from "@google-cloud/storage"
import { gsBucketName, gsFileName } from "../config"
import { sha256 } from "../helpers/crypto"
import { IUpdateResult } from "../interfaces"

const storage = new Storage()
const gsBucket = storage.bucket(gsBucketName)

async function getBlacklist(): Promise<string[]> {
    const remoteContents = await readContents(gsFileName)
    return JSON.parse(remoteContents || '[]')
}

async function readContents(fileName: string): Promise<string | undefined> {
    const file = gsBucket.file(fileName)
    const fileExists = await file.exists()
    if (fileExists[0]) {
        const contents = await file.download()
        return contents.toString()
    } else {
        return undefined
    }
}

async function writeContents(fileName: string, contents: string): Promise<void> {
    const remoteContents = await readContents(fileName) || ''
    const fileHash = sha256(remoteContents, `[gs]: ${fileName}`)
    const contentHash = sha256(contents, `[new?]: ${fileName}`)
    if (fileHash !== contentHash) {
        console.log(JSON.stringify({
            class: "cloudStorage",
            method: "writeContents",
            note: `writing new contents to ${fileName}`,
        }))
        const file = gsBucket.file(fileName)
        await file.save(contents)
    } else {
        console.log(JSON.stringify({
            class: 'cloudStorage',
            method: 'writeContents',
            note: `${fileName} unchanged; not writing`
        }))
    }
}

async function update(blacklist: string[]): Promise<IUpdateResult> {
    const remoteContents = await readContents(gsFileName)
    const remoteBlacklist = JSON.parse(remoteContents || '[]')
    const newAddresses = blacklist.filter((elem: string) => !remoteBlacklist.includes(elem))
    const deletedAddresses = remoteBlacklist.filter((elem: string) => !blacklist.includes(elem))
    const updated = newAddresses.length > 0 || deletedAddresses.length > 0
    if (updated) {
        console.log(JSON.stringify({
            class: 'cloudStorage',
            method: 'update',
            note: `found ${newAddresses?.length ?? 0} addresses to add and ${deletedAddresses?.length ?? 0} to remove`,
            add: newAddresses,
            remove: deletedAddresses
        }))
        await writeContents(gsFileName, JSON.stringify(blacklist))
        return {
            updated: true,
            actions: {
                add: newAddresses,
                delete: deletedAddresses
            }
        }
    } else {
        console.log(JSON.stringify({
            class: 'cloudStorage',
            method: 'update',
            note: 'blacklist unchanged'
        }))
        return {
            updated: false,
            actions: {
                add: [],
                delete: []
            }
        }
    }
}

export default { update, getBlacklist, readContents, writeContents }