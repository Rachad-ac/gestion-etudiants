const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'mon_secret_jwt';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

router.get('/', async (req, res) => {
  try {
    const etudiants = await Etudiant.findAll();
    const users = await Users.findAll();
    res.render('list-etudiant', { etudiants, users });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/', async (req, res) => {
  try {
    const users = await Users.findAll();
    const showModal = req.query.showModal === '1';
    res.render('list-etudiant', { users, showModal });
  } catch (err) {
    res.status(500).send(err.message);
  }
});



router.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, users) => {
    if (err) return res.status(500).send('Erreur serveur');
    if (users.length === 0) return res.render('auth/login', { error: 'Utilisateur introuvable' });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('auth/login', { error: 'Mot de passe incorrect' });

    const token = jwt.sign({ 
      id: user.id, 
      username: user.username, 
      email :user.email, 
      role: user.role }, 
      SECRET, { expiresIn: EXPIRES_IN }
    );

    res.cookie('token', token, { httpOnly: true, secure: false }); // secure: true en HTTPS
    res.redirect('/');
  });
});

router.get('/register', (req, res) => {
  res.render('auth/register', { error: null });
});

router.post('/register', async (req, res) => {
  const { username, email ,password, confirmPassword, role } = req.body;

  if (password !== confirmPassword) {
    return res.render('auth/register', { error: 'Les mots de passe ne correspondent pas' });
  }

  const hash = await bcrypt.hash(password, 10);

  db.query(
    'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [username, email, hash, role || 'user'],
    (err) => {
      if (err) {
        return res.render('auth/register', { error: 'Nom d’utilisateur ou mail déjà pris' });
      }
      res.redirect('/auth/login');
    }
  );
});

router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
});

module.exports = router;
