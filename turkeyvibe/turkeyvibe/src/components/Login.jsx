import React, { useState } from 'react';//veri saklama güncll
import { useNavigate } from 'react-router-dom'; //başka sayf yönlendirme home yönlendircek
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  // kullanc ilk giriş yapıp yapmadığını gösterir falsedir sonra turee
  const navigate = useNavigate();
  //kullanıcıyı baika sayfaya yönlendirmek için fonk kullanılır yukarda import ettiğimiz

  const handleLogin = async (e) => {//  girş form gönderir backende giriş isteği gönderir
    e.preventDefault();// giriş f gönderildikten sonra sayfanın yenilemsini engeller
    try {
      const response = await fetch('http://localhost:5000/api/login', {// backendde giriş endpointine POST istegi yapar
        method: 'POST',// veriyi sunucuya göndermek 
        headers: { 'Content-Type': 'application/json' },// gönd verinin json formatında old bleirtir
        body: JSON.stringify({ email, password }),// kullanc eposta ve şifresini json formatında gösterir
      });
      const data = await response.json();//sunucudan gelen yanıtı jsona çevirir
      if (response.status === 200) {// giriş başarılıysa
        if (data.user.isFirstLogin) {
          //Kullanıcı ilk giriş yapıyorsa isfirstLogin true ise isfirstLogin ve mesajı günceller
          setIsFirstLogin(true);
          setMessage('İlk girişiniz! Lütfen şifrenizi değiştirin.');
        } else {
          setMessage('Giriş başarılı! Ana sayfaya yönlendiriliyorsunuz...');
          setTimeout(() => navigate('/home'), 2000); // 2 saniye bekleyip yönlendir
        }
      } else {
        setMessage(data.message);// hata mesaj göasterir
      }
    } catch (error) {
      setMessage('Giriş sırasında bir hata oluştu!');
    }
  };

  const handleChangePassword = async (e) => {// şifre değiştirme isteği gönderir
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword }),// eposta ve yeni şifeyi gönderir
      });
      const data = await response.json();//Sunucudan gelen yanıtı işler örn: mesage  Şifre değiştirildi
      if (response.status === 200) {// giriş başarılıysa 
        setIsFirstLogin(false); //false yapar
        setMessage('Şifre başarıyla değiştirildi! Ana sayfaya yönlendiriliyorsunuz...');
        setTimeout(() => navigate('/home'), 2000); // 2 saniye bekleyip yönlendir
      } else {
        setMessage(data.message);// hata mesaju
      }
    } catch (error) {
      setMessage('Şifre değiştirme sırasında bir hata oluştu!');
    }
  };

  return (
    <div className="login-container">
      {/* ana kapsayıcı */}
      <div className="header">
        <h1 className="login-title">TURKEYVIBE</h1>
      </div>
      <div className="login-content">
        {!isFirstLogin ? (
          <form onSubmit={handleLogin} className="login-form">
            <h2 className="form-title">Giriş Yap</h2>
            <div className="form-group">
              <label htmlFor="email">E-posta:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required// alanların doldurulması zorunlu
                className="glow-input"
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
            <button type="submit" className="login-button">Giriş Yap</button>
          </form>
        ) : (
          <form onSubmit={handleChangePassword} className="login-form">
            <h2 className="form-title">Şifrenizi Değiştirin</h2>
            <div className="form-group">
              <label htmlFor="newPassword">Yeni Şifre:</label>
              {/*  yeni şifre için aşağıda calue onchange senkronize dilir */}
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="glow-input"
              />
            </div>
            <button type="submit" className="login-button">Şifreyi Değiştir</button>
            {/*  şifreyi değişitrme  buttonu formu gönderilir */}
          </form>
        )}
        {message && <p className="message">{message}</p>}
        {/* mesajı ekranda gösteriri */}
      </div>
    </div>
  );
};

export default Login;// dışa aktarmamızı sağlayarak app.jsxte birleşitrcez