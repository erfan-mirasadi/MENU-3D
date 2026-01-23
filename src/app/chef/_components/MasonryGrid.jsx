'use client'
import { useEffect, useState } from 'react'

export default function MasonryGrid({ children, className }) {
    const [columns, setColumns] = useState(1)

    useEffect(() => {
        const updateColumns = () => {
            const width = window.innerWidth
            if (width < 768) setColumns(1)      // Mobile
            else if (width < 1024) setColumns(2) // Tablet
            else if (width < 1536) setColumns(3) // Desktop
            else setColumns(4)                   // Large Desktop
        }

        updateColumns()
        window.addEventListener('resize', updateColumns)
        return () => window.removeEventListener('resize', updateColumns)
    }, [])

    // Create array of column arrays
    const columnWrapper = {}
    for (let i = 0; i < columns; i++) {
        columnWrapper[`col${i}`] = []
    }

    // Distribute children into columns
    const childrenArray = Array.isArray(children) ? children : [children]
    childrenArray.forEach((child, i) => {
        const columnIndex = i % columns
        columnWrapper[`col${columnIndex}`].push(
            <div key={child.key || i} className="mb-6">
                {child}
            </div>
        )
    })

    return (
        <div className={`flex gap-6 items-start ${className || ''}`}>
            {Array.from({ length: columns }).map((_, i) => (
                <div key={i} className="flex-1 w-full relative">
                    {columnWrapper[`col${i}`]}
                </div>
            ))}
        </div>
    )
}
