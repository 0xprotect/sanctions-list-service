import { projectId, datasetId, blacklistTableId, dbLocation } from '../config'
import { BigQuery, JobResponse, QueryRowsResponse } from "@google-cloud/bigquery"

const bigquery = new BigQuery()

const toDeleteSql = `SELECT address FROM \`${projectId}.${datasetId}.${blacklistTableId}\` WHERE address NOT IN UNNEST(@blacklist)`
const toAddSql = `  SELECT address
                    FROM UNNEST(@blacklist) as address
                    WHERE address NOT IN (  SELECT address
                                            FROM \`${projectId}.${datasetId}.${blacklistTableId}\`)`
const getBlacklistSql = `SELECT address FROM \`${projectId}.${datasetId}.${blacklistTableId}\` ORDER BY address`

async function getBlacklist(): Promise<string[]> {
    const results: QueryRowsResponse = await get(getBlacklistSql)
    const addresses: string[] = []
    for (const row of results[0]) {
        addresses.push(row.address)
    }
    return addresses
}

async function calculateAddressesToAdd(blacklist: string[]): Promise<string[]> {
    const results: QueryRowsResponse = await get(toAddSql, { blacklist: blacklist })
    const addresses: string[] = []
    for (const row of results[0]) {
        addresses.push(row.address)
    }
    return addresses
}

async function calculateAddressesToDelete(blacklist: string[]): Promise<string[]> {
    const results: QueryRowsResponse = await get(toDeleteSql, { blacklist: blacklist })
    const addresses: string[] = []
    for (const row of results[0]) {
        addresses.push(row.address)
    }
    return addresses
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

export default { getBlacklist, calculateAddressesToAdd, calculateAddressesToDelete }