import React, { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StoreContext } from '../../context/StoreContext'
import './FoodItem.css'
import { assets } from '../../assets/assets'

const FoodItem = (props) => {
    // Support two call styles:
    //   <FoodItem _id="..." name="..." ... />   (existing usages)
    //   <FoodItem item={ {...} } />             (from Favorites page)
    const item = props.item || props
    const {
        _id,
        name,
        price,
        description,
        image,
        isAvailable = true,
        stock = 1,
    } = item

    const {
        cartItems,
        addToCart,
        removeFromCart,
        url,
        isFavorite,
        toggleFavorite,
    } = useContext(StoreContext)

    const { t } = useTranslation()
    const [imageLoaded, setImageLoaded] = useState(false)
    const [isHovered, setIsHovered] = useState(false)
    const [imgError, setImgError] = useState(false)

    const handleImageError = () => {
        setImgError(true)
        setImageLoaded(true)
    }

    const stockCount = typeof stock === 'number' ? stock : 1
    const isOutOfStock = stockCount <= 0
    const canAddPurchasable = isAvailable && !isOutOfStock
    const inCartCount = cartItems[_id] || 0
    const canAddMore = inCartCount < stockCount
    const showLowStock = canAddPurchasable && stockCount <= 5

    const fav = isFavorite ? isFavorite(_id) : false

    const handleAddMore = () => {
        if (!canAddMore) return
        addToCart(_id)
    }

    const handleHeartClick = (e) => {
        e.stopPropagation()
        e.preventDefault()
        if (toggleFavorite) toggleFavorite(_id)
    }

    return (
        <div
            className={`food-item ${isHovered ? 'hovered' : ''} ${!canAddPurchasable ? 'unavailable' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="food-item-img-container">
                {!imageLoaded && <div className="image-skeleton"></div>}
                <img
                    className={`food-item-image ${imageLoaded ? 'loaded' : ''}`}
                    src={imgError ? 'https://via.placeholder.com/300x300?text=Food+Image' : `${url}/images/${image}`}
                    alt={name}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setImageLoaded(true)}
                    onError={handleImageError}
                />

                {/* ✅ FAVORITE HEART (outline → filled on click) */}
                <button
                    type="button"
                    className={`heart-btn ${fav ? 'active' : ''}`}
                    onClick={handleHeartClick}
                    aria-label={fav ? 'Remove from favorites' : 'Add to favorites'}
                    title={fav ? 'Remove from favorites' : 'Add to favorites'}
                >
                    {fav ? '♥' : '♡'}
                </button>

                {!canAddPurchasable && (
                    <div className="unavailable-overlay">
                        <span>{!isAvailable ? t('foodItem.currentlyUnavailable') : t('foodItem.outOfStock')}</span>
                    </div>
                )}

                {canAddPurchasable && (
                    !cartItems[_id] ? (
                        <div className="add-to-cart-btn" onClick={() => addToCart(_id)}>
                            <img src={assets.add_icon_white} alt='add' />
                            <span>{t('foodItem.addToCart')}</span>
                        </div>
                    ) : (
                        <div className="food-item-counter">
                            <img onClick={() => removeFromCart(_id)} src={assets.remove_icon_red} alt="remove" />
                            <p>{cartItems[_id]}</p>
                            <img
                                onClick={handleAddMore}
                                src={assets.add_icon_green}
                                alt="add more"
                                className={!canAddMore ? 'counter-disabled' : ''}
                            />
                        </div>
                    )
                )}
            </div>

            <div className="food-item-info">
                <div className="food-item-name-rating">
                    <p>{name}</p>
                    <div className="rating">
                        <img src={assets.rating_starts} alt="rating" />
                        <span>4.5</span>
                    </div>
                </div>
                <p className="food-item-description">{description?.substring(0, 80)}...</p>
                <div className="food-item-price-section">
                    <p className="food-item-price">{price} {t('common.etb')}</p>
                    {!isAvailable ? (
                        <div className="price-badge sold-out">{t('foodItem.soldOut')}</div>
                    ) : isOutOfStock ? (
                        <div className="price-badge sold-out">{t('foodItem.outOfStock')}</div>
                    ) : (
                        <div className={`price-badge ${showLowStock ? 'low-stock' : ''}`}>
                            {t('foodItem.left', { count: stockCount })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default React.memo(FoodItem)