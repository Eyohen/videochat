// import React from 'react'
// import {Route, Routes} from 'react-router-dom'
// import Home from './Pages/Home'


// const App = () => {
//   return (
//     <Routes>
//     <Route exact path="/" element={<Home/>}/>
//     </Routes>
//   )
// }

// export default App



import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer/simplepeer.min.js';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';

const App = () => {
  const [me, setMe] = useState("");
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState(null);
  const [callAccepted, setCallAccepted] = useState(false);
  const [idToCall, setIdToCall] = useState("");
  const [callEnded, setCallEnded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();
  const socket = useRef();

  useEffect(() => {
    socket.current = io("http://localhost:8000");

    socket.current.on("connect", () => {
      socket.current.emit("requestId");
    });

    socket.current.on("idAssigned", (id) => {
      setMe(id);
    });

    navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    }).then((currentStream) => {
      setStream(currentStream);
      if (myVideo.current) {
        myVideo.current.srcObject = currentStream;
      }
      setIsLoading(false);
    }).catch((err) => {
      console.error("Failed to get media stream:", err);
      setError("Failed to access camera and microphone");
      setIsLoading(false);
    });

    socket.current.on("callUser", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    socket.current.on("callEnded", () => {
      leaveCall();
    });

    socket.current.on("userLeft", () => {
      leaveCall();
    });

    socket.current.on("message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (socket.current) {
        socket.current.disconnect();
      }
      if (connectionRef.current) {
        connectionRef.current.destroy();
      }
    };
  }, []);

  const callUser = (id) => {
    try {
      if (!stream) {
        throw new Error("No media stream available");
      }

      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            {
              urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
              ],
            },
          ],
        },
      });

      peer.on("signal", (data) => {
        socket.current.emit("callUser", {
          userToCall: id,
          signalData: data,
          from: me,
        });
      });

      peer.on("stream", (remoteStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
        }
      });

      peer.on("close", () => {
        leaveCall();
      });

      peer.on("error", (err) => {
        console.error("Peer connection error:", err);
        setError("Connection failed");
        leaveCall();
      });

      socket.current.once("callAccepted", (signal) => {
        setCallAccepted(true);
        peer.signal(signal);
      });

      connectionRef.current = peer;
    } catch (err) {
      console.error("Error in callUser:", err);
      setError("Failed to establish connection");
    }
  };

  const answerCall = () => {
    try {
      if (!stream) {
        throw new Error("No media stream available");
      }

      setCallAccepted(true);
      
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream: stream,
        config: {
          iceServers: [
            {
              urls: [
                'stun:stun1.l.google.com:19302',
                'stun:stun2.l.google.com:19302',
              ],
            },
          ],
        },
      });

      peer.on("signal", (data) => {
        socket.current.emit("answerCall", { signal: data, to: caller });
      });

      peer.on("stream", (remoteStream) => {
        if (userVideo.current) {
          userVideo.current.srcObject = remoteStream;
        }
      });

      peer.on("close", () => {
        leaveCall();
      });

      peer.on("error", (err) => {
        console.error("Peer connection error:", err);
        setError("Connection failed");
        leaveCall();
      });

      peer.signal(callerSignal);
      connectionRef.current = peer;

    } catch (err) {
      console.error("Error in answerCall:", err);
      setError("Failed to establish connection");
      setCallAccepted(false);
    }
  };

  const leaveCall = () => {
    try {
      setCallEnded(true);
      setCallAccepted(false);
      setReceivingCall(false);
      setCaller("");
      setCallerSignal(null);

      if (connectionRef.current) {
        connectionRef.current.destroy();
      }

      if (userVideo.current) {
        userVideo.current.srcObject = null;
      }

      socket.current.emit("endCall");
    } catch (err) {
      console.error("Error in leaveCall:", err);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.current.emit("message", {
        text: newMessage,
        sender: me,
        timestamp: new Date().toISOString()
      });
      setNewMessage("");
    }
  };


 // New function to toggle audio
 const toggleAudio = () => {
  if (stream) {
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
    }
  }
};

// New function to toggle video
const toggleVideo = () => {
  if (stream) {
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
    }
  }
};




  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Initializing video chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen p-4 bg-gray-100">
      <div className="flex-1 flex gap-4">
        <div className="flex-1 flex gap-4 bg-white p-4 rounded-lg shadow">
          <div className="">
            <h3 className="text-lg font-semibold mb-2">Your Video</h3>
            <video
              playsInline
              muted
              ref={myVideo}
              autoPlay
              className="w-full rounded-lg bg-black"
            />

<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              <button
                onClick={toggleAudio}
                className={`p-2 rounded-full ${
                  isAudioEnabled ? 'bg-blue-500' : 'bg-red-500'
                } text-white hover:opacity-80`}
              >
                {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button
                onClick={toggleVideo}
                className={`p-2 rounded-full ${
                  isVideoEnabled ? 'bg-blue-500' : 'bg-red-500'
                } text-white hover:opacity-80`}
              >
                {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
            </div>



          </div>
          
          {callAccepted && !callEnded && (
            <div className="">
              <h3 className="text-lg font-semibold mb-2">Remote Video</h3>
              <video
                playsInline
                ref={userVideo}
                autoPlay
                className="w-full rounded-lg bg-black"
              />
            </div>
          )}
        </div>

        <div className="w-80 bg-white p-4 rounded-lg shadow">
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Controls</h3>
            <p className="mb-2">Your ID: {me}</p>
            
            {(!callAccepted && !callEnded) && (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={idToCall}
                  onChange={(e) => setIdToCall(e.target.value)}
                  placeholder="ID to call"
                  className="p-2 border rounded"
                />
                <button
                  onClick={() => callUser(idToCall)}
                  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                  disabled={!idToCall.trim() || !stream}
                >
                  Call
                </button>
              </div>
            )}

            {receivingCall && !callAccepted && (
              <button
                onClick={answerCall}
                className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 mt-2"
                disabled={!stream}
              >
                Answer Call
              </button>
            )}

            {(callAccepted && !callEnded) && (
              <button
                onClick={leaveCall}
                className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 mt-2"
              >
                End Call
              </button>
            )}
          </div>

          <div className="h-px bg-gray-200 my-4" />

          <div className="flex flex-col h-64">
            <h3 className="text-lg font-semibold mb-2">Chat</h3>
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-2 rounded ${
                    msg.sender === me
                      ? "bg-blue-100 ml-auto"
                      : "bg-gray-100"
                  } max-w-[80%]`}
                >
                  <p className="text-sm">{msg.text}</p>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 border rounded"
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={!newMessage.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

