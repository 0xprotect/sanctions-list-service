import { expect } from 'chai'
import notify from '../../src/handlers/notify'

describe('end to end: notify', async function () {

    it('check and notify for the last 50 days', async function () {
        const result = await notify.checkAndNotify("eden", 50)

        expect(result.success).to.equal(true)
    })

    it('check and notify for the last 24 hours', async function () {
        const result = await notify.checkAndNotify("eden", 1)

        expect(result.success).to.equal(true)
    })
})