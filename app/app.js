import App from './App.svelte'

import io from 'socket.io-client'
import RTCGroupConnection from './RTCGroupConnection'

const socket = io({ autoConnect: false })

const remoteStream = new MediaStream
const remoteAudioElement = document.querySelector('#remoteAudio')
remoteAudioElement.srcObject = remoteStream

window.foo = remoteStream

async function init() {

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

  socket.on('connect', () => {

    const vc = window.bar = new RTCGroupConnection()
    vc.on('offer', obj => socket.emit('user:rtc:offer', obj))
    vc.on('answer', obj => socket.emit('user:rtc:answer', obj))
    vc.on('candidate', obj => socket.emit('user:rtc:candidate', obj))
    vc.on('peer:add', ({ peerConnection: pc }) => {

      // add local audio input
      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream))
    
      // add remote input
      pc.ontrack = ({ track }) => {
      
        remoteStream.addTrack(track, remoteStream)
        
        function onClose() {
          if(pc.iceConnectionState === 'closed') {
            remoteStream.removeTrack(track)
            pc.removeEventListener('iceconnectionstatechange', onClose)
          }
        }
        
        pc.addEventListener('iceconnectionstatechange', onClose)
      }
    
    })

    socket.on('user:join', vc.initPeerConnection.bind(vc))
    socket.on('user:leave', vc.removePeer.bind(vc))
    socket.on('user:rtc:answer', vc.receiveAnswer.bind(vc))
    socket.on('user:rtc:offer', vc.receiveOffer.bind(vc))
    socket.on('user:rtc:candidate', vc.receiveCandidate.bind(vc))

    socket.on('pong', ms => console.log(ms))
  })

  socket.connect()
}

// init()

export default new App({
	target: document.getElementById('root'),
})