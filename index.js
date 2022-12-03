require('dotenv').config();
require('express-async-errors');
const express = require('express');
const app = express();
const path = require('path')
// extra security packages
const helmet = require('helmet');
const cors = require('cors');
const xssClean = require('xss-clean');
const expressRateLimit = require('express-rate-limit');

// Swagger && YAML
const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load(path.join(__dirname, './swagger.yaml'));

// connentDB
const connentDB = require('./db/connect');
const authenticationUser = require('./middleware/authentications');

// routers
const authRouter = require('./routes/auth');
const jobsRouter = require('./routes/jobs');


// Error handler
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

app.set('trust proxy', 1);
app.use(expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes,
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
}))


app.use(cors());
app.use( (req, res, next)=> {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, PATCH, OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Content-Type, api_key, Authorization, application/json');
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet());
app.use(xssClean());


const options = {
  customCssUrl: '/public/swagger-ui.css',
};

app.get('/', (req, res) => {
  res.redirect('/api-docs');
  //res.send('<h1>Jobs API</h1> <a href="/api-docs">Documentation</a>');
});
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/api-docs', swaggerUI.serve);
app.get('/api-docs', swaggerUI.setup(swaggerDocument, options));

// routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/jobs', authenticationUser, jobsRouter);



app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 1812;
const start = async () => {
  try {
    await connentDB(process.env.MONGO_URL);
    app.listen(port, console.log(`Server Listen In http://localhost:${port}`));
  } catch (error) {
    console.log(error)
  }
};

start()