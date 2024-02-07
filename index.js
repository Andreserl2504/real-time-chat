import express from 'express'
import pc from 'picocolors'
import logger from 'morgan'

const app = express()
const PORT = process.env.PORT ?? '3000'

app.use(logger('dev'))
app.get('/', (req, res) => {
  res.send('<h1>real time chat</h1>')
})

app.listen(PORT, () => {
  console.log(pc.bgBlue('Server running 😸😸'))
  console.log(pc.blue(`http://localhost:${PORT}`))
})
