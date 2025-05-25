const express = require('express');//Express.js frameworkünü ve router nesnesini projeye dahil eder
const router = express.Router(); //Web sunucusu ve rotalar için kullanılan bir Node.js frameworkü.

const eventsData = [//Dört etkinlik içerir
  { _id: "1", title: "Madrigal Konseri ", type: "Konser", date: new Date("2025-07-15"), location: "İstanbul", description: "Büyük yaz konseri!", capacity: 100 },
  { _id: "2", title: "Hamlet", type: "Tiyatro", date: new Date("2025-06-20"), location: "Ankara", description: "Klasik bir tiyatro eseri.", capacity: 100 },
  { _id: "3", title: "Van Gogh Sanat Müzesi", type: "Sergi", date: new Date("2025-08-01"), location: "İzmir", description: "Modern sanat eserleri.", capacity: 100 },
  { _id: "4", title: "Türkiye-İtalya Avrupa Şampiyonası", type: "Spor", date: new Date("2025-09-10"), location: "Bursa", description: "Heyecanlı bir maç!", capacity: 100 },
];
//avaScript Date nesneleri olarak tanımlanmış örneğin "2025-07-15"
const announcementsData = [
  { title: "Yeni Sezon Başlıyor!", description: "2025 sezonu etkinlikleri için hazırlanın!", date: new Date("2025-06-01") },
  { title: "Bilet İndirimi!", description: "Tüm etkinliklerde %20 indirim!", date: new Date("2025-05-15") },
];

router.get('/events', (req, res) => {//etkinlikleri tarihe göre sıralı bir şekilde listeler ve duyurularla birlikte döndürür  GET isteği için /events endpoint’i tanımlar
  try {
    const sortedEvents = [...eventsData].sort((a, b) => new Date(a.date) - new Date(b.date));//Tarihleri karşılaştırarak sıralama yapar.
    res.status(200).json({ events: sortedEvents, announcements: announcementsData });
  } catch (error) {
    console.error('Etkinlikler yüklenirken hata:', error);
    res.status(500).json({ message: 'Etkinlikler yüklenemedi!', error: error.message });
  }
});

router.post('/events/buy', (req, res) => {//Belirtilen etkinliğin biletini alır ve kapasiteyi günceller  POST isteği için /events/buy endpoint’i tanımlar
  const { eventId } = req.body;//Gelen isteğin gövdesinden eventId değerini çeker
  try {
    const eventIndex = eventsData.findIndex(event => event._id === eventId);//eventId ile eşleşen etkinliğin indeksini bulur.
    if (eventIndex === -1) {
      return res.status(404).json({ message: 'Etkinlik bulunamadı!' });
    }
    if (eventsData[eventIndex].capacity <= 0) {//Kapasite dolmuşsa, 400 (Bad Request) ile hata döndürür
      return res.status(400).json({ message: 'Kontenjan doldu!' });
    }
    eventsData[eventIndex].capacity -= 1;//etkinliğin kapasitesini bir azaltır.
    res.status(200).json({ message: 'Bilet alındı!', capacity: eventsData[eventIndex].capacity });
  } catch (error) {
    console.error('Bilet alma hatası:', error);
    res.status(500).json({ message: 'Bilet alma hatası!', error: error.message });
  }
});

module.exports = router;//tanımlanan rotaları dışa aktarır