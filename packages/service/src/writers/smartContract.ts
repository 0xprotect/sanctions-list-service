import { IUpdateResult } from "../interfaces"
import { ethers } from 'ethers'
import { providerUrl, blacklistSmartContractAddress, chainId } from '../config'

export const provider = new ethers.providers.JsonRpcProvider(
    providerUrl,
    chainId
)

export const updater = new ethers.Wallet(
    process.env["UPDATER_PK"] as string,
    provider
)

export const blacklistContract = new ethers.Contract(
    blacklistSmartContractAddress,
    require('../../src/abis/blacklist.json'),
    updater
)


async function update(blacklist: string[]): Promise<IUpdateResult> {
    const scBlacklist = await getBlacklist()
    const loweredScBlacklist = scBlacklist.map((entry) => entry.toLowerCase())
    const loweredBlacklist = blacklist.map((entry) => entry.toLowerCase())
    const newAddresses = loweredBlacklist.filter((elem: string) => !loweredScBlacklist.includes(elem))
    const deletedAddresses = loweredScBlacklist.filter((elem: string) => !loweredBlacklist.includes(elem))
    const updated = newAddresses.length > 0 || deletedAddresses.length > 0

    if (deletedAddresses.length > 0 && newAddresses.length > 0) {
        await updateBlacklist(newAddresses, deletedAddresses)
    } else if (deletedAddresses.length > 0) {
        await removeFromBlacklist(deletedAddresses)
    } else if (newAddresses.length > 0) {
        await addToBlacklist(newAddresses)
    } else {
        console.log(JSON.stringify({
            class: "smartContract",
            method: "update",
            note: "blacklist unchanged"
        }))
    }
    return {
        updated: updated,
        actions: {
            add: newAddresses,
            delete: deletedAddresses
        }
    }
}

async function updateBlacklist(newAddresses: string[], deletedAddresses: string[]): Promise<void> {
    const feeData = await provider.getFeeData()
    const nonce = await updater.getTransactionCount()
    const estGasLimit = await blacklistContract.estimateGas.updateBlacklist(newAddresses, deletedAddresses, { maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas, nonce: nonce })
    const gasLimit = estGasLimit.add(estGasLimit.div(10))
    const tx = await blacklistContract.populateTransaction.updateBlacklist(newAddresses, deletedAddresses, {
        type: 2,
        nonce: nonce,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        maxFeePerGas: feeData.maxFeePerGas,
        gasLimit: gasLimit
    })
    const sentTx = await updater.sendTransaction(tx)
    const receipt = await sentTx.wait()
    console.log(JSON.stringify({
        class: "smartContract",
        method: "updateBlacklist",
        newAddresses: newAddresses,
        blockHash: receipt.blockHash,
        transactionHash: receipt.transactionHash
    }))
}

async function addToBlacklist(newAddresses: string[]): Promise<void> {
    const feeData = await provider.getFeeData()
    const nonce = await updater.getTransactionCount()
    const estGasLimit = await blacklistContract.estimateGas.addToBlacklist(newAddresses, { maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas, nonce: nonce })
    const gasLimit = estGasLimit.add(estGasLimit.div(10))
    const tx = await blacklistContract.populateTransaction.addToBlacklist(newAddresses, {
        type: 2,
        nonce: nonce,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        maxFeePerGas: feeData.maxFeePerGas,
        gasLimit: gasLimit
    })
    const sentTx = await updater.sendTransaction(tx)
    const receipt = await sentTx.wait()
    console.log(JSON.stringify({
        class: "smartContract",
        method: "addToBlacklist",
        newAddresses: newAddresses,
        blockHash: receipt.blockHash,
        transactionHash: receipt.transactionHash
    }))
}

async function removeFromBlacklist(deletedAddresses: string[]): Promise<void> {
    const feeData = await provider.getFeeData()
    const nonce = await updater.getTransactionCount()
    const estGasLimit = await blacklistContract.estimateGas.removeFromBlacklist(deletedAddresses, { maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas, nonce: nonce })
    const gasLimit = estGasLimit.add(estGasLimit.div(10))
    const tx = await blacklistContract.populateTransaction.removeFromBlacklist(deletedAddresses, {
        type: 2,
        nonce: nonce,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        maxFeePerGas: feeData.maxFeePerGas,
        gasLimit: gasLimit
    })
    const sentTx = await updater.sendTransaction(tx)
    const receipt = await sentTx.wait()
    console.log(JSON.stringify({
        class: "smartContract",
        method: "removeFromBlacklist",
        deletedAddresses: deletedAddresses,
        blockHash: receipt.blockHash,
        transactionHash: receipt.transactionHash
    }))
}

async function getBlacklist(): Promise<string[]> {
    const _blacklist: string[] = await blacklistContract.blacklist()
    const blacklist = _blacklist.map((entry) => entry.toLowerCase())
    return [...blacklist].sort()
}

export default { update, getBlacklist }