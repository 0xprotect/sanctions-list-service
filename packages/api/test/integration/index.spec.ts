import { expect } from "chai"
import { app } from '../../src/index'
import request from "supertest"

describe('integration: index', function () {
    it('returns correct response sync', async () => {
        const response = await request(app)
            .get(`/`)

        expect(response.headers["content-type"]).to.match(/application\/json/)
        expect(response.status).to.equal(200)
    })

    it('returns correct response for valid tx', async () => {
        const response = await request(app)
            .get(`/tx/0x1e76aa7ad0f0e4aaf7838da38cc0c968571e51d6e13e3ce2a40f52739d1c7d31/1667995511`)

        expect(response.headers["content-type"]).to.match(/application\/json/)
        expect(response.status).to.equal(200)
    })

    it('returns 400 response for invalid tx', async () => {
        const response = await request(app)
            .get(`/tx/0x1e76aa7ad0fe4aaf7838da38cc0c968571e51d6e13e3ce2a40f52739d1c7d31/1667995511`)

        expect(response.headers["content-type"]).to.match(/application\/json/)
        expect(response.status).to.equal(400)
        expect(response.body.error).to.equal("invalid tx hash")
    })

    it('returns 404 for tx not found', async () => {
        const response = await request(app)
            .get(`/tx/0x3e8f586f58e13da3f95501a28932c6c0183f4b9dd5cb9269f9a9eaba2c7c07a7/1667995511`)

        expect(response.headers["content-type"]).to.match(/application\/json/)
        expect(response.status).to.equal(404)
        expect(response.body.error).to.equal("transaction not found")
    })

    // This test will only pass if there's actually be blacklisted transactions for the eden builder in the last 5 days. 
    // It would be better to refactor the implementation of the underlying function to take a date range as a parameter, calculated from the days parameter.
    it('returns correct response info blacklisted txs', async () => {
        const response = await request(app)
            .get(`/builder/eden/100`)

        expect(response.headers["content-type"]).to.match(/application\/json/)
        expect(response.status).to.equal(200)
    })

    it('returns 404 for no transactions found', async () => {
        const response = await request(app)
            .get(`/builder/NON-EXISTENT-BUILDER/5`)

        expect(response.headers["content-type"]).to.match(/application\/json/)
        expect(response.status).to.equal(200)
        expect(response.body.message).to.equal("no ofac txs found")
    })

    it('returns 404 when builder is missing', async () => {
        const response = await request(app)
            .get(`/builder/5`)

        expect(response.status).to.equal(404)
    })

    it('returns 404 when days is missing', async () => {
        const response = await request(app)
            .get(`/builder/eden/`)

        expect(response.status).to.equal(404)
    })

    it('returns 400 when days is not a number', async () => {
        const response = await request(app)
            .get(`/builder/eden/asd`)

        expect(response.headers["content-type"]).to.match(/application\/json/)
        expect(response.status).to.equal(400)
        expect(response.body.error).to.equal("days parameter needs to be a number")
    })

    it('returns correct response notify', async () => {
        const response = await request(app)
            .get(`/blacklist`)

        expect(response.headers["content-type"]).to.match(/application\/json/)
        expect(response.status).to.equal(200)
    })
})