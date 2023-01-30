import { promises as fsPromises } from "fs"
import { projectId, datasetId, blacklistTableId, dbLocation, bqStageAdd } from '../config'
import { BigQuery, JobMetadataResponse, JobResponse, QueryRowsResponse } from "@google-cloud/bigquery"
import { IUpdateResult } from "../interfaces"
import dbReader from '../readers/db'

const bigquery = new BigQuery()
const metadata = {
    sourceFormat: 'NEWLINE_DELIMITED_JSON',
    autodetect: false,
    location: dbLocation
}

const deleteSql = `DELETE FROM \`${projectId}.${datasetId}.${blacklistTableId}\` WHERE address IN UNNEST(@addresses)`

async function update(blacklist: string[]): Promise<IUpdateResult> {
    const response: IUpdateResult = {
        updated: false,
        actions: {
            add: [],
            delete: []
        }
    }
    const addressesToAdd = await dbReader.calculateAddressesToAdd(blacklist)
    const addressesToDelete = await dbReader.calculateAddressesToDelete(blacklist)
    if (addressesToAdd.length > 0 || addressesToDelete.length > 0) {
        console.log(JSON.stringify({
            class: 'db',
            method: 'update',
            note: `found ${addressesToAdd?.length ?? 0} addresses to add and ${addressesToDelete?.length ?? 0} to remove`
        }))
        if (addressesToAdd.length > 0) {
            await add(addressesToAdd)
        }
        if (addressesToDelete.length > 0) {
            await remove(addressesToDelete)
        }
        response.updated = true
        response.actions.add = addressesToAdd
        response.actions.delete = addressesToDelete
    } else {
        console.log(JSON.stringify({
            class: 'db',
            method: 'update',
            note: 'blacklist unchanged'
        }))
    }
    return response
}

async function add(addresses: string[]): Promise<void> {
    await fsPromises.writeFile(bqStageAdd, '', { flag: 'w' })
    for (const address of addresses) {
        await fsPromises.writeFile(bqStageAdd, JSON.stringify({ "address": address }) + '\n', { flag: 'a+' })
    }
    console.log(JSON.stringify({
        class: 'db',
        method: 'add',
        note: `bulk loading ${addresses.length} addresses to ${datasetId}.${blacklistTableId}`
    }))
    const jobResponse: JobMetadataResponse = await bigquery.dataset(datasetId).table(blacklistTableId).load(bqStageAdd, metadata)
    console.log(JSON.stringify({
        class: 'db',
        method: 'add',
        note: `added ${addresses.length} addresses to blacklist`,
        addresses: addresses
    }))
}

async function remove(addresses: string[]): Promise<void> {
    const options = {
        query: deleteSql,
        params: {
            addresses: addresses
        },
        location: dbLocation
    }
    const jobResponse: JobResponse = await bigquery.createQueryJob(options)
    const results: QueryRowsResponse = await jobResponse[0].getQueryResults()
    console.log(JSON.stringify({
        class: 'db',
        method: 'remove',
        note: `deleted ${addresses.length} addresses from blacklist`,
        addresses: addresses
    }))
}

export default { update }