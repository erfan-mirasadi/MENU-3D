'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { getKitchenOrders, updateOrderItemStatus } from '@/services/orderService'
import { useRestaurantData } from '@/app/hooks/useRestaurantData'
import KitchenTicket from '../_components/KitchenTicket'
import KitchenSummaryBar from '../_components/KitchenSummaryBar'
import MasonryGrid from '../_components/MasonryGrid'
import Loader from '@/components/ui/Loader'
import { useRestaurantFeatures } from '@/app/hooks/useRestaurantFeatures';
import toast from 'react-hot-toast'

export default function ChefDashboard() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const { restaurantId } = useRestaurantData()

    // 1. Initial Fetch
    useEffect(() => {
        if (!restaurantId) return

        const fetchOrders = async () => {
            try {
                const data = await getKitchenOrders(restaurantId)
                setOrders(data)
            } catch (err) {
                console.error("Failed to load orders", err)
                toast.error("Failed to load orders")
            } finally {
                setLoading(false)
            }
        }

        fetchOrders()
    }, [restaurantId])

    // 2. Realtime Subscription
    useEffect(() => {
        if (!restaurantId) return

        const channel = supabase
            .channel('chef-kitchen-updates')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'order_items'
                },
                (payload) => {
                     // Robust re-fetch on any change for now
                     // Adding delay to ensure DB replication is caught up
                     setTimeout(() => {
                         getKitchenOrders(restaurantId).then(data => {
                             setOrders(data)
                         })
                     }, 1000)
                }
            )
            .subscribe()

        return () => {
             supabase.removeChannel(channel)
        }
    }, [restaurantId])


    // 3. Actions
    // Updates status of a single item
    const handleUpdateStatus = async (itemId, newStatus) => {
        // Optimistic Update
        setOrders(prev => prev.map(o => 
            o.id === itemId ? { ...o, status: newStatus } : o
        ))

        try {
            await updateOrderItemStatus(itemId, newStatus)
            
            if (newStatus === 'served') {
                 // Do not remove immediately. Let it persist for context until the whole ticket is cleared.
                 // setOrders(prev => prev.filter(o => o.id !== itemId))
            }

            const icon = newStatus === 'preparing' ? '👨‍🍳' : '✅'
            toast.success(`Order ${newStatus}`, { icon })
        } catch (err) {
           toast.error("Action failed")
           // Revert on error
           getKitchenOrders(restaurantId).then(setOrders)
        }
    }

    // 4. Grouping Logic
    const groupedTickets = useMemo(() => {
        const groups = {}
        
        orders.forEach(order => {
            const sessionId = order.session_id || order.session?.id
            if (!groups[sessionId]) {
                groups[sessionId] = {
                    session: order.session, // Contains table info
                    orders: []
                }
            }
            groups[sessionId].orders.push(order)
        })

        // Sort groups by oldest pending order time?
        // Or essentially any active order.
        // Sort by FIFO
        const sortedGroups = Object.values(groups).sort((a,b) => {
             const timeA = Math.min(...a.orders.map(o => new Date(o.created_at).getTime()))
             const timeB = Math.min(...b.orders.map(o => new Date(o.created_at).getTime()))
             return timeA - timeB
        })

        // Filter out tickets that are completely 'served' (no active items)
        return sortedGroups.filter(group => {
            const hasActive = group.orders.some(o => o.status !== 'served' && o.status !== 'cancelled')
            return hasActive
        })
    }, [orders])

    // Bulk Serve Action
    const handleServeAll = async (ordersToServe) => {
        // Optimistic Update
        const ids = ordersToServe.map(o => o.id)
        setOrders(prev => prev.map(o => 
            ids.includes(o.id) ? { ...o, status: 'served' } : o
        ))

        try {
            // Update all in parallel
            await Promise.all(ids.map(id => updateOrderItemStatus(id, 'served')))
            toast.success("Ticket Served!")
        } catch (err) {
            toast.error("Bulk action failed")
            getKitchenOrders(restaurantId).then(setOrders)
        }
    }

    const { isEnabled } = useRestaurantFeatures();

    // 5. Render
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-900">
                <Loader />
            </div>
        )
    }

    if (!isEnabled("kitchen")) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#1f1d2b] text-white">
                <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-gray-500">Kitchen Display Disabled</h1>
                <p className="text-gray-400">This module is currently turned off in settings.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark-900 flex overflow-hidden">
            {/* Left Sidebar: Summary */}
            <KitchenSummaryBar orders={orders} />

            {/* Main Content */}
            <main className="flex-1 p-6 overflow-y-auto h-screen">
                <header className="flex justify-between items-center mb-8">
                    <div>
                    <h1 className="text-4xl font-black text-text-light tracking-tight">KITCHEN DISPLAY</h1>
                    <p className="text-text-dim mt-2 font-medium">
                        {groupedTickets.length} Active Tickets • {orders.length} Items
                    </p>
                    </div>
                    
                    {/* Connection Status Indicator */}
                    <div className="flex items-center gap-2 bg-dark-800 px-4 py-2 rounded-full shadow-lg border border-dark-700">
                        <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-400 text-sm font-bold">LIVE</span>
                    </div>
                </header>

                {groupedTickets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-text-dim">
                        <p className="text-2xl font-bold text-text-light">All clear, Chef!</p>
                        <p>No active orders pending or preparing.</p>
                    </div>
                ) : (
                    <MasonryGrid className="pb-10">
                        {groupedTickets.map(ticket => (
                            <KitchenTicket 
                                key={ticket.session.id} 
                                session={ticket.session}
                                orders={ticket.orders}
                                onUpdateStatus={handleUpdateStatus}
                                onServeAll={handleServeAll}
                            />
                        ))}
                    </MasonryGrid>
                )}
            </main>
        </div>
    )
}
