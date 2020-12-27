import EventEmitter from 'events'
import io from 'socket.io-client'

import RTCGroupConnection from './RTCGroupConnection'

export default class extends EventEmitter{

  constructor(remoteStream) {
    super()

    this.socket = io({ autoConnect: false })
    this.rtc = new RTCGroupConnection()
    
    this.remoteStream = remoteStream

    // remote tracks
    this.tracks = {}
  }

  _addStreamsToPeer(stream) {
    return ({ peerConnection: pc }) => {

      // add local audio input
      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream))
    
      // add remote input
      pc.ontrack = ({ track }) => {
        
        // add remote track to stream
        this.remoteStream.addTrack(track, this.remoteStream)
        
        // trigger when remote connection closes
        const onClose = () => {

          if (pc.iceConnectionState === 'closed') {

            // remove track from remote stream
            this.remoteStream.removeTrack(track)

            // remove this function 
            pc.removeEventListener('iceconnectionstatechange', onClose)
          }
        }

        // add onClose
        pc.addEventListener('iceconnectionstatechange', onClose)
      }
    }
  }

  setInputEnabled(enabled) {
    if (this.stream) {
      this.stream.getAudioTracks()[0].enabled = enabled
    }
  }

  async getAudio() {
    // TODO: error handling
    return await navigator.mediaDevices.getUserMedia({ audio: true })
  }

  async connect() {

    const stream = this.stream = await this.getAudio()

    getSoundVolume(stream, volume => {
      this.emit('input:volume', volume)
    })

    this.rtc.on('offer', obj => this.socket.emit('user:rtc:offer', obj))
    this.rtc.on('answer', obj => this.socket.emit('user:rtc:answer', obj))
    this.rtc.on('candidate', obj => this.socket.emit('user:rtc:candidate', obj))
    
    this.rtc.on('peer:add', this._addStreamsToPeer(stream).bind(this))

    this.socket.on('user:join', this.rtc.initPeerConnection.bind(this.rtc))
    this.socket.on('user:leave', this.rtc.removePeer.bind(this.rtc))
    this.socket.on('user:rtc:answer', this.rtc.receiveAnswer.bind(this.rtc))
    this.socket.on('user:rtc:offer', this.rtc.receiveOffer.bind(this.rtc))
    this.socket.on('user:rtc:candidate', this.rtc.receiveCandidate.bind(this.rtc))

    this.socket.connect()
  }

  close() {
    this.rtc.close()
    this.socket.close()
  }
}

// helper

const getSoundVolume = (stream, callback) => {

  const audioCtx = new AudioContext
  const analyser = audioCtx.createAnalyser()
  const mic = audioCtx.createMediaStreamSource(stream)
  const node = audioCtx.createScriptProcessor(2048, 1, 1)

  // analyser args
  analyser.smoothingTimeConstant = 0.8
  analyser.fftSize = 1024

  mic.connect(analyser)
  analyser.connect(node)
  node.connect(audioCtx.destination)

  node.onaudioprocess = () => {

    let array = new Uint8Array(analyser.frequencyBinCount)
    analyser.getByteFrequencyData(array)

    let values = 0

    for (let i=0; i<array.length; i++) {
      values += array[i]
    }

    const avg = values / array.length

    callback(avg)
  }
} 
