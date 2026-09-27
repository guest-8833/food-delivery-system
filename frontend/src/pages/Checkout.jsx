// frontend/src/pages/Checkout.jsx
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';

const Checkout = () => {
  const { user } = useAuth();
  const { cartItems, totalAmount, clearCart } = useCart();
  const [address, setAddress] = useState({});

  const handleChapaPayment = async () => {
    try {
      const orderData = {
        userId: user._id,
        items: cartItems,
        amount: totalAmount,  // this should be in ETB already
        address: address,
        paymentMethod: "chapa"
      };
      const { data } = await axios.post('/api/order/place', orderData, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (data.success) {
        // Redirect to Chapa payment page
        window.location.href = data.checkout_url;
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Payment initialization failed");
    }
  };

  return (
    <div>
      {/* address form ... */}
      <button onClick={handleChapaPayment}>Pay with Chapa</button>
    </div>
  );
};