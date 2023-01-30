import { Storage } from "@google-cloud/storage"
import { gsBucketName, gsFileName } from "../config"

const storage = new Storage()
const gsBucket = storage.bucket(gsBucketName)

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

async function getBlacklist(): Promise<string[]> {
    const remoteContents = await readContents(gsFileName)
    return JSON.parse(remoteContents || '[]')
}

export default { getBlacklist, readContents }