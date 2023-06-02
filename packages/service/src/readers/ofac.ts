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
    const targetElements = Array.from(dom.window.document.querySelectorAll('p'))
        .filter((el) => files.some((file) => el.textContent?.includes(file.name) && el.textContent?.includes('SHA-256:')))
    const results: ISha256Values = {}
    targetElements.forEach((el) => {
        const fileName = el.textContent?.match(/(\S+)\s+SHA-256:/)?.[1]
        const sha256 = el.textContent?.match(/SHA-256:\s(.+?)\s/)?.[1]
        if (fileName && sha256) {
            results[fileName] = sha256
        }
    })
    if (Object.keys(results).length < files.length) {
        throw new Error('Not all hash values could be extracted from the OFAC webpage.')
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