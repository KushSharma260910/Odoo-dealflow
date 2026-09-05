const app = require('./src/app');
const { testConnection } = require('./src/config/db');

const port = Number(process.env.PORT || 5000);
testConnection().catch(error => console.warn(`MySQL connection unavailable: ${error.message}`));
app.listen(port, () => console.log(`DealFlow360 API listening on port ${port}`));
