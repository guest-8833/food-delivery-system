import React, { useState, useContext, useEffect, useCallback } from 'react'
import Header from '../../components/Header/Header'
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay'
import AppDownload from '../../components/AppDownload/AppDownload'
import { StoreContext } from '../../context/StoreContext'

const Home = () => {
    const [category, setCategory] = useState("All")
    const [showScrollTop, setShowScrollTop] = useState(false)
    const { loading, food_list } = useContext(StoreContext)

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 500)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    return (
        <div className="home-page">
            <Header />

            {loading ? (
                <div className="home-loading">
                    <div className="loading-wave">
                        <div className="wave"></div>
                        <div className="wave"></div>
                        <div className="wave"></div>
                    </div>
                    <p>Loading delicious food...</p>
                </div>
            ) : (
                <>
                    {food_list && food_list.length > 0 ? (
                        <FoodDisplay category={category} />
                    ) : (
                        <div className="no-items-message">
                            <p>No food items available at the moment.</p>
                            <button onClick={() => window.location.reload()}>
                                Refresh
                            </button>
                        </div>
                    )}
                </>
            )}

            <AppDownload />

            {showScrollTop && (
                <button
                    className="scroll-top-btn"
                    onClick={scrollToTop}
                    aria-label="Scroll to top"
                >
                    ↑
                </button>
            )}
        </div>
    )
}

export default Home