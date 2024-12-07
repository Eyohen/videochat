import React, { useState, useEffect } from 'react'
import { PiChats,PiWarningCircle,PiGearSixLight,PiScreencastLight,PiPhoneSlashLight,PiTimer  } from "react-icons/pi";
import {CiMicrophoneOn } from "react-icons/ci";
import { IoVideocamOffOutline, IoVideocamOff,IoVideocamOutline } from "react-icons/io5";
import FifteenPopup from '../components/FifteenPopup';


const Home = () => {
    const [timeLeft, setTimeLeft] = useState(60 * 30); // 30 minutes in seconds
    const [elapsedTime, setElapsedTime] = useState(0); // Track elapsed time
    const [showPopup, setShowPopup] = useState(false);
  
    useEffect(() => {
      // If time left is 0, stop the countdown
      if (timeLeft <= 0) return;
  
      const intervalId = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
        setElapsedTime(prevElapsed => prevElapsed + 1);
        
        // Show popup after 15 seconds (when elapsedTime reaches 30)
        if (elapsedTime === 899) { // Use 899 because setState is async
          setShowPopup(true);
        }
      }, 1000);
  
      return () => clearInterval(intervalId);
    }, [timeLeft, elapsedTime]);
  
    const formatTime = (seconds) => {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}m:${s.toString().padStart(2, '0')}s`;
    };
  
    const handleEndMeeting = () => {
      setShowPopup(false);
      // Add your end meeting logic here
    };
  
    const handleProceed = () => {
      setShowPopup(false);
      // Meeting continues...
    };

    

    return (
        <div className='min-h-[100vh] p-9'>

            <div className='bg-black h-[85vh] rounded-xl'>

                <div className='flex justify-center items-center h-[100vh]'>

                    <p className='border border-slate-400 rounded-full p-4'>
                    <p className='border border-slate-400 rounded-full p-4'>
                        <div className='border-2 border-[#6B5DD3] bg-slate-200 p-8 rounded-full flex justify-center items-center'>GI</div>
                        </p>
                        </p>
                </div>

            </div>

            <div className='flex pt-4 gap-x-9 items-center'>
                <p className='border-2 px-3 py-2 rounded-md'><PiChats  size={30} color='gray'/></p>
                <p className='border-2 px-3 py-2 rounded-md'><PiWarningCircle size={30} color='gray'/></p>
                <p className='border-2 px-3 py-2 rounded-md'><PiGearSixLight size={30} color='gray'/></p>
                <p className='border-2 px-3 py-2 rounded-md'><PiScreencastLight size={30} color='gray'/></p>
                <p className='border-2 px-3 py-2 rounded-md'><CiMicrophoneOn size={30} color='gray'/></p>
                <p className='border-2 px-3 py-2 rounded-md'><IoVideocamOutline size={30} color='gray'/></p>

                <div><button className='bg-[#FB3640] py-2 px-9 text-white flex gap-x-2 rounded-md'><PiPhoneSlashLight color='white' size={30}/> Leave call</button></div>

                <p className='border-2 rounded-md text-xl px-2 flex gap-x-4 items-center py-2 '><PiTimer/> {formatTime(timeLeft)}</p>
            </div>
            {/* <FifteenPopup 
          onEndMeeting={handleEndMeeting}
          onProceed={handleProceed}
        /> */}
            {showPopup && (
        <FifteenPopup 
          onEndMeeting={handleEndMeeting}
          onProceed={handleProceed}
        />
      )}
        </div>
    )
}

export default Home