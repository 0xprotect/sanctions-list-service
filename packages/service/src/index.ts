import { port } from './config'
import express from "express"
import sync from './handlers/sync'
import notify from './handlers/notify'

const app = express()
app.use(express.json())

app.get("/", async (_req: any, res: any) => {
  res.json({ "response": "all good" })
})

app.post("/sync", async (req: any, res: any) => {
  try {
    const result = await sync.execute()
    if (!result.success) {
      res.status(500).json({ "error": result.error })
    } else {
      res.status(200).json(result.data)
    }
  } catch (error) {
    res.status(500).json({ "error": error instanceof Error ? error.message : error })
  }
})

app.get("/notify/:builder/:days", async (req: any, res: any) => {
  try {
    const result = await notify.checkAndNotify(req.params.builder, req.params.days)
    if (!result.success) {
      res.status(500).json({ "error": result.error })
    } else {
      res.status(200).json(result.data)
    }
  } catch (error) {
    res.status(500).json({ "error": error instanceof Error ? error.message : error })
  }
})

app.listen(port, () => {
  console.log(`app listening on port ${process.env.PORT}`)
})

export { app }