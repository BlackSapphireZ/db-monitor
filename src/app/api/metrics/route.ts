import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getDatabaseStats } from '@/lib/db';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SSH_KEY = '~/.ssh/crisp_do_key';
const SSH_HOST = 'root@206.189.36.199';

async function getRemoteServerMetrics() {
    try {
        // Get CPU, Memory, Disk from remote server via SSH
        const command = `ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no -o ConnectTimeout=5 ${SSH_HOST} "
            echo '===CPU==='
            top -bn1 | head -5
            echo '===MEMORY==='
            free -m
            echo '===DISK==='
            df -h /
            echo '===UPTIME==='
            uptime
            echo '===NETWORK==='
            cat /proc/net/dev | grep eth0
        "`;

        const { stdout } = await execAsync(command, { timeout: 15000 });

        // Parse CPU
        const cpuMatch = stdout.match(/%Cpu.*?(\d+\.?\d*)\s*us.*?(\d+\.?\d*)\s*sy.*?(\d+\.?\d*)\s*ni.*?(\d+\.?\d*)\s*id/);
        const cpuIdle = cpuMatch ? parseFloat(cpuMatch[4]) : 0;
        const cpuUsage = Math.round(100 - cpuIdle);

        // Parse Memory
        const memMatch = stdout.match(/Mem:\s+(\d+)\s+(\d+)\s+(\d+)/);
        const memTotal = memMatch ? parseInt(memMatch[1]) : 1024;
        const memUsed = memMatch ? parseInt(memMatch[2]) : 0;
        const memUsage = Math.round((memUsed / memTotal) * 100);

        // Parse Disk
        const diskMatch = stdout.match(/\/dev\/\S+\s+(\d+\.?\d*)(G|M)\s+(\d+\.?\d*)(G|M)\s+\S+\s+(\d+)%\s+\/$/m);
        let diskTotal = 25; // Default 25GB
        let diskUsed = 0;
        let diskUsage = 0;
        if (diskMatch) {
            diskTotal = diskMatch[2] === 'G' ? parseFloat(diskMatch[1]) : parseFloat(diskMatch[1]) / 1024;
            diskUsed = diskMatch[4] === 'G' ? parseFloat(diskMatch[3]) : parseFloat(diskMatch[3]) / 1024;
            diskUsage = parseInt(diskMatch[5]);
        }

        // Parse Network
        const netMatch = stdout.match(/eth0:\s*(\d+)\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+\d+\s+(\d+)/);
        const rxBytes = netMatch ? parseInt(netMatch[1]) : 0;
        const txBytes = netMatch ? parseInt(netMatch[2]) : 0;

        // Parse Uptime and Load
        const loadMatch = stdout.match(/load average:\s*([\d.]+)/);
        const loadAvg = loadMatch ? parseFloat(loadMatch[1]) : 0;

        // Parse uptime duration
        const uptimeMatch = stdout.match(/up\s+([\d]+\s+days?,?\s*)?([\d:]+)/);
        let uptime = 'Unknown';
        if (uptimeMatch) {
            const days = uptimeMatch[1] ? uptimeMatch[1].trim() : '';
            const time = uptimeMatch[2] || '';
            uptime = days ? `${days} ${time}` : time;
        }

        return {
            cpu: {
                usage: cpuUsage,
                cores: 1,
                load: loadAvg,
            },
            memory: {
                total: Math.round(memTotal / 1024 * 10) / 10, // Convert to GB
                used: Math.round(memUsed / 1024 * 10) / 10,
                usage: memUsage,
            },
            disk: {
                total: Math.round(diskTotal),
                used: Math.round(diskUsed * 10) / 10,
                usage: diskUsage,
            },
            network: {
                rx: Math.round(rxBytes / 1024 / 1024), // MB
                tx: Math.round(txBytes / 1024 / 1024),
            },
            uptime,
            source: 'remote',
        };
    } catch (error) {
        console.error('SSH metrics error:', error);
        throw error;
    }
}

export async function GET() {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get remote server metrics and database stats
        const [serverMetrics, dbStats] = await Promise.all([
            getRemoteServerMetrics(),
            getDatabaseStats(),
        ]);

        return NextResponse.json({
            ...serverMetrics,
            database: dbStats,
            server: {
                ip: '206.189.36.199',
                plan: 'Basic Regular',
                specs: {
                    cpu: '1 vCPU',
                    ram: '1 GB',
                    disk: '25 GB',
                    transfer: '1 TB',
                },
            },
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Metrics error:', error);
        return NextResponse.json(
            { error: 'Failed to get server metrics' },
            { status: 500 }
        );
    }
}
