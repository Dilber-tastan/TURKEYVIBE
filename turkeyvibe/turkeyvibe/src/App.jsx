import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Home from './components/Home';
import Cart from './components/Cart';

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div style={{ textAlign: 'center', padding: '20px',
              
             
             }}>
              <h1>TURKEYVİBE</h1>
              <h1>Hoş Geldiniz! Lütfen bir seçenek seçin.</h1>
              

              <div style={{ marginTop: '20px' }}>
                <Link to="/register" style={{ margin: '10px', padding: '10px 20px', background: '#0288d1', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                  Kayıt Ol
                </Link>
                <Link to="/login" style={{ margin: '10px', padding: '10px 20px', background: '#ffab00', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                  Giriş Yap
                </Link>
              </div>
            </div>
          }
        />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        
        < Route path='Cart' element={<Cart/>}/>
      </Routes>
    </Router>
  );
}

export default App;