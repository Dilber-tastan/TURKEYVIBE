const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'E-posta ve şifre zorunludur!' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı!' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Kayıt başarılı! Lütfen onay bekleyin.' });
  } catch (error) {
    res.status(500).json({ message: 'Kayıt sırasında bir hata oluştu!', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'E-posta ve şifre zorunludur!' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı!' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Şifre yanlış!' });
    }
    res.status(200).json({
      message: 'Giriş başarılı!',
      user: { email: user.email, isFirstLogin: user.isFirstLogin },
    });
  } catch (error) {
    res.status(500).json({ message: 'Giriş sırasında bir hata oluştu!', error: error.message });
  }
});

router.post('/change-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'E-posta ve yeni şifre zorunludur!' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı!' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.isFirstLogin = false;
    await user.save();
    res.status(200).json({ message: 'Şifre değiştirildi! Ana sayfaya yönlendiriliyorsunuz...' });
  } catch (error) {
    res.status(500).json({ message: 'Şifre değiştirme sırasında bir hata oluştu!', error: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, 'email isFirstLogin _id');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Kullanıcılar yüklenemedi!', error: error.message });
  }
});

router.post('/approve-user', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı!' });
    }
    user.isFirstLogin = false;
    await user.save();
    res.status(200).json({ message: 'Kullanıcı onaylandı!' });
  } catch (error) {
    res.status(500).json({ message: 'Onay sırasında bir hata oluştu!', error: error.message });
  }
});

module.exports = router;