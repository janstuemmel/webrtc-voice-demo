const http = require('http')
const Koa = require('koa')
const serve = require('koa-static')
const koaBody = require('koa-body')
const socketio = require('socket.io')

const app = new Koa()
const server = http.Server(app.callback())
const io = socketio(server, { pingInterval: 5000 })

app.use(koaBody())
app.use(serve('./dist'))


// rtc signaling server
io.on('connect', socket => {

  socket.broadcast.emit('user:join', socket.id)

  socket.on('user:rtc:offer', ({ remoteId, offer }) => {
    io.to(remoteId).emit('user:rtc:offer', { remoteId: socket.id, offer })
  })

  socket.on('user:rtc:answer', ({ remoteId, answer }) => {
    io.to(remoteId).emit('user:rtc:answer', { remoteId: socket.id, answer })
  })

  socket.on('user:rtc:candidate', ({ remoteId, candidate }) => {
    io.to(remoteId).emit('user:rtc:candidate', { remoteId: socket.id, candidate })
  })

  socket.on('disconnect', () => {
    socket.broadcast.emit('user:leave', socket.id)
  })
})

server.listen(1337)