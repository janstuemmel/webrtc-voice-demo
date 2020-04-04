const http = require('http')
const Koa = require('koa')
const serve = require('koa-static')
const koaBody = require('koa-body')
const socketio = require('socket.io')

const app = new Koa()
const server = http.Server(app.callback())
const io = socketio(server)

app.use(koaBody())
app.use(serve('./dist'))


// rtc signaling server
io.on('connect', socket => {

  socket.broadcast.emit('user:join', socket.id)

  socket.on('user:rtc:offer', ({ id, offer }) => {
    io.to(id).emit('user:rtc:offer', { id: socket.id, offer })
  })

  socket.on('user:rtc:answer', ({ id, answer }) => {
    io.to(id).emit('user:rtc:answer', { id: socket.id, answer })
  })

  socket.on('user:rtc:candidate', ({ id, candidate }) => {
    io.to(id).emit('user:rtc:candidate', { id: socket.id, candidate })
  })

  socket.on('disconnect', () => {
    socket.broadcast.emit('user:leave', socket.id)
  })
})

server.listen(1337)