import { expect } from 'chai'

import dotenv from "dotenv"
dotenv.config()
process.env.DATASET_ID = 'testing'
process.env.TABLE_ID = 'integration_blacklist'

import ofac from '../../src/readers/ofac'

describe('integration: ofac reader', async function () {

    it('get checksum values', async function () {
        const test = await ofac.getChecksumValues()

        expect(test).to.not.be.null
    })
})