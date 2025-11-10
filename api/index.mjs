import serverlessHttp from 'serverless-http';
import app from '../server/src/index.js';

export default serverlessHttp(app);

