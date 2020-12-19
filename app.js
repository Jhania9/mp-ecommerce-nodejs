var express = require('express');
var exphbs  = require('express-handlebars');
var port = process.env.PORT || 3000 
const mercadopago = require("mercadopago");

var app = express();
//access_token : esta token se genera x cada establecimento q use en una pasarela de pagos y se crea en la misma plataforma demercado pago
//integrador_id: es el identificador de cada desarrollador certificado x mercadopago
mercadopago.configure({
    access_token: "APP_USR-8208253118659647-112521-dd670f3fd6aa9147df51117701a2082e-677408439",
    integrator_id: "dev_2e4ad5dd362f11eb809d0242ac130004"
})
// me deberia ahora el usuario(front) mandar toda la info del cliente ya registrado (nombre,correo,mail, dni y direccion)
let comprador = {
    name: "Lalo",
    surname: "Landa",
    email:"test_user_46542185@testuser.com",
    phone:{
        area_code:"52",
        number: 5549737300
    },
    identification:{
    type:"DNI",
    number:"22334445"
    },
    address:{
    zip_code:"03940",
    street_name:"Insurgentes Sur",
    street_number:1602
    }
}

let metodos_pago = {
    installments: 6,
    exclude_payment_methods: [
        {
            id: "diner"
        }
    ],
    exclude_payment_types: [
        {
            id: "atm"
        }
    ]
}

let back_urls = {}
let preference = {
    items: [],
    back_urls: back_urls,
    payment_methods: metodos_pago,
    payer:comprador,
    auto_return:"approved",
    external_reference:"jhania.mjp@gmail.com",
    notification_url:""
}
 
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

app.use(express.static('assets'));
 
app.use('/assets', express.static(__dirname + '/assets'));

app.get('/', function (req, res) {
    res.render('home');
});

app.get('/detail', async (req, res)=> {
    console.log(req.query)
    console.log(req.get("host"));
    let item = {
        id: "1234",
        title: req.query.title,
        description: "Dispositivo móvil de Tienda e-commerce",
        picture_url: req.get("host")+req.query.img.substring(1),//localhost:3000
        quantity: +req.query.unit,
        currency_id:"PEN",
        unit_price: +req.query.unit
        //https://es.wikipedia.org/wiki/ISO_4217
    };
    preference.back_urls =  {
        success:`${req.get("host")}/success`,
        pending:`${req.get("host")}/pending`,
        failure:`${req.get("host")}/failure`,
    }
    preference.items = [];
    preference.items.push(item);
    preference.notification_url = `${req.get("host")}/notificaciones`;
    let respuesta = await mercadopago.preferences.create(preference);
    console.log(respuesta.body.init_point);
    req.query.init_point = respuesta.body.init_point;
    req.query.id = respuesta.body.id;
    res.render('detail',req.query);
});
//va a ingresar cuando el pago sea exitoso --line 81
app.get("/success", function(req,res){
    res.render("success",req.query)
});
//va a ingresar cuando el pago sea pendiente (eligio metodo contraentrega)
app.get("/pending", function(req,res){
    res.render("pending",req.query)
});
//va a ingresar cuando hubo un error en el pago
app.get("/failure", function(req,res){
    res.render("failure",req.query)
});
app.post("/notificaciones", function(req,res){
    //todo loq manda el mercadopago lo recibo mediante el req.query y esto lo definimos en linea 87
    console.log(req.query);
    res.status(200).send("ok")
});

app.listen(port);