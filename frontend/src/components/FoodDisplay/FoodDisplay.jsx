import React, { useContext, useMemo } from 'react'
import "./FoodDisplay.css"
import { useTranslation } from 'react-i18next'
import { StoreContext } from '../../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'

const FoodDisplay = ({ category }) => {
    const { food_list, loading, searchTerm } = useContext(StoreContext)
    const { t } = useTranslation()

    const filteredFood = useMemo(() => {
        const q = (searchTerm || "").trim().toLowerCase()

        return food_list.filter((item) => {
            const matchesCategory = category === "All" || category === item.category
            if (!q) return matchesCategory

            const matchesSearch =
                (item.name || "").toLowerCase().includes(q) ||
                (item.description || "").toLowerCase().includes(q)

            return matchesCategory && matchesSearch
        })
    }, [food_list, category, searchTerm])

    if (loading) {
        return (
            <div className="food-display">
                <div className="food-display-header">
                    <h2>{t('foodDisplay.heading')}</h2>
                </div>
                <div className="food-display-list loading-skeleton">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="food-item-wrapper skeleton">
                            <div className="skeleton-image"></div>
                            <div className="skeleton-content"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (filteredFood.length === 0) {
        const msg = searchTerm
            ? `No dishes match "${searchTerm}"`
            : t('foodDisplay.noItemsInCategory', { category })

        return (
            <div className="food-display">
                <div className="food-display-header">
                    <h2>{t('foodDisplay.heading')}</h2>
                    <p>{t('foodDisplay.subheading')}</p>
                </div>
                <div className="no-items-found">
                    <p>{msg}</p>
                    <p className="suggestion">{t('foodDisplay.tryOtherCategories')}</p>
                </div>
            </div>
        )
    }

    return (
        <div className='food-display' id='food-display'>
            <div className="food-display-header">
                <h2>{t('foodDisplay.heading')}</h2>
                <p>{t('foodDisplay.subheading')}</p>
            </div>
            <div className="food-display-list">
                {filteredFood.map((item, index) => (
                    <div
                        key={item._id}
                        className="food-item-wrapper"
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <FoodItem
                            _id={item._id}
                            name={item.name}
                            description={item.description}
                            price={item.price}
                            image={item.image}
                            rating={item.rating}
                            isPopular={item.isPopular}
                            stock={item.stock}
                            isAvailable={item.isAvailable}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default React.memo(FoodDisplay)