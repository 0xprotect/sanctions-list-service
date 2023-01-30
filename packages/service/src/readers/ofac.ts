import fetch from "node-fetch"
import { JSDOM } from "jsdom"
import { checksumUrl, files } from "../config"
import { IFileInfo, ISha256Values } from "../interfaces"

export interface IOfacFiles {
    [key: string]: string
}

interface IOfacFile {
    name: string,
    contents: string
}

async function getFile(file: IFileInfo): Promise<IOfacFile> {
    console.log(JSON.stringify({
        class: 'ofac',
        action: 'getFile',
        file: file.name,
        url: file.url
    }))
    return new Promise(async (resolve, reject) => {
        try {
            const response = await fetch(file.url)
            const responseText = await response.text()
            resolve({
                name: file.name,
                contents: responseText
            })
        } catch (error) {
            reject(error)
        }
    })
}

async function getFiles(targetFiles: IFileInfo[]): Promise<IOfacFiles> {
    const result: IOfacFiles = {}
    const promises: Promise<IOfacFile>[] = []
    for (const _file of targetFiles) {
        promises.push(getFile(_file))
    }
    const downloadedFiles = await Promise.all(promises)
    for (const _file of downloadedFiles) {
        result[_file.name] = _file.contents
    }
    console.log(JSON.stringify({
        class: 'ofac',
        action: 'getFiles',
        note: `fetched ${Object.values(result).length} files`
    }))
    return result
}

async function getChecksumValues(): Promise<ISha256Values> {
    console.log(JSON.stringify({
        class: 'ofac',
        action: 'getSha256Values',
        note: `fetching sha256 values from ${checksumUrl}`
    }))
    const response = await fetch(checksumUrl)
    const htmlString = await response.text()
    const dom = new JSDOM(htmlString)
    const element = dom.window.document.querySelector('meta[property="og:description"]')
    const content = element?.getAttribute('content')
    const results: ISha256Values = {}
    for (const _file of files) {
        const altRegex = new RegExp(`\\s${_file.name.replace('.', '\\.')}\\s{4}SHA-256:\\s(?<sha256>[a-fA-F0-9]{64})`, 'g')
        const matches = content?.matchAll(altRegex)
        const matchesArray = Array.from(matches ?? [], (m) => m.groups?.sha256)
        if (matchesArray.length === 0) {
            throw new Error(`ofac.getSha256Values() - no hash value for ofac sanction list file: ${_file.name}`)
        } else if (matchesArray.length > 1) {
            throw new Error(`ofac.getSha256Values() - multiple hash values for ofac sanction list file: ${_file.name}`)
        } else {
            results[_file.name] = matchesArray[0] as string
        }
    }
    console.log(JSON.stringify({
        class: 'ofac',
        action: 'getSha256Values',
        note: `fetched ${Object.values(results).length} sha256 values for [${files.map(file => file.name).join(', ')}]`
    }))
    for (const [key, value] of Object.entries(results)) {
        console.log(JSON.stringify({
            class: 'ofac',
            action: 'getSha256Values',
            file: `${key}`,
            hash: `${value}`
        }))
    }
    return results
}

export default { getChecksumValues, getFiles }