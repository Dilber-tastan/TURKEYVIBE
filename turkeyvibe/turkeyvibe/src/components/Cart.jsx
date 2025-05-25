import React, { useState, useEffect } from 'react';// usestate verileri (örneğin, sepet, öneriler) saklamak ve güncellemek için kullanılır
//useeffect Bileşen yüklendiğinde veri çekmek ve sepeti güncellemek için kullanılır
import { useNavigate, useLocation } from 'react-router-dom';
import './Cart.css';

const Cart = () => {
  const navigate = useNavigate();//kullanıcıyı yönlendirmede örn anasayfaya dönme kısmında kullanılacak
  const location = useLocation();// geçerli sayfanın konumunu ve state verisini verir örn homeden gelen etkinlik verileri vs.
  const [cart, setCart] = useState([]);//Sepetteki etkinliklerin listesini tutar
  const [recommendedEvents, setRecommendedEvents] = useState([]);//Kullanıcıya özel önerilen etkinlikleri tutar
  const [paymentMethod, setPaymentMethod] = useState('');//Seçilen ödeme yöntemini tutar
  const userInterests = JSON.parse(localStorage.getItem('userInterests')) || ['Konser', 'Tiyatro'];
//Kullanıcının ilgi alanlarını localStorage’dan alır yoksa varsayılan olarak Konser Tiyatro

//Sayfa yüklendiğinde sepeti yükler Homedan gelen etkinlikleri ekler ve önerileri çeker
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');//localStoragedan sepet verisini alır ve setCart ile günceller
    if (storedCart) {
      setCart(JSON.parse(storedCart));
    }

    // Home.jsxten gelen etkinliği sepete ekle
    const eventToAdd = location.state?.event;
    if (eventToAdd) {
      addToCart(eventToAdd);
      navigate('/cart', { replace: true, state: {} }); // Statei temizle
    }

    const fetchRecommendations = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/events');//Etkinlikleri çeker
        if (!response.ok) {
          throw new Error('API isteği başarısız oldu');
        }
        const data = await response.json();
        const sortedEvents = data.events.sort((a, b) => new Date(a.date) - new Date(b.date));//Etkinlikleri tarihe göre sıralar
        const filteredEvents = await Promise.all(sortedEvents.map(async (event) => {//Her etkinlik için hava durumu kontrolü yapar ve verileri birleştirir
          const weatherResponse = await fetch(`http://localhost:5000/api/custom-weather?location=${event.location}&date=${event.date}`);
          if (!weatherResponse.ok) {
            throw new Error('Hava durumu isteği başarısız');
          }
          const weatherData = await weatherResponse.json();
          return { ...event, isPlannable: weatherData.isPlannable, weather: weatherData.weather, temperature: weatherData.temperature };
        }));
        const recommended = filteredEvents//İlgi alanlarına ve planlanabilirliğe göre 3 öneri seçer, yoksa ilk 3 etkinliği alır
          .filter(event => userInterests.includes(event.type) && event.isPlannable)
          .slice(0, 3);
        setRecommendedEvents(recommended.length > 0 ? recommended : filteredEvents.slice(0, 3));//Önerileri günceller
      } catch (error) {
        console.error('Öneriler çekilirken hata:', error);
      }
    };
    fetchRecommendations();
  }, [location.state]);

  const removeFromCart = (eventId) => {//Belirtilen etkinliği sepetten kaldırır
    //evenıd kaldırılacak etkinliğin ıd
    const updatedCart = cart.filter(event => event._id !== eventId);//filter ile belirtilen idye sahip etkinliği hariç tutar localStoragea kaydeder ve kullanıcıya bilgi verir
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    alert('Etkinlik sepetten kaldırıldı!');
  };

  const clearCart = () => {//Sepeti tamamen temizler
    setCart([]);
    localStorage.removeItem('cart');//cartı boşaltır localStoragedan siler ve kullanıcıya bilgi verir
    alert('Sepet boşaltıldı!');
  };

  const goBackToHome = () => {//Kullanıcıyı ana sayfaya yönlendirir.
    navigate('/home');
  };

  const addToCart = async (event) => {
    try {
      const weatherResponse = await fetch(`http://localhost:5000/api/custom-weather?location=${event.location}&date=${event.date}`);
      if (!weatherResponse.ok) {
        throw new Error('Hava durumu isteği başarısız');
      }
      const weatherData = await weatherResponse.json();
      if (!weatherData.isPlannable) {
        throw new Error('Hava durumu uygun değil, etkinlik planlanamıyor!');
      }
      const response = await fetch('http://localhost:5000/api/events/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event._id }),
      });
      if (!response.ok) {
        throw new Error('Bilet alma başarısız: ' + response.statusText);
      }
      const data = await response.json();
      const updatedCart = [...cart, { ...event, isPlannable: weatherData.isPlannable, weather: weatherData.weather, temperature: weatherData.temperature }];
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      alert(`${event.title} sepete eklendi! Kalan kontenjan: ${data.capacity}`);

      const updatedEventsResponse = await fetch('http://localhost:5000/api/events');
      const updatedData = await updatedEventsResponse.json();
      const filteredEvents = await Promise.all(updatedData.events.map(async (e) => {
        const wResponse = await fetch(`http://localhost:5000/api/custom-weather?location=${e.location}&date=${e.date}`);
        const wData = await wResponse.json();
        return { ...e, isPlannable: wData.isPlannable, weather: wData.weather, temperature: wData.temperature };
      }));
      const recommended = filteredEvents
        .filter(e => userInterests.includes(e.type) && e.isPlannable)
        .slice(0, 3);
      setRecommendedEvents(recommended.length > 0 ? recommended : filteredEvents.slice(0, 3));
    } catch (error) {
      console.error('Bilet alma hatası:', error);
      alert('Bilet alınamadı: ' + error.message);
    }
  };

  const checkout = async () => {
    try {
      if (!cart.length) {
        throw new Error('Sepet boş!');
      }
      if (!paymentMethod) {
        throw new Error('Lütfen bir ödeme yöntemi seçin!');
      }
      const totalPrice = cart.reduce((sum, event) => sum + (event.capacity > 0 ? 100 : 0), 0);
      const response = await fetch('http://localhost:5000/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, paymentMethod, totalPrice }),
      });
      if (!response.ok) {
        throw new Error('Ödeme başarısız: ' + response.statusText);
      }
      const data = await response.json();
      setCart([]);
      localStorage.removeItem('cart');
      alert(data.message + ` Toplam: ${totalPrice} TL`);
    } catch (error) {
      console.error('Ödeme hatası:', error);
      alert('Ödeme başarısız: ' + error.message);
    }
  };

  return (
    <div className="cart-container">
      <div className="header">
        <h1 className="cart-title">TURKEYVIBE - Sepetim</h1>
        <button onClick={goBackToHome} className="back-button">
          Ana Sayfaya Dön
        </button>
      </div>

      <div className="cart-section">
        <h2>Sepetiniz</h2>
        {cart.length > 0 ? (
          <>
            {cart.map((event) => (
              <div key={event._id} className="cart-item">
                <h4>{event.title}</h4>
                <p><strong>Tür:</strong> {event.type}</p>
                <p><strong>Tarih:</strong> {new Date(event.date).toLocaleString()}</p>
                <p><strong>Yer:</strong> {event.location}</p>
                <p><strong>Planlanabilir mi?</strong> {event.isPlannable ? 'Evet' : 'Hayır'}</p>
                <p><strong>Hava Durumu:</strong> {event.weather}, {event.temperature}°C</p>
                <button
                  onClick={() => removeFromCart(event._id)}
                  className="remove-button"
                >
                  Kaldır
                </button>
              </div>
            ))}
            <div className="cart-actions">
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="payment-select">
                <option value="">Ödeme Yöntemi Seçin</option>
                <option value="credit-card">Kredi Kartı</option>
                <option value="bank-transfer">Banka Havalesi</option>
              </select>
              <button onClick={clearCart} className="clear-cart-button">
                Sepeti Boşalt
              </button>
              <button onClick={checkout} className="checkout-button" disabled={!paymentMethod}>
                Ödeme Yap
              </button>
            </div>
          </>
        ) : (
          <p>Sepetinizde henüz etkinlik yok.</p>
        )}
      </div>

      <div className="recommendations-section">
        <h3>Size Özel Öneriler</h3>
        {recommendedEvents.length > 0 ? (
          recommendedEvents.map((event) => (
            <div key={event._id} className="event-card">
              <h4>{event.title}</h4>
              <p><strong>Tür:</strong> {event.type}</p>
              <p><strong>Tarih:</strong> {new Date(event.date).toLocaleString()}</p>
              <p><strong>Yer:</strong> {event.location}</p>
              <p><strong>Kontenjan:</strong> {event.capacity}</p>
              <p><strong>Planlanabilir mi?</strong> {event.isPlannable ? 'Evet' : 'Hayır'}</p>
              <p><strong>Hava Durumu:</strong> {event.weather}, {event.temperature}°C</p>
              <button onClick={() => addToCart(event)} className="add-to-cart-button">
                Bilet Al
              </button>
            </div>
          ))
        ) : (
          <p>Size özel öneri bulunamadı. (Hava durumu veya ilgi alanlarınızı kontrol edin)</p>
        )}
      </div>
    </div>
  );
};

export default Cart;