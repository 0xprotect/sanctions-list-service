import { expect } from 'chai'

import dotenv from "dotenv"
dotenv.config()
process.env.DATASET_ID = 'testing'
process.env.TABLE_ID = 'integration_blacklist'

import sync from '../../src/handlers/sync'

describe('end to end: sync', async function () {

    it('execute', async function () {
        const result = await sync.execute()

        expect(result.success).to.equal(true)
    })
})