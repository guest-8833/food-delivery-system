import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import FoodItem from '../../components/FoodItem/FoodItem';
import './Favorites.css';

const Favorites = () => {
  const { food_list, favorites, loading } = useContext(StoreContext);
  const favs = (food_list || []).filter((f) => favorites?.[f._id]);

  return (
    <div className="favorites">
      <div className="favorites-header">
        <h2>Favorites</h2>
        {favs.length > 0 && (
          <p className="favorites-sub">
            {favs.length} {favs.length === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>

      {loading && favs.length === 0 ? (
        <div className="favorites-loading">
          <div className="spinner" />
          <p>Loading…</p>
        </div>
      ) : favs.length === 0 ? (
        <div className="favorites-empty">
          <div className="favorites-empty-icon">🤍</div>
          <h3>No favorites yet</h3>
          <p>Tap the heart on any dish to save it here for later.</p>
          <Link to="/" className="favorites-browse-btn">
            Browse menu
          </Link>
        </div>
      ) : (
        <div className="favorites-grid">
          {favs.map((item) => (
            <FoodItem key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;