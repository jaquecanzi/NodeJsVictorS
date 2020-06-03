//Carregando Módulos
const axios = require('axios')
const handlebars = require('express-handlebars')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const admin = require('./routes/admin')
const path = require('path')
const mongoose = require('mongoose')
const session = require('express-session')
const flash = require('connect-flash')
require('./models/Postagem')
const Postagem = mongoose.model('postagens')
require('./models/Categoria')
const Categoria = mongoose.model('categorias')
const usuarios = require('./routes/usuario')

//Configurações

//Session
app.use(session({
    secret: 'cursodenode',
    resave: true,
    saveUninitialized: true
}))

app.use(flash())

//Middleware

app.use((req,res,next) => {
    res.locals.success_msg = req.flash("success_msg")
    res.locals.error_msg = req.flash("error_msg")
    next()
})

//BodyParser
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

//Handlebars
/*app.engine('handlbars',handlebars({extname:'handlebars', defaultLayout:'main', 
layoutsDir: __dirname + '/views/layout/', helpers: { 
formatDate: (date, time) => {
    return moment(date,time).format('YYYY-MM-DD HH:mm:s')
}
}}
))*/

app.engine('handlebars', handlebars({defaultLayout: 'main'}))
app.set('view engine','handlebars')



//Mongoose
mongoose.connect("mongodb://localhost/visualappvictor", {useNewUrlParser: true, useUnifiedTopology: true}).then(() =>{
    console.log("Conectado com sucesso!")
}).catch((err) =>{
    mongoose.Promise = global.Promise;
    console.log("Erro ao conectar: " + err)
})

//Public
app.use(express.static(path.join(__dirname,"public")))
//app.use(express.static('public'));


//Rotas
app.get('/',(req,res) => {
    Postagem.find().lean().populate('categoria').sort({data: 'desc'}).then((postagens) => {
        res.render('index', {postagens: postagens})
    }).catch((err) => {
        req.flash('error_msg','Houve um erro interno')
        res.redirect('/404')
    })
    
})

app.get('/404', (req,res) => {
    res.send('Erro 404!')
})

/*app.get('postagem/:slug',(req,res) => {
    Postagem.findOne({slug: req.params.slug}).lean().then((postagem) => {
        if(postagem) {
            res.render('postagem/index',{postagem: postagem})
        } else {
            req.flash('error_msg','Esta postagem não existe')
            res.redirect('/')
        }
    }).catch((err) => {
        req.flash('error_msg','Houve um erro interno')
        res.redirect('/')
    })
})
*/
app.get('/postagem/:slug', (req,res) => {
    const slug = req.params.slug
    Postagem.findOne({slug}).then(postagem => {
        if(postagem){
            const post = {
            titulo: postagem.titulo,
            data: postagem.data,
            conteudo: postagem.conteudo
        }
            res.render('postagem/index', post)
            }else{
                req.flash("error_msg", "Essa postagem nao existe")
                res.redirect("/")
            }
        })
        .catch(err => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/")
        })
})

app.get('/categorias',(req,res) => {
    Categoria.find().lean().then((categorias) => {
        res.render('categorias/index', {categorias: categorias})
    }).catch((err) => {
        req.flash('error_msg','Houve um erro interno')
    })
})

app.get('/categorias/:slug', (req,res) => {
    Categoria.findOne({slug: req.params.slug}).lean().then((categoria) => {
        if(categoria){
            Postagem.find({categoria: categoria._id}).lean().then((postagens) => {
                res.render('categorias/postagens', {postagens: postagens, categoria: categoria})
            }).catch((err) => {
                req.flash('error_msg','Houve um erro ao listar as postagens')
            })
        } else {
            req.flash('error_msg','Esta categoria não existe')
            res.redirect('/')
        }
    }).catch((err) => {
        req.flash('error_msg','Houve um erro interno ao carregar esta categoria')
    })
})


app.use('/admin',admin)
app.use('/usuarios', usuarios)


//Outros

const PORT = 8081
app.listen(PORT, () => {
    console.log('Servidor rodando')
})


