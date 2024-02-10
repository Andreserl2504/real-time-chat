import express from 'express'
import pc from 'picocolors'
import logger from 'morgan'
import dotenv from 'dotenv'
import { createClient } from '@libsql/client'
import { Server } from 'socket.io'
import { createServer } from 'node:http'
import { argv } from 'node:process'

dotenv.config()
const app = express()
const serverHTTP = createServer(app)
const io = new Server(serverHTTP)
const PORT = process.env.PORT ?? '3000'
const db = createClient({
  url: 'libsql://my-db-andreserl2504.turso.io',
  authToken: process.env.DB_TOKEN
})

await db.execute(`
  CREATE TABLE IF NOT EXISTS messages(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT
  )`)

io.on('connection', async (socket) => {
  console.log(pc.green('An user has connected'))
  socket.on('chat message', async (msg) => {
    let result
    try {
      result = await db.execute({
        sql: 'INSERT INTO messages (content) VALUES(:content)',
        args: { content: msg }
      })
    } catch (e) {
      console.error(e)
      return
    }
    io.emit('chat message', msg, result.lastInsertRowid.toString())
  })
  socket.on('disconnect', () => {
    console.log(pc.yellow('An user has disconnected'))
  })

  if (!socket.recovered) {
    try {
      const results = await db.execute({
        sql: 'SELECT id, content FROM messages WHERE id > ?',
        args: [socket.handshake.auth.serverOffset ?? 0]
      })
      results.rows.forEach(row => {
        socket.emit('chat message', row.content, row.id.toString())
      })
    } catch (e) {
      console.error(e)
    }
  }
})
app.use(logger('dev'))
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/client/index.html')
})

serverHTTP.listen(PORT, () => {
  console.log(pc.bgBlue('Server running 😸😸'))
  console.log(pc.blue(`http://localhost:${PORT}`))
})
