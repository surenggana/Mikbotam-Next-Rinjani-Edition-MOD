import { RouterOSAPI } from 'node-routeros';
import { prisma } from './prisma';

export async function getRouterConfig() {
  const config = await prisma.systemConfig.findFirst();
  if (!config) {
    throw new Error('Konfigurasi router tidak ditemukan di database.');
  }
  return {
    host: config.routerIp || '',
    user: config.routerUsername || '',
    password: config.routerPassword || '',
    port: parseInt(config.port || '8728'),
  };
}

export async function getMikrotikConnection() {
  const config = await getRouterConfig();
  const conn = new RouterOSAPI({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port,
    timeout: 5,
  });
  return conn;
}

export async function getRouterStats() {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    
    const [identity, resource] = await Promise.all([
      conn.write('/system/identity/print'),
      conn.write('/system/resource/print'),
    ]);

    const id = identity[0] as any;
    const res = resource[0] as any;

    return {
      routerName: id.name,
      board: res['board-name'],
      version: res.version,
      cpu: res.cpu,
      cpuFreq: res['cpu-frequency'],
      cpuLoad: res['cpu-load'],
      cpuCount: res['cpu-count'],
      uptime: res.uptime,
      freeMemory: res['free-memory'],
      totalMemory: res['total-memory'],
      freeHdd: res['free-hdd-space'],
      totalHdd: res['total-hdd-space'],
      badBlocks: res['bad-blocks'],
    };
  } catch (error) {
    console.error('Gagal mengambil statistik router:', error);
    throw error;
  } finally {
    conn.close();
  }
}
