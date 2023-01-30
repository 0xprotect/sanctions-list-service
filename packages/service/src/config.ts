import dotenv from "dotenv"
dotenv.config()
import { IFileInfo } from "./interfaces"
import { join } from "path"

export const port = process.env.PORT
export const projectId = process.env.PROJECT_ID as string
export const datasetId = process.env.DATASET_ID as string
export const blacklistTableId = process.env.TABLE_ID as string
export const dbLocation = process.env.DB_LOCATION
export const gsBucketName = process.env.GS_BUCKET_NAME as string
export const gsFileName = process.env.GS_FILE_NAME as string
export const checksumUrl = process.env.OFAC_SHA256_CHECKSUM_URL as string
const ofacDownloadsUrl = process.env.OFAC_DOWNLOADS_URL as string
export const discordWebhook = process.env.DISCORD_WEBHOOK as string
export const etherscanUrl = process.env.ETHERSCAN_URL as string
export const blacklistApiUrl = process.env.BLACKLIST_API_URL as string
export const serviceName = process.env.SERVICE_NAME as string
const tempFolder: string = join(__dirname, '_temp/')
const bqStagingFolder: string = join(tempFolder, '_bq/')
export const bqStageAdd: string = join(bqStagingFolder, 'add.json')

export const providerUrl: string = process.env.PROVIDER_URL as string
export const blacklistSmartContractAddress: string = process.env.BLACKLIST_SMART_CONTRACT_ADDRESS as string
export const chainId: number = parseInt(process.env.CHAIN_ID as string)

export const files: IFileInfo[] = [{
    name: 'sdn.csv',
    url: `${ofacDownloadsUrl}/sdn.csv`,
    contents: ''
}, {
    name: 'add.csv',
    url: `${ofacDownloadsUrl}/add.csv`,
    contents: ''
}, {
    name: 'alt.csv',
    url: `${ofacDownloadsUrl}/alt.csv`,
    contents: ''
}, {
    name: 'sdn_comments.csv',
    url: `${ofacDownloadsUrl}/sdn_comments.csv`,
    contents: ''
}, {
    name: 'cons_prim.csv',
    url: `${ofacDownloadsUrl}/consolidated/cons_prim.csv`,
    contents: ''
}, {
    name: 'cons_add.csv',
    url: `${ofacDownloadsUrl}/consolidated/cons_add.csv`,
    contents: ''
}, {
    name: 'cons_alt.csv',
    url: `${ofacDownloadsUrl}/consolidated/cons_alt.csv`,
    contents: ''
}, {
    name: 'cons_comments.csv',
    url: `${ofacDownloadsUrl}/consolidated/cons_comments.csv`,
    contents: ''
}]