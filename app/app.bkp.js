import io from 'socket.io-client'
import { getSoundVolume } from './util'
import { mediaDeviceInit, volume, users, threshold as thresholdStore } from './stores'
import { keys } from 'lodash'
import App from './App.svelte'

export default new App({
	target: document.getElementById('root'),
})

const RTC_CONFIG = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
const socket = io({ autoConnect: false })
const peers = {}

const remoteStream = new MediaStream
const remoteAudioElement = document.querySelector('#remoteAudio')
remoteAudioElement.srcObject = remoteStream

let localStream
let threshold

thresholdStore.subscribe(v => threshold = v )

navigator.mediaDevices.getUserMedia({ audio: true })
.then(stream => {
  
  localStream = stream

  // analyse stream to get volume of input sound
  getSoundVolume(localStream.clone(), vol => {

    // set volume
    volume.update(v => vol)
  
    // permit audio transmission when
    // vol is higher then threshold
    localStream.getAudioTracks()[0].enabled = vol > threshold
  })
  
  socket.open()
  mediaDeviceInit.update(v => true)
})
.catch(err => {
  mediaDeviceInit(v => false)
})

socket.on('connect', () => {

  console.log(`i'am socket ${socket.id}`)

  // when a user joins the server
  socket.on('user:join', initRTCPeerConnection)

  // when a user leaves
  socket.on('user:leave', removeRTCPeerConnection)
  
  // when new user sent an answer 
  socket.on('user:rtc:answer', onRTCAnswer)
  
  // when a user gets an offer
  socket.on('user:rtc:offer', onRTCoffer)

  // when a candidate arrives
  socket.on('user:rtc:candidate', onRTCIceCandidate)

})

const onRTCIceCandidate = async ({ id, candidate }) => {

  console.log(`got ice candidate from ${id}`, candidate)

  if (!candidate) return

  const pc = peers[id]

  if (!pc) return

  await pc.addIceCandidate(candidate)

}

const removeRTCPeerConnection = id => {

  const pc = peers[id]

  if (!pc) return

  pc.close()

  delete peers[id]

  users.update(v => keys(peers))

  console.log(`removed rtc peer connection ${id}`)
} 

const initRTCPeerConnection = async id => {

  const pc = new RTCPeerConnection(RTC_CONFIG)

  addLocalStream(pc)
  addRemoteStream(pc)

  pc.onicecandidate = sendIceCandidate(id)

  // add peerconnection to peerlist
  peers[id] = pc

  // update userlist
  users.update(v => keys(peers))

  // create a new offer
  const offer = await pc.createOffer()

  // set offer as local descrioption
  await pc.setLocalDescription(offer)

  // send offer out
  socket.emit('user:rtc:offer', { id, offer })

  // log
  console.log(`init new rtc peer connection for client ${id}`, offer)
}

const onRTCAnswer = async ({ id, answer }) => {

  console.log(`got answer from ${id}`, answer)

  const pc = peers[id]

  if (!pc) return 

  if (!answer) return

  const desc = new RTCSessionDescription(answer)

  await pc.setRemoteDescription(desc)
}

const onRTCoffer = async ({ id, offer }) => {

  console.log(`got offer from ${id}`, offer)

  if (!offer) return

  const pc = new RTCPeerConnection(RTC_CONFIG)

  addLocalStream(pc)
  addRemoteStream(pc)

  pc.onicecandidate = sendIceCandidate(id)

  peers[id] = pc 

  users.update(v => keys(peers))

  const desc = new RTCSessionDescription(offer)

  // TODO: maybe await missing???
  pc.setRemoteDescription(desc)

  const answer = await pc.createAnswer()

  await pc.setLocalDescription(answer)

  socket.emit('user:rtc:answer', { id, answer })
}

const sendIceCandidate = id => ({ candidate }) => {
  if (candidate) {
    socket.emit('user:rtc:candidate', { id, candidate })
  }
}

const addLocalStream = pc => {
  localStream.getTracks().forEach(track => pc.addTrack(track, localStream))
} 

const addRemoteStream = pc => {
  pc.ontrack = async evt => {
    remoteStream.addTrack(evt.track, remoteStream)
  }
}