import express from 'express';
import dotenv from 'dotenv';
import meteringRoutes from './routes/metering.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', meteringRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'BillFlow API is running' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});