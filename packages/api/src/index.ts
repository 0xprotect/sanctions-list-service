import { port } from './config'
import express from "express"
import db from './readers/db'
import cloudStorage from './readers/cloudStorage'

const app = express()
app.use(express.json())

app.get("/", async (_req: any, res: any) => {
  res.status(200).json({ "response": "all good" })
})

app.get("/blacklist", async (req: any, res: any) => {
  try {
    const result = await cloudStorage.getBlacklist()
    res.status(200).json(result)
  } catch (error) {
    console.log(JSON.stringify({
      endpoint: "/blacklist",
      error: error instanceof Error ? error.message : error
    }))
    res.status(500).json({ "error": "something went wrong" })
  }
})

app.get("/builder/:builder/:days", async (req: any, res: any) => {
  try {
    let result: any
    if (isNaN(req.params.days)) {
      res.status(400).json({ "error": "days parameter needs to be a number" })
    } else {
      result = await db.getTransactions(req.params.builder, parseInt(req.params.days))
      if (result !== undefined) {
        res.status(200).json(result)
      } else {
        res.status(200).json({ "message": "no ofac txs found" })
      }
    }
  } catch (error) {
    console.log(JSON.stringify({
      endpoint: `/builder/${req.params.builder}/${req.params.days}`,
      error: error instanceof Error ? error.message : error
    }))
    res.status(500).json({ "error": "something went wrong" })
  }
})

app.get("/tx/:txHash/:blockTimestampUnix", async (req: any, res: any) => {
  try {
    const txHashFormat = new RegExp(/0x[a-fA-F0-9]{64}/g)
    const matches = req.params.txHash.match(txHashFormat)
    if (!matches || matches?.length == 0) {
      res.status(400).json({ "error": "invalid tx hash" })
    }
    else if (isNaN(req.params.blockTimestampUnix)) {
      res.status(400).json({ "error": "blockTimestampUnix parameter needs to be a number" })
    }
    else {
      let result: any
      result = await db.getTransaction(req.params.txHash, parseInt(req.params.blockTimestampUnix))
      if (result !== undefined) {
        res.status(200).json(result)
      } else {
        res.status(404).json({ "error": "transaction not found" })
      }
    }
  } catch (error) {
    console.log(JSON.stringify({
      endpoint: `/tx/${req.params.txHash}/${req.params.blockTimestampUnix}`,
      error: error instanceof Error ? error.message : error
    }))
    res.status(500).json({ "error": "something went wrong" })
  }
})

app.listen(port, () => {
  console.log(`app listening on port ${process.env.PORT}`)
})

export { app }