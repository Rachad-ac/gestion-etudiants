const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'mon_secret_jwt';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Page login
router.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
});

// Soumission login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, users) => {
    if (err) return res.status(500).send('Erreur serveur');
    if (users.length === 0) return res.render('auth/login', { error: 'Utilisateur introuvable' });

    const user = users[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('auth/login', { error: 'Mot de passe incorrect' });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: EXPIRES_IN });

    res.cookie('token', token, { httpOnly: true, secure: false }); // secure: true en HTTPS
    res.redirect('/');
  });
});

// Page d’inscription
router.get('/register', (req, res) => {
  res.render('auth/register', { error: null });
});

// Soumission inscription
router.post('/register', async (req, res) => {
  const { username, password, confirmPassword, role } = req.body;

  if (password !== confirmPassword) {
    return res.render('auth/register', { error: 'Les mots de passe ne correspondent pas' });
  }

  const hash = await bcrypt.hash(password, 10);

  db.query(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, hash, role || 'user'],
    (err) => {
      if (err) {
        return res.render('auth/register', { error: 'Nom d’utilisateur déjà pris' });
      }
      res.redirect('/auth/login');
    }
  );
});

// Déconnexion
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
});

module.exports = router;
