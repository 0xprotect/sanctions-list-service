import { IFileInfo } from "../interfaces"

async function generate(files: IFileInfo[]): Promise<string[]> {
    const ethAddresses: string[] = []
    for (const _file of files) {
        const ofacCsv = _file.contents
        const ethAddressFormat = new RegExp(/0x[a-fA-F0-9]{40}/g)
        const matches = ofacCsv.match(ethAddressFormat)
        if (matches && matches?.length > 0) {
            ethAddresses.push(...matches.map((entry) => entry.toLowerCase()))
            console.log(JSON.stringify({
                class: 'blacklist',
                method: 'generate',
                note: `found ${matches?.length ?? 0} addresses in ${_file.name}`
            }))
        }
    }
    if (ethAddresses.length > 0) {
        const blacklist = [...new Set(ethAddresses)]
        console.log(JSON.stringify({
            class: 'blacklist',
            action: 'generate',
            note: `generated blacklist with ${blacklist.length} unique addresses`
        }))
        return blacklist.sort()
    }
    throw new Error('no addresses found in files')
}

export default { generate }