// server.js 
const express = require('express'); 
const dotenv = require('dotenv'); 
const db = require('./models/db'); 
const path = require('path'); 
 
dotenv.config(); 
const app = express(); 
 
app.use(express.urlencoded({ extended: true })); 
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use(express.json()); 
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views')); 
 
// Routes
app.get('/', (req, res) => { 
  db.query('SELECT * FROM etudiants', (err, etudiants) => { 
    if (err) return res.status(500).send(err); 
    res.render('list-etudiant', { etudiants }); 
  }); 
}); 
 
app.get('/ajouter-etudiant', (req, res) => { 
  res.render('add-etudiant'); 
}); 
 
app.post('/ajouter-etudiant', (req, res) => { 
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
  const sql = 'INSERT INTO etudiants (mat, nom, prenom, date_naissance, classe, filiere, universite, adresse, sexe, nationalite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'; 
  db.query(sql, [mat, nom, prenom, date_naissance, classe, filiere, universite, adresse, sexe, nationalite], err => { 
    if (err) return res.status(500).send(err); 
    res.redirect('/'); 
  }); 
}); 
 
app.get('/modifier-etudiant/:id', (req, res) => { 
  db.query('SELECT * FROM etudiants WHERE id = ?', [req.params.id], (err, result) => { 
  if (err) return res.status(500).send(err); 
    res.render('edit-etudiant', { etudiant : result[0] }); 
  }); 
}); 
 
app.post('/modifier-etudiant/:id', (req, res) => { 
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

app.get('/supprimer-etudiant/:id', (req, res) => { 
  db.query('DELETE FROM etudiants WHERE id = ?', [req.params.id], err => { 
    if (err) return res.status(500).send(err); 
    res.redirect('/'); 
  }); 
});

const PORT = process.env.PORT || 3000; 
app.listen(PORT, () => console.log(`Serveur lancé sur http://localhost:${PORT}`));