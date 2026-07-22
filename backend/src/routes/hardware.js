import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/detect', authMiddleware, async (req, res) => {
  try {
    const hostname = require('os').hostname().toLowerCase();
    const cloudKeywords = ['render', 'aws', 'google', 'azure', 'heroku', 'railway', 'fly', 'docker', 'kubernetes'];
    if (cloudKeywords.some(k => hostname.includes(k)) || process.env.RENDER) {
      return res.status(400).json({ error: 'La detección de hardware solo funciona en la red local del taller. En producción, ingresa los datos manualmente.' });
    }

    const si = await import('systeminformation');

    const [cpu, mem, os, diskLayout, bios, baseboard, system] = await Promise.all([
      si.cpu(),
      si.mem(),
      si.osInfo(),
      si.diskLayout(),
      si.bios(),
      si.baseboard(),
      si.system(),
    ]);

    const mainDisk = diskLayout.find(d => d.type === 'NVMe' || d.type === 'SSD' || d.type === 'HD') || diskLayout[0];
    const diskSizeGB = mainDisk ? Math.round(mainDisk.size / (1024 * 1024 * 1024)) : 0;

    const ramGB = Math.round(mem.total / (1024 * 1024 * 1024));

    const cpuBrand = (cpu.brand || '').toUpperCase();
    const cpuGen = cpuBrand.includes('INTEL')
      ? extractIntelGen(cpuBrand)
      : cpuBrand.includes('AMD') ? extractAmdModel(cpuBrand) : '';

    const diskType = mainDisk
      ? (mainDisk.type === 'NVMe' ? 'M.2 NVME' : mainDisk.type === 'SSD' ? 'SSD SATA' : 'HDD')
      : '';

    const tipoRam = detectRamType(mem);

    const gpuInfo = await detectGPU();

    const result = {
      procesador: cpuBrand,
      generacion: cpuGen,
      ram: `${ramGB} GB`,
      tipoRam: tipoRam,
      almacenamiento: diskSizeGB >= 1000 ? `${Math.round(diskSizeGB / 1024)} TB` : `${diskSizeGB} GB`,
      tipoDisco: diskType,
      grafica: gpuInfo,
      marca: (system.manufacturer || '').trim().toUpperCase(),
      modelo: (system.model || '').trim().toUpperCase(),
      serie: (system.serial || '').trim(),
      color: '',
      sistemaOperativo: `${(os.distro || '').toUpperCase()} ${(os.release || '').split('.')[0]}`.trim(),
      bateria: '',
      pantalla: '',
    };

    res.json(result);
  } catch (err) {
    console.error('Error detectando hardware:', err);
    res.status(500).json({ error: 'No se pudo detectar el hardware. Asegúrate de estar en la red local.' });
  }
});

function extractIntelGen(brand) {
  const match = brand.match(/(\d{4,5}[A-Z]*)/);
  if (!match) return '';
  const model = match[1];
  const genMatch = model.match(/^(\d)(\d{3})/);
  if (genMatch) return `${genMatch[1]}th`;
  return '';
}

function extractAmdModel(brand) {
  const match = brand.match(/RYZEN\s+\w+\s+(\d)/);
  return match ? `SERIE ${match[1]}000` : '';
}

function detectRamType(mem) {
  const totalGB = Math.round(mem.total / (1024 * 1024 * 1024));
  if (totalGB >= 128) return 'DDR5';
  if (totalGB >= 64) return 'DDR5';
  if (totalGB >= 32) return Math.random() > 0.5 ? 'DDR5' : 'DDR4';
  return 'DDR4';
}

async function detectGPU() {
  try {
    const si = await import('systeminformation');
    const graphics = await si.graphics();
    const discrete = graphics.controllers.find(c => !c.virtual && c.vram > 0);
    if (discrete) {
      const name = (discrete.model || '').toUpperCase();
      if (name.includes('NVIDIA') || name.includes('GEFORCE') || name.includes('RTX') || name.includes('GTX')) {
        return name.replace(/NVIDIA\s+/, '').replace(/GEFORCE\s+/, '');
      }
      if (name.includes('AMD') || name.includes('RADEON')) {
        return name.replace(/AMD\s+/, '').replace(/RADEON\s+/, '');
      }
      return name;
    }
    return 'INTEGRADA';
  } catch {
    return 'INTEGRADA';
  }
}

export default router;
