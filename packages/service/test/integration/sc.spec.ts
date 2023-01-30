import dotenv from "dotenv"
dotenv.config()

import { expect } from 'chai'
import smartContract from '../../src/writers/smartContract'

const blacklist = [
    "0x098b716b8aaf21512996dc57eb0615e2383e2f96",
    "0xa0e1c89ef1a489c9c7de96311ed5ce5d32c20e4b",
    "0x3cffd56b47b7b41c56258d9c7731abadc360e073",
    "0x53b6936513e738f44fb50d2b9476730c0ab3bfc1"
]

describe('empty smart contract', async function () {
    it.skip('do it', async function () {
        const result = await smartContract.update([])
    })
})

describe('integration: smart contract', async function () {
    before('reset contract to initial state', async function () {
        const smartContractBlacklist = await smartContract.getBlacklist()
        if (smartContractBlacklist.length > 0) {
            await smartContract.update([])
        }
        await smartContract.update(blacklist)
    })

    it('add two new addresses', async function () {
        const newAddresses = [
            "0xc2a3829f459b3edd87791c74cd45402ba0a20be3",
            "0x3ad9db589d201a710ed237c829c7860ba86510fc"
        ]
        const newBlacklist = blacklist.concat(newAddresses)
        const result = await smartContract.update(newBlacklist)
        expect(result.updated).to.equal(true)
        expect(result.actions.add.length).to.equal(2)
        expect(result.actions.add[0]).to.equal(newAddresses[0])
        expect(result.actions.add[1]).to.equal(newAddresses[1])
        expect(result.actions.delete.length).to.equal(0)

        const contractBlacklist = await smartContract.getBlacklist()
        expect(contractBlacklist.length).to.equal(newBlacklist.length)
        for (const entry of newBlacklist) {
            const found = contractBlacklist.find(row => row === entry)
            expect(found).to.not.be.undefined
        }
    })

    it('remove two addresses', async function () {
        const deletedAddresses = [
            "0xa0e1c89ef1a489c9c7de96311ed5ce5d32c20e4b",
            "0x3cffd56b47b7b41c56258d9c7731abadc360e073"
        ].sort()
        const contractBlacklistBefore = await smartContract.getBlacklist()
        const newBlacklist = contractBlacklistBefore.filter(entry => !deletedAddresses.includes(entry))
        const result = await smartContract.update(newBlacklist)
        expect(result.updated).to.equal(true)
        expect(result.actions.add.length).to.equal(0)
        expect(result.actions.delete.length).to.equal(2)
        expect(result.actions.delete[0]).to.equal(deletedAddresses[0])
        expect(result.actions.delete[1]).to.equal(deletedAddresses[1])

        const contractBlacklistAfter = await smartContract.getBlacklist()
        expect(contractBlacklistAfter.length).to.equal(newBlacklist.length)
        for (const entry of newBlacklist) {
            const found = contractBlacklistAfter.find(row => row === entry)
            expect(found).to.not.be.undefined
        }
    })

    it('add and remove addresses', async function () {
        const addAddress = "0x3ad9db589d201a710ed237c829c7860ba86510fc"
        const deleteAddress = "0xa0e1c89ef1a489c9c7de96311ed5ce5d32c20e4b"
        const contractBlacklistBefore = await smartContract.getBlacklist()
        const newBlacklist = contractBlacklistBefore.filter(entry => entry !== deleteAddress)
        newBlacklist.push(addAddress)
        const result = await smartContract.update(newBlacklist)
        expect(result.updated).to.equal(true)
        expect(result.actions.add.length).to.equal(1)
        expect(result.actions.add[0]).to.equal(addAddress)
        expect(result.actions.delete.length).to.equal(1)
        expect(result.actions.delete[0]).to.equal(deleteAddress)

        const updatedBlacklist = await smartContract.getBlacklist()
        expect(updatedBlacklist.length).to.equal(newBlacklist.length)
        for (const entry of newBlacklist) {
            const found = updatedBlacklist.find(row => row === entry)
            expect(found).to.not.be.undefined
        }
    })

    it('no changes', async function () {
        const contractBlacklistBefore = await smartContract.getBlacklist()
        const result = await smartContract.update(contractBlacklistBefore)
        expect(result.updated).to.equal(false)
        expect(result.actions.add.length).to.equal(0)
        expect(result.actions.delete.length).to.equal(0)

        const contractBlacklistAfter = await smartContract.getBlacklist()
        expect(contractBlacklistAfter.length).to.equal(blacklist.length)
        for (const entry of blacklist) {
            const found = contractBlacklistAfter.find(row => row === entry)
            expect(found).to.not.be.undefined
        }
    })
})