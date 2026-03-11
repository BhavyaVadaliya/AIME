import { Router, Request, Response } from 'express';

const router = Router();

interface Creator {
  id: string;
  handle: string;
  platform: 'tiktok' | 'instagram';
  region: string;
  partnerSlug: string;
}

const creators: Creator[] = [
  {
    id: 'gima-01',
    handle: '@gima_clinic_edu_1',
    platform: 'tiktok',
    region: 'CA',
    partnerSlug: 'gima'
  },
  {
    id: 'adeeva-01',
    handle: '@adeeva_practitioner_1',
    platform: 'instagram',
    region: 'CA',
    partnerSlug: 'adeeva'
  }
];

router.get('/', (_req: Request, res: Response) => {
  res.json(creators);
});

router.get('/:id', (req: Request, res: Response) => {
  const creator = creators.find(c => c.id === req.params.id);
  if (!creator) {
    return res.status(404).json({ error: 'Creator not found' });
  }
  return res.json(creator);
});

export default router;
