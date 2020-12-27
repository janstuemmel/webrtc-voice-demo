import EventEmitter from 'events'

const RTC_DEFAULT_CONFIG = {
  iceServers: [
    {'urls': 'stun:stun.nextcloud.com:443'},
    {'urls': 'stun:stun.t-online.de:3478'},
  ]
}

class RTCGroupConnection extends EventEmitter {
  
  constructor(config = {}) {
    super()
    this.config = Object.assign({}, RTC_DEFAULT_CONFIG, config)
    this.peers = {}
  }

  _createPeerConnection(remoteId) {

    const pc = new RTCPeerConnection(this.config)

    pc.onicecandidate = ({ candidate }) => {
      if (candidate) this.emit('candidate', { remoteId, candidate })
    }

    this.peers[remoteId] = pc

    this.emit('peer:add', { remoteId, peerConnection: pc })

    return pc
  }

  async initPeerConnection(remoteId) {

    const pc = this._createPeerConnection(remoteId)

    const offer = await pc.createOffer()

    await pc.setLocalDescription(offer)

    this.emit('offer', { remoteId, offer })
  }

  async receiveOffer({ remoteId, offer }) {

    if (!offer) return 

    const pc = this._createPeerConnection(remoteId)

    const desc = new RTCSessionDescription(offer)

    // TODO: await?
    pc.setRemoteDescription(desc)

    const answer = await pc.createAnswer()

    await pc.setLocalDescription(answer)

    this.emit('answer', { remoteId, answer })
  }
  
  async receiveAnswer({ remoteId, answer }) {

    const pc = this.peers[remoteId]

    if (!pc || !answer) return

    const desc = new RTCSessionDescription(answer)

    await pc.setRemoteDescription(desc)
  }
  
  async receiveCandidate({ remoteId, candidate }) {

    const pc = this.peers[remoteId]

    if (!pc || !candidate) return

    await pc.addIceCandidate(candidate)
  }
  
  removePeer(remoteId) {

    const pc = this.peers[remoteId]

    if (!pc) return 

    pc.close()

    delete this.peers[remoteId]
  }

  close() {

    // remove all events from emitter
    this.removeAllListeners()

    // close all rtc peer connections
    for(let pcid in this.peers) {
      
      const pc = this.peers[pcid]
      
      // close connection
      if (pc) pc.close()
    }

    this.peers = {}
  }
}

export default RTCGroupConnection