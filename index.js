const connectToMongo = require('./db')

const bodyparser = require('body-parser');

var cors = require('cors')
connectToMongo();


const express = require('express');
const app = express()
const port = process.env.PORT || 8000

app.use(express.json())

app.use(cors())

app.use(bodyparser.urlencoded({ extended: false }));

app.use(bodyparser.json())

app.use('/uploads', express.static('uploads'))

// available routes

app.use('/api/auth', require('./Routes/auth.js'))
app.use('/api/blog', require('./Routes/blog.js'))


// Heroku set up code///

// if(process.env.NODE_ENV == "production"){
//   app.use(express.static('./Frontend/build'))
//   const path = require('path')

//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, 'Frontend', 'build', 'index.html'))
//   });

// }

// Cyclick deplyment setup

// app.use(express.static('./front/build'))
// const path = require('path')

// app.get('*', (req, res) => {
//   res.sendFile(path.resolve(__dirname, 'front', 'build', 'index.html'))
// });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})