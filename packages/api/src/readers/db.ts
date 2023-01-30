import { projectId, datasetId, blacklistedTxsDetailTableId, dbLocation } from '../config'
import { BigQuery, BigQueryDatetime, JobResponse, QueryRowsResponse } from "@google-cloud/bigquery"

const bigquery = new BigQuery()

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

const getBlacklistedTransactionsDetailSql = `     SELECT  block_number,
                                                    block_hash,
                                                    block_timestamp_seconds,
                                                    block_timestamp,
                                                    builder,
                                                    tx_hash,
                                                    transaction_level_count,
                                                    token_transfer_level_count, 
                                                    trace_level_count, 
                                                    level_overview
                                                FROM \`${projectId}.${datasetId}.${blacklistedTxsDetailTableId}\`
                                                WHERE block_timestamp >= TIMESTAMP(CONCAT(CAST(DATE_ADD(CURRENT_DATE("UTC"),INTERVAL -@days DAY) AS STRING)," 12:00:00.000"))
                                                    AND block_timestamp < TIMESTAMP(CONCAT(CAST(CURRENT_DATE("UTC") AS STRING)," 12:00:00.000"))
                                                    AND (LOWER(builder) LIKE LOWER(@builder) OR LOWER(coinbase) LIKE LOWER(@builder))`
const getBlacklistTransactionDetailSql = `SELECT   block_number,
                                                    block_hash,
                                                    block_timestamp_seconds,
                                                    block_timestamp,
                                                    builder,
                                                    tx_hash,
                                                    transaction_level_count,
                                                    token_transfer_level_count, 
                                                    trace_level_count, 
                                                    level_overview
                                            FROM \`${projectId}.${datasetId}.${blacklistedTxsDetailTableId}\`
                                            WHERE block_timestamp = TIMESTAMP_SECONDS(@unixSeconds)
                                                AND tx_hash = @txHash`

async function getTransactions(builder: string, dayDelta: number): Promise<ITransaction[] | undefined> {
    const results: QueryRowsResponse = await get(getBlacklistedTransactionsDetailSql, { days: dayDelta, builder: `%${builder}%` })
    if (results[0].length > 0) {

        return results[0].map((row: any) => {
            return {
                blockNumber: row.block_number,
                blockHash: row.block_hash,
                blockTimestampUnix: row.block_timestamp_seconds,
                blockTimestamp: row.block_timestamp,
                builder: row.builder,
                transactionHash: row.tx_hash,
                transactionLevelCount: row.transaction_level_count,
                tokenTransferLevelCount: row.token_transfer_level_count,
                traceLevelCount: row.trace_level_count,
                levelOverview: row.level_overview.map((level: any) => {
                    return {
                        level: level.level,
                        fromMatch: level.from_match,
                        toMatch: level.to_match
                    }
                })
            } as ITransaction
        })
    } else {
        return undefined
    }
}

async function getTransaction(txHash: string, blockTimestampUnix: number): Promise<ITransaction | undefined> {
    const results: QueryRowsResponse = await get(getBlacklistTransactionDetailSql, { txHash: txHash, unixSeconds: blockTimestampUnix })
    if (results[0].length > 0) {
        const row = results[0][0] as any
        return {
            blockNumber: row.block_number,
            blockHash: row.block_hash,
            blockTimestampUnix: row.block_timestamp_seconds,
            blockTimestamp: row.block_timestamp,
            builder: row.builder,
            transactionHash: row.tx_hash,
            transactionLevelCount: row.transaction_level_count,
            tokenTransferLevelCount: row.token_transfer_level_count,
            traceLevelCount: row.trace_level_count,
            levelOverview: row.level_overview.map((level: any) => {
                return {
                    level: level.level,
                    fromMatch: level.from_match,
                    toMatch: level.to_match
                }
            })
        } as ITransaction
    } else {
        return undefined
    }
}

async function get(sql: string, params?: any): Promise<QueryRowsResponse> {
    let options = {
        query: sql,
        location: dbLocation
    }

    if (params) {
        options['params'] = params
    }

    const jobResponse: JobResponse = await bigquery.createQueryJob(options)
    return await jobResponse[0].getQueryResults()
}

export default { getTransactions, getTransaction }