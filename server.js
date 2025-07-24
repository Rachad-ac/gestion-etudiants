const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

const db = require('./models/db');
const authRoutes = require('./routes/auth');
const { authenticateToken, authorizeRoles } = require('./middlewares/auth');
const exposeUser = require('./middlewares/exposeUser');

dotenv.config();
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Assets
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, 'public')));

// EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Met l'utilisateur (si connecté) dans res.locals.currentUser
app.use(exposeUser);

// Routes d'auth
app.use('/auth', authRoutes);

// Expose req.user -> res.locals.currentUser pour les vues
app.use(require('./middlewares/exposeUser'));

// (Optionnel) Rediriger /login vers /auth/login
app.get('/login', (req, res) => res.redirect('/auth/login'));

// --------- Routes protégées ----------
app.get('/', authenticateToken, (req, res) => {
  db.query('SELECT * FROM etudiants', (err, etudiants) => {
    if (err) return res.status(500).send(err);
    res.render('list-etudiant', { etudiants });
  });
});

app.get('/ajouter-etudiant', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.render('add-etudiant');
});

app.post('/ajouter-etudiant', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const {
    mat, nom, prenom, date_naissance, classe, filiere, universite, adresse, sexe, nationalite
  } = req.body;

  const sql = `
    INSERT INTO etudiants (mat, nom, prenom, date_naissance, classe, filiere, universite, adresse, sexe, nationalite)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [mat, nom, prenom, date_naissance, classe, filiere, universite, adresse, sexe, nationalite], err => {
    if (err) return res.status(500).send(err);
    res.redirect('/');
  });
});

app.get('/supprimer-etudiant/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  db.query('DELETE FROM etudiants WHERE id = ?', [req.params.id], err => {
    if (err) return res.status(500).send(err);
    res.redirect('/');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
