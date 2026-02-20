'use client'
import { useState, useEffect } from 'react'
import { FaClock } from 'react-icons/fa';

export default function KitchenTimer({ createdAt }) {
    const [secondsLeft, setSecondsLeft] = useState(1200) // Default 20 mins

    useEffect(() => {
        const interval = setInterval(() => {
            const created = new Date(createdAt).getTime()
            const now = Date.now()
            
            // Calculate elapsed seconds
            const elapsedSeconds = Math.floor((now - created) / 1000)
            
            // Calculate remaining from 20 mins (1200s)
            // If elapsed is 100s, remaining is 1100s.
            const remaining = 1200 - elapsedSeconds
            
            setSecondsLeft(remaining)
        }, 1000)

        return () => clearInterval(interval)
    }, [createdAt])

    // Format Logic
    const isNegative = secondsLeft < 0
    const absSeconds = Math.abs(secondsLeft)
    const minutes = Math.floor(absSeconds / 60)
    const seconds = Math.floor(absSeconds % 60)
    const timeString = `${isNegative ? '-' : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

    // Color Logic (Traffic Light) based on Remaining Time
    // > 10 min (600s): Green
    // 5-10 min (300-600s): Yellow
    // 0-5 min (<300s): Red
    // < 0: Red Blinking
    
    let colorClass = "bg-emerald-100 text-emerald-800 border-emerald-300" // Green
    let iconColor = "text-emerald-600"

    if (secondsLeft < 0) {
         colorClass = "bg-red-100 text-red-800 border-red-300 animate-pulse border-2 shadow-red-500/50 shadow-lg" // Overdue
         iconColor = "text-red-700"
    } else if (secondsLeft < 300) { // Less than 5 mins
         colorClass = "bg-red-50 text-red-600 border-red-300 border-2" // Low Time
         iconColor = "text-red-500"
    } else if (secondsLeft < 600) { // Less than 10 mins
         colorClass = "bg-yellow-100 text-yellow-800 border-yellow-300" // Warning
         iconColor = "text-yellow-600"
    }

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm font-mono font-bold tracking-wider transition-colors duration-500 ${colorClass}`}>
            <FaClock className={iconColor} />
            {timeString}
        </div>
    )
}
