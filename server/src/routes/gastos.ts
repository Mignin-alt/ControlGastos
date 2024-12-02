import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { obtenerGastos, crearGasto, actualizarGasto, eliminarGasto } from '../controllers/gastosController';

const router = Router();

router.use(authMiddleware);

router.get('/', obtenerGastos as any);
router.post('/', crearGasto as any);
router.put('/:id', actualizarGasto as any);
router.delete('/:id', eliminarGasto as any);

export default router;