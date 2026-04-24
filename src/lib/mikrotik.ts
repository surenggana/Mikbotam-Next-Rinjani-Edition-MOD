import { RouterOSAPI } from 'node-routeros';
import { prisma } from './prisma';
import { auth } from '@/auth';

export async function getActiveConfig() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const adminId = parseInt(session.user.id);

  // Ambil config router milik admin yang sedang login
  const config = await prisma.systemConfig.findFirst({
    where: { adminId: adminId }
  });

  return config;
}

export async function getRouterConfig() {
  const config = await getActiveConfig();
  if (!config) return null;

  return {
    host: config.routerIp || '',
    user: config.routerUsername || '',
    password: config.routerPassword || '',
    port: parseInt(config.port || '8728'),
  };
}

export async function getMikrotikConnection(customConfig?: any) {
  let config;

  if (customConfig) {
    config = {
      host: customConfig.routerIp || '',
      user: customConfig.routerUsername || '',
      password: customConfig.routerPassword || '',
      port: parseInt(customConfig.port || '8728'),
    };
  } else {
    config = await getRouterConfig();
  }

  if (!config || !config.host) {
    throw new Error('Router belum dikonfigurasi.');
  }

  const conn = new RouterOSAPI({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port,
    timeout: 5,
  });

  // Tambahkan listener error agar tidak crash jika terjadi timeout/gangguan socket
  conn.on('error', (err) => {
    console.error('RouterOS API Socket Error:', err.message);
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

export async function getInterfaces() {
  const conn = await getMikrotikConnection();
  try {
    await conn.connect();
    const data = await conn.write('/interface/print');
    return data;
  } catch (error) {
    console.error('Gagal mengambil data interface:', error);
    throw error;
  } finally {
    conn.close();
  }
}
