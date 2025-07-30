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
app.use(express.static('public'));

app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(exposeUser);
app.use('/auth', authRoutes);
app.use(require('./middlewares/exposeUser'));
app.get('/login', (req, res) => res.redirect('/auth/login'));

app.get('/', authenticateToken, (req, res) => {
  const showModal = req.query.showModal === '1';
  db.query('SELECT * FROM etudiants', (err, etudiants) => {
    if (err) return res.status(500).send(err);
    db.query('SELECT * FROM users', (err, users) => {
    if (err) return res.status(500).send(err);
  res.render('list-etudiant', { etudiants ,  users , showModal: showModal});  });
  });
});

app.get('/users', authenticateToken, (req, res) => {
  db.query('SELECT * FROM users', (err, users) => {
    if (err) return res.status(500).send(err);
    res.render('list-user', { users });
  });
});

app.get('/ajouter-etudiant', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.render('add-etudiant');
});

app.post('/ajouter-etudiant', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const {
    mat, 
    nom, 
    prenom, 
    date_naissance, 
    classe, filiere, 
    universite, 
    adresse, 
    sexe, 
    nationalite
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

app.get('/modifier-etudiant/:id', authenticateToken, authorizeRoles('admin'), (req, res) => { 
  db.query('SELECT * FROM etudiants WHERE id = ?', [req.params.id], (err, result) => { 
  if (err) return res.status(500).send(err); 
    res.render('edit-etudiant', { etudiant : result[0] }); 
  }); 
}); 
 
app.post('/modifier-etudiant/:id' , authenticateToken, authorizeRoles('admin'), (req, res) => { 
  const {
    mat,
    nom,
    prenom,
    date_naissance,
    classe,
    filiere,
    universite,
    adresse,
    sexe,
    nationalite
  } = req.body;  
  const sql = 'UPDATE etudiants SET mat =?, nom =?, prenom =?,date_naissance =?, classe =?, filiere =?, universite =?, adresse =?, sexe =?, nationalite =? WHERE id = ?'; 
  db.query(sql, [mat, nom, prenom, date_naissance, classe, filiere, universite, adresse, sexe, nationalite, req.params.id], err => { 
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

app.get('/supprimer-user/:id', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const userId = req.params.id;

  db.query('SELECT role FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) return res.status(500).send(err);

    if (results.length === 0) {
      return res.status(404).send(err);
    }

    const userRole = results[0].role;

    if (userRole === 'admin') {
      return res.status(403).send(err);
    }

    db.query('DELETE FROM users WHERE id = ?', [userId], err => {
      if (err) return res.status(500).send(err);
      res.redirect('/?showModal=1');
    });
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
