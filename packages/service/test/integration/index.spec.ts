import { expect } from "chai"
import { app } from '../../src/index'
import request from "supertest"

describe('integration: index', function () {
    it('returns correct response sync', async () => {
        const response = await request(app)
            .post(`/sync`)

        expect(response.headers["content-type"]).to.match(/application\/json/)
        expect(response.status).to.equal(200)
    })

    it('returns correct response notify', async () => {
        const response = await request(app)
            .get(`/notify/eden/1`)

        expect(response.headers["content-type"]).to.match(/application\/json/)
        expect(response.status).to.equal(200)
    })
})