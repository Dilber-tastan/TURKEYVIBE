const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// MongoDB bağlantısı-- VERİ TABANI
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB bağlantısı başarılı!'))
  .catch(err => console.log('MongoDB bağlantı hatası:', err));

// Kullanıcı modeli
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isApproved: { type: Boolean, default: false },
  isFirstLogin: { type: Boolean, default: true },
});
const User = mongoose.model('User', userSchema);

// Etkinlik veriLERİ
let eventsData = [
  { _id: "1", title: "Madrigal Konseri", type: "Konser", date: new Date("2025-07-15"), location: "bursa", description: "Büyük yaz konseri!", capacity: 1000 },
  { _id: "2", title: "Hamlet", type: "Tiyatro", date: new Date("2025-06-20"), location: "Ankara", description: "Klasik bir tiyatro eseri.", capacity: 500 },
  { _id: "3", title: "Van Gogh Sanat Müzesi", type: "Sergi", date: new Date("2025-08-01"), location: "İzmir", description: "Modern sanat eserleri.", capacity: 350 },
  { _id: "4", title: "Türkiye-İtalya Avrupa Şampiyonası ", type: "Spor", date: new Date("2025-09-10"), location: "istanbul", description: "Heyecanlı bir maç!", capacity:53.345},
];
// Kendi hava durumu API
app.get('/api/custom-weather', (req, res) => {
  try {
    const { location, date } = req.query;
    if (!location || !date) {
      return res.status(400).json({ message: 'Konum ve tarih gereklidir!' });
    }

    const eventDate = new Date(date);
    const month = eventDate.getMonth() + 1; // 0-11 aralığı olduğu için +1
    const isSummerMonth = month >= 6 && month <= 9; // Haziran 6 - Eylül 9

    // Rastgele hava durumu (yaz ayları için %80 planlanabilir)
    const random = Math.random();
    const isGoodWeather = isSummerMonth ? (random > 0.2) : (random > 0.5); // Yazda %80, diğer aylarda %50
    const weatherConditions = ['Güneşli', 'Rüzgarlı', 'Yağmurlu'];
    const weather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    const temperature = isGoodWeather ? (20 + Math.random() * 15) : (5 + Math.random() * 10); // 20-35°C veya 5-15°C

    res.status(200).json({
      location,
      date,
      isPlannable: isGoodWeather,
      message: isGoodWeather ? 'Etkinlik planlanabilir' : 'Hava durumu uygun değil',
      weather,
      temperature: Math.round(temperature),
    });
  } catch (error) {
    console.error('Hava durumu hatası:', error.message);
    res.status(500).json({ message: 'Hava durumu kontrolünde hata!', error: error.message });
  }
});

const announcementsData = [// DUYURU KISMI
  { title: "Yeni Sezon Başlıyor!", description: "2025 sezonu etkinlikleri için hazırlanın!", date: new Date("2025-06-01") },
  { title: "Bilet İndirimi!", description: "Tüm etkinliklerde %20 indirim!", date: new Date("2025-05-15") },
];

// Kayıt endpointi
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı!' });
    }
    const newUser = new User({ email, password, isApproved: false, isFirstLogin: true });
    await newUser.save();
    res.status(201).json({ message: 'Kayıt başarılı! Yönetici onayı bekleniyor...' });
  } catch (error) {
    res.status(500).json({ message: 'Kayıt sırasında bir hata oluştu!' });
  }
});

// Giriş endpointi
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre!' });
    }
    if (!user.isApproved) {
      return res.status(403).json({ message: 'Hesabınız henüz onaylanmadı!' });
    }
    res.status(200).json({ message: 'Giriş başarılı!', user: { isFirstLogin: user.isFirstLogin } });
  } catch (error) {
    res.status(500).json({ message: 'Giriş sırasında bir hata oluştu!' });
  }
});

// Şifre değiştirme endpointi
app.post('/api/change-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı!' });
    }
    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();
    res.status(200).json({ message: 'Şifre başarıyla değiştirildi!' });
  } catch (error) {
    res.status(500).json({ message: 'Şifre değiştirme sırasında bir hata oluştu!' });
  }
});

// Yönetici endpointleri - Kullanıcılar
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Kullanıcılar yüklenirken bir hata oluştu!' });
  }
});

app.post('/api/admin/approve-user', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı!' });
    }
    user.isApproved = true;
    await user.save();
    res.status(200).json({ message: 'Kullanıcı onaylandı!' });
  } catch (error) {
    res.status(500).json({ message: 'Kullanıcı onaylanırken bir hata oluştu!' });
  }
});

// Etkinlik endpointleri
app.get('/api/events', (req, res) => {
  try {
    const sortedEvents = [...eventsData].sort((a, b) => new Date(a.date) - new Date(b.date));
    res.status(200).json({ events: sortedEvents, announcements: announcementsData });
  } catch (error) {
    console.error('Etkinlikler yüklenirken hata:', error);
    res.status(500).json({ message: 'Etkinlikler yüklenemedi!', error: error.message });
  }
});

app.post('/api/events/buy', (req, res) => {
  const { eventId } = req.body;
  try {
    const eventIndex = eventsData.findIndex(event => event._id === eventId);
    if (eventIndex === -1) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı!' });
    }
    if (eventsData[eventIndex].capacity <= 0) {
      return res.status(400).json({ message: 'Kontenjan doldu!' });
    }
    eventsData[eventIndex].capacity -= 1;
    res.status(200).json({ message: 'Bilet alındı!', capacity: eventsData[eventIndex].capacity });
  } catch (error) {
    console.error('Bilet alma hatası:', error);
    res.status(500).json({ message: 'Bilet alma hatası!', error: error.message });
  }
});

// Yönetici için etkinlik yönetimi endpointleri
app.get('/api/admin/events', (req, res) => {
  try {
    const sortedEvents = [...eventsData].sort((a, b) => new Date(a.date) - new Date(b.date));
    res.status(200).json(sortedEvents);
  } catch (error) {
    res.status(500).json({ message: 'Etkinlikler yüklenemedi!', error: error.message });
  }
});

app.post('/api/admin/add-event', (req, res) => {
  try {
    const { title, type, date, location, description, capacity } = req.body;
    const newEvent = {
      _id: String(eventsData.length + 1),
      title,
      type,
      date: new Date(date),
      location,
      description,
      capacity: Number(capacity),
    };
    eventsData.push(newEvent);
    res.status(201).json({ message: 'Etkinlik eklendi!', event: newEvent });
  } catch (error) {
    res.status(500).json({ message: 'Etkinlik eklenirken hata!', error: error.message });
  }
});

app.put('/api/admin/update-event/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, date, location, description, capacity } = req.body;
    const eventIndex = eventsData.findIndex(event => event._id === id);
    if (eventIndex === -1) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı!' });
    }
    eventsData[eventIndex] = {
      ...eventsData[eventIndex],
      title,
      type,
      date: new Date(date),
      location,
      description,
      capacity: Number(capacity),
    };
    res.status(200).json({ message: 'Etkinlik güncellendi!', event: eventsData[eventIndex] });
  } catch (error) {
    res.status(500).json({ message: 'Etkinlik güncellenirken hata!', error: error.message });
  }
});

app.delete('/api/admin/delete-event/:id', (req, res) => {
  try {
    const { id } = req.params;
    const eventIndex = eventsData.findIndex(event => event._id === id);
    if (eventIndex === -1) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı!' });
    }
    const deletedEvent = eventsData.splice(eventIndex, 1)[0];
    res.status(200).json({ message: 'Etkinlik silindi!', event: deletedEvent });
  } catch (error) {
    res.status(500).json({ message: 'Etkinlik silinirken hata!', error: error.message });
  }
});

// Ödeme endpointİİ
app.post('/api/checkout', (req, res) => {
  try {
    const { cart, paymentMethod, totalPrice } = req.body;
    if (!cart || cart.length === 0) {
      return res.status(400).json({ message: 'Sepet boş!' });
    }
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Ödeme yöntemi seçilmedi!' });
    }
    res.status(200).json({ message: `Ödeme ${paymentMethod} ile başarıyla tamamlandı! Toplam: ${totalPrice} TL`, cart: [] });
  } catch (error) {
    console.error('Ödeme hatası:', error);
    res.status(500).json({ message: 'Ödeme sırasında bir hata oluştu!', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} adresinde çalışıyor`);
});
