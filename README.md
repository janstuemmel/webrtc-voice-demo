# WebRTC voice chat demo

WebRTC voice chat implementation with svelte. Like Teamspeak you can chat with all peers connected and define a threshold for voice transmission.
## Usage

```sh
# install deps
npm i

# builds the frontend and 
# starts the signaling server
npm start
```

Point your browser to [localhost:1337](http://localhost:1337). If a second tab get's opened, the two peers will get connected automatically and you can start chatting.

If you want to test the implementation with a different computer you will have to use a secure connection. WebRTC will not work on insecure connections. Try one of the following: 

Open Chromium with following args. This will enable WebRTC on insecure connections.

```sh
chromium-browser --unsafely-treat-insecure-origin-as-secure="http://<hostname.or.ip>:1337"
```

If you wnat to connect with someone outside your network, try using `ngrok`:

```sh
ngrok http 1337
```

Select the `https//...` url and open it on the remote machine.


## Resources

* [WebRTC.org Tutorial](https://webrtc.org/getting-started/overview)
* [Discord Blogpost about custom WebRTC implementation](https://blog.discordapp.com/how-discord-handles-two-and-half-million-concurrent-voice-users-using-webrtc-ce01c3187429)

