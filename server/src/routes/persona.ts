import { Router, Request, Response } from 'express';

const router = Router();

// Simple in-memory persona list for Sprint-2
interface Persona {
  id: string;
  label: string;
  description: string;
  partnerSlug: string;
}

const personas: Persona[] = [
  {
    id: 'gima-educator',
    label: 'GIMA Educator',
    description: 'Health professional–facing, evidence-based educational tone.',
    partnerSlug: 'gima'
  },
  {
    id: 'adeeva-clinical-support',
    label: 'Adeeva Clinical Support',
    description: 'Clinically oriented, supplement-aware support persona.',
    partnerSlug: 'adeeva'
  }
];

router.get('/', (_req: Request, res: Response) => {
  res.json(personas);
});

router.get('/:id', (req: Request, res: Response) => {
  const persona = personas.find(p => p.id === req.params.id);
  if (!persona) {
    return res.status(404).json({ error: 'Persona not found' });
  }
  return res.json(persona);
});

export default router;
