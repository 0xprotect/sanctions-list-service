const testDataSetId = 'testing'
const testTableId = 'integration_blacklist'

import dotenv from "dotenv"
dotenv.config()
process.env.DATASET_ID = testDataSetId
process.env.TABLE_ID = testTableId

import { expect } from 'chai'
import db from '../../src/writers/db'
import { BigQuery, JobResponse, QueryRowsResponse } from "@google-cloud/bigquery"
import { promises as fsPromises } from "fs"
import { join } from "path"

const bigquery = new BigQuery()

const blacklist = [
    "0x098B716B8Aaf21512996dC57EB0615e2383E2f96",
    "0xa0e1c89Ef1a489c9C7dE96311eD5Ce5D32c20E4B",
    "0x3Cffd56B47B7b41c56258D9C7731ABaDc360E073",
    "0x53b6936513e738f44FB50d2b9476730C0Ab3Bfc1"
]

describe('integration: db', async function () {
    before(async function () {
        try {
            const deleteResponse = await bigquery.dataset(testDataSetId).table(testTableId).delete()
        } catch (error) {
            console.log(error)
        }
        const spec = await fsPromises.readFile(join(__dirname, '../../bq/schemas/ofac.json'), { encoding: 'utf8' })
        const specJson = JSON.parse(spec)
        const options = {
            schema: specJson,
            location: 'US'
        }
        await bigquery.dataset(testDataSetId).createTable(testTableId, options)
    })

    beforeEach(async function () {
        const truncateSql = `TRUNCATE TABLE \`${testDataSetId}.${testTableId}\``
        const options = {
            query: truncateSql,
            location: 'US'
        }
        const jobResponse: JobResponse = await bigquery.createQueryJob(options)
        const truncateResults: QueryRowsResponse = await jobResponse[0].getQueryResults()
        const metadata = {
            sourceFormat: 'NEWLINE_DELIMITED_JSON',
            autodetect: false,
            location: 'US'
        }
        const startStatePath = join(__dirname, '../data/db/start_state')
        const addResults = await bigquery.dataset(testDataSetId).table(testTableId).load(startStatePath, metadata)
    })


    it('add two new addresses', async function () {
        const newAddresses = [
            "0xc2a3829F459B3Edd87791c74cD45402BA0a20Be3",
            "0x3AD9dB589d201A710Ed237c829c7860Ba86510Fc"
        ]
        const newBlacklist = blacklist.concat(newAddresses)
        const result = await db.update(newBlacklist)

        expect(result.updated).to.equal(true)
        expect(result.actions.add.length).to.equal(2)
        expect(result.actions.add[0]).to.equal(newAddresses[0])
        expect(result.actions.add[1]).to.equal(newAddresses[1])
        expect(result.actions.delete.length).to.equal(0)

        const querySql = `SELECT * FROM \`${testDataSetId}.${testTableId}\``
        const options = {
            query: querySql,
            location: 'US'
        }
        const jobResponse: JobResponse = await bigquery.createQueryJob(options)
        const queryResults: QueryRowsResponse = await jobResponse[0].getQueryResults()
        const rows = queryResults[0]
        expect(rows.length).to.equal(newBlacklist.length)
        for (const entry of newBlacklist) {
            const found = rows.find(row => row.address === entry)
            expect(found).to.not.be.undefined
        }
    })

    it('remove two addresses', async function () {
        const deletedAddresses = [
            "0xa0e1c89Ef1a489c9C7dE96311eD5Ce5D32c20E4B",
            "0x3Cffd56B47B7b41c56258D9C7731ABaDc360E073"
        ]
        const newBlacklist = blacklist.filter(entry => !deletedAddresses.includes(entry))
        const result = await db.update(newBlacklist)

        expect(result.updated).to.equal(true)
        expect(result.actions.delete.length).to.equal(2)
        expect(result.actions.delete[0]).to.equal(deletedAddresses[0])
        expect(result.actions.delete[1]).to.equal(deletedAddresses[1])
        expect(result.actions.add.length).to.equal(0)

        const querySql = `SELECT * FROM \`${testDataSetId}.${testTableId}\``
        const options = {
            query: querySql,
            location: 'US'
        }
        const jobResponse: JobResponse = await bigquery.createQueryJob(options)
        const queryResults: QueryRowsResponse = await jobResponse[0].getQueryResults()
        const rows = queryResults[0]
        expect(rows.length).to.equal(newBlacklist.length)
        for (const entry of newBlacklist) {
            const found = rows.find(row => row.address === entry)
            expect(found).to.not.be.undefined
        }
    })

    it('add and remove addresses', async function () {
        const addAddress = "0x3AD9dB589d201A710Ed237c829c7860Ba86510Fc"
        const deleteAddress = "0xa0e1c89Ef1a489c9C7dE96311eD5Ce5D32c20E4B"
        const newBlacklist = blacklist.filter((address) => address !== deleteAddress).concat(addAddress)
        const result = await db.update(newBlacklist)

        expect(result.updated).to.equal(true)
        expect(result.actions.add.length).to.equal(1)
        expect(result.actions.add[0]).to.equal(addAddress)
        expect(result.actions.delete.length).to.equal(1)
        expect(result.actions.delete[0]).to.equal(deleteAddress)

        const querySql = `SELECT * FROM \`${testDataSetId}.${testTableId}\``
        const options = {
            query: querySql,
            location: 'US'
        }
        const jobResponse: JobResponse = await bigquery.createQueryJob(options)
        const queryResults: QueryRowsResponse = await jobResponse[0].getQueryResults()
        const rows = queryResults[0]
        expect(rows.length).to.equal(newBlacklist.length)
        for (const entry of newBlacklist) {
            const found = rows.find(row => row.address === entry)
            expect(found).to.not.be.undefined
        }
    })

    it('no changes', async function () {
        const result = await db.update(blacklist)

        expect(result.updated).to.equal(false)
        expect(result.actions.add.length).to.equal(0)
        expect(result.actions.delete.length).to.equal(0)

        const querySql = `SELECT * FROM \`${testDataSetId}.${testTableId}\``
        const options = {
            query: querySql,
            location: 'US'
        }
        const jobResponse: JobResponse = await bigquery.createQueryJob(options)
        const queryResults: QueryRowsResponse = await jobResponse[0].getQueryResults()
        const rows = queryResults[0]
        expect(rows.length).to.equal(blacklist.length)
        for (const entry of blacklist) {
            const found = rows.find(row => row.address === entry)
            expect(found).to.not.be.undefined
        }
    })
})