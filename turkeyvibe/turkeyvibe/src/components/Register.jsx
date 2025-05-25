import React, { useState, useEffect } from 'react';
// usestate verileri saklamak ve güncellemek
import { useNavigate } from 'react-router-dom';
//react-router kütüphanesinden usenavigate import edilir ve başka sayfaya yönlendirmeyi sağlar (giriş sayfasına)
import './Register.css';
//react kütüphanesinin hookları import edilir

const Register = () => {
  //Kullanıcının girdiği eposta adresini tutar başta boş
  const [email, setEmail] = useState('');
  //Kullanıcının girdiği şifreyi tutar 
  const [password, setPassword] = useState('');
  //Kullanıcıya gösterilecek mesajları tutar
  const [message, setMessage] = useState('');
  //Kullanıcının kayıt olup olmadığını gösterir. Başlangıçta falsee  kayıt başarılıysa true 
  const [isRegistered, setIsRegistered] = useState(false);
  //Onay durumunun kontrol edilip edilmediğini gösterir. Başlangıçta false kayt sonrası true 
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);
  //Kullanıcıyı başka bir sayfaya yönlendirmek için bir fonksiyon sağlar (örneğin, /login sayfasına)
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    //Kullanıcının kayıt formunu göndermesini işler ve backend’e kayıt isteği gönderir
    e.preventDefault();
    //Form gönderildiğinde sayfanın yenilenmesini engeller
    setMessage('');// önceki mesajları temizleme
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        //Backend’de kayıt endpoint’ine POST isteği yapar
        method: 'POST',//Veriyi sunucuya gönderme
        headers: { 'Content-Type': 'application/json' },//Gönderilen verinin JSON formatında olduğunu belirtir
        body: JSON.stringify({ email, password }),//e-posta ve şifreyi JSON formatında gönderir
      });
      const data = await response.json();
      //Sunucudan gelen yanıtı JSONa çevirir (örneğin { message Kayıt başarılı)
      setMessage(data.message);//Sunucudan gelen mesajı ekranda gösterir
      if (response.status === 201) {// kayıt başarılı olıursa durumları true yapar
        setIsRegistered(true);
        setIsCheckingApproval(true);
      }
    } catch (error) {
      setMessage('Kayıt sırasında bir hata oluştu!');
    }
  };
// proje içinde devam eden durumları ele alır ( onaylama durumu) api ile iletişim kurar
  useEffect(() => {
    if (!isCheckingApproval || !email) return;//Onay kontrolü aktif değilse veya e-posta boşsa fonksiyonu sonlandırır.

    const checkApproval = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/check-approval', {
          // fetch isteği ile /api/check-approval endpoint’ine POST isteği yapar
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),//E postayı sunucuya gönderir
        });
        const data = await response.json();
        if (data.isApproved) {//Onaylanmışsa onay kontrolünü durdurur
          setIsCheckingApproval(false);
          //mesajı günceller ve 2 saniye sonra giriş sayfasına yönlendirir
          setMessage('Onaylandı! Giriş ekranına yönlendiriliyorsunuz...');
          setTimeout(() => navigate('/login'), 2000);// 2 saniye
        }
      } catch (error) {
        console.error('Onay kontrolünde hata:', error);
        setMessage('Onay kontrolünde bir hata oluştu!');
      }
    };

    const interval = setInterval(checkApproval, 1000);//Onay durumunu her 1 saniyede bir kontrol eder
    return () => clearInterval(interval);//Bileşen kaldırıldığında  intervali temizler
  }, [isCheckingApproval, email, navigate]);

  const handleGoToLogin = () => {//giriş sayfasına yönlendirme
    navigate('/login');// yukarda import edttiğimiz ile tarayıcı adresini login sayfasına değiştirir
  };

  return (
    <div className="register-container">
      <div className="header"> 
        {/* başlık için olan kısım */}
        <h1 className="register-title">TURKEYVIBE</h1>
      </div>
      <div className="register-content">
        {!isRegistered ? (
          <form onSubmit={handleSubmit} className="register-form">
            {/* form gönderildiğinde handlesubmit çalışır */}
            <h2 className="form-title">Kayıt Ol</h2>
            <div className="form-group">
              <label htmlFor="email">E-posta:</label>
              <input
              //input ile aşağıdakileri senkronize ettt
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required// alanların doldurma zorunluluğu 
                className="glow-input"
                //stil dosyasında tanımlı parlayan efekti kullandım
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Şifre:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glow-input"
              />
            </div>
            <button type="submit" className="register-button">Kayıt Ol</button>
            {/* kayıt ol butonu formu göndeir */}
          </form>
        ) : (
          <div className="waiting-message">
            {/*  bekleme mesajı kısmı is registered  ture göst */}
            <h2>Yönetici onayı bekleniyor...</h2>
            <p>Lütfen yönetici panelinde hesabınızı onaylayın.</p>
            {isCheckingApproval && <p>Durum kontrol ediliyor...</p>}
            {/*  onay durumu aktifse */}
            <button onClick={handleGoToLogin} className="login-button">
              Giriş Yap (Onaylandıysa)
            </button>
          </div>
        )}
        {message && <p className="message">{message}</p>}
        {/* mesajı ekranda gösterur */}
      </div>
    </div>
  );
};
export default Register;// bileşeni dışa aktarır app.jsxte de kullanalımm