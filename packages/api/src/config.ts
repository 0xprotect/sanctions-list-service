import dotenv from "dotenv"
dotenv.config()

export const port = process.env.PORT
export const projectId = process.env.PROJECT_ID as string
export const datasetId = process.env.DATASET_ID as string
export const blacklistedTxsDetailTableId = process.env.BLACKLISTED_TXS_DETAIL_TABLE_ID as string
export const dbLocation = process.env.DB_LOCATION
export const gsBucketName = process.env.GS_BUCKET_NAME as string
export const gsFileName = process.env.GS_FILE_NAME as string