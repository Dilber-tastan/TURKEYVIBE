import React, { useState, useEffect } from 'react';// veriileri saklamak ve güncellemek için kullanılıur
import { useNavigate } from 'react-router-dom';// diğer sayfaya yönlendirmeyi sağlar carta 
import './Home.css';

const Home = () => {
  const navigate = useNavigate();// kullanıcı yönlendirmede kullanıyoz çıkış yapma sepete gitme vs.
  const userEmail = localStorage.getItem('userEmail') || 'Kullanıcı';//Kullanıcının epostasını localStoragedan alır
  const [events, setEvents] = useState([]);//tüm planabilen etkinliklerin listesini tutar baişlangıç olarak boş bir dizi
  const [announcements, setAnnouncements] = useState([]);//Duyuruların listesini tutar
  const [cart, setCart] = useState([]);//Kullanıcının sepetindeki etkinlikleri tutar
  const [recommendedEvents, setRecommendedEvents] = useState([]);//ullanıcıya özel önerilen etkinlikleri barındırı
  const [error, setError] = useState(null);//Hata mesajlarını tutar
  const userInterests = JSON.parse(localStorage.getItem('userInterests')) || ['Konser', 'Tiyatro'];
//Kullanıcının ilgi alanlarını localStoragedan alır yoksa varsayılan olarak Konser Tiyatro vs..

   // Hava durumu verilerinin önbelleklemek için map nesnensini tutar
  const [weatherCache, setWeatherCache] = useState(new Map());

  useEffect(() => {//etkinlikleri, duyuruları ve hava durumu verilerini çeker
    const fetchEventsAndAnnouncements = async () => {
       
      try {// backendden etkinlik ve duyuru verilerini çeker
        const response = await fetch('http://localhost:5000/api/events');
        if (!response.ok) {// yanıt başarısızsa hata verir
          throw new Error('API isteği başarısız oldu: ' + response.statusText);
          //Her etkinlik için hava durumu kontrolü yapar
        }
        const data = await response.json();

        // Etkinlikler için hava durumu kontrolü
        const filteredEvents = await Promise.all(data.events.map(async (event) => {
          const cacheKey = `${event._id}-${event.date}-${event.location}`;//Önbellek anahtarı olarak etkinlik IDsi tarih ve konumu birleştirir
          if (weatherCache.has(cacheKey)) {//nbellekte veri varsa onu kullanır yoksa APIden çeker
            return { ...event, ...weatherCache.get(cacheKey) };
          }
          const weatherResponse = await fetch(`http://localhost:5000/api/custom-weather?location=${event.location}&date=${event.date}`);//Hava durumu APIsine istek gönderir
          if (!weatherResponse.ok) {
            throw new Error('Hava durumu isteği başarısız');
          }
          const weatherData = await weatherResponse.json();
          //Yeni hava durumu verisini önbelleğe ekler ve setWeatherCache ile statei günceller
          weatherCache.set(cacheKey, { isPlannable: weatherData.isPlannable, weather: weatherData.weather, temperature: weatherData.temperature });
          setWeatherCache(new Map(weatherCache)); // Statei güncelle
          return { ...event, ...weatherData };
        }));

        // Tüm etkinlikler (sadece planlanabilir olanlar)
        const plannableEvents = filteredEvents//Sadece planlanabilir etkinlikleri filtreler ve tarihe göre sıralar
          .filter(event => event.isPlannable)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(plannableEvents);

        // Öneriler kullanıcı ilgi alanlarına uygun olanlar
        const recommended = filteredEvents
          .filter(event => userInterests.includes(event.type) && event.isPlannable)
          .slice(0, 3);//Kullanıcı ilgi alanlarına ve planlanabilirliğe göre 3 öneri seçer
        setRecommendedEvents(recommended);

        setAnnouncements(data.announcements);//Duyuruları günceller
      } catch (error) {
        console.error('Etkinlikler çekilirken hata:', error);
        setError('Etkinlikler yüklenemedi. Lütfen daha sonra tekrar deneyin.');
      }
    };
    fetchEventsAndAnnouncements();
  }, []);

  // etkinliği sepete ekler ve kapasiteyi günceller
  const addToCart = async (event) => {// event eklenmek istenen etkinlik listesi
    try {
      const cacheKey = `${event._id}-${event.date}-${event.location}`;
      let weatherData = weatherCache.get(cacheKey);
      // cacheKey ve weatherData Hava durumu önbelleğini kontrol eder yoksa APIden çeker
      if (!weatherData) {
        const weatherResponse = await fetch(`http://localhost:5000/api/custom-weather?location=${event.location}&date=${event.date}`);
        if (!weatherResponse.ok) {
          throw new Error('Hava durumu isteği başarısız');
        }
        weatherData = await weatherResponse.json();
        weatherCache.set(cacheKey, { isPlannable: weatherData.isPlannable, weather: weatherData.weather, temperature: weatherData.temperature });
        setWeatherCache(new Map(weatherCache));
      }
      if (!weatherData.isPlannable) {//Planlanamazsa hata verir
        throw new Error('Hava durumu uygun değil, etkinlik planlanamıyor!');
      }
      const response = await fetch('http://localhost:5000/api/events/buy', {//Bilet alma isteği gönderir
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event._id }),
      });
      if (!response.ok) {
        throw new Error('Bilet alma başarısız: ' + response.statusText);
      }
      const data = await response.json();
      
      const updatedCart = [...cart, { ...event, isPlannable: weatherData.isPlannable, weather: weatherData.weather, temperature: weatherData.temperature }];
      // updatedCart Etkinliği sepete ekler ve localStorage’a kaydeder.
      setCart(updatedCart);
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      alert(`${event.title} sepete eklendi! Kalan kontenjan: ${data.capacity}`);//Kullanıcıya bilgilendirme yapar

      // yeni verileri çeker ve events ile recommendedEvents’ı günceller
      const updatedEventsResponse = await fetch('http://localhost:5000/api/events');
      const updatedData = await updatedEventsResponse.json();
      const filteredEvents = await Promise.all(updatedData.events.map(async (e) => {
        const cacheKey = `${e._id}-${e.date}-${e.location}`;
        if (weatherCache.has(cacheKey)) {
          return { ...e, ...weatherCache.get(cacheKey) };
        }
        const wResponse = await fetch(`http://localhost:5000/api/custom-weather?location=${e.location}&date=${e.date}`);
        const wData = await wResponse.json();
        weatherCache.set(cacheKey, { isPlannable: wData.isPlannable, weather: wData.weather, temperature: wData.temperature });
        setWeatherCache(new Map(weatherCache));
        return { ...e, ...wData };
      }));
      const plannableEvents = filteredEvents
        .filter(event => event.isPlannable)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(plannableEvents);

      const recommended = filteredEvents
        .filter(event => userInterests.includes(event.type) && event.isPlannable)
        .slice(0, 3);
      setRecommendedEvents(recommended);
    } catch (error) {
      console.error('Bilet alma hatası:', error);
      alert('Bilet alınamadı: ' + error.message);
    }
  };

  const handleLogout = () => {//çıkış yapar ve giriş sayfasına yönlendirir
    localStorage.removeItem('userEmail');//userEmaili localStoragedan siler ve logine yönlendirir
    navigate('/login');
  };

  const goToCart = () => {//Kullanıcıyı sepet sayfasına yönlendirir
    localStorage.setItem('cart', JSON.stringify(cart));//Sepeti localStoragea kaydeder  carte yönlendirme yapar
    navigate('/cart');
  };

  return (
    <div className="home-container">
      {/*  sayfanın ana kapsayıcısı */}
      <div className="header">
        {/* başlık için header */}
        <h1 className="home-title">TURKEYVIBE</h1>
        <button onClick={handleLogout} className="logout-button">
          Çıkış Yap
          {/* çıkış yapıp giriş sayfasına yönlendirmede kullanılan buton */}
        </button>
      </div>

      <divb className="welcome-section">
        {/*  hoşgeldiniz bölümü  */}
        
        <p> <h1> TURKEYVİBE HOŞ GELDİNİZ </h1></p>
        <p> Türkiye'nin en çok tercih ediilen etkinlik rehberi </p>
        {error && <p className="error-message">{error}</p>}
        <button onClick={goToCart} className="cart-button">
          Sepete Git ({cart.length})
        </button>
      </divb>

      <div className="announcements-section">
        {/* duyurular bölümü */}
        <h3>Duyurular</h3>
        {announcements.length > 0 ? (
          announcements.map((announcement, index) => (
            // map ile her duyuru kartı oluşturl
            <div key={index} className="announcement-card">
              <h4>{announcement.title}</h4>
              <p>{announcement.description}</p>
              <p><em>{new Date(announcement.date).toLocaleDateString()}</em></p>
            </div>
          ))
        ) : (
          <p>Henüz duyuru yok.</p>
        )}
      </div>

      <div className="recommendations-section">
        {/*  öneriler bölümü */}
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

      <div className="events-section">
        {/*  tüm etkinlikler */}
        <h3>Tüm Etkinlikler</h3>
        {events.length > 0 ? (
          events.map((event) => (
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
          <p>Şu anda uygun etkinlik bulunmamaktadır. (Hava durumu kontrol edin)</p>
        )}
      </div>
    </div>
  );
};

export default Home; // dışa aktarım sağlayarak app.jsxte kullanabilriiz böylece birlşeme yapacağız